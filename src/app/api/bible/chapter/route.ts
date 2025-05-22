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

    const chapter = await agentsApi.getChapter(agents_id, chapterId);
    
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: chapter.id,
      content: chapter.content,
    });
  } catch (error) {
    console.error('Error fetching agents chapter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents chapter' },
      { status: 500 }
    );
  }
} 