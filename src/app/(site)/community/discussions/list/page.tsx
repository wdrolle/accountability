'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../../../../components/Breadcrumb';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Discussion {
  id: string;
  title: string;
  content: string;
  topic: string;
  created_at: string;
  updatedAt: string;
  creator: {
    name: string;
    image: string | null;
  };
  replies_count?: number;
}

interface DiscussionModalProps {
  discussion: Discussion | null;
  onClose: () => void;
}

function DiscussionModal({ discussion, onClose }: DiscussionModalProps) {
  if (!discussion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto backdrop-blur-sm bg-white/95 dark:bg-dark/100 rounded-lg border border-white/20 dark:border-white/10">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-dark/100 border-b border-white/20 dark:border-white/10 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="mb-0">
            <h2 className="text-2xl font-bold text-white mb-2">{discussion.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>{discussion.creator.name}</span>
              <span>•</span>
              <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span className="bg-gradient-to-r from-purple-500/20 to-purple-700/20 px-3 py-0.5 rounded-full text-white font-medium border border-purple-500/20">
                {discussion.topic}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-line">{discussion.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiscussionsListPage() {
  const [currentSlide, setCurrentSlide] = useState<number[]>([0]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDiscussions, setTotalDiscussions] = useState(0);
  const discussionsPerPage = 6;

  const { data: session } = useSession();

  const fetchDiscussions = async (page: number) => {
    try {
      const response = await fetch(`/api/discussions?page=${page}&limit=${discussionsPerPage}`);
      const data = await response.json();
      if (response.ok) {
        setDiscussions(data.discussions);
        setTotalDiscussions(data.total);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchDiscussions(currentPage);
    }
  }, [session, currentPage]);

  const totalPages = Math.ceil(totalDiscussions / discussionsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setIsLoading(true);
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Please Log In to access community discussions</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Discussions" />
      <section className="relative z-10 overflow-hidden pt-[20px] pb-5 md:pt-[50px] md:pb-[120px] xl:pt-[180px] xl:pb-[160px] 2xl:pt-[50px] 2xl:pb-[50px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div className="w-full lg:w-1/2 px-0">
                <p className="text-lg md:text-xl text-body-color dark:text-gray-400">
                  Join discussions with fellow believers.
                </p>
              </div>
              <div className="w-full lg:w-auto px-0 mt-4 lg:mt-0">
                <Link
                  href="/community/discussions/new"
                  className="hero-button-gradient inline-flex light:text-white dark:text-white items-center rounded-lg px-8 py-4 text-base font-medium text-white duration-300 ease-in hover:opacity-80"
                >
                  Start New Discussion
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : discussions.length === 0 ? (
              <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-8 text-center">
                <p className="text-xl text-black dark:text-white">
                  No discussions yet. Be the first to start a conversation!
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      className="cursor-pointer group"
                      onClick={() => setSelectedDiscussion(discussion)}
                    >
                      <div className="backdrop-blur-sm bg-gradient-to-br from-white/20 via-purple-500/10 to-purple-700/20 dark:from-dark/20 dark:via-purple-500/10 dark:to-purple-800/20 rounded-lg relative z-10 overflow-hidden border-2 border-white/20 dark:border-white/10 shadow-lg hover:shadow-purple-500/20 p-6 hover:border-purple-500/30 transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500/50 to-purple-700/50 ring-2 ring-purple-500/30 ring-offset-2 ring-offset-black/10">
                            <Image
                              src={discussion.creator.image || '/images/logo/agents.png'}
                              alt={`Profile picture of ${discussion.creator.name}`}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">
                              {discussion.creator.name}
                            </h4>
                            <p className="text-xs text-gray-300">
                              {new Date(discussion.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="ml-auto text-xs bg-gradient-to-r from-purple-500/20 to-purple-700/20 px-3 py-1.5 rounded-full text-purple-300 font-medium border border-purple-500/20">
                            {discussion.topic}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {discussion.title}
                        </h3>
                        <div className="flex-grow">
                          <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                            {discussion.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-500/20">
                          <span className="text-xs text-gray-300">
                            {discussion.replies_count || 0} {discussion.replies_count === 1 ? 'reply' : 'replies'}
                          </span>
                          <span className="text-xs text-purple-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Read more <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg backdrop-blur-sm bg-white/10 dark:bg-dark/10 border border-white/20 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg backdrop-blur-sm ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white/10 dark:bg-dark/10 border border-white/20 dark:border-white/10'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg backdrop-blur-sm bg-white/10 dark:bg-dark/10 border border-white/20 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <DiscussionModal
        discussion={selectedDiscussion}
        onClose={() => setSelectedDiscussion(null)}
      />
    </>
  );
} 