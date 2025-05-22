"use client";

import { useState } from 'react';
import { AIMessage } from '@/types/ai-agents';

interface ThinkingState {
  deepseek: boolean;
  llama: boolean;
  finalizing: boolean;
  currentThought?: string;
}

export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [thinkingState, setThinkingState] = useState<ThinkingState>({
    deepseek: false,
    llama: false,
    finalizing: false,
    currentThought: ''
  });

  const sendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setThinkingState({ 
        deepseek: true, 
        llama: false, 
        finalizing: false,
        currentThought: 'Analyzing...'
      });

      const userMessage: AIMessage = { 
        id: crypto.randomUUID(),
        role: 'user', 
        content: message, 
        agent: 'user'
      };

      setMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message) {
        throw new Error('Invalid response format from AI service');
      }

      // Store debug info and update thinking state
      if (data.debug) {
        setDebugInfo(data.debug);
        
        setThinkingState(prev => ({
          ...prev,
          llama: true,
          currentThought: 'Llama is analyzing DeepSeek\'s response...'
        }));

        // Add thinking steps as hidden messages
        const thinkingMessages: AIMessage[] = [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.debug.initial_response,
            agent: 'deepseek',
            hidden: true,
            title: 'Initial DeepSeek Thoughts'
          },
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.debug.llama_feedback,
            agent: 'llama3',
            hidden: true,
            title: 'Llama Analysis'
          }
        ];

        setThinkingState(prev => ({
          ...prev,
          llama: false,
          finalizing: true,
          currentThought: 'Finalizing response with feedback...'
        }));

        const finalMessage: AIMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.choices[0].message.content,
          agent: 'deepseek',
          title: 'Final Response'
        };

        setMessages(prev => [...prev, ...thinkingMessages, finalMessage]);
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setThinkingState({
        deepseek: false,
        llama: false,
        finalizing: false,
        currentThought: ''
      });
    }
  };

  return { 
    messages, 
    isLoading, 
    error, 
    sendMessage,
    debugInfo,
    thinkingState
  };
} 