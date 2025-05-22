import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { user_id, versions } = await req.json();

    if (!user_id || !versions || !Array.isArray(versions)) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid versions format' },
        { status: 400 }
      );
    }

    // Update or create user preferences with the array of agents version IDs
    const userPreferences = await prisma.user_preferences.upsert({
      where: {
        user_id: user_id,
      },
      update: {
        preferred_agents_version: {
          set: versions,
        },
      },
      create: {
        user_id: user_id,
        preferred_agents_version: versions,
      },
    });

    console.log('Updated preferences:', userPreferences);
    return NextResponse.json({ preferences: userPreferences });
  } catch (error) {
    console.error('Error saving user versions:', error);
    return NextResponse.json(
      { error: 'Failed to save versions' },
      { status: 500 }
    );
  }
} 