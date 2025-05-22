import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface ReplyResponse {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { content, is_private } = await request.json();
    const godV2UserId = request.headers.get('x-god-v2-user-id');

    if (!godV2UserId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 401 }
      );
    }

    console.log('Creating reply with data:', {
      note_id: params.noteId,
      user_id: godV2UserId,
      content,
      is_private,
    });

    // Create the reply using Prisma
    const [reply] = await prisma.$queryRaw<ReplyResponse[]>`
      WITH inserted_reply AS (
        INSERT INTO agents.agents_group_note_reply (note_id, user_id, content, is_private)
        VALUES (${params.noteId}::uuid, ${godV2UserId}::uuid, ${content}, ${is_private})
        RETURNING *
      )
      SELECT 
        r.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'image', u.image
        ) as user
      FROM inserted_reply r
      LEFT JOIN agents.user u ON r.user_id = u.id;
    `;

    console.log('Reply created:', reply);

    return new NextResponse(
      JSON.stringify({
        success: true,
        reply,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/agents-study-groups/[id]/notes/[noteId]/replies:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error?.message }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const replyId = request.url.split('/').pop();
    const godV2UserId = request.headers.get('x-god-v2-user-id');

    if (!godV2UserId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 401 }
      );
    }

    // Soft delete the reply using raw SQL
    await prisma.$executeRaw`
      UPDATE agents.agents_group_note_reply 
      SET deleted_at = NOW() 
      WHERE id = ${replyId}::uuid;
    `;

    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in DELETE /api/agents-study-groups/[id]/notes/[noteId]/replies:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error?.message }),
      { status: 500 }
    );
  }
} 