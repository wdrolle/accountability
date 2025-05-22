'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Breadcrumb from '@/components/Breadcrumb';
import { PenTool, Share2, MessageSquare, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  is_shared: boolean;
}

interface PrayerResponse {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

interface Prayer {
  id: string;
  content: string;
  created_at: string;
  journal_entries: JournalEntry[];
  responses: PrayerResponse[];
}

export default function PrayerJournalPage() {
  const { data: session } = useSession();
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentResponsePage, setCurrentResponsePage] = useState(1);
  const [currentJournalPage, setCurrentJournalPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const prayersPerPage = 5;
  const responsesPerPage = 3;
  const journalEntriesPerPage = 5;

  // Fetch prayers
  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const response = await fetch('/api/prayers');
        if (response.ok) {
          const data = await response.json();
          setPrayers(data);
        } else {
          throw new Error('Failed to fetch prayers');
        }
      } catch (error) {
        console.error('Error fetching prayers:', error);
        toast.error('Failed to load prayers');
      }
    };

    if (session) {
      fetchPrayers();
    }
  }, [session]);

  // Filter responses based on search term
  const filteredResponses = selectedPrayer?.responses.filter(response => {
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

  // Pagination for journal entries
  const indexOfLastJournalEntry = currentJournalPage * journalEntriesPerPage;
  const indexOfFirstJournalEntry = indexOfLastJournalEntry - journalEntriesPerPage;
  const currentJournalEntries = selectedPrayer?.journal_entries.slice(
    indexOfFirstJournalEntry,
    indexOfLastJournalEntry
  ) || [];
  const totalJournalPages = Math.ceil((selectedPrayer?.journal_entries.length || 0) / journalEntriesPerPage);

  // Save journal entry
  const saveJournalEntry = async () => {
    if (!selectedPrayer || !journalContent.trim()) {
      toast.error('Please select a prayer and write your journal entry');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/prayer-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prayer_request_id: selectedPrayer.id,
          content: journalContent,
          is_shared: isShared,
        }),
      });

      if (response.ok) {
        const newEntry = await response.json();
        toast.success('Journal entry saved successfully');
        
        // Update the prayers state with the new entry
        setPrayers(prevPrayers => 
          prevPrayers.map(prayer => {
            if (prayer.id === selectedPrayer.id) {
              return {
                ...prayer,
                journal_entries: [...prayer.journal_entries, newEntry],
              };
            }
            return prayer;
          })
        );

        // Update selected prayer
        setSelectedPrayer(prev => {
          if (!prev) return null;
          return {
            ...prev,
            journal_entries: [...prev.journal_entries, newEntry],
          };
        });

        // Reset form
        setJournalContent('');
        setIsShared(false);
        setCurrentJournalPage(1); // Reset to first page to show the new entry
      } else {
        throw new Error('Failed to save journal entry');
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  // Handle prayer selection
  const handlePrayerSelect = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setCurrentResponsePage(1);
    setCurrentJournalPage(1);
    setSearchTerm('');
  };

  // Pagination for prayers
  const indexOfLastPrayer = currentPage * prayersPerPage;
  const indexOfFirstPrayer = indexOfLastPrayer - prayersPerPage;
  const currentPrayers = prayers.slice(indexOfFirstPrayer, indexOfLastPrayer);
  const totalPages = Math.ceil(prayers.length / prayersPerPage);

  return (
    <>
      <Breadcrumb pageTitle="Prayer Journal" />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prayer List */}
          <div className="lg:col-span-1">
            <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Your Prayers
              </h2>
              <div className="space-y-4">
                {currentPrayers.map((prayer) => (
                  <div
                    key={prayer.id}
                    className={`relative rounded-xl bg-[url(/images/cta/grid.svg)] p-4 border cursor-pointer transition-all ${
                      selectedPrayer?.id === prayer.id
                        ? 'border-purple-500/50 shadow-purple-500/20'
                        : 'border-gray-300/20 dark:border-gray-600/20 hover:border-gray-500/30'
                    }`}
                    onClick={() => handlePrayerSelect(prayer)}
                  >
                    <div className="text-sm text-gray-400 mb-2">
                      {format(new Date(prayer.created_at), 'MMM d, yyyy')}
                    </div>
                    <p className="text-white line-clamp-2">{prayer.content}</p>
                    <div className="mt-2 flex items-center gap-4">
                      {prayer.journal_entries && prayer.journal_entries.length > 0 && (
                        <div className="flex items-center gap-2 text-purple-500">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm">{prayer.journal_entries.length} entries</span>
                        </div>
                      )}
                      {prayer.responses && prayer.responses.length > 0 && (
                        <div className="flex items-center gap-2 text-blue-500">
                          <Share2 className="h-4 w-4" />
                          <span className="text-sm">{prayer.responses.length} responses</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Prayer Pagination */}
              <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </button>
                <span className="text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Journal Entry Form */}
          <div className="lg:col-span-2">
            <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}>
              {/* Two Column Layout for Prayer and Responses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Selected Prayer */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Selected Prayer</h2>
                  {selectedPrayer ? (
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">
                        {format(new Date(selectedPrayer.created_at), 'MMM d, yyyy')}
                      </div>
                      <p className="text-white">{selectedPrayer.content}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">Select a prayer to start journaling</p>
                  )}
                </div>

                {/* Community Responses */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Community Responses</h2>
                  {selectedPrayer ? (
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
                      <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {currentResponses.length > 0 ? (
                          currentResponses.map((response) => (
                            <div key={response.id} className="bg-gray-800/50 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-purple-400">{response.user_name}</p>
                                  <p className="text-sm text-gray-400">{response.user_email}</p>
                                </div>
                                <span className="text-sm text-gray-400">
                                  {format(new Date(response.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <p className="text-white">{response.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400">No responses found</p>
                        )}
                      </div>

                      {/* Response Pagination */}
                      {filteredResponses.length > 0 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                          <button
                            onClick={() => setCurrentResponsePage(prev => Math.max(prev - 1, 1))}
                            disabled={currentResponsePage === 1}
                            className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                          >
                            <ChevronLeft className="h-4 w-4 text-gray-400" />
                          </button>
                          <span className="text-gray-400">
                            Page {currentResponsePage} of {totalResponsePages}
                          </span>
                          <button
                            onClick={() => setCurrentResponsePage(prev => Math.min(prev + 1, totalResponsePages))}
                            disabled={currentResponsePage === totalResponsePages}
                            className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                          >
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400">Select a prayer to view responses</p>
                  )}
                </div>
              </div>

              {/* Journal Entry Input */}
              <div className="space-y-4">
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Write your thoughts, reflections, and experiences..."
                  className="w-full h-48 p-4 rounded-lg bg-gray-900/50 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  disabled={!selectedPrayer}
                />

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-gray-400">
                    <input
                      type="checkbox"
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="rounded border-gray-300/20 text-purple-500 focus:ring-purple-500/50"
                    />
                    <Share2 className="h-4 w-4" />
                    Share with community
                  </label>

                  <button
                    onClick={saveJournalEntry}
                    disabled={loading || !selectedPrayer || !journalContent.trim()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50 hover:bg-purple-600 transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journal Entries Section */}
        {selectedPrayer && (
          <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg"
            style={{
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
              transform: 'perspective(1000px) rotateX(2deg)'
            }}>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Your Journal Entries
            </h2>

            {currentJournalEntries.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentJournalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-800/50 p-4 rounded-lg border border-gray-300/20"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">
                            {format(new Date(entry.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {entry.is_shared && (
                          <div className="flex items-center gap-1 text-purple-500">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm">Shared</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ))}
                </div>

                {/* Journal Entries Pagination */}
                {totalJournalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                      onClick={() => setCurrentJournalPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentJournalPage === 1}
                      className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-400" />
                    </button>
                    <span className="text-gray-400">
                      Page {currentJournalPage} of {totalJournalPages}
                    </span>
                    <button
                      onClick={() => setCurrentJournalPage(prev => Math.min(prev + 1, totalJournalPages))}
                      disabled={currentJournalPage === totalJournalPages}
                      className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No journal entries yet</p>
            )}
          </div>
        )}
      </div>
    </>
  );
} 