import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { getZoomAccessToken } from '@/lib/zoom';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, meetingDetails } = body;

    if (!action || !meetingDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create_session':
        return await createZoomSession(meetingDetails);
      case 'update_session':
        return await updateZoomSession(meetingDetails);
      case 'delete_session':
        return await deleteZoomSession(meetingDetails.sessionId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Zoom API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function createZoomSession(meetingDetails: any) {
  try {
    console.log('Creating Zoom meeting with details:', {
      ...meetingDetails,
      // Don't log sensitive data
      password: meetingDetails.password ? '[HIDDEN]' : undefined
    });

    const token = await getZoomAccessToken();
    console.log('Got Zoom access token:', token ? `${token.substring(0, 10)}...` : 'missing');
    
    // Generate a random password if not provided
    const password = meetingDetails.password || Math.random().toString(36).slice(-8).toUpperCase();
    
    const requestBody = JSON.stringify({
      topic: meetingDetails.name,
      type: meetingDetails.recurrence ? 8 : 2, // 8 for recurring, 2 for scheduled
      start_time: meetingDetails.startTime,
      duration: meetingDetails.duration,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      password: password,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        auto_recording: 'none',
        waiting_room: false,
        meeting_authentication: false,
        registrants_confirmation_email: true,
        registrants_email_notification: true,
        alternative_hosts_email_notification: true,
        use_pmi: false,
        approval_type: 2, // Automatically approve
        registration_type: 2, // Required
        audio: 'both',
        enforce_login: false
      },
      recurrence: meetingDetails.recurrence ? {
        type: meetingDetails.recurrence.type,
        repeat_interval: meetingDetails.recurrence.repeat_interval,
        end_date_time: meetingDetails.recurrence.end_date_time
      } : undefined
    });

    console.log('Zoom API Request:', {
      url: 'https://api.zoom.us/v2/users/me/meetings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [HIDDEN]'
      },
      body: requestBody
    });

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: requestBody,
    });

    const data = await response.json();
    console.log('Zoom API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data,
      error: !response.ok ? data : undefined
    });

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Zoom session');
    }

    return NextResponse.json({
      sessionId: data.id,
      meetingId: data.id,
      joinUrl: data.join_url,
      startUrl: data.start_url,
      name: data.topic,
      startTime: data.start_time,
      duration: data.duration,
      recurrence: meetingDetails.recurrence
    });
  } catch (error) {
    console.error('Create Zoom Session Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Zoom session' },
      { status: 500 }
    );
  }
}

async function updateZoomSession(meetingDetails: any) {
  try {
    const token = await getZoomAccessToken();
    console.log('Updating Zoom meeting with details:', {
      ...meetingDetails,
      token: token ? 'present' : 'missing'
    });
    
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingDetails.meetingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        topic: meetingDetails.name,
        type: meetingDetails.recurrence ? 8 : 2,
        start_time: meetingDetails.startTime,
        duration: meetingDetails.duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          auto_recording: 'none',
        },
        recurrence: meetingDetails.recurrence ? {
          type: meetingDetails.recurrence.type,
          repeat_interval: meetingDetails.recurrence.repeat_interval,
          end_date_time: meetingDetails.recurrence.end_date_time
        } : undefined
      }),
    });

    const data = await response.json();
    console.log('Zoom API update response:', {
      status: response.status,
      statusText: response.statusText,
      data
    });

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update Zoom session');
    }

    return NextResponse.json({
      sessionId: meetingDetails.meetingId,
      meetingId: meetingDetails.meetingId,
      name: meetingDetails.name,
      startTime: meetingDetails.startTime,
      duration: meetingDetails.duration,
      recurrence: meetingDetails.recurrence
    });
  } catch (error) {
    console.error('Update Zoom Session Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update Zoom session' },
      { status: 500 }
    );
  }
}

async function deleteZoomSession(meetingId: string) {
  try {
    const token = await getZoomAccessToken();
    console.log('Deleting Zoom meeting:', {
      meetingId,
      token: token ? 'present' : 'missing'
    });
    
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete Zoom session');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Zoom Session Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete Zoom session' },
      { status: 500 }
    );
  }
} 