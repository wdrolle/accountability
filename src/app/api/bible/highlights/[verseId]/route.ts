import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { verseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const verseId = params.verseId;
    if (!verseId) {
      return NextResponse.json(
        { success: false, error: 'Verse ID is required' },
        { status: 400 }
      );
    }

    // Find the highlight first
    const highlight = await prisma.verse_highlights.findFirst({
      where: {
        user_id: session.user.id,
        verse_id: verseId,
        agents_id: verseId.split('.')[0] // Extract agents_id from verse_id
      }
    });

    if (!highlight) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Delete the highlight using its ID
    await prisma.verse_highlights.delete({
      where: {
        id: highlight.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete highlight'
      },
      { status: 500 }
    );
  }
} 