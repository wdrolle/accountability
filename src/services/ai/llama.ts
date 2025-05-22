interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  error?: string;
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export class OllamaAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages,
          stream: options.stream || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        message: data.message || data.response,
      };
    } catch (error) {
      console.error('Ollama API error:', error);
      return {
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 