// /src/app/(site)/community/discussions/new/page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../../../../components/Breadcrumb';
import { ChevronDown } from 'lucide-react';

const AVAILABLE_THEMES = [
  { value: "faith", label: "Faith" },
  { value: "love", label: "Love" },
  { value: "hope", label: "Hope" },
  { value: "wisdom", label: "Wisdom" },
  { value: "peace", label: "Peace" },
  { value: "strength", label: "Strength" },
  { value: "forgiveness", label: "Forgiveness" },
  { value: "gratitude", label: "Gratitude" },
];

interface InspirationTopic {
  id: string;
  title: string;
  topic: string;
  content: string;
}

const NewDiscussionPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [inspirationTopics, setInspirationTopics] = useState<InspirationTopic[]>([]);
  const [leftScrollPaused, setLeftScrollPaused] = useState(false);
  const [rightScrollPaused, setRightScrollPaused] = useState(false);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  const [discussion, setDiscussion] = useState({
    title: '',
    content: '',
    topic: ''
  });

  // Fetch inspiration topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/discussions');
        const data = await response.json();
        if (response.ok) {
          setInspirationTopics(data.discussions);
        }
      } catch (error) {
        console.error('Error fetching inspiration topics:', error);
      }
    };
    fetchTopics();
  }, []);

  // Scrolling animation
  useEffect(() => {
    const scrollColumn = (columnRef: React.RefObject<HTMLDivElement | null>, isPaused: boolean) => {
      if (!columnRef.current || isPaused) return;
      
      columnRef.current.scrollTop += 1;
      if (columnRef.current.scrollTop + columnRef.current.clientHeight >= columnRef.current.scrollHeight) {
        columnRef.current.scrollTop = 0;
      }
    };

    const leftInterval = setInterval(() => scrollColumn(leftColumnRef, leftScrollPaused), 50);
    const rightInterval = setInterval(() => scrollColumn(rightColumnRef, rightScrollPaused), 50);

    return () => {
      clearInterval(leftInterval);
      clearInterval(rightInterval);
    };
  }, [leftScrollPaused, rightScrollPaused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discussion),
      });

      if (response.ok) {
        toast.success('Discussion created successfully');
        router.push('/community/discussions/list');
      } else {
        toast.error('Failed to create discussion');
      }
    } catch (error) {
      toast.error('Error creating discussion');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Please Log In to create discussions</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Start New Discussion" />
      <section className="relative z-10 overflow-hidden pt-[80px] pb-16 md:pt-[100px] md:pb-[120px] xl:pt-[120px] xl:pb-[160px] 2xl:pt-[50px] 2xl:pb-[200px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            <div className="flex gap-8">
              {/* Left Inspiration Column */}
              <div 
                ref={leftColumnRef}
                onClick={() => setLeftScrollPaused(!leftScrollPaused)}
                className="hidden lg:block w-1/4 h-[600px] overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  {inspirationTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-4"
                    >
                      <h4 className="text-sm font-medium text-black dark:text-white mb-2">{topic.title}</h4>
                      <p className="text-xs text-body-color dark:text-gray-400 line-clamp-3">{topic.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Form */}
              <div className="flex-1">
                <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-8 sm:p-12 lg:px-8 xl:p-12">
                  <div className="max-w-[800px] mx-auto">
                    <h2 className="font-bold text-3xl sm:text-4xl text-black dark:text-white mb-8">
                      Start a New Discussion
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                      <div>
                        <label htmlFor="title" className="block text-black dark:text-white mb-2">
                          Discussion Title
                        </label>
                        <input
                          id="title"
                          type="text"
                          value={discussion.title}
                          onChange={(e) => setDiscussion({ ...discussion, title: e.target.value })}
                          placeholder="What would you like to discuss?"
                          className="w-full rounded-lg bg-white/5 dark:bg-dark/5 border border-white/10 dark:border-white/10 p-4 text-black dark:text-white placeholder:text-gray-400 focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20"
                          required
                        />
                      </div>

                      <div className="relative">
                        <label htmlFor="topic" className="block text-black dark:text-white mb-2">
                          Topic
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                            className="w-full rounded-lg bg-white/5 dark:bg-dark/5 border border-white/10 dark:border-white/10 p-4 text-left text-black dark:text-white focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20 flex items-center justify-between"
                          >
                            <span>{discussion.topic || 'Select a topic'}</span>
                            <ChevronDown className="w-5 h-5" />
                          </button>
                          
                          {showTopicDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-white dark:bg-dark border border-white/10 dark:border-white/20 shadow-lg z-50">
                              {AVAILABLE_THEMES.map((theme) => (
                                <button
                                  key={theme.value}
                                  type="button"
                                  onClick={() => {
                                    setDiscussion({ ...discussion, topic: theme.label });
                                    setShowTopicDropdown(false);
                                  }}
                                  className="w-full px-4 py-2 text-left text-black dark:text-white hover:bg-white/5 dark:hover:bg-dark/5"
                                >
                                  {theme.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="content" className="block text-black dark:text-white mb-2">
                          Discussion Content
                        </label>
                        <textarea
                          id="content"
                          value={discussion.content}
                          onChange={(e) => setDiscussion({ ...discussion, content: e.target.value })}
                          placeholder="Share your thoughts..."
                          className="w-full min-h-[300px] rounded-lg bg-white/5 dark:bg-dark/5 border border-white/10 dark:border-white/10 p-4 text-black dark:text-white placeholder:text-gray-400 focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20"
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="hero-button-gradient px-8 py-4 rounded-lg text-white font-medium hover:opacity-80 transition duration-300 disabled:opacity-50"
                        >
                          {isLoading ? 'Creating...' : 'Create Discussion'}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-8 py-4 rounded-lg border border-white/20 dark:border-white/10 text-black dark:text-white font-medium hover:bg-white/5 dark:hover:bg-dark/5 transition duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Inspiration Column */}
              <div 
                ref={rightColumnRef}
                onClick={() => setRightScrollPaused(!rightScrollPaused)}
                className="hidden lg:block w-1/4 h-[600px] overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  {[...inspirationTopics].reverse().map((topic) => (
                    <div
                      key={topic.id}
                      className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-4"
                    >
                      <h4 className="text-sm font-medium text-black dark:text-white mb-2">{topic.title}</h4>
                      <p className="text-xs text-body-color dark:text-gray-400 line-clamp-3">{topic.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default NewDiscussionPage; 