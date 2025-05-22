import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing user_id parameter',
        data: [] 
      });
    }

    // Fetch verse notes with book information
    const verseNotes = await prisma.verse_notes.findMany({
      where: {
        user_id: user_id,
      },
      distinct: ['id'],
      orderBy: [
        { id: 'asc' },
        { created_at: 'desc' }
      ],
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    // Get agents notes for the user to get agents version info
    const agentsNotes = await prisma.agents_notes.findMany({
      where: {
        user_id: user_id,
        verse_id: {
          in: verseNotes.map(note => note.verse_id)
        }
      }
    });

    // Get all unique agents IDs
    const agentsIds = Array.from(new Set(agentsNotes.map(note => note.agents_id)));

    // Get agents versions info
    const agentsVersions = await prisma.agents_versions.findMany({
      where: {
        id: {
          in: agentsIds
        }
      }
    });

    // Get book information by matching version_id with agents_id
    const books = await prisma.agents_books.findMany({
      where: {
        version_id: {
          in: agentsIds
        }
      }
    });

    // Create lookup maps for efficient access
    const agentsNotesMap = new Map(agentsNotes.map(note => [note.verse_id, note]));
    const agentsVersionsMap = new Map(agentsVersions.map(version => [version.id, version]));
    const booksMap = new Map(
      books.map(book => [`${book.version_id}-${book.id}`, book])
    );

    // Format the response
    const formattedVerses = verseNotes.map(note => {
      const agentsNote = agentsNotesMap.get(note.verse_id);
      const agentsVersion = agentsNote ? agentsVersionsMap.get(agentsNote.agents_id) : null;
      const bookInfo = agentsNote ? books.find(book => 
        book.version_id === agentsNote.agents_id && 
        book.id === note.book_id
      ) : null;

      // Debug information
      console.log('Debug Info:', {
        note_book_id: note.book_id,
        agents_note_agents_id: agentsNote?.agents_id,
        bookInfo,
        agentsNote,
      });
    
      return {
        id: note.id,
        first_name: note.user.first_name,
        last_name: note.user.last_name,
        verse_id: note.verse_id,
        book_id: note.book_id,
        chapter: note.chapter,
        verse: note.verse,
        note: note.note,
        book_name: bookInfo?.name || 'Unknown',
        agents_version: agentsVersion?.name || 'Unknown Version',
        agents_abbreviation: agentsVersion?.abbreviation || '',
        created_at: note.created_at
      };
    });

    return NextResponse.json({ 
      success: true,
      data: formattedVerses,
      count: formattedVerses.length 
    });

  } catch (error) {
    console.error('Error in /api/agents/saved/all:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch saved verses',
      data: [] 
    }, { 
      status: 500 
    });
  }
} 