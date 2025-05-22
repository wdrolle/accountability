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
      `https://api.scripture.api.agents/v1/agentss/${agentsId}/chapters/${chapterId}/verses`,
      {
        headers: {
          'api-key': process.env.agents_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch verses: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the verses to match our interface
    const verses = data.data.map((verse: any) => ({
      id: verse.id,
      verse: parseInt(verse.reference.split(':')[1]),
      text: verse.content,
      reference: verse.reference
    }));

    return NextResponse.json(verses);
  } catch (error) {
    console.error('Error fetching verses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch verses' },
      { status: 500 }
    );
  }
} 