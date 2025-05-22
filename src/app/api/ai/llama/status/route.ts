import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = 'http://localhost:11434/api';

export async function GET() {
  try {
    // Test basic connectivity to Ollama
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`);
    
    if (!response.ok) {
      throw new Error(`Failed to connect to Ollama: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ 
      status: 'ok',
      models: data.models,
      raw: data 
    });
  } catch (error) {
    console.error('Ollama status check failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    );
  }
} 