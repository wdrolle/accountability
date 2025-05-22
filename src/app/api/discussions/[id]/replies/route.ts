// /src/app/api/discussions/[id]/replies/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SUPABASE_BUCKET_URL, USER_IMAGES_BUCKET, DEFAULT_USER_IMAGE } from '@/lib/constants';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const replies = await prisma.reply.findMany({
      where: {
        discussionid: id
      },
      include: {
        user: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Get user data for all authors
    const userIds = replies.map(reply => reply.user.id);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        image: true,
        first_name: true,
        last_name: true
      }
    });

    // Create a map of user data
    const userMap = new Map(users.map(u => [u.id, u]));

    // Format the replies
    const formattedReplies = replies.map(reply => {
      const userData = userMap.get(reply.user.id);
      return {
        id: reply.id,
        content: reply.content,
        authorId: reply.authorid,
        authorName: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Anonymous' : 'Anonymous',
        authorImage: userData?.image ? 
          `${SUPABASE_BUCKET_URL}${USER_IMAGES_BUCKET}/${userData.image}` : 
          DEFAULT_USER_IMAGE,
        created_at: reply.created_at
      };
    });

    return NextResponse.json({ replies: formattedReplies });
  } catch (error) {
    // console.error('Error in replies route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { content } = await request.json();

    if (!content) {
      return new NextResponse(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const discussion = await prisma.discussion.findUnique({
      where: {
        id
      }
    });

    if (!discussion) {
      return new NextResponse(
        JSON.stringify({ error: 'Discussion not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const reply = await prisma.reply.create({
      data: {
        id: crypto.randomUUID(),
        content,
        authorid: session.user.id,
        discussionid: id
      },
      include: {
        user: {
          select: {
            id: true,
            image: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    const formattedReply = {
      id: reply.id,
      content: reply.content,
      authorId: reply.authorid,
      authorName: `${reply.user.first_name || ''} ${reply.user.last_name || ''}`.trim() || 'Anonymous',
      authorImage: reply.user.image ? 
        `${SUPABASE_BUCKET_URL}${USER_IMAGES_BUCKET}/${reply.user.image}` : 
        DEFAULT_USER_IMAGE,
      created_at: reply.created_at
    };

    return new NextResponse(
      JSON.stringify({ reply: formattedReply }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // console.error('Error in replies route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 