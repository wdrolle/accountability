import { NextRequest } from 'next/server';
import { OllamaAPI } from '@/services/ai/llama';

const ollama = new OllamaAPI('http://localhost:11434');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, assistant } = body;
    
    const response = await ollama.chat({
      model: 'llama3.2',
      messages: [{ role: 'user', content: message }],
      stream: false
    });

    return new Response(JSON.stringify({
      message: response.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Chat processing error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 