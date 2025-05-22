'use client';

import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import {Calendar} from "@nextui-org/react";
import {today, getLocalTimeZone, CalendarDate} from "@internationalized/date";
import { format } from 'date-fns';

interface Devotional {
  id: string;
  message_content: string;
  created_at: Date;
  message_type: string;
  delivery_status: string | null;
  sent_at: Date | null;
}

export default function DailyDevotionalsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchTheme, setSearchTheme] = useState('');
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedDate, setFocusedDate] = useState<CalendarDate>(today(getLocalTimeZone()));

  useEffect(() => {
    // Load initial data
    fetchDevotionals();
  }, []);

  const fetchDevotionals = async (date?: Date, theme?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) {
        params.append('date', format(date, 'yyyy-MM-dd'));
      }
      if (theme) {
        params.append('theme', theme);
      }

      const response = await fetch(`/api/daily-devotionals?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch devotionals');
      }
      const data = await response.json();
      // Ensure created_at is converted to Date object
      const formattedData = data.map((item: any) => ({
        ...item,
        created_at: new Date(item.created_at),
        sent_at: item.sent_at ? new Date(item.sent_at) : null
      }));
      setDevotionals(formattedData);
    } catch (error) {
      console.error('Error fetching devotionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: CalendarDate | null) => {
    if (date) {
      const jsDate = new Date(date.year, date.month - 1, date.day);
      setSelectedDate(jsDate);
      fetchDevotionals(jsDate, searchTheme);
    } else {
      setSelectedDate(undefined);
      fetchDevotionals(undefined, searchTheme);
    }
  };

  const handleThemeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      fetchDevotionals(selectedDate, searchTheme);
    } else {
      fetchDevotionals(undefined, searchTheme);
    }
  };

  const groupDevotionalsByMonth = (items: Devotional[]) => {
    if (!Array.isArray(items)) {
      console.error('Expected array for grouping, received:', typeof items);
      return {};
    }
    
    return items.reduce<Record<string, Devotional[]>>((groups, devotional) => {
      const monthYear = format(devotional.created_at, 'MMMM yyyy');
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(devotional);
      return groups;
    }, {});
  };

  const hasDevotionalOnDate = (date: CalendarDate) => {
    const jsDate = new Date(date.year, date.month - 1, date.day);
    return devotionals.some(devotional => 
      format(devotional.created_at, 'yyyy-MM-dd') === format(jsDate, 'yyyy-MM-dd')
    );
  };

  return (
    <>
      <Breadcrumb pageTitle="Daily Devotionals" />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-10 gap-8">
          {/* Left Sidebar - Calendar */}
          <div className="col-span-3">
            <div 
              className="relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}
            >
              <div className="relative z-10 flex justify-center items-center">
                <Calendar
                  aria-label="Select Date"
                  className="rounded-md w-full"
                  onChange={handleDateChange}
                  value={selectedDate ? new CalendarDate(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate()) : null}
                  focusedValue={focusedDate}
                  onFocusChange={setFocusedDate}
                  showShadow={false}
                  color="primary"
                  weekdayStyle="short"
                  showMonthAndYearPickers
                  classNames={{
                    base: "w-full flex flex-col items-center",
                    title: "text-lg",
                    headerWrapper: "gap-4",
                    gridHeaderCell: "text-default-600 px-2",
                    grid: "gap-3",
                    gridHeader: "gap-3",
                    gridHeaderRow: "gap-3",
                    gridBody: "gap-3",
                    gridBodyRow: "gap-3",
                    cell: "p-0",
                    cellButton: "h-9 w-9"
                  }}
                />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
            
            {/* Theme Search */}
            <div 
              className="mt-6 relative rounded-xl bg-[url(/images/cta/grid.svg)] p-6 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}
            >
              <div className="relative z-10">
                <form onSubmit={handleThemeSearch}>
                  <input
                    type="text"
                    value={searchTheme}
                    onChange={(e) => setSearchTheme(e.target.value)}
                    placeholder="Search by theme..."
                    className="w-full p-2 rounded bg-transparent backdrop-blur-sm text-white border border-gray-600/30 focus:outline-none focus:border-blue-500/50 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="mt-2 w-full button-border-gradient hover:button-gradient-hover relative inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm text-white dark:text-white light:text-black shadow-button hover:shadow-none"
                  >
                    Search
                  </button>
                </form>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>

          {/* Main Content - Devotionals List */}
          <div className="col-span-7">
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : devotionals.length === 0 ? (
              <div className="text-center text-gray-400">No devotionals found</div>
            ) : (
              Object.entries(groupDevotionalsByMonth(devotionals)).map(([monthYear, monthDevotionals]) => (
                <div key={monthYear} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-white dark:text-white light:text-black">{monthYear}</h2>
                  <div className="space-y-4">
                    {monthDevotionals.map((devotional) => (
                      <div
                        key={devotional.id}
                        className="relative rounded-xl bg-[url(/images/cta/grid.svg)] px-10 py-8 border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
                        style={{
                          boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                          transform: 'perspective(1000px) rotateX(2deg)'
                        }}
                      >
                        <div className="relative z-10">
                          <div className="text-sm text-gray-400 dark:text-gray-400 light:text-black/80 mb-4">
                            {format(devotional.created_at, 'MMMM d, yyyy')}
                          </div>
                          <div className="prose prose-invert dark:prose-invert light:prose-light max-w-none prose-lg">
                            {devotional.message_content}
                          </div>
                          <div className="mt-6 flex items-center justify-between text-gray-400 dark:text-gray-400 light:text-black/80">
                            <span className="text-sm">
                              Status: {devotional.delivery_status || 'Pending'}
                            </span>
                            {devotional.sent_at && (
                              <span className="text-sm">
                                Sent: {format(devotional.sent_at, 'MMM d, yyyy h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
} 