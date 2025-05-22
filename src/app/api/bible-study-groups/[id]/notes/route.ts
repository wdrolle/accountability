// /src/app/api/agents-study-groups/[id]/notes/route.ts
//
// 1) Mark this route as fully dynamic so Next.js won't complain that params aren't awaited.
// 2) You don't need an artificial "await" if you do this. Just add `export const dynamic = 'force-dynamic'`
//    at the top (or use dynamicParams = true / fetchCache = 'force-no-store').
//
// Below is a complete updated code sample that prevents the "`params` should be awaited" error.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Add type definitions for the note and reply
type NoteWithIncludes = {
  id: string;
  content: string;
  title: string | null;
  visibility: string | null;
  group_id: string;
  user_id: string;
  created_at: Date | null;
  updated_at: Date | null;
  user: {
    id: string;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    image: string | null;
  };
  agents_group_note_reply: Array<{
    id: string;
    content: string;
    created_at: Date | null;
    updated_at: Date | null;
    user: {
      id: string;
      name: string | null;
      first_name: string | null;
      last_name: string | null;
      image: string | null;
    };
  }>;
};

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // console.log('[DEBUG GET /notes] Starting GET request');
  
  try {
    const params = await context.params;
    // console.log('[DEBUG GET /notes] Params:', params);
    
    const session = await getServerSession(authOptions);
    // console.log('[DEBUG GET /notes] Session:', session);

    // Get godV2UserId from headers
    const godV2UserId = request.headers.get('x-god-v2-user-id');
    // console.log('[DEBUG GET /notes] godV2UserId from headers:', godV2UserId);

    if (!session?.user?.id || !godV2UserId) {
      // console.log('[DEBUG GET /notes] No session or godV2UserId found');
      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required',
          notes: [],
          success: false
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const groupId = params.id;
    // console.log('[DEBUG GET /notes] Group ID:', groupId);

    // Get user's membership and role using godV2UserId
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: godV2UserId,
        status: {
          in: ['ACCEPTED', 'ACTIVE']
        }
      },
      select: {
        role: true,
        agents_group: {
          select: {
            leader_id: true
          }
        }
      }
    });

    // console.log('[DEBUG GET /notes] Membership:', membership);

    if (!membership) {
      // console.log('[DEBUG GET /notes] Not a member');
      return new NextResponse(
        JSON.stringify({
          error: 'You must be a member of this group to view notes',
          notes: [],
          success: false
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const isLeader = membership.agents_group.leader_id === godV2UserId;
    const isAdmin = membership.role === 'ADMIN';

    // console.log('[DEBUG GET /notes] User roles:', { isLeader, isAdmin, role: membership.role });

    // Simplified query to fetch notes
    const notes = await prisma.agents_group_note.findMany({
      where: {
        group_id: groupId,
        OR: [
          { visibility: 'GROUP' },
          {
            AND: [
              { visibility: 'LEADER' },
              {
                OR: [
                  { user_id: godV2UserId },
                  { AND: [{ OR: [{ user_id: membership.agents_group.leader_id }] }] }
                ]
              }
            ]
          },
          {
            AND: [
              { visibility: 'PRIVATE' },
              { user_id: godV2UserId }
            ]
          }
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            image: true,
          }
        },
        agents_group_note_reply: {
          where: {
            deleted_at: {
              equals: null
            },
          },
          include: {
            user: true,
          },
          orderBy: {
            created_at: 'asc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    }) as unknown as NoteWithIncludes[];

    // console.log('[DEBUG GET /notes] Raw notes:', notes);

    // Format notes for response
    const formattedNotes = notes.map((note: NoteWithIncludes) => ({
      id: note.id,
      content: note.content,
      title: note.title || 'Note',
      visibility: note.visibility || 'GROUP',
      created_at: note.created_at,
      updated_at: note.updated_at,
      group_id: note.group_id,
      user: {
        id: note.user_id,
        name: note.user.name || `${note.user.first_name || ''} ${note.user.last_name || ''}`.trim() || 'Anonymous',
        image: note.user.image 
          ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${note.user.image}`
          : '/images/logo/agents.png'
      },
      replies: note.agents_group_note_reply.map((reply) => ({
        id: reply.id,
        content: reply.content,
        created_at: reply.created_at,
        updated_at: reply.updated_at,
        user: {
          id: reply.user.id,
          name: reply.user.name || `${reply.user.first_name || ''} ${reply.user.last_name || ''}`.trim() || 'Anonymous',
          image: reply.user.image 
            ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${reply.user.image}`
            : '/images/logo/agents.png'
        }
      }))
    }));

    // console.log('[DEBUG GET /notes] Formatted notes:', formattedNotes);
    
    return new NextResponse(
      JSON.stringify({
        notes: formattedNotes,
        success: true,
        message: formattedNotes.length === 0 ? 'No notes found' : undefined
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ERROR GET /notes] Error details:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to fetch notes',
        notes: [],
        success: false,
        debug: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('[DEBUG POST /notes] Starting POST request');
  
  try {
    const params = await context.params;
    console.log('[DEBUG POST /notes] Params:', params);

    const session = await getServerSession(authOptions);
    console.log('[DEBUG POST /notes] Session:', session?.user?.id);

    // Get godV2UserId from headers
    const godV2UserId = request.headers.get('x-god-v2-user-id');
    console.log('[DEBUG POST /notes] godV2UserId from headers:', godV2UserId);

    if (!session?.user?.id || !godV2UserId) {
      console.log('[DEBUG POST /notes] No session or godV2UserId found');
      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required',
          success: false
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Debug raw request body
    const rawBody = await request.text();
    console.log('[DEBUG POST /notes] Raw body:', rawBody);

    // Parse JSON
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (err) {
      console.error('[ERROR POST /notes] JSON parse failed:', err);
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid JSON input',
          success: false
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const groupId = params.id;
    const { content, title, visibility = 'GROUP', scheduleTime } = data;

    console.log('[DEBUG POST /notes] Parsed data:', { godV2UserId, groupId, content, title, visibility, scheduleTime });

    if (!content?.trim()) {
      console.log('[DEBUG POST /notes] Empty content');
      return new NextResponse(
        JSON.stringify({
          error: 'Note content cannot be empty',
          success: false
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate visibility
    const validVisibilities = ['PRIVATE', 'LEADER', 'GROUP'];
    if (!validVisibilities.includes(visibility)) {
      console.log('[DEBUG POST /notes] Invalid visibility:', visibility);
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid visibility value',
          success: false
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check membership and role using godV2UserId
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: godV2UserId,
        status: {
          in: ['ACCEPTED', 'ACTIVE']
        }
      },
      include: {
        agents_group: {
          select: {
            leader_id: true
          }
        }
      }
    });

    if (!membership) {
      console.log('[DEBUG POST /notes] Not a member');
      return new NextResponse(
        JSON.stringify({
          error: 'You must be a member of this group to add notes',
          success: false
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user can create notes with the specified visibility
    const isLeader = membership.agents_group.leader_id === godV2UserId;
    const isAdmin = membership.role === 'ADMIN';

    if (visibility === 'LEADER' && !isLeader && !isAdmin) {
      return new NextResponse(
        JSON.stringify({
          error: 'Only leaders and admins can create leader-only notes',
          success: false
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the note using godV2UserId
    const note = await prisma.agents_group_note.create({
      data: {
        content,
        title: title || 'Note',
        visibility,
        group_id: groupId,
        user_id: godV2UserId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            image: true,
          }
        }
      }
    });

    console.log('[DEBUG POST /notes] Note created:', note.id);

    const formattedNote = {
      id: note.id,
      content: note.content,
      title: note.title,
      visibility: note.visibility,
      created_at: note.created_at,
      updated_at: note.updated_at,
      group_id: note.group_id,
      user: {
        id: note.user.id,
        name: note.user.name || `${note.user.first_name || ''} ${note.user.last_name || ''}`.trim() || 'Anonymous',
        image: note.user.image 
          ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${note.user.image}`
          : '/images/logo/agents.png'
      }
    };

    console.log('[DEBUG POST /notes] Returning success response');
    return new NextResponse(
      JSON.stringify({
        note: formattedNote,
        success: true,
        message: 'Note added successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ERROR POST /notes] Error details:', error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error saving note',
        success: false,
        debug: error instanceof Error ? error.stack : 'No stack trace'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}