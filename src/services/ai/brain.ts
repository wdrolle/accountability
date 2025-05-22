import { AIMessage, AIResponse } from './types';

export class AIBrain {
  private model: string;
  private baseUrl: string;
  private systemPrompt: string;

  constructor(model: string = 'deepseek-r1:8b') {
    this.model = model;
    this.baseUrl = 'http://localhost:11434';
    this.systemPrompt = `You are a helpful AI assistant named Zoe. 
When responding:
1. Be concise and clear
2. Only respond when directly addressed by name "Zoe"
3. Keep responses focused and relevant
4. If not addressed as "Zoe", respond with empty string`;
  }

  async think(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const lastMessage = messages[messages.length - 1];
      
      // Check if the last message contains "Zoe"
      if (!lastMessage.content.toLowerCase().includes('zoe')) {
        console.log('Message does not contain AI name, skipping response');
        return { content: '' };
      }

      const requestBody = {
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...messages
        ],
        stream: false
      };

      console.log('Sending request to Ollama:', {
        url: `${this.baseUrl}/api/chat`,
        body: requestBody
      });

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama error response:', errorText);
        throw new Error(`AI request failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw Ollama response:', data);

      if (!data.message?.content) {
        console.error('Invalid Ollama response format:', data);
        throw new Error('Invalid response format');
      }

      return { content: data.message.content };
    } catch (error) {
      console.error('AI error:', error);
      return { content: '', error: error instanceof Error ? error.message : 'AI processing failed' };
    }
  }
} 