import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        user_preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      preferences: {
        theme_preferences: user.user_preferences?.theme_preferences || ['faith'],
        blocked_themes: user.user_preferences?.blocked_themes || [],
        message_length_preference: user.user_preferences?.message_length_preference || 'MEDIUM',
        preferred_agents_version: user.user_preferences?.preferred_agents_version || [],
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        user_preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create user preferences
    const updatedPreferences = await prisma.user_preferences.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        theme_preferences: preferences.theme_preferences,
        blocked_themes: preferences.blocked_themes,
        message_length_preference: preferences.message_length_preference,
        preferred_agents_version: preferences.preferred_agents_version,
      },
      update: {
        theme_preferences: preferences.theme_preferences,
        blocked_themes: preferences.blocked_themes,
        message_length_preference: preferences.message_length_preference,
        preferred_agents_version: preferences.preferred_agents_version,
      },
    });

    return NextResponse.json({ preferences: updatedPreferences });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 