'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import {
  energyLevel,
  journalApiUrl,
  type JournalRecord,
} from '@/lib/journal';
import { JournalCoachModal } from '@/components/JournalCoachModal';
import { catColor, hueForEntry } from '@/lib/journalColors';

export default function DateJournalPage() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<JournalRecord[]>([]);
  const [selected, setSelected] = useState<JournalRecord | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadEntries = async () => {
    try {
      const response = await fetch(journalApiUrl('?kind=journal_entry'));
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      const data = await response.json();
      setEntries(data.items || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast.error('Failed to load journal entries');
    }
  };

  useEffect(() => {
    if (session) {
      loadEntries();
    }
  }, [session]);

  const filtered = entries.filter((entry) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      entry.text.toLowerCase().includes(q) ||
      (entry.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const openNewEntry = () => {
    setSelected(null);
    setComposerOpen(true);
  };

  const openEntry = (entry: JournalRecord) => {
    setSelected(entry);
    setComposerOpen(true);
  };

  if (status !== 'loading' && !session) {
    return (
      <>
        <Breadcrumb pageTitle="Journal" />
        <div className="w-full px-4 pb-6 pt-2 sm:px-6 lg:px-12">
          <div className="mb-6 w-full">
            <p className="w-full text-gray-600 dark:text-gray-400">
              Private entries are the source of truth for insights, reminders, and lists.
              This is not therapy and does not diagnose. In a crisis, call or text 988.
            </p>
          </div>
          <Link
            href="/api/auth/hub-signin?next=/journal/journal"
            className="text-gray-800 hover:text-black dark:text-gray-300 dark:hover:text-white"
          >
            Sign in →
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Journal" />
      <div className="w-full px-4 pb-6 pt-2 sm:px-6 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="w-full max-w-none text-gray-600 dark:text-gray-400">
            Private entries are the source of truth for insights, reminders, and lists.
            This is not therapy and does not diagnose. In a crisis, call or text 988.
          </p>
          <Button
            className="shrink-0 text-white shadow-lg"
            size="lg"
            style={{
              background: 'linear-gradient(135deg, hsl(255deg 70% 55%), hsl(315deg 65% 55%))',
            }}
            onPress={openNewEntry}
          >
            ✦ New entry — talk it through
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-black dark:text-white">Your entries</h2>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search entries or tags..."
            aria-label="Search entries or tags"
            className="w-full rounded-2xl bg-gray-100 px-4 py-2 text-sm text-black placeholder:text-gray-500 outline-none ring-0 dark:bg-dark-7 dark:text-white dark:placeholder:text-gray-400 sm:w-64"
          />
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500 dark:border-white/15 dark:text-gray-400">
            No entries yet. Start your first one above — the AI companion will help you get going.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => {
            const hue = hueForEntry(entry);
            const energy = energyLevel(entry.mood);
            return (
              <div
                key={entry.id}
                className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-dark-6"
                style={{ borderLeft: `4px solid ${catColor(hue)}` }}
                onClick={() => openEntry(entry)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: catColor(hue, 62, 46, 0.14), color: catColor(hue, 55, 32) }}
                  >
                    {energy ? `${energy.emoji} ${energy.label}` : 'No energy set'}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-gray-800 dark:text-gray-300">{entry.text}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(entry.tags || []).slice(0, 4).map((tag) => (
                    <Chip
                      key={tag}
                      size="sm"
                      variant="flat"
                      style={{ background: catColor(hue, 55, 88), color: catColor(hue, 45, 28) }}
                    >
                      {tag}
                    </Chip>
                  ))}
                  {entry.excludeFromAi && (
                    <Chip size="sm" color="warning" variant="flat">private</Chip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <JournalCoachModal
        isOpen={composerOpen}
        onOpenChange={setComposerOpen}
        entry={selected}
        onSaved={loadEntries}
      />
    </>
  );
}
