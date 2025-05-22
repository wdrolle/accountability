import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, fileId } = params;

    // Check if user is a member of the group
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        status: 'ACTIVE',
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized to delete files from this group' }, { status: 403 });
    }

    // Get the file to check ownership
    const file = await prisma.agents_group_file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Only allow file owner to delete
    if (file.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 });
    }

    // Delete the file
    await prisma.agents_group_file.delete({
      where: { id: fileId }
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 