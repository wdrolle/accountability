// /src/app/api/groups/[id]/notes/route.ts

// Purpose: API route for managing agents Study Group notes
//  Relationships: Used by GroupClient.tsx to manage notes

// Key Functions:
//  GET: Fetches notes for a specific group
//  POST: Creates a new note for a group

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RawNote {
  id: string;
  title: string;
  content: string;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  created_at: Date;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[DEBUG] Session:', { 
      userId: session?.user?.id,
      email: session?.user?.email 
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the agents user ID
    const godV2User = await prisma.user.findFirst({
      where: {
        email: session.user.email
      },
      select: {
        id: true
      }
    });

    if (!godV2User) {
      console.error('[DEBUG] No agents user found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = godV2User.id;
    console.log('[DEBUG] God V2 User ID:', userId);

    const groupId = params.id;
    console.log('[DEBUG] Group ID:', groupId);

    // Check if user is a member of the group and get their role
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
        status: 'ACTIVE'
      },
      include: {
        agents_group: {
          select: {
            leader_id: true
          }
        }
      }
    });

    console.log('[DEBUG] Membership:', membership);

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    const isLeader = membership.agents_group.leader_id === userId;
    const isAdmin = membership.role === 'ADMIN';

    console.log('[DEBUG] User Roles:', {
      isLeader,
      isAdmin,
      membershipRole: membership.role,
      userId,
      leaderId: membership.agents_group.leader_id
    });

    // Get notes with visibility rules
    const notes = await prisma.agents_group_note.findMany({
      where: {
        group_id: groupId,
        OR: [
          { visibility: 'GROUP' },
          { 
            visibility: 'LEADER',
            AND: [
              {
                OR: [
                  { 
                    agents_group: {
                      leader_id: userId
                    }
                  },
                  {
                    agents_group: {
                      agents_group_member: {
                        some: {
                          user_id: userId,
                          role: 'ADMIN'
                        }
                      }
                    }
                  }
                ]
              }
            ]
          },
          {
            visibility: 'PRIVATE',
            user_id: userId
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('[DEBUG] Raw Notes Query Result:', notes);

    const formattedNotes = notes.map((note) => ({
      id: note.id,
      title: note.title || 'Note',
      content: note.content,
      created_at: note.created_at,
      visibility: note.visibility,
      user: {
        id: note.user.id,
        name: `${note.user.first_name || ''} ${note.user.last_name || ''}`.trim() || 'Anonymous',
        image: note.user.image 
          ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${note.user.image}`
          : null,
      },
    }));

    console.log('[DEBUG] Formatted Notes:', formattedNotes);

    return NextResponse.json({ notes: formattedNotes, success: true });
  } catch (error) {
    console.error('[DEBUG] Error in GET notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[DEBUG] POST Session:', {
      userId: session?.user?.id,
      email: session?.user?.email
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the agents user ID
    const godV2User = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "agents"."user"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    if (!godV2User?.length) {
      console.error('[DEBUG] No agents user found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = godV2User[0].id;
    console.log('[DEBUG] God V2 User ID:', userId);

    const groupId = params.id;
    console.log('[DEBUG] POST Group ID:', groupId);

    // Check if user is a member of the group
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
        status: 'ACTIVE'
      },
    });

    console.log('[DEBUG] POST Membership:', membership);

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('[DEBUG] POST Request Body:', body);

    const { content, title = 'Note', visibility = 'GROUP' } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const note = await prisma.$queryRaw<RawNote[]>`
      INSERT INTO "agents"."agents_group_note" 
        (id, title, content, visibility, group_id, user_id, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), ${title}, ${content}, ${visibility}, ${groupId}, ${userId}, NOW(), NOW())
      RETURNING *
    `;

    console.log('[DEBUG] Created Note:', note);

    const user = await prisma.$queryRaw<{ id: string; first_name: string | null; last_name: string | null; image: string | null; }[]>`
      SELECT id, first_name, last_name, image
      FROM "agents"."user"
      WHERE id = ${userId}
    `;

    console.log('[DEBUG] User Info:', user);

    const formattedNote = {
      id: note[0].id,
      title: note[0].title,
      content: note[0].content,
      created_at: note[0].created_at,
      visibility: note[0].visibility,
      user: {
        id: user[0].id,
        name: `${user[0].first_name} ${user[0].last_name}`.trim() || 'Anonymous',
        image: user[0].image 
          ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${user[0].image}`
          : null,
      },
    };

    console.log('[DEBUG] Formatted Note:', formattedNote);

    return NextResponse.json({ note: formattedNote, success: true });
  } catch (error) {
    console.error('[DEBUG] Error in POST notes:', error);
    return NextResponse.json(
      { error: 'Failed to create group note' },
      { status: 500 }
    );
  }
} 