import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const bookId = searchParams.get('bookId');
    const chapter = searchParams.get('chapter');

    if (!user_id || !bookId || !chapter) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const savedVerses = await prisma.saved_verses.findMany({
      where: {
        user_id: user_id,
        book_id: bookId,
        chapter: parseInt(chapter),
      },
      select: {
        verse_id: true,
      },
    });

    // Return array of verse IDs
    return NextResponse.json(savedVerses.map(v => v.verse_id));
  } catch (error) {
    console.error('Error fetching saved verses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved verses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, verse_id } = await request.json();

    if (!user_id || !verse_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Parse verse ID to get book and chapter (format: BOOK.CHAPTER.VERSE)
    const [bookId, chapter, verse] = verse_id.split('.');

    // Check if verse is already saved
    const existingSave = await prisma.saved_verses.findUnique({
      where: {
        user_id_verse_id: {
          user_id: user_id,
          verse_id: verse_id,
        },
      },
    });

    if (existingSave) {
      // If verse is already saved, delete it (toggle off)
      await prisma.saved_verses.delete({
        where: {
          user_id_verse_id: {
            user_id: user_id,
            verse_id: verse_id,
          },
        },
      });
      return NextResponse.json({ saved: false });
    } else {
      // If verse is not saved, save it (toggle on)
      const result = await prisma.saved_verses.create({
        data: {
          user_id: user_id,
          verse_id: verse_id,
          book_id: bookId,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
        },
      });
      return NextResponse.json({ saved: true, verse: result });
    }
  } catch (error) {
    console.error('Error saving verse:', error);
    return NextResponse.json(
      { error: 'Failed to save verse' },
      { status: 500 }
    );
  }
} 