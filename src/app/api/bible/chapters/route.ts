import { NextResponse } from 'next/server';
import { agentsApi } from '@/lib/agentsApi';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agents_id = searchParams.get('agents_id');
    const bookId = searchParams.get('bookId');

    if (!agents_id || !bookId) {
      return NextResponse.json(
        { error: 'agents ID and book ID are required' },
        { status: 400 }
      );
    }

    const chapters = await agentsApi.getChapters(agents_id, bookId);
    
    if (!chapters) {
      return NextResponse.json(
        { error: 'Chapters not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Error fetching agents chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents chapters' },
      { status: 500 }
    );
  }
} 