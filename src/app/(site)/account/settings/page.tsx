'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/Breadcrumb';
import { ThemeToggle } from '@/components/ThemeToggle';

interface UserPreferences {
  theme_preferences: string[];
  blocked_themes: string[];
  message_length_preference: string;
}

const messageLengths = [
  { value: 'SHORT', label: 'Short (2-3 minutes)' },
  { value: 'MEDIUM', label: 'Medium (4-5 minutes)' },
  { value: 'LONG', label: 'Long (6-7 minutes)' },
];

const themeOptions = [
  { value: 'faith', label: 'Faith' },
  { value: 'hope', label: 'Hope' },
  { value: 'love', label: 'Love' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'prayer', label: 'Prayer' },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserPreferences();
    }
  }, [session]);

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      const data = await response.json();

      if (response.ok) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      toast.error('Failed to load preferences');
    }
  };

  const handlePreferenceChange = async (field: string, value: any) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      [field]: value,
    };

    setPreferences(updatedPreferences);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: updatedPreferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Please Log In to view your settings</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Settings" />
      <section className="pb-5 pt-5 md:pb-5 md:pt-5 xl:pb-5 xl:pt-5">
        <div className="container">
          <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4 sm:p-8 lg:px-4 xl:p-8"
            style={{
              transform: 'perspective(1000px) rotateX(2deg)',
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-2xl font-bold text-black dark:text-white">Settings</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Toggle */}
                <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4"
                  style={{
                    transform: 'perspective(1000px) rotateX(2deg)',
                    boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h3 className="text-xl font-bold text-black dark:text-white mb-4">Theme</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-black dark:text-white">Dark Mode</span>
                    <ThemeToggle />
                  </div>
                </div>

                {/* Message Length */}
                <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4"
                  style={{
                    transform: 'perspective(1000px) rotateX(2deg)',
                    boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h3 className="text-xl font-bold text-black dark:text-white mb-4">Message Length</h3>
                  <select
                    value={preferences?.message_length_preference || 'MEDIUM'}
                    onChange={(e) => handlePreferenceChange('message_length_preference', e.target.value)}
                    className="w-full rounded-lg bg-[url(/images/cta/grid.svg)] border-2 border-gray-300/20 dark:border-gray-600/20 p-4 text-black dark:text-white focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20 [&>option]:bg-white dark:[&>option]:bg-dark [&>option]:text-black dark:[&>option]:text-white"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {messageLengths.map((length) => (
                      <option key={length.value} value={length.value}>
                        {length.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Theme Preferences */}
                <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 p-4 md:col-span-2"
                  style={{
                    transform: 'perspective(1000px) rotateX(2deg)',
                    boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h3 className="text-xl font-bold text-black dark:text-white mb-4">Content Themes</h3>
                  <div className="space-y-2">
                    {themeOptions.map((theme) => (
                      <label key={theme.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={preferences?.theme_preferences.includes(theme.value)}
                          onChange={(e) => {
                            const updatedThemes = e.target.checked
                              ? [...(preferences?.theme_preferences || []), theme.value]
                              : preferences?.theme_preferences.filter((t) => t !== theme.value) || [];
                            handlePreferenceChange('theme_preferences', updatedThemes);
                          }}
                          className="rounded border-gray-300/20 dark:border-gray-600/20 text-primary shadow-sm focus:border-primary/20 focus:ring focus:ring-primary/20 focus:ring-opacity-50"
                        />
                        <span className="text-black dark:text-white">{theme.label}</span>
                      </label>
                    ))}
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