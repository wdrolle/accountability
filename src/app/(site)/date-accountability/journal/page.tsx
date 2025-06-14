'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Breadcrumb from '@/components/Breadcrumb';
import { PenTool, Share2, MessageSquare, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface DateEntry {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
  responses: DateResponse[];
}

interface DateResponse {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

export default function DateJournalPage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<DateEntry | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateEntries, setDateEntries] = useState<DateEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentResponsePage, setCurrentResponsePage] = useState(1);
  const [currentJournalPage, setCurrentJournalPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const entriesPerPage = 5;
  const responsesPerPage = 3;
  const journalEntriesPerPage = 5;

  // Fetch date entries
  useEffect(() => {
    const fetchDateEntries = async () => {
      try {
        const response = await fetch('/api/dates');
        if (response.ok) {
          const data = await response.json();
          setDateEntries(data);
        } else {
          throw new Error('Failed to fetch date entries');
        }
      } catch (error) {
        console.error('Error fetching date entries:', error);
        toast.error('Failed to load date entries');
      }
    };

    if (session) {
      fetchDateEntries();
    }
  }, [session]);

  // Filter responses based on search term
  const filteredResponses = selectedDate?.responses.filter(response => {
    const searchLower = searchTerm.toLowerCase();
    return (
      response.content.toLowerCase().includes(searchLower) ||
      response.user_name.toLowerCase().includes(searchLower) ||
      response.user_email.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Pagination for responses
  const indexOfLastResponse = currentResponsePage * responsesPerPage;
  const indexOfFirstResponse = indexOfLastResponse - responsesPerPage;
  const currentResponses = filteredResponses.slice(indexOfFirstResponse, indexOfLastResponse);
  const totalResponsePages = Math.ceil(filteredResponses.length / responsesPerPage);

  return (
    <>
      <Breadcrumb pageTitle="Date Journal" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-4">
            Date Journal
          </h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
            Record your dating experiences and collect feedback from trusted friends.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Date Entries List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Your Date Entries</h2>
            {dateEntries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedDate?.id === entry.id
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-gray-800/50 hover:bg-gray-800/70'
                }`}
                onClick={() => setSelectedDate(entry)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-medium">{entry.user_name}</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">
                      {entry.responses.length} responses
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 mt-2 line-clamp-2">{entry.content}</p>
              </div>
            ))}
          </div>

          {/* Selected Date Entry and Responses */}
          {selectedDate && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Date Details</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedDate.content}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Community Responses</h2>
                {selectedDate ? (
                  <div>
                    {/* Search Bar */}
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder="Search responses..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentResponsePage(1);
                        }}
                        className="w-full p-2 pl-10 rounded-lg bg-gray-900/50 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>

                    {/* Responses List */}
                    <div className="space-y-4">
                      {currentResponses.map((response) => (
                        <div
                          key={response.id}
                          className="bg-gray-800/50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-white font-medium">{response.user_name}</h4>
                              <p className="text-gray-400 text-sm">
                                {new Date(response.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-300">{response.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalResponsePages > 1 && (
                      <div className="flex justify-center space-x-2 mt-4">
                        <button
                          onClick={() => setCurrentResponsePage(currentResponsePage - 1)}
                          disabled={currentResponsePage === 1}
                          className="px-3 py-1 rounded bg-gray-800/50 text-white disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-gray-400">
                          Page {currentResponsePage} of {totalResponsePages}
                        </span>
                        <button
                          onClick={() => setCurrentResponsePage(currentResponsePage + 1)}
                          disabled={currentResponsePage === totalResponsePages}
                          className="px-3 py-1 rounded bg-gray-800/50 text-white disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Select a date entry to view responses</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 