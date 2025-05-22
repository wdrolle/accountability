import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createZoomMeeting, getZoomAccessToken } from '@/lib/zoom';
import type { ZoomMeetingDetails } from '@/lib/zoom';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get the latest meeting for this group
    const meeting = await prisma.zoom_meeting.findFirst({
      where: { agents_group_id: groupId },
      orderBy: { created_at: 'desc' }
    });

    if (!meeting) {
      return NextResponse.json(null);
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error getting zoom meeting:', error);
    return NextResponse.json(
      { error: 'Failed to get zoom meeting' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Verify user has permission to create meetings for this group
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        OR: [
          { role: 'LEADER' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized to create meetings for this group' }, { status: 403 });
    }

    const data = await request.json();
    console.log('[DEBUG] Received meeting data:', data);

    // Create the Zoom meeting
    const meetingDetails = await createZoomMeeting(data);
    console.log('[DEBUG] Created Zoom meeting:', meetingDetails);

    // Save meeting details to database
    const meeting = await prisma.zoom_meeting.create({
      data: {
        agents_group_id: groupId,
        meeting_id: meetingDetails.meeting_id,
        topic: meetingDetails.topic,
        start_time: new Date(meetingDetails.start_time),
        duration: meetingDetails.duration,
        join_url: meetingDetails.join_url,
        start_url: meetingDetails.start_url,
        password: meetingDetails.password,
        settings: meetingDetails.settings,
        host_id: session.user.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return NextResponse.json(meetingDetails);
  } catch (error) {
    console.error('[DEBUG] Error creating Zoom meeting:', error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create meeting',
        details: error
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function PATCH(
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

    // Verify user has permission to manage meetings for this group
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        OR: [
          { role: 'LEADER' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized to manage meetings for this group' }, { status: 403 });
    }

    const { action, meeting_id, session_id } = await request.json();

    if (action === 'start') {
      // Update meeting status in database
      await prisma.zoom_meeting.update({
        where: {
          meeting_id: meeting_id
        },
        data: {
          status: 'STARTED',
          started_at: new Date()
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing Zoom meeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage meeting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id: groupId } = context.params;
    
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the meeting to delete
    const meeting = await prisma.zoom_meeting.findFirst({
      where: { agents_group_id: groupId },
      orderBy: { created_at: 'desc' }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'No meeting found' }, { status: 404 });
    }

    // Delete from database
    await prisma.zoom_meeting.delete({
      where: { id: meeting.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
