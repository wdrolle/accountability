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
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TooltipProps {
  text: string;
  mousePosition: { x: number; y: number } | null;
}

interface AnalysisContent {
  date: string;
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

export default function DateAnalysisPage() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<DateEntry | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateEntries, setDateEntries] = useState<DateEntry[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [dateDates, setDateDates] = useState<Date[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 4;
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const analysesPerPage = 3;

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start || new Date());
    setEndDate(end || new Date());
  };

  const fetchDateEntries = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoadingDates(true);
    try {
      const response = await fetch(
        `/api/dates?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch date entries');
      }

      const data = await response.json();
      setDateEntries(data);
      
      // Extract unique dates from entries
      const uniqueDates = data.reduce((dates: Date[], entry: DateEntry) => {
        const date = new Date(entry.created_at);
        const dateString = date.toDateString();
        if (!dates.some(d => d.toDateString() === dateString)) {
          dates.push(date);
        }
        return dates;
      }, []);
      
      setDateDates(uniqueDates);
    } catch (error) {
      console.error('Error fetching date entries:', error);
    } finally {
      setIsLoadingDates(false);
    }
  };

  useEffect(() => {
    fetchDateEntries();
  }, [startDate, endDate]);

  const handleDateSelect = async (date: DateEntry, index: number) => {
    setSelectedDate(date);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/analyze-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date,
          dateNumber: indexOfFirstDate + index + 1
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze date');
      }

      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing date:', error);
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
    const isDateDate = dateDates.some(
      dateDate => dateDate.toDateString() === date.toDateString()
    );

    return (
      <div
        className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
          isDateDate ? 'bg-purple-600 text-white font-medium' : ''
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
        setSelectedDate(null); // Clear selected date
        setIsLoading(false); // Ensure loading state is cleared
        setAiAnalysis(parsedContent.analysis);
      }
    } catch (error) {
      // console.error('Error parsing analysis content:', error);
    }
  };

  // Add pagination calculation
  const indexOfLastDate = currentPage * entriesPerPage;
  const indexOfFirstDate = indexOfLastDate - entriesPerPage;
  const currentDates = dateEntries.slice(indexOfFirstDate, indexOfLastDate);
  const totalPages = Math.ceil(dateEntries.length / entriesPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <style>{datePickerStyles}</style>
      <Tooltip text={hoveredDate || ''} mousePosition={tooltipPosition} />
      <Breadcrumb pageTitle="Date Analysis" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-4">
            Date Journey Analysis
          </h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
            Select a date range to view your dates and receive AI-powered insights.
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
                <h2 className="text-xl font-semibold text-white mb-4">Your Dates</h2>
                <div className="space-y-4">
                  {isLoadingDates ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      <p className="text-gray-400 mt-2">Loading dates...</p>
                    </div>
                  ) : dateEntries.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {dateEntries.map((date, index) => (
                          <div
                            key={date.id}
                            className={`p-4 rounded-lg cursor-pointer transition-all ${
                              selectedDate?.id === date.id
                                ? 'bg-purple-500/20 border border-purple-500/50'
                                : 'bg-gray-800/50 hover:bg-gray-800/70'
                            }`}
                            onClick={() => handleDateSelect(date, index)}
                            onMouseEnter={(e) => {
                              setHoveredDate(date.content);
                              setTooltipPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => {
                              setHoveredDate(null);
                              setTooltipPosition(null);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-white font-medium">{date.user_name}</h3>
                                <p className="text-gray-400 text-sm">
                                  {formatDate(date.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-sm">
                                  {date.responses.length} responses
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-300 mt-2 line-clamp-2">{date.content}</p>
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
                      No dates found in the selected date range.
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="space-y-6">
            <div className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}>
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-white mb-4">AI Analysis</h2>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="text-gray-400 mt-2">Analyzing date...</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400">Select a date to view AI analysis</p>
                )}
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 