// agents/notes/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const book_id = searchParams.get('book_id');
    const chapter = searchParams.get('chapter');
    const agents_id = searchParams.get('agents_id');
    const user_id = searchParams.get('user_id');

    if (!book_id || !chapter || !agents_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters', data: [] },
        { status: 400 }
      );
    }

    try {
      // Fetch notes from both tables
      const [verseNotes, agentsNotes] = await Promise.all([
        prisma.verse_notes.findMany({
          where: {
            user_id,
            book_id,
            chapter: parseInt(chapter),
          },
        }),
        prisma.agents_notes.findMany({
          where: {
            user_id,
            verse_id: {
              startsWith: `${book_id}.${chapter}.`
            },
            agents_id
          },
        })
      ]);

      // Combine and deduplicate notes based on verse_id
      const combinedNotes = [...verseNotes, ...agentsNotes].reduce((acc, note) => {
        if (!acc[note.verse_id]) {
          acc[note.verse_id] = note;
        }
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json({ 
        success: true, 
        data: Object.values(combinedNotes)
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database operation failed',
          details: dbError.message,
          data: []
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch notes',
        details: error.message,
        data: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { verse_id, note, book_id, chapter, verse, agents_id, is_public } = body;

    // Validate required fields
    if (!verse_id || !note || !book_id || !chapter || !verse || !agents_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    try {
      // Create notes in both tables within a transaction
      const [verseNote, agentsNote] = await prisma.$transaction([
        // Create verse_notes entry
        prisma.verse_notes.upsert({
          where: {
            id: `${session.user.id}_${verse_id}`
          },
          update: {
            note,
            book_id,
            chapter,
            verse,
            updated_at: new Date()
          },
          create: {
            id: `${session.user.id}_${verse_id}`,
            user_id: session.user.id,
            verse_id,
            book_id,
            chapter,
            verse,
            note,
            created_at: new Date(),
            updated_at: new Date()
          }
        }),
        // Create agents_notes entry
        prisma.agents_notes.upsert({
          where: {
            id: `${session.user.id}_${verse_id}`
          },
          update: {
            note,
            agents_id,
            is_public,
            updated_at: new Date()
          },
          create: {
            id: `${session.user.id}_${verse_id}`,
            user_id: session.user.id,
            verse_id,
            agents_id,
            book_id,
            chapter,
            verse,
            note,
            is_public,
            is_favorite: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
      ]);

      return NextResponse.json({ success: true, data: { verseNote, agentsNote } });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: dbError instanceof Error ? dbError.message : 'Database operation failed',
          details: dbError
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save note',
        details: error
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verse_id, note, note_id, agents_note_id } = await request.json();

    if (!verse_id || !note || (!note_id && !agents_note_id)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    try {
      const updates = [];

      if (note_id) {
        updates.push(
          prisma.verse_notes.update({
            where: {
              id: note_id,
              user_id: session.user.id,
            },
            data: { note },
          })
        );
      }

      if (agents_note_id) {
        updates.push(
          prisma.agents_notes.update({
            where: {
              id: agents_note_id,
              user_id: session.user.id,
            },
            data: { note },
          })
        );
      }

      const results = await prisma.$transaction(updates);
      console.log('Updated notes:', results);
      return NextResponse.json(results);
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database operation failed',
          details: {
            message: dbError.message,
            code: dbError.code
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
} 