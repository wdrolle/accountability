export type AIMessageRole = 'user' | 'assistant' | 'system';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent: 'user' | 'deepseek' | 'llama3';
  hidden?: boolean;
  title?: string;
  timestamp?: Date;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface AIAgentConfig {
  name: 'llama3' | 'deepseek-r1:8b';
  modelPath?: string;
  temperature?: number;
  maxTokens?: number;
} 