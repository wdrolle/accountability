/**
 * Lists page — HeroUI reference implementation
 * ---------------------------------------------
 * Mirrors the interactive prototype (lists-redesign.html): a "due soon"
 * rail surfaces recurring/dated items across every list before they're
 * forgotten, then each list renders as its own color-keyed Card. Category
 * hues and urgency hues are two separate systems and never overlap, so
 * color always answers one question at a time — "which list" or "how soon".
 *
 * npm i @heroui/react framer-motion
 */

import { useMemo, useState } from "react";
import { Card, CardHeader, CardBody, Chip, Checkbox, Button, Input } from "@heroui/react";

// ---------------------------------------------------------------------------
// Data — swap for your real store/query. Shape mirrors the prototype.
// ---------------------------------------------------------------------------

export type ListItem = {
  id: string;
  title: string;
  done: boolean;
  amount?: string;        // e.g. "$68" — bills only
  recur?: string;         // e.g. "monthly", "every 3 months"
  dueInDays?: number;     // negative = overdue, undefined = no date
};

export type ListDef = {
  id: string;
  name: string;
  hue: number;            // reserve 0–25 and 335–360 (red) and 25–55 (amber) for urgency, not categories
  icon: "check" | "basket" | "route" | "receipt";
  items: ListItem[];
};

export const INITIAL_LISTS: ListDef[] = [
  { id: "todo", name: "To-do", hue: 255, icon: "check", items: [
    { id: "t1", title: "Call mom back", done: false },
    { id: "t2", title: "Finish journal review notes", done: false },
    { id: "t3", title: "Book therapist follow-up", done: false, recur: "every 3 months", dueInDays: 4 },
  ]},
  { id: "groceries", name: "Groceries", hue: 150, icon: "basket", items: [
    { id: "g1", title: "Milk", done: false },
    { id: "g2", title: "Eggs", done: false },
    { id: "g3", title: "Coffee", done: false, recur: "usually every 2 weeks" },
  ]},
  { id: "errands", name: "Weekend errands", hue: 195, icon: "route", items: [
    { id: "e1", title: "Car wash", done: false },
    { id: "e2", title: "Return library books", done: false, dueInDays: 2 },
    { id: "e3", title: "Renew car registration", done: false, recur: "yearly", dueInDays: 3 },
  ]},
  { id: "bills", name: "Bills", hue: 315, icon: "receipt", items: [
    { id: "b1", title: "Internet", amount: "$68", done: false, dueInDays: 1 },
    { id: "b2", title: "Rent", amount: "$1,450", done: false, dueInDays: 6 },
    { id: "b3", title: "Prescription", amount: "$32", done: false, recur: "monthly", dueInDays: -1 },
  ]},
];

// Reserved, exclusive of every category hue above:
const URGENCY = { overdue: 356, soon: 40 } as const;

const catColor = (hue: number, l = 46) => `hsl(${hue}deg 62% ${l}%)`;

function dueLabel(dueInDays?: number): { text: string; tier: "overdue" | "soon" | "later" } | null {
  if (dueInDays === undefined) return null;
  if (dueInDays < 0) return { text: `Overdue by ${Math.abs(dueInDays)} day${Math.abs(dueInDays) === 1 ? "" : "s"}`, tier: "overdue" };
  if (dueInDays === 0) return { text: "Due today", tier: "soon" };
  if (dueInDays === 1) return { text: "Due tomorrow", tier: "soon" };
  if (dueInDays <= 3) return { text: `Due in ${dueInDays} days`, tier: "soon" };
  return { text: `Due in ${dueInDays} days`, tier: "later" };
}

// ---------------------------------------------------------------------------
// DueSoonRail — the proactive layer: every dated, unfinished item across
// every list, nearest first. This is what removes the "remember it
// yourself" burden — a recurring bill or errand surfaces here on its own
// lead time rather than waiting for the user to open its list.
// ---------------------------------------------------------------------------

function DueSoonRail({ lists }: { lists: ListDef[] }) {
  const due = useMemo(() => {
    return lists
      .flatMap((list) => list.items.filter((it) => !it.done && it.dueInDays !== undefined).map((item) => ({ list, item })))
      .sort((a, b) => (a.item.dueInDays ?? 0) - (b.item.dueInDays ?? 0));
  }, [lists]);

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-tiny font-bold uppercase tracking-wider text-default-500">Due soon</h2>
        <span className="text-tiny text-default-400">
          {due.length === 0 ? "All clear" : `${due.length} item${due.length === 1 ? "" : "s"} in the next week`}
        </span>
      </div>

      {due.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default-300 px-5 py-5 text-small text-default-500">
          Nothing due in the next week — you're clear.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {due.map(({ list, item }) => {
            const info = dueLabel(item.dueInDays)!;
            const urgencyColor = info.tier === "overdue" ? catColor(URGENCY.overdue, 46) : info.tier === "soon" ? catColor(URGENCY.soon, 45) : undefined;
            return (
              <div
                key={item.id}
                className="flex-none w-56 rounded-2xl border border-default-200 bg-content1 p-4 flex flex-col gap-2"
                style={{ borderLeft: `3px solid ${urgencyColor ?? "var(--heroui-default-300, #d4d4d8)"}` }}
              >
                <span className="inline-flex items-center gap-1.5 text-tiny font-bold uppercase tracking-wide" style={{ color: catColor(list.hue) }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor(list.hue) }} />
                  {list.name}
                </span>
                <span className="text-small font-semibold leading-snug">{item.title}</span>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-tiny font-semibold" style={{ color: urgencyColor }}>{info.text}</span>
                  {item.amount && <span className="text-tiny text-default-500 tabular-nums">{item.amount}</span>}
                </div>
                {item.recur && <span className="text-tiny text-default-400">↻ {item.recur}</span>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ListCard — one category. Header wash + icon chip carry the category
// color; item rows carry an independent urgency chip when dated.
// ---------------------------------------------------------------------------

function ListCard({
  list,
  onToggle,
  onAdd,
}: {
  list: ListDef;
  onToggle: (itemId: string) => void;
  onAdd: (title: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const remaining = list.items.filter((it) => !it.done).length;
  const color = catColor(list.hue);

  function commit() {
    const title = draft.trim();
    if (!title) return;
    onAdd(title);
    setDraft("");
  }

  return (
    <Card className="overflow-visible" shadow="sm">
      <CardHeader
        className="gap-2.5 border-b border-default-100"
        style={{ background: catColor(list.hue, 94) }}
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-background flex-none"
          style={{ background: color }}
        >
          {/* swap for your icon set */}
          <span className="text-tiny">●</span>
        </span>
        <span className="font-bold text-medium flex-1">{list.name}</span>
        <Chip size="sm" variant="bordered" style={{ color, borderColor: color }}>
          {remaining} {remaining === 1 ? "item" : "items"}
        </Chip>
      </CardHeader>

      <CardBody className="gap-0.5 p-2">
        {list.items.length === 0 && (
          <p className="text-small italic text-default-400 px-2 py-3">Nothing here yet.</p>
        )}

        {list.items.map((item) => {
          const info = dueLabel(item.dueInDays);
          return (
            <div key={item.id} className="flex items-start gap-2.5 rounded-xl px-2 py-2 hover:bg-default-100">
              <Checkbox
                isSelected={item.done}
                onValueChange={() => onToggle(item.id)}
                color="default"
                classNames={{ wrapper: "mt-0.5" }}
                style={{ ["--heroui-primary" as any]: color }}
              />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(item.id)}>
                <p className={`text-small font-medium ${item.done ? "text-default-400 line-through" : ""}`}>
                  {item.title}
                </p>
                {(item.recur || info) && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.recur && (
                      <Chip size="sm" variant="flat" className="h-5 text-tiny">↻ {item.recur}</Chip>
                    )}
                    {info && (
                      <Chip
                        size="sm"
                        className="h-5 text-tiny text-white"
                        style={{ background: info.tier === "later" ? undefined : catColor(info.tier === "overdue" ? URGENCY.overdue : URGENCY.soon, 45) }}
                        variant={info.tier === "later" ? "flat" : "solid"}
                      >
                        {info.text}
                      </Chip>
                    )}
                  </div>
                )}
              </div>
              {item.amount && <span className="text-small text-default-500 tabular-nums pt-0.5">{item.amount}</span>}
              {list.id === "bills" && (
                <Button
                  size="sm"
                  variant="bordered"
                  className="h-7 text-tiny"
                  isDisabled={item.done}
                  onPress={() => onToggle(item.id)}
                >
                  {item.done ? "Paid" : "Mark paid"}
                </Button>
              )}
            </div>
          );
        })}

        <div className="flex gap-2 pt-2 mt-1 border-t border-default-100">
          <Input
            size="sm"
            placeholder={`Add to ${list.name.toLowerCase()}…`}
            value={draft}
            onValueChange={setDraft}
            onKeyDown={(e) => e.key === "Enter" && commit()}
          />
          <Button size="sm" style={{ background: color }} className="text-white" onPress={commit}>
            Add
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ListsPage
// ---------------------------------------------------------------------------

export default function ListsPage() {
  const [lists, setLists] = useState<ListDef[]>(INITIAL_LISTS);

  function toggle(listId: string, itemId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId ? l : { ...l, items: l.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)) }
      )
    );
  }

  function add(listId: string, title: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId ? l : { ...l, items: [...l.items, { id: `${listId}-${crypto.randomUUID()}`, title, done: false }] }
      )
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <p className="text-tiny text-default-400 mb-2">Home / Lists</p>
      <h1 className="text-4xl font-extrabold tracking-tight">Lists</h1>
      <p className="mt-3 max-w-prose text-default-500">
        Keep tasks, shopping, and bills next to the journal that inspired them. Recurring items resurface on
        their own before they're due, so nothing rides on memory.
      </p>

      <DueSoonRail lists={lists} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            onToggle={(itemId) => toggle(list.id, itemId)}
            onAdd={(title) => add(list.id, title)}
          />
        ))}
      </div>
    </main>
  );
}
