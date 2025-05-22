'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../../../../components/Breadcrumb';
import { MessageCircle } from 'lucide-react';

interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  created_at: string;
  updatedAt: string;
  topic: string;
  authorImage?: string;
}

interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  created_at: string;
  authorImage?: string;
}

interface DiscussionClientProps {
  discussionId: string;
}

export default function DiscussionClient({ discussionId }: DiscussionClientProps) {
  const { data: session } = useSession();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await fetch(`/api/discussions/${discussionId}`);
        const data = await response.json();
        if (response.ok) {
          setDiscussion(data.discussion);
          setReplies(data.replies || []);
        }
      } catch (error) {
        // console.error('Error fetching discussion:', error);
        toast.error('Failed to load discussion');
      }
    };

    if (discussionId) {
      fetchDiscussion();
    }
  }, [discussionId]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error('Please Log In to reply');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newReply }),
      });

      if (response.ok) {
        const data = await response.json();
        setReplies([...replies, data.reply]);
        setNewReply('');
        toast.success('Reply posted successfully');
      } else {
        toast.error('Failed to post reply');
      }
    } catch (error) {
      toast.error('Error posting reply');
    } finally {
      setIsLoading(false);
    }
  };

  if (!discussion) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Loading discussion...</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Discussion" />
      <section className="relative z-10 overflow-hidden pt-[80px] pb-16 md:pt-[100px] md:pb-[120px] xl:pt-[120px] xl:pb-[160px] 2xl:pt-[50px] 2xl:pb-[200px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            {/* Discussion Card */}
            <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-8 sm:p-12 lg:px-8 xl:p-12 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-r from-primary/20 to-primary/40">
                    <Image
                      src={discussion.authorImage || '/images/logo/agents.png'}
                      alt={`Profile picture of ${discussion.authorName}`}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/images/logo/agents.png';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black dark:text-white">
                      {discussion.authorName}
                    </h3>
                    <p className="text-sm text-body-color dark:text-gray-400">
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
                  {discussion.topic}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-black dark:text-white mb-6">
                {discussion.title}
              </h1>

              <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
                <p className="text-body-color dark:text-gray-400 whitespace-pre-line">
                  {discussion.content}
                </p>
              </div>
            </div>

            {/* Replies Section */}
            <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-8 sm:p-12 lg:px-8 xl:p-12">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-8">
                Replies
              </h2>

              <div className="space-y-6 mb-8">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="backdrop-blur-sm bg-white/5 dark:bg-dark/5 rounded-lg border border-white/10 dark:border-white/10 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-primary/20 to-primary/40">
                        <Image
                          src={reply.authorImage || '/images/logo/agents.png'}
                          alt={`Profile picture of ${reply.authorName}`}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          unoptimized
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/images/logo/agents.png';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-black dark:text-white">
                          {reply.authorName}
                        </h4>
                        <p className="text-sm text-body-color dark:text-gray-400">
                          {new Date(reply.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-body-color dark:text-gray-400 whitespace-pre-line">
                      {reply.content}
                    </p>
                  </div>
                ))}

                {replies.length === 0 && (
                  <p className="text-center text-body-color dark:text-gray-400">
                    No replies yet. Be the first to reply!
                  </p>
                )}
              </div>

              {session ? (
                <form onSubmit={handleSubmitReply} className="space-y-4">
                  <div>
                    <label htmlFor="reply" className="block text-black dark:text-white mb-2">
                      Your Reply
                    </label>
                    <textarea
                      id="reply"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full min-h-[150px] rounded-lg bg-white/5 dark:bg-dark/5 border border-white/10 dark:border-white/10 p-4 text-black dark:text-white placeholder:text-gray-400 focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="hero-button-gradient inline-flex items-center gap-2 rounded-lg px-6 py-3 text-white font-medium hover:opacity-80 transition duration-300 disabled:opacity-50"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {isLoading ? 'Posting...' : 'Post Reply'}
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <p className="text-body-color dark:text-gray-400 mb-4">
                    Please Log In to reply to this discussion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
} 