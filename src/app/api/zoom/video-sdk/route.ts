import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { generateVideoSDKToken } from '@/lib/zoom';

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
    const { sessionName, role = 0, sessionKey, userIdentity } = body;

    if (!sessionName) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      );
    }

    try {
      const token = generateVideoSDKToken(
        sessionName,
        role as 0 | 1,
        sessionKey,
        userIdentity || session.user.id
      );

      return NextResponse.json({ token });
    } catch (error) {
      console.error('Failed to generate Video SDK token:', error);
      return NextResponse.json(
        { error: 'Failed to generate Video SDK token' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Video SDK API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 