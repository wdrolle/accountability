import { AIAgentConfig, AIMessage } from "@/types/ai-agents";

const OLLAMA_BASE_URL = 'http://localhost:11434/api';

export const defaultConfigs: Record<string, AIAgentConfig> = {
  'llama3': {
    name: 'llama3',
    temperature: 0.1,
    maxTokens: 8000
  },
  'deepseek-r1:8b': {
    name: 'deepseek-r1:8b',
    temperature: 0.1,
    maxTokens: 8000
  }
};

export async function getAIResponse(messages: AIMessage[], agent: 'llama3' | 'deepseek-r1:8b'): Promise<string> {
  if (agent === 'llama3') {
    return getLlamaResponse(messages);
  } else {
    return getDeepseekResponse(messages);
  }
}

async function getLlamaResponse(messages: AIMessage[]): Promise<string> {
  try {
    console.log('[DEBUG] getLlamaResponse called with:', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });

    const modelName = 'llama3';
    console.log('[DEBUG] Using model name:', modelName);

    const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: messages[messages.length - 1].content,
        stream: false
      }),
    });

    console.log('[DEBUG] Ollama response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] Ollama error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Llama response failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Ollama response data:', data);

    if (!data.response) {
      throw new Error('Invalid response format from Llama');
    }

    return data.response;
  } catch (error) {
    console.error('[DEBUG] getLlamaResponse error:', error);
    throw error;
  }
}

async function getDeepseekResponse(messages: AIMessage[]): Promise<string> {
  try {
    console.log('[DEBUG] getDeepseekResponse called with:', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });

    const response = await fetch('/api/ai/deepseek/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek response failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.response) {
      throw new Error('Invalid response format from DeepSeek');
    }

    return data.response;
  } catch (error) {
    console.error('[DEBUG] getDeepseekResponse error:', error);
    throw error;
  }
} 