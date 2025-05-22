import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { getZoomAccessToken } from '@/lib/zoom';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a member of the group
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: params.id,
        user_id: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to access meeting details' },
        { status: 403 }
      );
    }

    // Get meeting details from Zoom API using OAuth token
    const token = await getZoomAccessToken();
    const response = await fetch(`https://api.zoom.us/v2/meetings/${params.meetingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Zoom API error:', {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      throw new Error(error.message || 'Failed to fetch meeting details from Zoom');
    }

    const data = await response.json();

    return NextResponse.json({
      meetingId: data.id,
      joinUrl: data.join_url,
      startUrl: data.start_url,
      name: data.topic,
      startTime: data.start_time,
      duration: data.duration,
      recurrence: data.recurrence,
    });
  } catch (error) {
    console.error('Error fetching Zoom meeting details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch meeting details' },
      { status: 500 }
    );
  }
} 