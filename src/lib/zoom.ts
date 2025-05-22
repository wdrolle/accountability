import jwt from 'jsonwebtoken';

// Add interface for the token payload
interface VideoSDKTokenPayload {
  app_key: string;
  tpc: string;
  role_type: 0 | 1;
  version: number;
  iat: number;
  exp: number;
  session_key?: string;
  user_identity?: string;
}

function generateVideoSDKToken(sessionName: string, role: 0 | 1, sessionKey?: string, userIdentity?: string) {
  const ZOOM_SDK_KEY = process.env.ZOOM_API_KEY;
  const ZOOM_SDK_SECRET = process.env.ZOOM_API_SECRET;

  if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
    console.error('Missing Zoom SDK credentials:', {
      hasSDKKey: !!ZOOM_SDK_KEY,
      hasSDKSecret: !!ZOOM_SDK_SECRET,
    });
    throw new Error('Zoom SDK credentials are not configured. Please check your environment variables: ZOOM_API_KEY and ZOOM_API_SECRET');
  }

  try {
    const iat = Math.round(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // Token expires in 2 hours

    // Create base payload with required fields
    const payload: VideoSDKTokenPayload = {
      app_key: ZOOM_SDK_KEY,
      tpc: sessionName,
      role_type: role,
      version: 1,
      iat,
      exp
    };

    // Add optional fields if provided
    if (sessionKey) {
      payload.session_key = sessionKey;
    }
    if (userIdentity) {
      payload.user_identity = userIdentity;
    }

    console.log('Generating token with payload:', JSON.stringify(payload, null, 2));

    // Ensure payload is not null before signing
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload for token generation');
    }

    const token = jwt.sign(payload, ZOOM_SDK_SECRET, { algorithm: 'HS256' });
    
    if (!token) {
      throw new Error('Failed to generate token - token is empty');
    }

    console.log('Successfully generated token');
    return token;

  } catch (error) {
    console.error('Error generating Zoom Video SDK token:', error);
    
    let errorMessage = 'Failed to generate Zoom Video SDK token';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

function generateVideoSDKApiToken() {
  const ZOOM_SDK_KEY = process.env.NEXT_PUBLIC_ZOOM_API_KEY;
  const ZOOM_SDK_SECRET = process.env.NEXT_PUBLIC_ZOOM_API_SECRET;

  if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
    throw new Error('Zoom SDK credentials are not configured');
  }

  try {
    const iat = Math.round(Date.now() / 1000);
    const exp = iat + 60 * 60; // Token expires in 1 hour

    const payload = {
      iss: ZOOM_SDK_KEY,
      exp: exp
    };

    const token = jwt.sign(payload, ZOOM_SDK_SECRET, { algorithm: 'HS256' });
    if (!token) {
      throw new Error('Failed to generate API token');
    }
    return token;
  } catch (error) {
    console.error('Error generating Video SDK API token:', error);
    throw error;
  }
}

async function getZoomAccessToken() {
  const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
  const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
  const ZOOM_ACCOUNT_ID = process.env.NEXT_PUBLIC_ZOOM_ACCOUNT_ID;

  // Debug: Log credential presence and partial values
  console.log('[DEBUG] src/lib/zoom.ts Zoom Credentials Check:', {
    clientId: ZOOM_CLIENT_ID ? `${ZOOM_CLIENT_ID.substring(0, 4)}...` : 'missing',
    clientSecret: ZOOM_CLIENT_SECRET ? `${ZOOM_CLIENT_SECRET.substring(0, 4)}...` : 'missing',
    accountId: ZOOM_ACCOUNT_ID ? `${ZOOM_ACCOUNT_ID.substring(0, 4)}...` : 'missing',
  });

  if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
    console.error('[DEBUG] src/lib/zoom.ts Missing Zoom credentials:', {
      hasClientId: !!ZOOM_CLIENT_ID,
      hasClientSecret: !!ZOOM_CLIENT_SECRET,
      hasAccountId: !!ZOOM_ACCOUNT_ID
    });
    throw new Error('Missing required Zoom credentials. Please check your environment variables: ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, NEXT_PUBLIC_ZOOM_ACCOUNT_ID');
  }

  try {
    const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
    console.log('[DEBUG] src/lib/zoom.ts Basic Auth Token:', `${auth.substring(0, 10)}...`);
    
    // Only request the exact scopes needed for meeting management
    const scopes = [
      'meeting:write:admin',
      'meeting:write',
      'meeting:read:admin',
      'meeting:read'
    ].join(' ');

    const requestBody = new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: ZOOM_ACCOUNT_ID,
      scope: scopes,
    }).toString();

    console.log('[DEBUG] src/lib/zoom.ts OAuth Request:', {
      url: 'https://zoom.us/oauth/token',
      method: 'POST',
      headers: {
        'Authorization': 'Basic [hidden]',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    });
    
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    const data = await response.json();
    console.log('[DEBUG] src/lib/zoom.ts Zoom OAuth Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      hasAccessToken: !!data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
      error: !response.ok ? data : undefined
    });

    if (!response.ok) {
      console.error('[DEBUG] src/lib/zoom.ts Zoom OAuth Error:', data);
      throw new Error(data.message || data.error_description || 'Failed to get Zoom access token');
    }

    if (!data.access_token) {
      console.error('[DEBUG] src/lib/zoom.ts No access token in response:', data);
      throw new Error('No access token received from Zoom');
    }

    return data.access_token;
  } catch (error) {
    console.error('[DEBUG] src/lib/zoom.ts Error getting Zoom access token:', error);
    throw error;
  }
}

export interface ZoomMeetingDetails {
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  password: string;
  timezone?: string;
  agenda?: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    waiting_room: boolean;
    meeting_authentication: boolean;
    registrants_email_notification?: boolean;
    watermark?: boolean;
    use_pmi?: boolean;
    approval_type?: number;
    registration_type?: number;
    audio?: string;
    auto_recording?: string;
    enforce_login?: boolean;
  };
  join_url: string;
  start_url: string;
  meeting_id: string;
  session_id: string;
  status?: string;
  recurrence?: {
    type: 1 | 2 | 3;
    repeat_interval: number;
    weekly_days?: string;
    monthly_day?: number;
    end_date_time: string;
  };
}

export interface ZoomApiError {
  error: string;
  message?: string;
  code?: number;
}

export async function createZoomMeeting(details: ZoomMeetingDetails) {
  try {
    const token = await getZoomAccessToken();
    
    if (!token) {
      throw new Error('Failed to get Zoom access token');
    }

    console.log('[DEBUG] Creating Zoom meeting with details:', details);

    // Prepare the request body according to Zoom API specs
    const requestBody = {
      topic: details.topic,
      type: details.type || 2, // Default to scheduled meeting
      start_time: details.start_time,
      duration: details.duration,
      timezone: details.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      password: details.password,
      agenda: details.agenda,
      settings: {
        ...details.settings,
        watermark: false,
        use_pmi: false,
        approval_type: 2,
        registration_type: 1,
        audio: 'both',
        auto_recording: 'none',
        enforce_login: false,
        registrants_email_notification: true
      }
    };

    console.log('[DEBUG] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('[DEBUG] Zoom API Response:', responseText);

    if (!response.ok) {
      try {
        const error = JSON.parse(responseText);
        throw new Error(error.message || 'Failed to create Zoom meeting');
      } catch (e) {
        throw new Error(`Failed to create Zoom meeting: ${responseText}`);
      }
    }

    const data = JSON.parse(responseText);

    // Transform response to match our internal format
    return {
      meeting_id: data.id.toString(),
      topic: data.topic,
      join_url: data.join_url,
      start_url: data.start_url,
      password: data.password,
      start_time: data.start_time,
      duration: data.duration,
      settings: data.settings,
      session_id: data.id.toString(),
      type: data.type,
      status: data.status
    };
  } catch (error) {
    console.error('[DEBUG] Create Zoom meeting error:', error);
    throw error;
  }
}

export async function updateZoomMeeting(details: ZoomMeetingDetails) {
  try {
    const response = await fetch('/api/zoom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_session',
        meetingDetails: details,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Update Zoom meeting error response:', data);
      throw new Error(data.error || data.message || 'Failed to update Zoom meeting');
    }

    return data;
  } catch (error) {
    console.error('Update Zoom meeting error:', error);
    const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Failed to update Zoom meeting. Please try again.';
    throw new Error(errorMessage);
  }
}

export async function deleteZoomMeeting(sessionId: string) {
  try {
    const response = await fetch('/api/zoom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete_session',
        meetingDetails: { sessionId },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Delete Zoom meeting error response:', error);
      throw new Error(error.message || 'Failed to delete Zoom meeting');
    }

    return response.json();
  } catch (error) {
    console.error('Delete Zoom meeting error:', error);
    const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Failed to delete Zoom meeting. Please try again.';
    throw new Error(errorMessage);
  }
}

export async function createZoomMeetingInviteLinks(meetingId: string, attendees: Array<{ name: string }>) {
  try {
    const token = await getZoomAccessToken();
    
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/invite_links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        attendees,
        ttl: 7200 // 2 hours expiration
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create invite links');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating invite links:', error);
    throw error;
  }
}

export { getZoomAccessToken, generateVideoSDKToken, generateVideoSDKApiToken };
