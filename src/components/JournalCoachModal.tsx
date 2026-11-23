'use client';

/**
 * JournalCoachModal — the "New entry" experience: a guided, therapist-style
 * conversation on the left, and the actual saved entry (text, energy,
 * feelings, privacy) on the right. Every one of the user's own chat turns
 * is folded into the entry text as they write, so the conversation *is* the
 * journaling, not a separate thing bolted on top.
 *
 * Nothing here silently creates a to-do — action items detected in the
 * entry are offered as chips the user has to click to add (spec section 4.5:
 * agentic actions must be confirmed, never silent).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Checkbox,
  Divider,
  Tooltip,
  ScrollShadow,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import {
  ENERGY_LEVELS,
  JOURNAL_PROMPTS,
  appApiUrl,
  extractActionCandidates,
  journalApiUrl,
  type JournalRecord,
} from '@/lib/journal';
import { EmotionWheelModal, filterEmotionTags } from '@/components/EmotionWheelModal';
import { catColor, hueForEntry, hueForMood } from '@/lib/journalColors';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

const quietFieldClass =
  'w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm text-black placeholder:text-gray-500 shadow-none outline-none ring-0 border-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:bg-dark-7 dark:text-white dark:placeholder:text-gray-400';

const OPENERS = [
  "Hi — what's on your mind today?",
  "Hey, good to see you. What's been sitting with you lately?",
  "What's one thing you want to think through today?",
  "Where do you want to start?",
];

function randomOpener() {
  return OPENERS[Math.floor(Math.random() * OPENERS.length)];
}

function ChatBubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'text-black dark:text-white'
        }`}
        style={!isUser ? { background: 'hsl(255deg 62% 46% / 0.12)' } : undefined}
      >
        {turn.content}
      </div>
    </div>
  );
}

export function JournalCoachModal({
  isOpen,
  onOpenChange,
  entry,
  onSaved,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalRecord | null;
  onSaved: () => void;
}) {
  const isEdit = !!entry;

  const [text, setText] = useState('');
  const [mood, setMood] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [excludeFromAi, setExcludeFromAi] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [addedCandidates, setAddedCandidates] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (entry) {
      setText(entry.text);
      setMood(entry.mood || 3);
      setTags(filterEmotionTags(entry.tags));
      setExcludeFromAi(!!entry.excludeFromAi);
      setPrompt(entry.prompt || '');
      setMessages([
        {
          role: 'assistant',
          content: "Want to talk through this entry a bit more, or just tidy it up? I'm here either way.",
        },
      ]);
    } else {
      setText('');
      setMood(3);
      setTags([]);
      setExcludeFromAi(false);
      setPrompt('');
      setMessages([{ role: 'assistant', content: randomOpener() }]);
    }
    setChatInput('');
    setCrisisMessage(null);
    setAddedCandidates(new Set());
  }, [isOpen, entry]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, chatLoading]);

  const actionCandidates = useMemo(() => extractActionCandidates(text), [text]);

  const sendChat = async () => {
    const content = chatInput.trim();
    if (!content || chatLoading) return;
    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setChatInput('');
    setText((prev) => (prev ? `${prev}\n\n${content}` : content));
    setChatLoading(true);
    try {
      const response = await fetch(appApiUrl('/api/ai/journal-coach'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (data.crisis) {
        setCrisisMessage(data.reply);
      }
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I couldn't reach your AI companion just now — keep writing, I'll catch up when it's back." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const applyPrompt = (nextPrompt: string) => {
    setPrompt(nextPrompt);
    setMessages((prev) => [...prev, { role: 'assistant', content: nextPrompt }]);
  };

  const addCandidate = async (candidate: string) => {
    try {
      const response = await fetch(journalApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'list_item', text: candidate, listName: 'To-do' }),
      });
      if (!response.ok) throw new Error('failed');
      setAddedCandidates((prev) => new Set(prev).add(candidate));
      toast.success('Added to your to-do list');
    } catch {
      toast.error('Could not add that to your list');
    }
  };

  const save = async () => {
    if (!text.trim()) {
      toast.error('Write a few words first');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(journalApiUrl(), {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry?.id,
          kind: 'journal_entry',
          text,
          mood,
          tags: filterEmotionTags(tags),
          excludeFromAi,
          prompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      if (data.crisisMessage) setCrisisMessage(data.crisisMessage);
      toast.success(isEdit ? 'Entry updated' : 'Entry saved');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!entry) return;
    try {
      const response = await fetch(journalApiUrl(`?id=${entry.id}`), { method: 'DELETE' });
      if (!response.ok) throw new Error('failed');
      toast.success('Entry deleted');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const headerHue = hueForEntry({ tags, mood });
  const moodHue = hueForMood(mood);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: 'bg-black/80',
          base: 'm-0 w-full max-h-[100dvh] rounded-none border border-gray-200 bg-white text-black dark:border-white/15 dark:bg-dark-6 dark:text-white sm:m-auto sm:max-h-[92vh] sm:rounded-large',
          header: 'border-b border-gray-200 dark:border-white/10',
          body: 'bg-white dark:bg-dark-6',
          footer: 'border-t border-gray-200 bg-white dark:border-white/10 dark:bg-dark-6',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader
                className="flex flex-col items-start gap-1"
                style={{ background: catColor(headerHue, 62, 46, 0.12) }}
              >
                <p className="text-tiny font-semibold uppercase tracking-wider text-default-400">
                  Journal · Talk it through
                </p>
                <h2 className="text-xl font-semibold">{isEdit ? 'Edit entry' : "What's going on?"}</h2>
                <p className="text-small font-normal text-default-500">
                  This is a private space to think out loud. Not therapy, and not a diagnosis — in a crisis, call or text 988.
                </p>
              </ModalHeader>

              {crisisMessage && (
                <div className="mx-6 mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-100">
                  {crisisMessage}
                </div>
              )}

              <ModalBody className="grid gap-6 py-6 md:grid-cols-2">
                {/* Conversation column */}
                <div className="flex min-h-0 flex-col">
                  <ScrollShadow ref={scrollRef} className="flex max-h-[340px] min-h-[240px] flex-col gap-3 pr-1">
                    {messages.map((turn, index) => (
                      <ChatBubble key={index} turn={turn} />
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div
                          className="rounded-2xl px-4 py-2.5 text-sm italic text-default-500"
                          style={{ background: 'hsl(255deg 62% 46% / 0.12)' }}
                        >
                          thinking…
                        </div>
                      </div>
                    )}
                  </ScrollShadow>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          sendChat();
                        }
                      }}
                      placeholder="Say what's on your mind…"
                      aria-label="Message"
                      className={quietFieldClass}
                    />
                    <Button
                      className="text-white"
                      style={{ background: catColor(255) }}
                      isLoading={chatLoading}
                      onPress={sendChat}
                    >
                      Send
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {JOURNAL_PROMPTS.map((item) => (
                      <Button
                        key={item}
                        size="sm"
                        variant="flat"
                        className="bg-gray-200 text-black dark:bg-white/10 dark:text-white"
                        onPress={() => applyPrompt(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Entry draft column */}
                <div className="flex flex-col gap-5">
                  <textarea
                    rows={8}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Your entry builds here as you talk — or just type directly."
                    aria-label="Journal entry"
                    className={`min-h-[180px] resize-y ${quietFieldClass}`}
                  />

                  {actionCandidates.length > 0 && (
                    <div
                      className="rounded-2xl border p-3"
                      style={{ borderColor: catColor(255, 62, 46, 0.35), background: catColor(255, 62, 46, 0.08) }}
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: catColor(255, 55, 42) }}>
                        Sounds like a next step
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {actionCandidates.map((candidate) => {
                          const added = addedCandidates.has(candidate);
                          return (
                            <Chip
                              key={candidate}
                              variant={added ? 'flat' : 'solid'}
                              className={`cursor-pointer text-xs ${added ? '' : 'text-white'}`}
                              style={{ background: added ? undefined : catColor(255) }}
                              onClick={() => !added && addCandidate(candidate)}
                            >
                              {added ? `✓ ${candidate}` : `+ To-do: ${candidate}`}
                            </Chip>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Divider className="bg-gray-200 dark:bg-white/10" />

                  <div>
                    <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">Energy</p>
                    <div className="flex flex-wrap justify-between gap-2 sm:justify-start sm:gap-4">
                      {ENERGY_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          aria-label={`${level.label} energy`}
                          aria-pressed={mood === level.value}
                          onClick={() => setMood(level.value)}
                          className="flex flex-col items-center gap-1"
                        >
                          <Chip
                            as="span"
                            size="lg"
                            radius="full"
                            variant={mood === level.value ? 'solid' : 'flat'}
                            style={
                              mood === level.value
                                ? { background: catColor(hueForMood(level.value), 55, 50), color: 'white' }
                                : undefined
                            }
                            classNames={{
                              base:
                                mood === level.value
                                  ? 'h-12 min-w-12 cursor-pointer'
                                  : 'h-12 min-w-12 cursor-pointer !bg-gray-200 dark:!bg-white/10',
                              content: 'text-xl leading-none',
                            }}
                          >
                            {level.emoji}
                          </Chip>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{level.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Divider className="bg-gray-200 dark:bg-white/10" />

                  <div>
                    <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">Feelings</p>
                    <Button
                      variant="flat"
                      className="bg-gray-200 text-black dark:bg-white/10 dark:text-white"
                      onPress={() => setTagPickerOpen(true)}
                    >
                      Choose feelings
                    </Button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No feelings selected yet.</p>
                      )}
                      {tags.map((tag) => (
                        <Chip
                          key={tag}
                          size="sm"
                          variant="flat"
                          style={{ background: catColor(headerHue, 55, 88), color: catColor(headerHue, 45, 28) }}
                          onClose={() => setTags(tags.filter((item) => item !== tag))}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <Tooltip
                    content="This entry won't be used for AI insights, recaps, or the to-do worker"
                    placement="top"
                    showArrow
                    delay={150}
                    closeDelay={80}
                    classNames={{
                      content: 'max-w-xs bg-white px-3 py-2 text-sm text-black dark:bg-dark-7 dark:text-white',
                    }}
                  >
                    <div className="inline-flex max-w-fit items-center cursor-default">
                      <Checkbox
                        isSelected={excludeFromAi}
                        onValueChange={setExcludeFromAi}
                        classNames={{
                          base: 'max-w-fit items-center gap-2',
                          wrapper:
                            'h-5 w-5 min-w-5 max-w-5 overflow-hidden rounded-[4px] border-2 border-gray-400 bg-transparent after:bg-black dark:border-white/50 dark:after:bg-white',
                          icon: 'h-3 w-3 text-white dark:text-black',
                          label: 'text-sm text-black dark:text-white',
                        }}
                      >
                        Private
                      </Checkbox>
                    </div>
                  </Tooltip>
                </div>
              </ModalBody>

              <ModalFooter className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                {isEdit ? (
                  <Button color="danger" variant="flat" onPress={remove}>
                    Delete
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="light" onPress={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button className="text-white" style={{ background: catColor(headerHue, 55, 40) }} isLoading={saving} onPress={save}>
                    {isEdit ? 'Update entry' : 'Save entry'}
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <EmotionWheelModal
        isOpen={tagPickerOpen}
        onOpenChange={setTagPickerOpen}
        initialTags={tags}
        onSave={(nextTags) => setTags(filterEmotionTags(nextTags))}
      />
    </>
  );
}
