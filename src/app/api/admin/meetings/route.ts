/**
 * Meetings API Route
 * 
 * This API route handles CRUD operations for meetings:
 * - GET: Retrieve all meetings for the authenticated user
 * - POST: Create a new meeting
 * - PUT: Update an existing meeting
 * 
 * Meetings include:
 * - Title and metadata
 * - Speakers and their profiles
 * - Transcript segments
 * - RAID analysis
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/meetings
 * Retrieves all meetings for the authenticated user
 */
export async function GET() {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch meetings from database
    const meetings = await prisma.meetings.findMany({
      where: {
        host_id: session.user.id
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error in GET /meetings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/meetings
 * Creates a new meeting with initial data
 */
export async function POST(req: Request) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract meeting data
    const { title, transcript, speakers, analysis } = await req.json();
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create meeting record
    const meeting = await prisma.meetings.create({
      data: {
        title,
        host_id: session.user.id,
        transcript: transcript || [],
        speakers: speakers || [],
        raid_analysis: analysis || {
          risks: [],
          issues: [],
          actions: [],
          dependencies: [],
          decisions: [],
          followups: [],
          summary: ''
        }
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error in POST /meetings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/meetings
 * Updates an existing meeting
 * - Can update basic info, transcript, speakers, analysis
 * - Can mark meeting as ended
 * - Can update LLaMA summary
 */
export async function PUT(req: Request) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract update data
    const { id, title, transcript, speakers, raisAnalysis, llamaSummary } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    // Verify meeting ownership
    const existingMeeting = await prisma.meetings.findUnique({
      where: { id }
    });

    if (!existingMeeting || existingMeeting.host_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Update meeting record
    const updateData: any = {};
    if (title) updateData.title = title;
    if (transcript) updateData.transcript = transcript;
    if (speakers) updateData.speakers = speakers;
    if (raisAnalysis) updateData.raid_analysis = raisAnalysis;
    if (llamaSummary) updateData.llama_summary = llamaSummary;

    const updatedMeeting = await prisma.meetings.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error('Error in PUT /meetings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 