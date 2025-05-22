import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const polly = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(request: Request) {
  try {
    const { text, voice = 'Joanna', rate = 1.0 } = await request.json();

    if (!text) {
      return new NextResponse('Text is required', { status: 400 });
    }

    const command = new SynthesizeSpeechCommand({
      Engine: 'neural',
      LanguageCode: 'en-US',
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voice,
      SampleRate: '24000',
    });

    const response = await polly.send(command);
    const audioStream = response.AudioStream;

    if (!audioStream) {
      throw new Error('Failed to generate audio');
    }

    // Convert the audio stream to a Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return the audio as a response with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Failed to generate speech',
      { status: 500 }
    );
  }
} 