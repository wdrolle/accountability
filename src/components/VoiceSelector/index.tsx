// src/components/VoiceSelector/index.tsx

'use client';

import React, { useState, useEffect } from 'react';

interface Voice {
  id: string;
  name: string;
  style?: string;
  description?: string;
}

interface VoiceGroup {
  language: string;
  code: string;
  voices: {
    female: Voice[];
    male: Voice[];
  };
}

interface VoiceSelectorProps {
  onVoiceChange: (voice: { id: string; languageCode: string }) => void;
  defaultVoiceId?: string;
  className?: string;
}

export default function VoiceSelector({ onVoiceChange, defaultVoiceId = 'Joanna', className = '' }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceGroup[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string; language: string; code: string; style?: string; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadVoices() {
      try {
        const response = await fetch('/api/tts');
        const data = await response.json();
        if (Array.isArray(data.voices)) {
          setVoices(data.voices);

          // Find and set the default voice
          for (const voiceGroup of data.voices) {
            const femaleVoice = voiceGroup.voices.female.find((v: Voice) => v.id === defaultVoiceId);
            const maleVoice = voiceGroup.voices.male.find((v: Voice) => v.id === defaultVoiceId);
            const voice = femaleVoice || maleVoice;
            if (voice) {
              setSelectedVoice({
                ...voice,
                language: voiceGroup.language,
                code: voiceGroup.code
              });
              break;
            }
          }
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVoices();
  }, [defaultVoiceId]);

  const handleVoiceChange = (voice: { id: string; name: string; language: string; code: string; style?: string; description?: string }) => {
    setSelectedVoice(voice);
    onVoiceChange({ id: voice.id, languageCode: voice.code });
    setIsOpen(false);
  };

  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded-md" />;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-left bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="block truncate">
          {selectedVoice ? (
            <span>
              {selectedVoice.name}
              {selectedVoice.style && <span className="text-gray-500 ml-1">({selectedVoice.style})</span>}
              <span className="text-gray-400 ml-1">- {selectedVoice.language}</span>
            </span>
          ) : (
            'Select a voice'
          )}
        </span>
        <span className="ml-2">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          {voices.map((voiceGroup) => (
            <div key={voiceGroup.code} className="px-2 py-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 border-b">
                {voiceGroup.language}
              </div>
              {[
                { label: 'Female Voices', options: voiceGroup.voices.female.map(voice => ({ ...voice, language: voiceGroup.language, code: voiceGroup.code })) },
                { label: 'Male Voices', options: voiceGroup.voices.male.map(voice => ({ ...voice, language: voiceGroup.language, code: voiceGroup.code })) }
              ].map((section) => (
                <div key={section.label} className="mt-2">
                  <div className="text-xs font-medium text-gray-400 px-2 py-1 bg-gray-50">
                    {section.label}
                  </div>
                  {section.options.map((voice) => (
                    <button
                      key={voice.id}
                      className={`w-full text-left px-4 py-2 hover:bg-indigo-50 flex flex-col ${
                        selectedVoice?.id === voice.id ? 'bg-indigo-50 font-medium' : ''
                      }`}
                      onClick={() => handleVoiceChange(voice)}
                    >
                      <span className="font-medium">{voice.name}</span>
                      {voice.style && (
                        <span className="text-sm text-gray-500">{voice.style}</span>
                      )}
                      {voice.description && (
                        <span className="text-xs text-gray-400">{voice.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 