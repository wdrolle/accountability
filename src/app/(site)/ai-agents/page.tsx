"use client";

import { AIChat } from '@/components/ai/AIChat';
import { Avatar } from "@heroui/react";
import { useState, useRef, useMemo } from 'react';
import Image from "next/image";
import VoiceSelector from '@/components/ui/VoiceSelector';
import { Switch } from '@/components/ui/Switch';
import { Assistant } from '@/services/ai/assistant';

export default function AIAgentsPage() {
  const [currentVoice, setCurrentVoice] = useState('af_bella');
  const [isListening, setIsListening] = useState(false);
  const assistantRef = useRef<Assistant>(useMemo(() => new Assistant('af_bella'), []));

  return (
    <div className="flex h-screen pt-16 w-full max-w-full flex-col overflow-hidden">
      <div className="flex h-full flex-col justify-between gap-8 p-4">
        <div className="flex-1 overflow-y-auto">
          <div className="flex w-full flex-col items-center justify-center gap-2 mt-8 mb-1">
            <div className="flex items-center gap-2">
              <Image
                src="/images/ai-tools/ai-agent.gif"
                width={64}
                height={48}
                alt="AI Agent"
                className="w-16 h-12 object-contain"
              />
              <h1 className="text-xl font-medium">AI Agents Chat</h1>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                label={isListening ? 'Listening (Click to stop)' : 'Click to start listening'}
                isSelected={isListening}
                onChange={setIsListening}
                disabled={false}
              />
              <VoiceSelector 
                onChange={setCurrentVoice}
                currentVoice={currentVoice}
              />
            </div>
          </div>
          <AIChat />
        </div>
      </div>
    </div>
  );
} 