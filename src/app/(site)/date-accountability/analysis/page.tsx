'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  ENERGY_LEVELS,
  extractActionCandidates,
  journalApiUrl,
  type JournalRecord,
} from '@/lib/journal';
import { catColor, daysAgo, hueForMood, hueForScore, hueForTag } from '@/lib/journalColors';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';

type RangeKey = '7' | '30' | '90' | 'all';
const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
  { key: 'all', label: 'All time' },
];

function withinRange(iso: string, range: RangeKey) {
  if (range === 'all') return true;
  return daysAgo(iso) <= Number(range);
}

function daysUntil(dueDate?: string | null): number | undefined {
  if (!dueDate) return undefined;
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function dueLabel(dueInDays?: number): { text: string; tier: 'overdue' | 'soon' | 'later' } | null {
  if (dueInDays === undefined) return null;
  if (dueInDays < 0) {
    const d = Math.abs(dueInDays);
    return { text: `Overdue ${d}d`, tier: 'overdue' };
  }
  if (dueInDays === 0) return { text: 'Due today', tier: 'soon' };
  if (dueInDays === 1) return { text: 'Due tomorrow', tier: 'soon' };
  if (dueInDays <= 3) return { text: `Due in ${dueInDays}d`, tier: 'soon' };
  return { text: `Due in ${dueInDays}d`, tier: 'later' };
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

type DayCell = { key: string; date: Date; avgMood?: number; count: number };

function buildMoodCalendar(entries: JournalRecord[], weeks = 14): DayCell[][] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  const gridStart = startOfWeek(start);

  const dayMap = new Map<string, { sum: number; count: number }>();
  entries.forEach((entry) => {
    if (entry.excludeFromAi || entry.crisis || typeof entry.mood !== 'number') return;
    const key = localDateKey(new Date(entry.created_at));
    const cur = dayMap.get(key) || { sum: 0, count: 0 };
    cur.sum += entry.mood;
    cur.count += 1;
    dayMap.set(key, cur);
  });

  const columns: DayCell[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    const column: DayCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(gridStart);
      date.setDate(date.getDate() + w * 7 + d);
      const key = localDateKey(date);
      const info = dayMap.get(key);
      column.push({
        key,
        date,
        avgMood: info ? info.sum / info.count : undefined,
        count: info?.count || 0,
      });
    }
    columns.push(column);
  }
  return columns;
}

function StatCard({ label, value, hue }: { label: string; value: string; hue?: number }) {
  return (
    <Card
      className="border bg-gray-50 dark:bg-dark-6"
      style={{ borderColor: hue !== undefined ? catColor(hue, 62, 46, 0.35) : undefined }}
    >
      <CardBody>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p
          className="mt-2 text-3xl font-semibold"
          style={{ color: hue !== undefined ? catColor(hue, 55, 40) : undefined }}
        >
          {value}
        </p>
      </CardBody>
    </Card>
  );
}

function MoodCalendar({ entries }: { entries: JournalRecord[] }) {
  const columns = useMemo(() => buildMoodCalendar(entries), [entries]);
  const today = localDateKey(new Date());

  return (
    <Card className="border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6">
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-xl font-semibold text-black dark:text-white">Mood over time</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last 14 weeks, one square per day. Darker = higher energy that day.
        </p>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto pb-2">
          <div className="flex w-max gap-1">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1">
                {column.map((cell) => {
                  const isFuture = cell.key > today;
                  const hasData = cell.avgMood !== undefined;
                  const hue = hasData ? hueForMood(Math.round(cell.avgMood!)) : 220;
                  const baseClass = 'h-3 w-3 rounded-sm sm:h-3.5 sm:w-3.5';
                  return (
                    <div
                      key={cell.key}
                      title={
                        isFuture
                          ? undefined
                          : `${cell.date.toLocaleDateString()}${
                              hasData
                                ? ` — energy ${cell.avgMood!.toFixed(1)}/5 (${cell.count} ${cell.count === 1 ? 'entry' : 'entries'})`
                                : ' — no entry'
                            }`
                      }
                      className={hasData ? baseClass : `${baseClass} bg-gray-200 dark:bg-white/10`}
                      style={{
                        background: hasData ? catColor(hue, 65, 45, 0.35 + 0.55 * (cell.avgMood! / 5)) : undefined,
                        visibility: isFuture ? 'hidden' : 'visible',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Low</span>
          {ENERGY_LEVELS.map((level) => (
            <span
              key={level.value}
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: catColor(hueForMood(level.value), 65, 45, 0.35 + 0.55 * (level.value / 5)) }}
            />
          ))}
          <span>High</span>
        </div>
      </CardBody>
    </Card>
  );
}

function EmotionHeatmap({ usable }: { usable: JournalRecord[] }) {
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    usable.forEach((entry) => {
      (entry.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 16);
  }, [usable]);

  const max = tagCounts[0]?.[1] || 1;

  return (
    <Card className="border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6">
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-xl font-semibold text-black dark:text-white">Feelings heatmap</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Darker tiles are feelings that show up more often in your writing.
        </p>
      </CardHeader>
      <CardBody>
        {tagCounts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Tags will appear here as you write and choose feelings.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {tagCounts.map(([tag, count]) => {
              const hue = hueForTag(tag);
              const intensity = 0.18 + 0.72 * (count / max);
              return (
                <div
                  key={tag}
                  className="flex flex-col items-start justify-between gap-3 rounded-xl p-3"
                  style={{ background: catColor(hue, 65, 45, intensity) }}
                >
                  <span className={`text-sm font-semibold ${intensity > 0.55 ? 'text-white' : 'text-black dark:text-white'}`}>
                    {tag}
                  </span>
                  <span className={`text-xs font-medium ${intensity > 0.55 ? 'text-white/85' : 'text-black/60 dark:text-white/70'}`}>
                    {count} {count === 1 ? 'time' : 'times'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function UpcomingRail({
  items,
  onToggleDone,
}: {
  items: JournalRecord[];
  onToggleDone: (item: JournalRecord) => void;
}) {
  const due = useMemo(() => {
    return items
      .map((item) => ({ item, dueInDays: daysUntil(item.dueDate) }))
      .filter((row) => !row.item.done && row.dueInDays !== undefined && row.dueInDays <= 14)
      .sort((a, b) => (a.dueInDays ?? 0) - (b.dueInDays ?? 0))
      .slice(0, 8);
  }, [items]);

  return (
    <Card className="border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6">
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-xl font-semibold text-black dark:text-white">Upcoming &amp; overdue</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">To-dos and bills from Lists, due in the next two weeks.</p>
      </CardHeader>
      <CardBody>
        {due.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Nothing due soon — you&apos;re clear.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {due.map(({ item, dueInDays }) => {
              const info = dueLabel(dueInDays)!;
              const hue = info.tier === 'overdue' ? 356 : info.tier === 'soon' ? 40 : 210;
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-stretch gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-dark-7 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-black dark:text-white">{item.text}</p>
                    <span className="text-xs font-semibold" style={{ color: catColor(hue, 60, 42) }}>
                      {info.text}
                      {item.amount != null ? ` · $${item.amount}` : ''}
                    </span>
                  </div>
                  <Button size="sm" variant="flat" className="w-full shrink-0 sm:w-auto" onPress={() => onToggleDone(item)}>
                    Done
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function NudgesCard({
  usable,
  listItems,
  onAdd,
}: {
  usable: JournalRecord[];
  listItems: JournalRecord[];
  onAdd: (candidate: string, sourceEntryId: string) => void;
}) {
  const coveredEntryIds = useMemo(
    () => new Set(listItems.map((item) => item.sourceEntryId).filter(Boolean) as string[]),
    [listItems]
  );

  const nudges = useMemo(() => {
    const rows: { entry: JournalRecord; candidate: string }[] = [];
    for (const entry of usable) {
      if (coveredEntryIds.has(entry.id)) continue;
      const candidates = extractActionCandidates(entry.text, 1);
      if (candidates.length) rows.push({ entry, candidate: candidates[0] });
      if (rows.length >= 6) break;
    }
    return rows;
  }, [usable, coveredEntryIds]);

  return (
    <Card className="border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6">
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-xl font-semibold text-black dark:text-white">Worth following up on</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Things you mentioned wanting to do, from entries that aren&apos;t private, with no to-do yet.
        </p>
      </CardHeader>
      <CardBody>
        {nudges.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Nothing waiting on you right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {nudges.map(({ entry, candidate }) => (
              <div
                key={entry.id}
                className="flex flex-col items-stretch gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: catColor(255, 62, 46, 0.3), background: catColor(255, 62, 46, 0.06) }}
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-black dark:text-white">{candidate}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    from {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full shrink-0 text-white sm:w-auto"
                  style={{ background: catColor(255) }}
                  onPress={() => onAdd(candidate, entry.id)}
                >
                  + To-do
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function FollowThroughCard({
  suggested,
  onToggleDone,
  onDismiss,
}: {
  suggested: JournalRecord[];
  onToggleDone: (item: JournalRecord) => void;
  onDismiss: (id: string) => void;
}) {
  const total = suggested.length;
  const completed = suggested.filter((item) => item.done).length;
  const open = suggested.filter((item) => !item.done).sort((a, b) => daysAgo(b.created_at) - daysAgo(a.created_at));
  const pct = total ? Math.round((completed / total) * 100) : null;
  const hue = pct !== null ? hueForScore(pct) : 220;

  return (
    <Card className="border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6">
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-xl font-semibold text-black dark:text-white">Following through with the AI</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Of the to-dos your AI companion has suggested, how many actually got done.
        </p>
      </CardHeader>
      <CardBody className="gap-4">
        {total === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No AI-suggested to-dos yet — these show up once the background worker or the journal chat spots something actionable.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: catColor(hue, 60, 45) }}
              >
                {pct}%
              </div>
              <p className="text-sm text-black dark:text-gray-300">
                <strong>{completed}</strong> of <strong>{total}</strong> AI-suggested to-dos completed.
                {open.length > 0 && ` ${open.length} still open below.`}
              </p>
            </div>
            {open.length > 0 && (
              <div className="flex flex-col gap-2">
                {open.slice(0, 6).map((item) => {
                  const age = daysAgo(item.created_at);
                  const stale = age >= 7;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-stretch gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-dark-7 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-black dark:text-white">{item.text}</p>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: stale ? catColor(356, 60, 42) : catColor(210, 60, 42) }}
                        >
                          {stale ? `Suggested ${age} days ago — still open` : `Suggested ${age === 0 ? 'today' : `${age}d ago`}`}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="flat" className="flex-1 sm:flex-none" onPress={() => onToggleDone(item)}>
                          Done
                        </Button>
                        <Button size="sm" color="danger" variant="light" className="flex-1 sm:flex-none" onPress={() => onDismiss(item.id)}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

export default function JournalInsightsPage() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<JournalRecord[]>([]);
  const [listItems, setListItems] = useState<JournalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('30');

  const load = async () => {
    try {
      const [entryRes, listRes, billRes] = await Promise.all([
        fetch(journalApiUrl('?kind=journal_entry')),
        fetch(journalApiUrl('?kind=list_item')),
        fetch(journalApiUrl('?kind=bill')),
      ]);
      if (!entryRes.ok || !listRes.ok || !billRes.ok) throw new Error('Failed to load insights');
      const [entryData, listData, billData] = await Promise.all([entryRes.json(), listRes.json(), billRes.json()]);
      setEntries(entryData.items || []);
      setListItems([...(listData.items || []), ...(billData.items || [])]);
    } catch (err) {
      setError('Could not load journal insights');
    }
  };

  useEffect(() => {
    if (session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const usableAll = entries.filter((entry) => !entry.excludeFromAi && !entry.crisis);
  const usable = usableAll.filter((entry) => withinRange(entry.created_at, range));
  const moods = usable.filter((entry) => typeof entry.mood === 'number');
  const averageMood = moods.length
    ? (moods.reduce((sum, entry) => sum + (entry.mood || 0), 0) / moods.length).toFixed(1)
    : '—';

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    usable.forEach((entry) => (entry.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [usable]);

  const observations = useMemo(() => {
    const notes: string[] = [];
    if (!usable.length) {
      notes.push('Write a few entries and keep them out of Private to see patterns here.');
      return notes;
    }
    if (tagCounts[0] && tagCounts[0][1] >= 2) {
      notes.push(
        `I've noticed "${tagCounts[0][0]}" coming up ${tagCounts[0][1]} times. Want to talk through what's driving that, or make a small plan around it?`
      );
    }
    const lowEnergy = moods.filter((entry) => (entry.mood || 0) <= 2).length;
    if (lowEnergy >= 2) {
      notes.push('A few recent check-ins were low energy. This is an observation, not a diagnosis — would a short walk, rest, or a reminder help?');
    }
    if (!notes.length) {
      notes.push('No strong recurring pattern yet. Keep writing — insights stay gentle and non-clinical.');
    }
    return notes;
  }, [usable, tagCounts, moods]);

  const suggestedTodos = listItems.filter((item) => item.source === 'ai_suggested');

  const toggleDone = async (item: JournalRecord) => {
    try {
      const response = await fetch(journalApiUrl(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, done: !item.done }),
      });
      if (!response.ok) throw new Error('failed');
      toast.success(item.done ? 'Marked not done' : 'Nice — marked done');
      await load();
    } catch {
      toast.error('Could not update that item');
    }
  };

  const dismissItem = async (id: string) => {
    try {
      const response = await fetch(journalApiUrl(`?id=${id}`), { method: 'DELETE' });
      if (!response.ok) throw new Error('failed');
      toast.success('Dismissed');
      await load();
    } catch {
      toast.error('Could not dismiss that item');
    }
  };

  const addNudgeAsTodo = async (candidate: string, sourceEntryId: string) => {
    try {
      const response = await fetch(journalApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'list_item', text: candidate, listName: 'To-do', sourceEntryId }),
      });
      if (!response.ok) throw new Error('failed');
      toast.success('Added to your to-do list');
      await load();
    } catch {
      toast.error('Could not add that to-do');
    }
  };

  if (status !== 'loading' && !session) {
    return (
      <>
        <Breadcrumb pageTitle="Insights" />
        <div className="w-full px-4 pb-8 pt-2 sm:px-6 lg:px-12">
          <p className="mb-8 w-full max-w-none text-gray-600 dark:text-gray-400">
            Observations from entries you have not marked private. These are questions and reflections,
            never clinical claims. This journal is not a therapy replacement.
          </p>
          <Link href="/api/auth/hub-signin?next=/journal/analysis" className="text-gray-800 dark:text-gray-300">
            Sign in to view insights →
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Insights" />
      <div className="w-full px-4 pb-10 pt-2 sm:px-6 lg:px-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="w-full max-w-none text-gray-600 dark:text-gray-400">
            Observations from entries you have not marked private. These are questions and reflections,
            never clinical claims. This journal is not a therapy replacement.
          </p>
          <div className="flex shrink-0 gap-1.5 overflow-x-auto rounded-full bg-gray-100 p-1 dark:bg-dark-7">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  range === r.key
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mb-6 text-red-400">{error}</p>}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Entries used" value={String(usable.length)} />
          <StatCard label="Average energy" value={averageMood} hue={averageMood !== '—' ? hueForMood(Math.round(Number(averageMood))) : undefined} />
          <StatCard label="Private / excluded" value={String(entries.filter((e) => e.excludeFromAi).length)} />
          <StatCard
            label="AI to-dos followed through"
            value={suggestedTodos.length ? `${Math.round((suggestedTodos.filter((i) => i.done).length / suggestedTodos.length) * 100)}%` : '—'}
            hue={suggestedTodos.length ? hueForScore((suggestedTodos.filter((i) => i.done).length / suggestedTodos.length) * 100) : undefined}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MoodCalendar entries={usableAll} />
          <EmotionHeatmap usable={usable} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UpcomingRail items={listItems} onToggleDone={toggleDone} />
          <NudgesCard usable={usableAll} listItems={listItems} onAdd={addNudgeAsTodo} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FollowThroughCard suggested={suggestedTodos} onToggleDone={toggleDone} onDismiss={dismissItem} />
          <Card className="border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-black dark:text-white">Gentle observations</h2>
            </CardHeader>
            <CardBody>
              <ul className="space-y-3 text-black dark:text-gray-300">
                {observations.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span style={{ color: catColor(255, 55, 50) }}>✦</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
