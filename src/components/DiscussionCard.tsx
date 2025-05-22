// /src/components/DiscussionCard.tsx

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { DEFAULT_USER_IMAGE } from '@/lib/constants';

interface DiscussionCardProps {
  id: string;
  title: string;
  content: string;
  topic: string;
  createdAt: string;
  creator: {
    name: string;
    image: string | null;
  };
  repliesCount: number;
}

export default function DiscussionCard({ 
  id, 
  title,
  content,
  topic,
  createdAt, 
  creator, 
  repliesCount 
}: DiscussionCardProps) {
  // Get a preview of the content (first 100 characters)
  const contentPreview = content?.length > 100 
    ? `${content.substring(0, 100)}...` 
    : content;

  return (
    <Link 
      href={`/community/discussions/${id}`}
      className="block h-full"
    >
      <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-6 h-full hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full overflow-hidden">
              <Image
                src={creator.image || DEFAULT_USER_IMAGE}
                alt={creator.name || 'User'}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-2xl font-semibold text-black dark:text-white mb-2 truncate">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                {topic}
              </span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(createdAt))} ago</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {contentPreview}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                By {creator.name || 'Anonymous'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 