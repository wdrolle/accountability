import { NextResponse } from 'next/server';
import { agentsApi } from '@/lib/agentsApi';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agents_id = searchParams.get('agents_id');
    const chapterId = searchParams.get('chapterId');

    if (!agents_id || !chapterId) {
      return NextResponse.json(
        { error: 'agents ID and chapter ID are required' },
        { status: 400 }
      );
    }

    const verses = await agentsApi.getVerses(agents_id, chapterId);
    
    // Transform the data to match our frontend expectations
    const transformedVerses = verses.map(verse => ({
      id: verse.id,
      verse: parseInt(verse.reference.split(':')[1]),
      text: verse.content,
    }));

    return NextResponse.json(transformedVerses);
  } catch (error) {
    console.error('Error fetching agents verses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents verses' },
      { status: 500 }
    );
  }
} 