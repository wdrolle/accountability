'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Mail, MessageSquare } from 'lucide-react';
import Button from '@/components/CustomButtons/Button';
import { Spinner } from "@heroui/react";

export const PRAYER_THEMES = [
  { id: 'faith', name: 'Faith', description: 'Prayers to strengthen your faith and trust in God' },
  { id: 'love', name: 'Love', description: 'Prayers focused on love for God and others' },
  { id: 'hope', name: 'Hope', description: 'Prayers for hope and encouragement in difficult times' },
  { id: 'wisdom', name: 'Wisdom', description: 'Prayers for divine wisdom and understanding' },
  { id: 'peace', name: 'Peace', description: 'Prayers for inner peace and tranquility' },
  { id: 'strength', name: 'Strength', description: 'Prayers for strength and perseverance' },
  { id: 'forgiveness', name: 'Forgiveness', description: 'Prayers for forgiveness and reconciliation' },
  { id: 'gratitude', name: 'Gratitude', description: 'Prayers of thanksgiving and appreciation' }
];

export default function GenerateMessagePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/login?callbackUrl=/prayer-guidance/generate-message';
    },
  });
  
  const [selectedTheme, setSelectedTheme] = useState(PRAYER_THEMES[0]);
  const [generatedPrayer, setGeneratedPrayer] = useState('');
  const [displayedPrayer, setDisplayedPrayer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const loadingMessageRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (generatedPrayer && generatedPrayer !== displayedPrayer) {
      let currentIndex = 0;
      
      const typeNextCharacter = () => {
        if (currentIndex <= generatedPrayer.length) {
          setDisplayedPrayer(generatedPrayer.slice(0, currentIndex));
          currentIndex++;
          typewriterRef.current = setTimeout(typeNextCharacter, 30); // Adjust speed as needed
        }
      };

      typeNextCharacter();

      return () => {
        if (typewriterRef.current) {
          clearTimeout(typewriterRef.current);
        }
      };
    }
  }, [generatedPrayer]);

  useEffect(() => {
    if (isGenerating) {
      const fullMessage = "Creating your personalized prayer with divine inspiration...";
      let currentIndex = 0;

      const typeLoadingMessage = () => {
        if (currentIndex <= fullMessage.length) {
          setLoadingMessage(fullMessage.slice(0, currentIndex));
          currentIndex++;
          loadingMessageRef.current = setTimeout(typeLoadingMessage, 50);
        }
      };

      typeLoadingMessage();

      return () => {
        if (loadingMessageRef.current) {
          clearTimeout(loadingMessageRef.current);
        }
        setLoadingMessage('');
      };
    }
  }, [isGenerating]);

  const generatePrayer = async () => {
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
    }
    setIsGenerating(true);
    setGeneratedPrayer('');
    setDisplayedPrayer('');
    
    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          themeId: selectedTheme.id,
          prompt: prompt
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate message');
      }
      
      if (!data.success || !data.message) {
        throw new Error('No message received');
      }

      setGeneratedPrayer(data.message);
      toast.success('Message generated successfully');
    } catch (error) {
      console.error('Error generating message:', error);
      toast.error('Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prayer: generatedPrayer,
          themeId: selectedTheme.id,
          type: 'email'
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }
      
      if (data.success) {
        toast.success('Prayer sent to your email!');
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendText = async () => {
    setIsSendingText(true);
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prayer: generatedPrayer,
          themeId: selectedTheme.id
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send text');
      }
      
      if (data.success) {
        toast.success('Prayer sent to your phone!');
      } else {
        throw new Error(data.error || 'Failed to send text');
      }
    } catch (error) {
      console.error('Error sending text:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send text');
    } finally {
      setIsSendingText(false);
    }
  };

  const Spinner = () => (
    <div className="min-h-[300px] flex flex-col items-center justify-center">
      <div className="w-16 h-16 mb-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-secondary"></div>
      </div>
      <p className="text-secondary text-lg font-medium text-center min-h-[2em]">
        {loadingMessage}
      </p>
    </div>
  );

  const PrayerContent = () => {
    if (isGenerating) {
      return (
        <div className="min-h-[300px] relative">
          <Spinner />
        </div>
      );
    }

    if (displayedPrayer) {
      return (
        <div className="prose prose-lg dark:prose-invert min-h-[300px] px-6 py-4">
          <p className="text-black dark:text-white whitespace-pre-wrap text-justify">{displayedPrayer}</p>
        </div>
      );
    }

    return (
      <div className="min-h-[300px] flex items-center justify-center px-6">
        <p className="text-body-color dark:text-gray-400 italic text-center">
          Select a theme and click "Generate New Message" to create a personalized message...
        </p>
      </div>
    );
  };

  if (status === "loading") {
    return <Spinner />;
  }

  return (
    <>
      <Breadcrumb pageTitle="AI Generated Message" />
      <section className="pb-5 pt-5 md:pb-5 md:pt-5 xl:pb-5 xl:pt-5">
        <div className="container">
          <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4 sm:p-8 lg:px-4 xl:p-8"
            style={{
              transform: 'perspective(1000px) rotateX(2deg)',
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="max-w-[1200px] mx-auto">
              <div className="grid grid-cols-12 gap-8">
                {/* Left Column - Input Fields (30%) */}
                <div className="col-span-4 space-y-6">
                  {/* Prayer Theme Selection */}
                  <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <label htmlFor="theme" className="block text-xl font-bold text-black dark:text-white mb-4">
                      Prayer Theme
                    </label>
                    <select
                      id="theme"
                      value={selectedTheme.id}
                      onChange={(e) => setSelectedTheme(PRAYER_THEMES.find(t => t.id === e.target.value) || PRAYER_THEMES[0])}
                      className="w-full rounded-lg bg-[url(/images/cta/grid.svg)] border-2 border-gray-300/20 dark:border-gray-600/20 p-4 text-black dark:text-white focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20 [&>option]:bg-white dark:[&>option]:bg-dark [&>option]:text-black dark:[&>option]:text-white"
                      style={{
                        transform: 'perspective(1000px) rotateX(2deg)',
                        boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {PRAYER_THEMES.map(theme => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-body-color dark:text-gray-400">
                      {selectedTheme.description}
                    </p>
                  </div>

                  {/* Generate Button */}
                  <div className="text-center light:text-white dark:text-white">
                    <Button
                      color="primary"
                      disabled={isGenerating}
                      onClick={generatePrayer}
                      fullWidth
                      className="light:text-white dark:text-white"
                    >
                      {isGenerating ? 'Generating Prayer...' : 'Generate New Prayer'}
                    </Button>
                  </div>

                  {generatedPrayer && (
                    <>
                      {/* Send Email Card */}
                      <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4"
                        style={{
                          transform: 'perspective(1000px) rotateX(2deg)',
                          boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold light:text-black dark:text-white">Send to Email</h3>
                          <Mail className="h-6 w-6 light:text-white dark:text-white" />
                        </div>
                        <Button
                          color="primary"
                          disabled={isSendingEmail}
                          onClick={sendEmail}
                          fullWidth
                          className="light:text-white dark:text-white"
                        >
                          {isSendingEmail ? 'Sending...' : 'Send to My Email'}
                        </Button>
                      </div>

                      {/* Send Text Card */}
                      <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4"
                        style={{
                          transform: 'perspective(1000px) rotateX(2deg)',
                          boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-black dark:text-white">Send as Text</h3>
                          <MessageSquare className="h-6 w-6 text-black dark:text-white" />
                        </div>
                        <Button
                          color="primary"
                          disabled={isSendingText}
                          onClick={sendText}
                          fullWidth
                          className="light:text-white dark:text-white"
                        >
                          {isSendingText ? 'Sending...' : 'Send to My Phone'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column - Prayer Preview (60%) */}
                <div className="col-span-8 space-y-6">
                  <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-4">Generated Prayer</h3>
                    <PrayerContent />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
} 