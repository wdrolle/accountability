'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/Breadcrumb';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardBody, CardHeader, Select, SelectItem, Checkbox } from '@heroui/react';
import { appApiUrl } from '@/lib/journal';
import { heroSelectClassNames, heroSelectPopoverProps } from '@/lib/utils';

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
  { value: 'reflection', label: 'Reflection' },
  { value: 'habits', label: 'Habits' },
  { value: 'planning', label: 'Planning' },
  { value: 'mood', label: 'Mood' },
  { value: 'gratitude', label: 'Gratitude' },
];

const checkboxClassNames = {
  base: 'max-w-fit items-center gap-2',
  wrapper:
    'h-5 w-5 min-w-5 max-w-5 overflow-hidden rounded-[4px] border-2 border-gray-400 bg-transparent after:bg-black dark:border-white/50 dark:after:bg-white',
  icon: 'h-3 w-3 text-white dark:text-black',
  label: 'text-sm text-black dark:text-white',
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserPreferences();
    }
  }, [session]);

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch(appApiUrl('/api/user/preferences'));
      const data = await response.json();

      if (response.ok) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      toast.error('Failed to load preferences');
    }
  };

  const handlePreferenceChange = async (field: string, value: unknown) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      [field]: value,
    };

    setPreferences(updatedPreferences);

    try {
      const response = await fetch(appApiUrl('/api/user/preferences'), {
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
        <p className="text-xl text-black dark:text-white">Please log in to view your settings</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Settings" />
      <section className="pb-5 pt-5">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="overflow-visible border border-gray-200 bg-gray-50 text-black dark:border-white/10 dark:bg-dark-6 dark:text-white">
            <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
              <h4 className="text-2xl font-bold text-black dark:text-white">Settings</h4>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-6 overflow-visible px-4 pb-6 sm:px-6 sm:pb-8 md:grid-cols-2">
              <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                <CardBody>
                  <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Theme</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-black dark:text-white">Dark Mode</span>
                    <ThemeToggle />
                  </div>
                </CardBody>
              </Card>

              <Card className="overflow-visible border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                <CardBody className="overflow-visible">
                  <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Check-in length</h3>
                  <Select
                    selectedKeys={[preferences?.message_length_preference || 'MEDIUM']}
                    onChange={(event) => {
                      if (event.target.value) {
                        handlePreferenceChange('message_length_preference', event.target.value);
                      }
                    }}
                    aria-label="Check-in length"
                    classNames={heroSelectClassNames}
                    popoverProps={heroSelectPopoverProps}
                  >
                    {messageLengths.map((length) => (
                      <SelectItem key={length.value}>{length.label}</SelectItem>
                    ))}
                  </Select>
                </CardBody>
              </Card>

              <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70 md:col-span-2">
                <CardBody>
                  <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Journal themes</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {themeOptions.map((theme) => (
                      <Checkbox
                        key={theme.value}
                        isSelected={preferences?.theme_preferences?.includes(theme.value)}
                        onValueChange={(checked) => {
                          const updatedThemes = checked
                            ? [...(preferences?.theme_preferences || []), theme.value]
                            : preferences?.theme_preferences.filter((item) => item !== theme.value) || [];
                          handlePreferenceChange('theme_preferences', updatedThemes);
                        }}
                        classNames={checkboxClassNames}
                      >
                        {theme.label}
                      </Checkbox>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
