import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentsId = searchParams.get('agents_id');

    if (!agentsId) {
      return NextResponse.json({ error: 'agents ID is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://api.scripture.api.agents/v1/agentss/${agentsId}/books`,
      {
        headers: {
          'api-key': process.env.agents_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the books to match our interface
    const books = data.data.map((book: any) => ({
      id: book.id,
      name: book.name,
      nameLong: book.nameLong,
      abbreviation: book.abbreviation,
      agents_id: agentsId,
      chapters: book.chapters?.length || 0
    }));

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch books' },
      { status: 500 }
    );
  }
} 