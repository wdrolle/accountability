import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { noteId, userIds, groupId } = await req.json();

    if (!noteId) {
      return new NextResponse('Note ID is required', { status: 400 });
    }

    // Verify the note exists and belongs to the user
    const note = await prisma.agents_notes.findFirst({
      where: {
        id: noteId,
        user_id: session.user.id
      }
    });

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    const shares = [];

    // Share with individual users
    if (userIds?.length > 0) {
      const userShares = userIds.map((userId: string) => ({
        note_id: noteId,
        shared_by: session.user.id,
        shared_with: userId,
        created_at: new Date(),
        updated_at: new Date()
      }));
      shares.push(...userShares);
    }

    // Share with group members
    if (groupId) {
      // Get all members of the group
      const groupMembers = await prisma.agents_group_member.findMany({
        where: {
          group_id: groupId,
          user_id: {
            not: session.user.id // Exclude the current user
          }
        }
      });

      const groupShares = groupMembers.map(member => ({
        note_id: noteId,
        shared_by: session.user.id,
        shared_with: member.user_id,
        created_at: new Date(),
        updated_at: new Date()
      }));
      shares.push(...groupShares);
    }

    // Create all shares in a single transaction
    if (shares.length > 0) {
      await prisma.note_shares.createMany({
        data: shares,
        skipDuplicates: true // Skip if already shared with user
      });
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error sharing note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      );
    }

    // Get all notes shared with this user
    const sharedNotes = await prisma.note_shares.findMany({
      where: {
        shared_with: user_id,
      },
      include: {
        agents_notes: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(sharedNotes);
  } catch (error: any) {
    console.error('Error fetching shared notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared notes' },
      { status: 500 }
    );
  }
} 