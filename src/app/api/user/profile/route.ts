// src/app/api/user/profile/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, agents_version, timezone, text_message_time } = body;

    // Validate time format (HH:mm)
    if (text_message_time && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(text_message_time)) {
      return NextResponse.json({ error: 'Invalid time format. Must be HH:mm (00:00-23:59)' }, { status: 400 });
    }

    // Validate timezone exists in our database
    const validTimezone = await prisma.tz.findFirst({
      where: {
        timezone: timezone
      }
    });

    if (!validTimezone) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    const profile = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        phone,
        timezone,
        text_message_time,
        updated_at: new Date()
      }
    });

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

