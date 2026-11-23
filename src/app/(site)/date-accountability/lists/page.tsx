'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { journalApiUrl, type JournalRecord } from '@/lib/journal';
import { Button, Card, CardBody, CardHeader, Checkbox, Chip, Input } from '@heroui/react';

type ListId = 'todo' | 'groceries' | 'errands' | 'bills';

type ListDef = {
  id: ListId;
  name: string;
  hue: number;
};

const LIST_DEFS: ListDef[] = [
  { id: 'todo', name: 'To-do', hue: 255 },
  { id: 'groceries', name: 'Groceries', hue: 150 },
  { id: 'errands', name: 'Weekend errands', hue: 195 },
  { id: 'bills', name: 'Bills', hue: 315 },
];

const URGENCY = { overdue: 356, soon: 40 } as const;

const catColor = (hue: number, l = 46) => `hsl(${hue}deg 62% ${l}%)`;

function listForRecord(item: JournalRecord): ListDef {
  if (item.kind === 'bill') return LIST_DEFS[3];
  return LIST_DEFS.find((list) => list.name === item.listName) || LIST_DEFS[0];
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
    const days = Math.abs(dueInDays);
    return { text: `Overdue by ${days} day${days === 1 ? '' : 's'}`, tier: 'overdue' };
  }
  if (dueInDays === 0) return { text: 'Due today', tier: 'soon' };
  if (dueInDays === 1) return { text: 'Due tomorrow', tier: 'soon' };
  if (dueInDays <= 3) return { text: `Due in ${dueInDays} days`, tier: 'soon' };
  return { text: `Due in ${dueInDays} days`, tier: 'later' };
}

function formatAmount(amount?: number | null) {
  if (amount == null) return '';
  return `$${amount}`;
}

function DueSoonRail({ items }: { items: JournalRecord[] }) {
  const due = useMemo(() => {
    return items
      .map((item) => ({ item, list: listForRecord(item), dueInDays: daysUntil(item.dueDate) }))
      .filter((entry) => !entry.item.done && entry.dueInDays !== undefined && entry.dueInDays <= 7)
      .sort((a, b) => (a.dueInDays ?? 0) - (b.dueInDays ?? 0));
  }, [items]);

  return (
    <section className="mt-2">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Due soon</h2>
        <span className="text-xs text-gray-400">
          {due.length === 0 ? 'All clear' : `${due.length} item${due.length === 1 ? '' : 's'} in the next week`}
        </span>
      </div>

      {due.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-5 text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
          Nothing due in the next week — you&apos;re clear.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {due.map(({ list, item, dueInDays }) => {
            const info = dueLabel(dueInDays)!;
            const urgencyColor =
              info.tier === 'overdue'
                ? catColor(URGENCY.overdue, 46)
                : info.tier === 'soon'
                  ? catColor(URGENCY.soon, 45)
                  : undefined;
            return (
              <div
                key={item.id}
                className="flex w-56 flex-none flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-dark-6"
                style={{ borderLeft: `3px solid ${urgencyColor ?? '#d4d4d8'}` }}
              >
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
                  style={{ color: catColor(list.hue) }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: catColor(list.hue) }} />
                  {list.name}
                </span>
                <span className="text-sm font-semibold leading-snug text-black dark:text-white">{item.text}</span>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: urgencyColor }}>
                    {info.text}
                  </span>
                  {item.amount != null && (
                    <span className="text-xs tabular-nums text-gray-500">{formatAmount(item.amount)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ListCard({
  list,
  items,
  onToggle,
  onAdd,
  onRemove,
}: {
  list: ListDef;
  items: JournalRecord[];
  onToggle: (item: JournalRecord) => void;
  onAdd: (payload: { title: string; amount?: string; dueDate?: string }) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const remaining = items.filter((item) => !item.done).length;
  const color = catColor(list.hue);
  const isBills = list.id === 'bills';

  const commit = () => {
    const title = draft.trim();
    if (!title) return;
    onAdd({ title, amount, dueDate });
    setDraft('');
    setAmount('');
    setDueDate('');
  };

  return (
    <Card className="overflow-visible border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6" shadow="sm">
      <CardHeader
        className="gap-2.5 border-b border-gray-200 dark:border-white/10"
        style={{ background: `hsl(${list.hue}deg 62% 46% / 0.12)` }}
      >
        <span
          className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-white"
          style={{ background: color }}
        >
          <span className="text-xs">●</span>
        </span>
        <span className="flex-1 text-base font-bold text-black dark:text-white">{list.name}</span>
        <Chip size="sm" variant="bordered" style={{ color, borderColor: color }}>
          {remaining} {remaining === 1 ? 'item' : 'items'}
        </Chip>
      </CardHeader>

      <CardBody className="gap-0.5 p-2">
        {items.length === 0 && (
          <p className="px-2 py-3 text-sm italic text-gray-400">Nothing here yet.</p>
        )}

        {items.map((item) => {
          const info = dueLabel(daysUntil(item.dueDate));
          return (
            <div key={item.id} className="flex items-start gap-2.5 rounded-xl px-2 py-2 hover:bg-black/5 dark:hover:bg-white/5">
              <Checkbox
                isSelected={!!item.done}
                onValueChange={() => onToggle(item)}
                color="default"
                classNames={{ wrapper: 'mt-0.5' }}
                aria-label={item.text}
              />
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onToggle(item)}>
                <p className={`text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-black dark:text-white'}`}>
                  {item.text}
                </p>
                {(info || item.source === 'ai_suggested') && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {item.source === 'ai_suggested' && (
                      <Chip
                        size="sm"
                        variant="flat"
                        className="h-5 text-xs"
                        style={{ background: 'hsl(270deg 62% 46% / 0.16)', color: 'hsl(270deg 55% 42%)' }}
                      >
                        ✨ AI suggested
                      </Chip>
                    )}
                    {info && (
                      <Chip
                        size="sm"
                        className={`h-5 text-xs ${info.tier === 'later' ? '' : 'text-white'}`}
                        style={{
                          background:
                            info.tier === 'later'
                              ? undefined
                              : catColor(info.tier === 'overdue' ? URGENCY.overdue : URGENCY.soon, 45),
                        }}
                        variant={info.tier === 'later' ? 'flat' : 'solid'}
                      >
                        {info.text}
                      </Chip>
                    )}
                  </div>
                )}
              </div>
              {item.amount != null && (
                <span className="pt-0.5 text-sm tabular-nums text-gray-500">{formatAmount(item.amount)}</span>
              )}
              {isBills && (
                <Button
                  size="sm"
                  variant="bordered"
                  className="h-7 text-xs"
                  isDisabled={!!item.done}
                  onPress={() => onToggle(item)}
                >
                  {item.done ? 'Paid' : 'Mark paid'}
                </Button>
              )}
              <Button size="sm" color="danger" variant="light" className="h-7 self-start" onPress={() => onRemove(item.id)}>
                Remove
              </Button>
            </div>
          );
        })}

        <div className="mt-1 flex flex-col gap-2 border-t border-gray-200 pt-2 dark:border-white/10">
          <div className="flex gap-2">
            <Input
              size="sm"
              placeholder={`Add to ${list.name.toLowerCase()}…`}
              value={draft}
              onValueChange={setDraft}
              onKeyDown={(event) => event.key === 'Enter' && commit()}
            />
            <Button size="sm" className="text-white" style={{ background: color }} onPress={commit}>
              Add
            </Button>
          </div>
          {isBills && (
            <div className="grid grid-cols-2 gap-2">
              <Input size="sm" placeholder="Amount" value={amount} onValueChange={setAmount} />
              <Input size="sm" type="date" value={dueDate} onValueChange={setDueDate} />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function JournalListsPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<JournalRecord[]>([]);

  const load = async () => {
    const [listRes, billRes] = await Promise.all([
      fetch(journalApiUrl('?kind=list_item')),
      fetch(journalApiUrl('?kind=bill')),
    ]);
    if (!listRes.ok || !billRes.ok) {
      toast.error('Failed to load lists');
      return;
    }
    const lists = await listRes.json();
    const bills = await billRes.json();
    setItems([...(lists.items || []), ...(bills.items || [])]);
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  const grouped = useMemo(() => {
    const map = new Map<string, JournalRecord[]>();
    LIST_DEFS.forEach((list) => map.set(list.name, []));
    items.forEach((item) => {
      const name = listForRecord(item).name;
      map.set(name, [...(map.get(name) || []), item]);
    });
    return map;
  }, [items]);

  const addItem = async (list: ListDef, payload: { title: string; amount?: string; dueDate?: string }) => {
    if (!payload.title.trim()) {
      toast.error('Add an item first');
      return;
    }
    const kind = list.id === 'bills' ? 'bill' : 'list_item';
    const response = await fetch(journalApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        text: payload.title,
        listName: list.name,
        amount: payload.amount ? Number(payload.amount) : null,
        dueDate: payload.dueDate || null,
      }),
    });
    if (!response.ok) {
      toast.error('Failed to add item');
      return;
    }
    toast.success('Added');
    await load();
  };

  const toggleDone = async (item: JournalRecord) => {
    const response = await fetch(journalApiUrl(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, done: !item.done }),
    });
    if (!response.ok) {
      toast.error('Failed to update item');
      return;
    }
    await load();
  };

  const removeItem = async (id: string) => {
    const response = await fetch(journalApiUrl(`?id=${id}`), { method: 'DELETE' });
    if (!response.ok) {
      toast.error('Failed to delete item');
      return;
    }
    await load();
  };

  const intro = (
    <p className="mb-8 w-full max-w-none text-gray-600 dark:text-gray-400">
      Keep tasks, shopping, and bill reminders next to the journal that inspired them.
      Mark a bill paid when it is done. This is lightweight organization, not a full finance app.
    </p>
  );

  if (status !== 'loading' && !session) {
    return (
      <>
        <Breadcrumb pageTitle="Lists" />
        <div className="w-full px-4 pb-8 pt-2 sm:px-6 lg:px-12">
          {intro}
          <Link href="/auth/login" className="text-gray-800 dark:text-gray-300">
            Sign in to manage lists →
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Lists" />
      <div className="w-full px-4 pb-8 pt-2 sm:px-6 lg:px-12">
        {intro}
        <DueSoonRail items={items} />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {LIST_DEFS.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              items={grouped.get(list.name) || []}
              onToggle={toggleDone}
              onAdd={(payload) => addItem(list, payload)}
              onRemove={removeItem}
            />
          ))}
        </div>
      </div>
    </>
  );
}
