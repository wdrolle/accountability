import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = 'http://localhost:11434/api';

export async function GET() {
  try {
    // Test 1: List models
    const listResponse = await fetch(`${OLLAMA_BASE_URL}/tags`);
    const listData = await listResponse.json();

    // Test 2: Simple generate request
    const generateResponse = await fetch(`${OLLAMA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: 'Say hello',
        system: "You are a helpful AI assistant.",
        options: {
          temperature: 0.7
        }
      }),
    });

    const generateData = await generateResponse.json();

    return NextResponse.json({
      status: 'debug info',
      ollamaUrl: OLLAMA_BASE_URL,
      availableModels: listData,
      testGenerate: {
        status: generateResponse.status,
        response: generateData
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Debug check failed',
      details: error
    }, { status: 500 });
  }
} 