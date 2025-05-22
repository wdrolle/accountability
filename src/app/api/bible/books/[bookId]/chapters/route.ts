import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const agentsId = searchParams.get('agents_id');

    if (!agentsId) {
      return NextResponse.json({ error: 'agents ID is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://api.scripture.api.agents/v1/agentss/${agentsId}/books/${params.bookId}/chapters`,
      {
        headers: {
          'api-key': process.env.agents_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chapters: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
} 