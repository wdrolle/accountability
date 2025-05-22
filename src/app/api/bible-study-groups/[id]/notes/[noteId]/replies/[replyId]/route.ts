import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string; replyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const godV2UserId = request.headers.get('x-god-v2-user-id');

    if (!session?.user?.id || !godV2UserId) {
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

    // Check if the reply exists and belongs to the user
    const reply = await prisma.agents_group_note_reply.findUnique({
      where: {
        id: params.replyId,
      },
      include: {
        agents_group_note: {
          include: {
            agents_group: {
              select: {
                leader_id: true
              }
            }
          }
        }
      }
    });

    if (!reply) {
      return new NextResponse(
        JSON.stringify({
          error: 'Reply not found',
          success: false
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has permission to delete the reply
    const isOwner = reply.user_id === godV2UserId;
    const isLeader = reply.agents_group_note.agents_group.leader_id === godV2UserId;

    if (!isOwner && !isLeader) {
      return new NextResponse(
        JSON.stringify({
          error: 'You do not have permission to delete this reply',
          success: false
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Soft delete the reply by updating deleted_at
    const updatedReply = await prisma.agents_group_note_reply.update({
      where: {
        id: params.replyId,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Reply deleted successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Failed to delete reply:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to delete reply',
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 