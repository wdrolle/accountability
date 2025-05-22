'use client';

import { useState, useEffect } from 'react';
import { ThemeContext } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div 
        className={`${theme} min-h-screen ${
          theme === 'light' 
            ? 'bg-light-purple-gradient [&_h1]:text-black [&_h2]:text-black [&_h3]:text-black [&_h4]:text-black [&_p]:text-black [&_span]:text-black [&_button]:text-black [&_a]:text-black [&_div]:text-black [&_label]:text-black hover:[&_a]:text-purple hover:[&_button]:text-purple' 
            : 'bg-dark-gradient text-white'
        }`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
} 