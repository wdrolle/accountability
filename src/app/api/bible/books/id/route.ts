import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const version_id = searchParams.get('version_id');
    const book_code = searchParams.get('book_code');

    if (!version_id || !book_code) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // First get all books for this version
    const books = await prisma.agents_books.findMany({
      where: {
        version_id: version_id
      },
      select: {
        id: true,
        name: true,
        book_number: true
      }
    });

    if (!books || books.length === 0) {
      // console.error('[DEBUG] No books found for version:', version_id);
      return NextResponse.json(
        { error: 'No books found for this version' },
        { status: 404 }
      );
    }

    // Get book data from API
    const apiResponse = await fetch(`https://api.scripture.api.agents/v1/agentss/${version_id}/books`, {
      headers: {
        'api-key': process.env.agents_API_KEY || ''
      }
    });

    if (!apiResponse.ok) {
      // console.error('[DEBUG] Failed to fetch from agents API:', apiResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch book data' },
        { status: 500 }
      );
    }

    const apiData = await apiResponse.json();
    const apiBook = apiData.data.find((b: any) => b.id.startsWith(book_code));

    if (!apiBook) {
      // console.error('[DEBUG] Book not found in API:', { version_id, book_code });
      return NextResponse.json(
        { error: 'Book not found in API' },
        { status: 404 }
      );
    }

    // Find matching book in our database
    const matchingBook = books.find(b => b.name === apiBook.name);

    if (!matchingBook) {
      // console.error('[DEBUG] Book not found in database:', { 
      //   version_id, 
      //   book_code,
      //   api_book_name: apiBook.name,
      //   available_books: books.map(b => b.name)
      // });
      return NextResponse.json(
        { error: 'Book not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: matchingBook.id });
  } catch (error) {
    // console.error('Error getting book ID:', error);
    return NextResponse.json(
      { error: 'Failed to get book ID' },
      { status: 500 }
    );
  }
} 