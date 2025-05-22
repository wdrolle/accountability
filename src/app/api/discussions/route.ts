// /src/app/api/discussions/route.ts

// Purpose: API route for handling agents Study Group CRUD operations
//  Relationships: Used by GroupClient.tsx to fetch and manage groups

// Key Functions:
//  GET: Fetches all groups for the current user
//  POST: Creates a new group

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SUPABASE_BUCKET_URL, USER_IMAGES_BUCKET, DEFAULT_USER_IMAGE } from '@/lib/constants';

interface Discussion {
  id: string;
  title: string;
  content: string;
  topic: string;
  authorid: string;
  created_at: Date | null;
  updated_at: Date | null;
  users: {
    first_name: string | null;
    last_name: string | null;
    raw_app_meta_data: any | null;
    id: string;
  };
}

export async function POST(request: Request) {
  try {
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

    // Get the user data directly from agents.user table
    const userData = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        image: true,
        first_name: true,
        last_name: true,
        name: true
      }
    });

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        topic,
        authorid: session.user.id
      },
      include: {
        users: true
      }
    }) as Discussion;

    const formattedDiscussion = {
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      topic: discussion.topic,
      authorId: discussion.authorid,
      creator: {
        name: userData?.name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Anonymous',
        image: userData?.image || DEFAULT_USER_IMAGE
      },
      created_at: discussion.created_at,
      updated_at: discussion.updated_at
    };

    return new NextResponse(
      JSON.stringify({ discussion: formattedDiscussion }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in discussion route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    const offset = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.discussion.count();

    // Get discussions with user info
    const discussions = await prisma.discussion.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        users: true
      }
    });

    // Get user data for all authors
    const userIds = discussions.map(d => d.users.id);
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
        last_name: true,
        name: true
      }
    });

    // Create a map of user data
    const userMap = new Map(users.map(u => [u.id, u]));

    // Format the discussions
    const formattedDiscussions = discussions.map(discussion => {
      const userData = userMap.get(discussion.users.id);
      // console.log('Raw user data:', userData);
      
      // Get the complete image URL from the database
      const imageUrl = userData?.image ? 
        `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${userData.image}` : 
        DEFAULT_USER_IMAGE;
      
      // console.log('Formatted image URL:', imageUrl);
      
      return {
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
    });

    return NextResponse.json({
      discussions: formattedDiscussions,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    // console.error('Error in discussion route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}