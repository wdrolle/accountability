// src/components/PollyPlayer/index.tsx

'use client';

import React from 'react';
import { useState, useRef } from 'react';

interface PollyPlayerProps {
  text: string;
  voices?: string[];
}

export default function PollyPlayer({ text, voices = ['Joanna', 'Matthew'] }: PollyPlayerProps) {
  const [currentVoice, setCurrentVoice] = useState(voices[0]);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const synthesizeSpeech = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/polly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: currentVoice }),
      });

      if (!response.ok) throw new Error('Speech synthesis failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <audio ref={audioRef} controls className="w-64" />
      <select 
        value={currentVoice}
        onChange={(e) => setCurrentVoice(e.target.value)}
        className="border rounded px-2 py-1"
      >
        {voices.map(voice => (
          <option key={voice} value={voice}>{voice}</option>
        ))}
      </select>
      <button 
        onClick={synthesizeSpeech}
        disabled={isLoading}
        className="px-4 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        {isLoading ? 'Loading...' : 'Speak'}
      </button>
    </div>
  );
} 