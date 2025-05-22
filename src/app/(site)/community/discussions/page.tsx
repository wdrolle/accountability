// /src/app/(site)/community/discussions/page.tsx

'use client'

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import {
  MessageCircle,
  Heart,
  Share2,
  Reply,
  Pause,
  Play,
} from "lucide-react";
import { DEFAULT_USER_IMAGE, SUPABASE_BUCKET_URL, USER_IMAGES_BUCKET } from "@/lib/constants";

// Features for the static feature cards
const discussionFeatures = [
  {
    title: "Start Discussions",
    description:
      "Share your thoughts, ask questions, and initiate meaningful conversations about faith.",
    icon: MessageCircle,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "React & Engage",
    description: "Show support through reactions and engage with others' perspectives.",
    icon: Heart,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Share Insights",
    description: "Share valuable insights and spread wisdom within the community.",
    icon: Share2,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Join Conversations",
    description: "Participate in ongoing discussions and build meaningful connections.",
    icon: Reply,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
];

interface Discussion {
  id: string;
  title: string;
  content: string;
  topic: string;
  created_at: string;
  creator: {
    name: string;
    image: string;
  };
  replies_count: number;
}

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const singleListRef = useRef<HTMLDivElement>(null);

  const scrollSpeedPx = 1;
  const scrollIntervalMs = 25;

  useEffect(() => {
    fetchDiscussions();
  }, []);

  useEffect(() => {
    if (!isLoading && discussions.length > 0 && singleListRef.current) {
      const listHeight = singleListRef.current.scrollHeight;
      setOffset(0); // Start from top
    }
  }, [isLoading, discussions]);

  useEffect(() => {
    if (isPaused || !discussions.length || !singleListRef.current) return;

    const listHeight = singleListRef.current.scrollHeight;

    const timerId = setInterval(() => {
      setOffset((prev) => {
        const nextVal = prev + scrollSpeedPx;
        // When we've scrolled one full height, reset to 0
        return nextVal % listHeight;
      });
    }, scrollIntervalMs);

    return () => clearInterval(timerId);
  }, [isPaused, discussions]);

  async function fetchDiscussions() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/discussions");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDiscussions(data.discussions || []);
    } catch (error) {
      // console.error("Error fetching discussions:", error);
      setDiscussions([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Breadcrumb pageTitle="Discussions" />

      <section className="relative z-10 overflow-hidden pt-5 lg:pt-[15px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            {/* Header and controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Community Discussions
              </h1>
              <Link
                href="/community/discussions/new"
                className="hero-button-gradient px-6 py-3 rounded-lg inline-flex items-center gap-2 light:text-white dark:text-white"
              >
                Start a Discussion
              </Link>
            </div>

            <div className="flex justify-center mb-5">
              <button
                onClick={() => setIsPaused((prev) => !prev)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : discussions.length === 0 ? (
              <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-5 text-center">
                <p className="text-xl text-black dark:text-white">
                  No discussions yet. Be the first to start a conversation!
                </p>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden h-[200px] mb-8 border border-white/10 rounded-lg bg-white/5 dark:bg-dark/5">
                  <div ref={containerRef} className="absolute inset-0">
                    {/* First copy */}
                    <div
                      ref={singleListRef}
                      className="absolute w-full"
                      style={{ transform: `translateY(-${offset}px)` }}
                    >
                      <DiscussionList discussions={discussions} />
                    </div>
                    {/* Second copy positioned right after first */}
                    <div
                      className="absolute w-full"
                      style={{ 
                        transform: `translateY(${singleListRef.current?.scrollHeight ? singleListRef.current.scrollHeight - offset : 0}px)`
                      }}
                    >
                      <DiscussionList discussions={discussions} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 mb-8">
                  <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Join our vibrant community in meaningful conversations about faith,
                    share your experiences, and grow together in understanding.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {discussionFeatures.map((feature) => (
                    <div
                      key={feature.title}
                      className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-8 h-full"
                    >
                      <div
                        className={`relative flex h-16 w-16 items-center justify-center rounded-full ${feature.bgColor} mb-6`}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                        <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                        <div className="absolute inset-[1px] rounded-full ring-1 ring-white/10 shadow-inner" />
                        <div className="absolute inset-0 rounded-full shadow-lg" />
                        <feature.icon
                          className={`h-8 w-8 ${feature.color} relative z-10 drop-shadow-lg`}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Renders a grid of discussion cards (1 pass).
 * We’ll use two copies of this <DiscussionList> in the marquee
 * for continuous looping.
 */
function DiscussionList({ discussions }: { discussions: Discussion[] }) {
  // console.log('Discussions:', discussions);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
      {discussions.map((disc) => {
        // console.log('Discussion creator:', disc.creator);
        return (
          <Link
            key={disc.id}
            href={`/community/discussions/${disc.id}`}
            className="discussion-card backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg border border-white/20 dark:border-white/10 p-2 text-center hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-center mb-2">
              <div className="relative h-9 w-9 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={disc?.creator?.image || DEFAULT_USER_IMAGE}
                  alt={`Profile picture of ${disc?.creator?.name || 'User'}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = DEFAULT_USER_IMAGE;
                    // console.log('Image load error, using default:', DEFAULT_USER_IMAGE);
                  }}
                />
              </div>
            </div>
            <h3 className="text-base font-semibold text-black dark:text-white mb-1 truncate">
              {disc.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              By {disc?.creator?.name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(disc.created_at).toLocaleDateString()}
            </p>
          </Link>
        );
      })}
    </div>
  );
}