'use client';

// Polly Voice Selector Below
// src/components/VoiceSelector/index.tsx

import React, { useState } from 'react';

interface PollyVoice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  gender: 'Female' | 'Male';
}

const POLLY_VOICES: PollyVoice[] = [
  { id: 'Olivia', name: 'Olivia', language: 'English (Australian)', languageCode: 'en-AU', gender: 'Female' },
  { id: 'Kajal', name: 'Kajal', language: 'English (Indian)', languageCode: 'en-IN', gender: 'Female' },
  { id: 'Amy', name: 'Amy', language: 'English (UK)', languageCode: 'en-GB', gender: 'Female' },
  { id: 'Danielle', name: 'Danielle', language: 'English (US)', languageCode: 'en-US', gender: 'Female' },
  { id: 'Joanna', name: 'Joanna', language: 'English (US)', languageCode: 'en-US', gender: 'Female' },
  { id: 'Matthew', name: 'Matthew', language: 'English (US)', languageCode: 'en-US', gender: 'Male' },
  { id: 'Ruth', name: 'Ruth', language: 'English (US)', languageCode: 'en-US', gender: 'Female' },
  { id: 'Stephen', name: 'Stephen', language: 'English (US)', languageCode: 'en-US', gender: 'Male' },
  { id: 'Ayanda', name: 'Ayanda', language: 'English (South African)', languageCode: 'en-ZA', gender: 'Female' },
];

interface VoiceSelectorProps {
  onVoiceChange: (voice: { id: string; languageCode: string }) => void;
  defaultVoiceId?: string;
  className?: string;
}

export default function VoiceSelectorPolly({ onVoiceChange, defaultVoiceId = 'Joanna', className = '' }: VoiceSelectorProps) {
  const [selectedVoice, setSelectedVoice] = useState<PollyVoice | null>(
    POLLY_VOICES.find(voice => voice.id === defaultVoiceId) || null
  );

  const handleVoiceChange = (voiceId: string) => {
    const voice = POLLY_VOICES.find(v => v.id === voiceId);
    if (voice) {
      setSelectedVoice(voice);
      onVoiceChange({ id: voice.id, languageCode: voice.languageCode });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedVoice?.id || ''}
        onChange={(e) => handleVoiceChange(e.target.value)}
        className="w-full px-3 py-2 text-left bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="" disabled>Select a voice</option>
        {POLLY_VOICES.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name} - {voice.language} ({voice.gender})
          </option>
        ))}
      </select>
    </div>
  );
} 