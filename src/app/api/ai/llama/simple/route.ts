import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = 'http://localhost:11434/api';

export async function POST(req: Request) {
  try {
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: 'Say hello',
        stream: false
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama request failed: ${await ollamaResponse.text()}`);
    }

    const data = await ollamaResponse.json();
    return new NextResponse(
      JSON.stringify({ response: data.response }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process request' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 