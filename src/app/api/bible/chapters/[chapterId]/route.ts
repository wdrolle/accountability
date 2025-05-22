import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const { searchParams } = new URL(request.url);
    const agentsId = searchParams.get('agents_id');

    if (!agentsId) {
      return NextResponse.json({ error: 'agents ID is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://api.scripture.api.agents/v1/agentss/${agentsId}/chapters/${chapterId}`,
      {
        headers: {
          'api-key': process.env.agents_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      id: data.data.id,
      content: data.data.content,
      reference: data.data.reference,
      verseCount: data.data.verseCount
    });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
} 