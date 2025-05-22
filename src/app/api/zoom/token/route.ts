import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Use the exact variable names from .env
    const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
    const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || 'sLkjn9slSMmsLiuoonJJPA'; // Use the value from .env

    console.log('Server-side Zoom credentials check:', {
      hasClientId: !!ZOOM_CLIENT_ID,
      hasClientSecret: !!ZOOM_CLIENT_SECRET,
      hasAccountId: !!ZOOM_ACCOUNT_ID,
      clientIdPrefix: ZOOM_CLIENT_ID ? ZOOM_CLIENT_ID.substring(0, 4) : 'missing',
      secretPrefix: ZOOM_CLIENT_SECRET ? ZOOM_CLIENT_SECRET.substring(0, 4) : 'missing',
      accountIdPrefix: ZOOM_ACCOUNT_ID ? ZOOM_ACCOUNT_ID.substring(0, 4) : 'missing'
    });

    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      console.error('Missing Zoom credentials:', {
        hasClientId: !!ZOOM_CLIENT_ID,
        hasClientSecret: !!ZOOM_CLIENT_SECRET,
        hasAccountId: !!ZOOM_ACCOUNT_ID
      });
      return NextResponse.json(
        { error: 'Zoom OAuth credentials are not configured' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
    
    // Only request the exact scopes needed for meeting management
    const scopes = [
      'meeting:write:meeting',
      'meeting:write:meeting:admin'
    ].join(' ');
    
    const requestBody = new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: ZOOM_ACCOUNT_ID,
      scope: scopes,
    }).toString();

    console.log('Sending Zoom OAuth request:', {
      url: 'https://zoom.us/oauth/token',
      method: 'POST',
      hasAuth: !!auth,
      authPrefix: auth ? auth.substring(0, 10) : 'missing',
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

    if (!response.ok) {
      console.error('Zoom OAuth error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      return NextResponse.json(
        { error: data.message || data.error_description || 'Failed to get Zoom access token' },
        { status: response.status }
      );
    }

    console.log('Zoom OAuth success:', {
      hasAccessToken: !!data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Zoom token route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 