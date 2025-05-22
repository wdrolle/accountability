import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = 'http://localhost:11434/api';

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`);
    const data = await response.json();
    
    console.log('Available models:', data);
    
    return NextResponse.json({ 
      models: data.models,
      raw: data 
    });
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
} 