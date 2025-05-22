import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, meetingId } = params;
    const { action } = await request.json();

    // Verify user is a member of the group
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        status: 'ACCEPTED'
      },
      select: {
        role: true,
        agents_group: {
          select: {
            leader_id: true
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to manage meetings' },
        { status: 403 }
      );
    }

    // Check if user is leader or admin
    const isLeader = membership.agents_group.leader_id === session.user.id;
    const isAdmin = membership.role === 'ADMIN';
    if (!isLeader && !isAdmin) {
      return NextResponse.json(
        { error: 'Only leaders and admins can manage meetings' },
        { status: 403 }
      );
    }

    // Get current meeting status
    const currentMeeting = await prisma.zoom_meeting.findUnique({
      where: { id: meetingId }
    });

    if (!currentMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Call the appropriate database function based on the action
    try {
      switch (action) {
        case 'start':
          if (currentMeeting.status !== 'SCHEDULED') {
            return NextResponse.json(
              { error: 'Meeting must be in SCHEDULED status to start' },
              { status: 400 }
            );
          }
          await prisma.$queryRaw`SELECT agents.start_zoom_meeting(${meetingId}::uuid)`;
          break;
        case 'end':
          if (currentMeeting.status !== 'STARTED') {
            return NextResponse.json(
              { error: 'Meeting must be in STARTED status to end' },
              { status: 400 }
            );
          }
          await prisma.$queryRaw`SELECT agents.end_zoom_meeting(${meetingId}::uuid)`;
          break;
        case 'cancel':
          if (currentMeeting.status !== 'SCHEDULED') {
            return NextResponse.json(
              { error: 'Only scheduled meetings can be cancelled' },
              { status: 400 }
            );
          }
          await prisma.$queryRaw`SELECT agents.cancel_zoom_meeting(${meetingId}::uuid)`;
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid action. Must be one of: start, end, cancel' },
            { status: 400 }
          );
      }

      // Get updated meeting details
      const meeting = await prisma.zoom_meeting.findUnique({
        where: { id: meetingId },
        include: {
          zoom_meeting_participant: {
            where: { user_id: session.user.id }
          }
        }
      });

      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: meeting.id,
        meetingId: meeting.meeting_id,
        status: meeting.status,
        startTime: meeting.start_time,
        startedAt: meeting.started_at,
        canStart: isLeader || isAdmin,
        canJoin: true,
        isParticipant: meeting.zoom_meeting_participant.length > 0,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url
      });

    } catch (error) {
      console.error('Error executing meeting action:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to execute meeting action' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error managing meeting status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update meeting status' },
      { status: 500 }
    );
  }
} 