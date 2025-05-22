import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('book_id');
    const chapter = searchParams.get('chapter');
    const agentsId = searchParams.get('agents_id');

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: [] },
        { status: 401 }
      );
    }

    if (!bookId || !chapter || !agentsId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters', data: [] },
        { status: 400 }
      );
    }

    const highlights = await prisma.verse_highlights.findMany({
      where: {
        user_id: session.user.id,
        book_id: bookId,
        chapter: parseInt(chapter),
        agents_id: agentsId
      },
    });

    return NextResponse.json({ success: true, data: highlights });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch highlights',
        data: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { verse_id, color, book_id, chapter, verse, agents_id } = body;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    if (!verse_id || !color || !book_id || !chapter || !verse || !agents_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters', data: null },
        { status: 400 }
      );
    }

    try {
      const existingHighlight = await prisma.verse_highlights.findFirst({
        where: {
          user_id: session.user.id,
          verse_id: verse_id,
          agents_id: agents_id
        }
      });

      let result;
      if (existingHighlight) {
        result = await prisma.verse_highlights.update({
          where: {
            id: existingHighlight.id
          },
          data: {
            color
          }
        });
      } else {
        result = await prisma.verse_highlights.create({
          data: {
            id: `${session.user.id}_${agents_id}_${verse_id}`,
            user_id: session.user.id,
            verse_id,
            book_id,
            chapter: typeof chapter === 'string' ? parseInt(chapter) : chapter,
            verse: typeof verse === 'string' ? parseInt(verse) : verse,
            color,
            agents_id
          }
        });
      }

      return NextResponse.json({ success: true, data: result });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: dbError instanceof Error ? dbError.message : 'Database operation failed',
          data: null 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving highlight:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save highlight'
      },
      { status: 500 }
    );
  }
} 