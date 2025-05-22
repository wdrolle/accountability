// src/app/api/polly/route.ts

import { NextResponse } from 'next/server';
import { PollyService } from '@/utils/pollyService';

export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const pollyService = new PollyService();
    const audioBuffer = await pollyService.synthesizeSpeech(text, voiceId);

    // Return audio as a stream
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Polly API error:', error);
    return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 });
  }
} 