'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Breadcrumb from '@/components/Breadcrumb';
import { Calendar, Clock, User, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ReactMarkdown from 'react-markdown';

// Add custom styles for the DatePicker
const datePickerStyles = `
  .react-datepicker {
    background-color: transparent !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    font-family: inherit !important;
  }
  .react-datepicker__header {
    background-color: transparent !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name,
  .react-datepicker__day {
    color: white !important;
  }
  .react-datepicker__day:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--in-range {
    background-color: rgba(168, 85, 247, 0.4) !important;
    color: white !important;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: rgba(168, 85, 247, 0.4) !important;
    color: white !important;
  }
  .react-datepicker__day--disabled {
    color: rgba(255, 255, 255, 0.3) !important;
  }
  .react-datepicker__navigation-icon::before {
    border-color: white !important;
  }
  .react-datepicker__today-button {
    background-color: transparent !important;
    border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
  }
`;

interface Prayer {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
  responses: PrayerResponse[];
}

interface PrayerResponse {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  content: {
    prayer: string;
    analysis: string;
    url: string;
  };
  created_at: string;
}

interface TooltipProps {
  text: string;
  mousePosition: { x: number; y: number } | null;
}

interface AnalysisContent {
  prayer: string;
  analysis: string;
  url: string;
}

function Tooltip({ text, mousePosition }: TooltipProps) {
  if (!mousePosition) return null;

  return (
    <div
      className="fixed z-50 max-w-md p-4 rounded-xl border shadow-xl 
        dark:bg-gray-900/95 dark:backdrop-blur-sm dark:border-gray-700/50 dark:text-gray-200
        light:bg-white/95 light:backdrop-blur-sm light:border-gray-200/50 light:text-gray-800"
      style={{
        left: mousePosition.x + 16,
        top: mousePosition.y,
        transform: 'translateY(-50%)',
      }}
    >
      {text}
    </div>
  );
}

export default function SpiritualGuidancePage() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isLoadingPrayers, setIsLoadingPrayers] = useState(false);
  const [prayerDates, setPrayerDates] = useState<Date[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const prayersPerPage = 4;
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPrayer, setHoveredPrayer] = useState<string | null>(null);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const analysesPerPage = 3;

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start || new Date());
    setEndDate(end || new Date());
  };

  const fetchPrayers = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoadingPrayers(true);
    try {
      const response = await fetch(
        `/api/prayers?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch prayers');
      }

      const data = await response.json();
      setPrayers(data);
      
      // Extract unique dates from prayers
      const uniqueDates = data.reduce((dates: Date[], prayer: Prayer) => {
        const date = new Date(prayer.created_at);
        const dateString = date.toDateString();
        if (!dates.some(d => d.toDateString() === dateString)) {
          dates.push(date);
        }
        return dates;
      }, []);
      
      setPrayerDates(uniqueDates);
    } catch (error) {
      // console.error('Error fetching prayers:', error);
    } finally {
      setIsLoadingPrayers(false);
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, [startDate, endDate]);

  const handlePrayerSelect = async (prayer: Prayer, index: number) => {
    setSelectedPrayer(prayer);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/analyze-prayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prayer,
          prayerNumber: indexOfFirstPrayer + index + 1
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze prayer');
      }

      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (error) {
      // console.error('Error analyzing prayer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // Custom day rendering for DatePicker
  const renderDayContents = (day: number, date: Date) => {
    const isPrayerDate = prayerDates.some(
      prayerDate => prayerDate.toDateString() === date.toDateString()
    );

    return (
      <div
        className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
          isPrayerDate ? 'bg-purple-600 text-white font-medium' : ''
        }`}
      >
        {day}
      </div>
    );
  };

  // Add function to fetch chat history
  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chat-history?type=Spiritual%20Guidance&limit=10');
      if (response.ok) {
        const data = await response.json();
        // console.log('Fetched chat history:', data);
        setChatHistory(data);
      } else {
        // console.error('Failed to fetch chat history:', await response.json());
      }
    } catch (error) {
      // console.error('Error fetching chat history:', error);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Calculate pagination for chat history
  const indexOfLastAnalysis = currentHistoryPage * analysesPerPage;
  const indexOfFirstAnalysis = indexOfLastAnalysis - analysesPerPage;
  const currentAnalyses = chatHistory.slice(indexOfFirstAnalysis, indexOfLastAnalysis);
  const totalHistoryPages = Math.ceil(chatHistory.length / analysesPerPage);

  const handleHistoryPageChange = (pageNumber: number) => {
    setCurrentHistoryPage(pageNumber);
  };

  const handleAnalysisSelect = (content: string | AnalysisContent) => {
    try {
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      if (parsedContent && parsedContent.analysis) {
        setSelectedPrayer(null); // Clear selected prayer
        setIsLoading(false); // Ensure loading state is cleared
        setAiAnalysis(parsedContent.analysis);
      }
    } catch (error) {
      // console.error('Error parsing analysis content:', error);
    }
  };

  // Add pagination calculation
  const indexOfLastPrayer = currentPage * prayersPerPage;
  const indexOfFirstPrayer = indexOfLastPrayer - prayersPerPage;
  const currentPrayers = prayers.slice(indexOfFirstPrayer, indexOfLastPrayer);
  const totalPages = Math.ceil(prayers.length / prayersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleMouseMove = (e: React.MouseEvent, prayer: Prayer) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    setHoveredPrayer(prayer.content);
  };

  const handleMouseLeave = () => {
    setTooltipPosition(null);
    setHoveredPrayer(null);
  };

  return (
    <>
      <style>{datePickerStyles}</style>
      <Tooltip text={hoveredPrayer || ''} mousePosition={tooltipPosition} />
      <Breadcrumb pageTitle="Spiritual Guidance" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-4">
            Prayer Journey Analysis
          </h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
            Select a date range to view your prayers and receive AI-powered spiritual insights.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}>
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Date Range
                </h2>
                <DatePicker
                  selected={startDate}
                  onChange={handleDateChange}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  inline
                  renderDayContents={renderDayContents}
                  className="bg-transparent text-white rounded-lg p-2"
                />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>

            <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}>
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-white mb-4">Your Prayers</h2>
                <div className="space-y-4">
                  {isLoadingPrayers ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      <p className="text-gray-400 mt-2">Loading prayers...</p>
                    </div>
                  ) : currentPrayers.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentPrayers.map((prayer, index) => (
                          <div
                            key={prayer.id}
                            className={`relative rounded-xl bg-[url(/images/cta/grid.svg)] p-4 border cursor-pointer transition-all ${
                              selectedPrayer?.id === prayer.id
                                ? 'border-purple-500/50 shadow-purple-500/20'
                                : 'border-gray-300/20 dark:border-gray-600/20 hover:border-gray-500/30'
                            }`}
                            style={{
                              boxShadow: selectedPrayer?.id === prayer.id 
                                ? 'inset -4px -4px 8px rgba(168,85,247,0.05), inset 4px 4px 8px rgba(168,85,247,0.05), 0 2px 12px rgba(168,85,247,0.1)'
                                : 'inset -4px -4px 8px rgba(0,0,0,0.1), inset 4px 4px 8px rgba(255,255,255,0.1)'
                            }}
                            onClick={() => handlePrayerSelect(prayer, index)}
                            onMouseMove={(e) => handleMouseMove(e, prayer)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div>
                                <span className="text-purple-500 font-medium">#{indexOfFirstPrayer + index + 1}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-400 text-sm">
                                  {formatDate(prayer.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
                          </div>
                        ))}
                      </div>
                      {/* Pagination */}
                      <div className="flex justify-center items-center space-x-2 mt-4">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4 text-gray-400" />
                        </button>
                        <span className="text-gray-400">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 text-center py-4">
                      No prayers found in the selected date range.
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
            <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}>
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Analyses</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentAnalyses.map((chat, index) => {
                      try {
                        const prayerNumber = indexOfFirstAnalysis + index + 1;
                        
                        return (
                          <div 
                            key={chat.id} 
                            className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-4 border border-gray-300/20 dark:border-gray-600/20 hover:border-purple-500/30 transition-all"
                          >
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div>
                                <span className="text-purple-500 font-medium">#{prayerNumber}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-400 text-sm">
                                  {formatDate(chat.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-end items-center gap-2 mt-2">
                              <button
                                onClick={() => handleAnalysisSelect(chat.content)}
                                className="px-2 py-1 text-sm text-white bg-purple-500/20 hover:bg-purple-500/30 rounded transition-colors"
                              >
                                Show
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(`/api/chat-history/${chat.id}`, {
                                      method: 'DELETE',
                                    });
                                    const data = await response.json();
                                    if (response.ok && data.success) {
                                      await fetchChatHistory();
                                      if (currentAnalyses.length === 1 && currentHistoryPage > 1) {
                                        setCurrentHistoryPage(currentHistoryPage - 1);
                                      }
                                    } else {
                                      // console.error('Failed to delete chat:', data.error);
                                    }
                                  } catch (error) {
                                    // console.error('Error deleting analysis:', error);
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
                          </div>
                        );
                      } catch (e) {
                        // console.error('Error parsing chat content:', e, chat);
                        return null;
                      }
                    })}
                  </div>
                  {chatHistory.length === 0 && (
                    <div className="text-gray-400 text-center py-4">
                      No previous analyses found.
                    </div>
                  )}
                  {chatHistory.length > analysesPerPage && (
                    <div className="flex justify-center items-center space-x-2 mt-4">
                      <button
                        onClick={() => handleHistoryPageChange(currentHistoryPage - 1)}
                        disabled={currentHistoryPage === 1}
                        className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-400" />
                      </button>
                      <span className="text-gray-400">
                        Page {currentHistoryPage} of {totalHistoryPages}
                      </span>
                      <button
                        onClick={() => handleHistoryPageChange(currentHistoryPage + 1)}
                        disabled={currentHistoryPage === totalHistoryPages}
                        className="p-2 rounded-lg border border-gray-300/20 disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>

          <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
            style={{
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
              transform: 'perspective(1000px) rotateX(2deg)'
            }}>
            <div className="relative z-10">
              <h2 className="text-xl font-semibold text-white mb-4">AI Analysis</h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                  <p className="text-gray-400 mt-4">Analyzing your prayer journey...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-4 border border-gray-300/20 dark:border-gray-600/20">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  Select a prayer to receive AI-powered spiritual insights or view previous analyses.
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
} 