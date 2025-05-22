// /src/app/api/discussions/[id]/route.ts

// Purpose: API route for handling agents Study Group CRUD operations
//  Relationships: Used by GroupClient.tsx to fetch and manage groups

// Key Functions:
//  GET: Fetches a specific group by ID
//  PUT: Updates a group's details
//  DELETE: Deletes a group

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SUPABASE_BUCKET_URL, USER_IMAGES_BUCKET, DEFAULT_USER_IMAGE } from '@/lib/constants';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const discussion = await prisma.discussion.findUnique({
      where: {
        id
      },
      include: {
        users: true
      }
    });

    if (!discussion) {
      return new NextResponse(
        JSON.stringify({ error: 'Discussion not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user data from agents.user table
    const userData = await prisma.user.findUnique({
      where: {
        id: discussion.users.id
      },
      select: {
        image: true,
        first_name: true,
        last_name: true,
        name: true
      }
    });

    // Get the complete image URL from the database
    const imageUrl = userData?.image ? 
      `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${userData.image}` : 
      DEFAULT_USER_IMAGE;

    const formattedDiscussion = {
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      topic: discussion.topic,
      authorId: discussion.authorid,
      creator: {
        name: userData?.name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Anonymous',
        image: imageUrl
      },
      created_at: discussion.created_at,
      updated_at: discussion.updated_at
    };

    return NextResponse.json({ discussion: formattedDiscussion });
  } catch (error) {
    // console.error('Error in discussion route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { title, content, topic } = await request.json();

    if (!title || !content || !topic) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
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

    if (discussion.authorid !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedDiscussion = await prisma.discussion.update({
      where: {
        id
      },
      data: {
        title,
        content,
        topic,
        updated_at: new Date()
      },
      include: {
        users: true
      }
    });

    // Get user data from agents.user table
    const userData = await prisma.user.findUnique({
      where: {
        id: updatedDiscussion.users.id
      },
      select: {
        image: true,
        first_name: true,
        last_name: true,
        name: true
      }
    });

    // Get the complete image URL from the database
    const imageUrl = userData?.image ? 
      `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${userData.image}` : 
      DEFAULT_USER_IMAGE;

    const formattedDiscussion = {
      id: updatedDiscussion.id,
      title: updatedDiscussion.title,
      content: updatedDiscussion.content,
      topic: updatedDiscussion.topic,
      authorId: updatedDiscussion.authorid,
      creator: {
        name: userData?.name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Anonymous',
        image: imageUrl
      },
      created_at: updatedDiscussion.created_at,
      updated_at: updatedDiscussion.updated_at
    };

    return NextResponse.json({ discussion: formattedDiscussion });
  } catch (error) {
    // console.error('Error in discussion route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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

    if (discussion.authorid !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.discussion.delete({
      where: {
        id
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // console.error('Error in discussion route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 