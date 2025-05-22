import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface UserMetaData {
  first_name?: string;
  last_name?: string;
  image?: string | null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      include: {
        agents_group_member: {
          where: {
            user_id: session.user.id,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const files = await prisma.agents_group_file.findMany({
      where: {
        group_id: groupId,
      },
      include: {
        users: {
          select: {
            id: true,
            raw_user_meta_data: true,
          },
        },
      },
    });

    const formattedFiles = files.map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size,
      type: file.type,
      created_at: file.created_at,
      updated_at: file.updated_at,
      user: {
        id: file.users.id,
        first_name: (file.users.raw_user_meta_data as UserMetaData)?.first_name || '',
        last_name: (file.users.raw_user_meta_data as UserMetaData)?.last_name || '',
        image: (file.users.raw_user_meta_data as UserMetaData)?.image || null,
      },
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error('Error fetching group files:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      include: {
        agents_group_member: {
          where: {
            user_id: session.user.id,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.agents_group_member.length === 0) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const body = await request.json();
    const { name, url, size, type } = body;

    const file = await prisma.agents_group_file.create({
      data: {
        name,
        url,
        size,
        type,
        group_id: groupId,
        user_id: session.user.id,
      },
      include: {
        users: {
          select: {
            id: true,
            raw_user_meta_data: true,
          },
        },
      },
    });

    const formattedFile = {
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size,
      type: file.type,
      created_at: file.created_at,
      updated_at: file.updated_at,
      user: {
        id: file.users.id,
        first_name: (file.users.raw_user_meta_data as UserMetaData)?.first_name || '',
        last_name: (file.users.raw_user_meta_data as UserMetaData)?.last_name || '',
        image: (file.users.raw_user_meta_data as UserMetaData)?.image || null,
      },
    };

    return NextResponse.json(formattedFile);
  } catch (error) {
    console.error('Error creating group file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const file = await prisma.agents_group_file.findUnique({
      where: { id: fileId },
      include: {
        agents_group: {
          include: {
            agents_group_member: {
              where: {
                user_id: session.user.id,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.user_id !== session.user.id && file.agents_group.leader_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 });
    }

    await prisma.agents_group_file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting group file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 