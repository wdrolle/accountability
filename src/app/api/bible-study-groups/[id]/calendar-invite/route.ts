import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createZoomMeeting } from '@/lib/zoom';
import { sendCalendarInviteEmail } from '@/lib/email';

interface ZoomRecurrence {
  type: 1 | 2 | 3;
  repeat_interval: number;
  weekly_days?: number[];
  monthly_day?: number;
  end_date_time: string;
}

const CALENDAR_TYPE_MAP = {
  google: 1,
  outlook: 2,
  ical: 3,
} as const;

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userIdTemp = session?.user?.id;
    if (!userIdTemp) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId: string = userIdTemp;

    const groupId = context.params.id;
    if (!groupId) {
      console.error('Missing group ID');
      return NextResponse.json({ error: 'Missing group ID' }, { status: 400 });
    }

    const { calendarType } = await request.json();
    if (!calendarType || !(calendarType in CALENDAR_TYPE_MAP)) {
      return NextResponse.json({ error: 'Invalid calendar type' }, { status: 400 });
    }

    // Get the group and its members
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      include: {
        agents_group_member: {
          include: {
            user_agents_group_member_user_idTouser: true
          }
        },
        zoom_meeting: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member
    const userMember = group.agents_group_member.find(
      member => member.user_id === userId
    );
    if (!userMember) {
      return NextResponse.json({ error: 'User is not a member of the group' }, { status: 403 });
    }

    // Get the latest Zoom meeting
    const latestMeeting = group.zoom_meeting[0];
    if (!latestMeeting) {
      return NextResponse.json({ error: 'No Zoom meeting found for this group' }, { status: 404 });
    }

    if (!group.zoom_start_time) {
      return NextResponse.json({ error: 'Meeting start time not set' }, { status: 400 });
    }

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Get all member emails
    const memberEmails = group.agents_group_member
      .map(member => member.user_agents_group_member_user_idTouser.email)
      .filter((email): email is string => email !== null);

    // Create or update Zoom meeting with calendar settings
    const meetingDetails = {
      name: group.name,
      meetingId: latestMeeting.meeting_id,
      startTime: group.zoom_start_time.toISOString(),
      duration: group.zoom_duration ?? 60,
      settings: {
        calendar_type: CALENDAR_TYPE_MAP[calendarType as keyof typeof CALENDAR_TYPE_MAP],
        send_calendar_invite: true,
        alternative_hosts: memberEmails.join(',')
      },
      recurrence: group.zoom_recurrence ? (group.zoom_recurrence as unknown as ZoomRecurrence) : undefined
    };

    const updatedMeeting = await createZoomMeeting(meetingDetails);

    // Send calendar invite email
    await sendCalendarInviteEmail({
      to: user.email,
      calendarType,
      meetingName: group.name,
      startTime: group.zoom_start_time.toISOString(),
      duration: group.zoom_duration ?? 60,
      joinUrl: updatedMeeting.joinUrl || latestMeeting.join_url
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar invites sent successfully',
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error('Error sending calendar invites:', error);
    return NextResponse.json(
      { error: 'Failed to send calendar invites', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 