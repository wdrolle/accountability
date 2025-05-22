import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateVideoSDKToken } from '@/lib/zoom';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { meetingNumber, role } = data;

    if (!meetingNumber) {
      return NextResponse.json(
        { error: 'Meeting number is required' },
        { status: 400 }
      );
    }

    // Generate a token for the video SDK
    const token = generateVideoSDKToken(
      meetingNumber,
      role || 0,
      undefined,
      session.user.id
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating video token:', error);
    return NextResponse.json(
      { error: 'Failed to generate video token' },
      { status: 500 }
    );
  }
} 