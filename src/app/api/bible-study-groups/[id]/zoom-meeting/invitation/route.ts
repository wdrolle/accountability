import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getZoomAccessToken } from '@/lib/zoom';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = await params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get the latest meeting for this group
    const meeting = await prisma.zoom_meeting.findFirst({
      where: { agents_group_id: groupId },
      orderBy: { created_at: 'desc' }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'No meeting found' }, { status: 404 });
    }

    const token = await getZoomAccessToken();
    
    // Get meeting invitation from Zoom API
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting.meeting_id}/invitation`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get meeting invitation');
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting meeting invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get meeting invitation' },
      { status: 500 }
    );
  }
} 