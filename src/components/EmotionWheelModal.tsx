"use client";

/**
 * EmotionWheelModal — HeroUI wheel + family chips.
 * Tag vocabulary comes from src/styles/emotion-tags.json (single source of truth).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Accordion,
  AccordionItem,
  ScrollShadow,
} from "@heroui/react";
import emotionData from "@/styles/emotion-tags.json";

export type EmotionFamily = {
  id: string;
  name: string;
  hue: number;
  wheel: { mild: string; core: string; intense: string };
  tags: string[];
};

export const EMOTION_FAMILIES: EmotionFamily[] = emotionData.families as EmotionFamily[];

export function listEmotionTags(): string[] {
  const tags = new Set<string>();
  EMOTION_FAMILIES.forEach((fam) => {
    tags.add(fam.wheel.mild);
    tags.add(fam.wheel.core);
    tags.add(fam.wheel.intense);
    fam.tags.forEach((tag) => tags.add(tag));
  });
  return [...tags];
}

const TAG_LOOKUP = new Map(listEmotionTags().map((tag) => [tag.toLowerCase(), tag]));

export function canonicalizeEmotionTag(tag: string): string | null {
  return TAG_LOOKUP.get(tag.trim().toLowerCase()) ?? null;
}

export function filterEmotionTags(tags: string[] | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags || []) {
    const canonical = canonicalizeEmotionTag(tag);
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      result.push(canonical);
    }
  }
  return result;
}

const RING_LEVELS = [
  { key: "mild", order: 0, s: 52, l: 80 },
  { key: "core", order: 1, s: 64, l: 63 },
  { key: "intense", order: 2, s: 74, l: 45 },
] as const;

const hsl = (h: number, s: number, l: number) => `hsl(${h}deg ${s}% ${l}%)`;
const textOn = (l: number) => (l > 58 ? "#2a2117" : "#fbf6ef");

// ---------------------------------------------------------------------------
// FeelingWheel — the radial picker (SVG, generated per-render, not hand
// authored path data — coordinates come from the polar() helper below).
// ---------------------------------------------------------------------------

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function annularPath(cx: number, cy: number, rInner: number, rOuter: number, start: number, end: number) {
  const [x1, y1] = polar(cx, cy, rOuter, start);
  const [x2, y2] = polar(cx, cy, rOuter, end);
  const [x3, y3] = polar(cx, cy, rInner, end);
  const [x4, y4] = polar(cx, cy, rInner, start);
  const largeArc = (end - start) % 360 > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

function FeelingWheel({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (tag: string, family: EmotionFamily) => void;
}) {
  const CX = 200, CY = 200;
  const sliceAngle = 360 / EMOTION_FAMILIES.length;
  const GAP = 1.1;
  const ringGeom = [
    { rInner: 118, rOuter: 172 },
    { rInner: 66, rOuter: 118 },
    { rInner: 26, rOuter: 66 },
  ];

  return (
    <svg viewBox="0 0 400 400" role="group" aria-label="Emotion wheel" style={{ width: "100%", height: "100%" }}>
      {EMOTION_FAMILIES.map((fam, i) => {
        const start = i * sliceAngle + GAP / 2;
        const end = (i + 1) * sliceAngle - GAP / 2;
        const mid = (start + end) / 2;
        const words = [fam.wheel.mild, fam.wheel.core, fam.wheel.intense];

        return (
          <g key={fam.id}>
            {RING_LEVELS.map((ring, ringIdx) => {
              const geom = ringGeom[ringIdx];
              const word = words[ringIdx];
              const color = hsl(fam.hue, ring.s, ring.l);
              const isOn = selected.has(word);
              const [lx, ly] = polar(CX, CY, (geom.rInner + geom.rOuter) / 2, mid);

              return (
                <g key={ring.key}>
                  <path
                    d={annularPath(CX, CY, geom.rInner, geom.rOuter, start, end)}
                    fill={color}
                    stroke="var(--card, #fff)"
                    strokeWidth={1.5}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isOn}
                    aria-label={`${word} (${fam.name}, ${ring.key})`}
                    style={{
                      cursor: "pointer",
                      transformOrigin: "center",
                      transform: isOn ? "scale(1.045)" : "scale(1)",
                      transition: "transform .15s ease, filter .15s ease",
                    }}
                    onClick={() => onToggle(word, fam)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(word, fam); }
                    }}
                  />
                  <text
                    x={lx} y={ly}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={ringIdx === 0 ? 11.5 : ringIdx === 1 ? 11 : 9.5}
                    fontWeight={600}
                    fill={textOn(ring.l)}
                    style={{ pointerEvents: "none" }}
                  >
                    {word}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r={24} fill="var(--card, #fff)" stroke="var(--line-strong, #d8c6ac)" />
      <text x={CX} y={CY - 3} textAnchor="middle" fontSize={19} fontWeight={600}>{selected.size}</text>
      <text x={CX} y={CY + 13} textAnchor="middle" fontSize={9.5} letterSpacing="0.08em" fill="var(--ink-faint, #a3927e)">FELT</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// EmotionWheelModal — the piece a screen actually renders
// ---------------------------------------------------------------------------

export function EmotionWheelModal({
  isOpen,
  onOpenChange,
  initialTags = [],
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialTags?: string[];
  onSave: (tags: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(filterEmotionTags(initialTags)));

  useEffect(() => {
    if (isOpen) setSelected(new Set(filterEmotionTags(initialTags)));
  }, [isOpen, initialTags]);

  const familyOf = useMemo(() => {
    const map = new Map<string, EmotionFamily>();
    EMOTION_FAMILIES.forEach((fam) => {
      [fam.wheel.mild, fam.wheel.core, fam.wheel.intense, ...fam.tags].forEach((tag) => map.set(tag, fam));
    });
    return map;
  }, []);

  function toggle(tag: string, fam: EmotionFamily) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/80",
        base: "m-0 w-full max-h-[100dvh] rounded-none border border-gray-200 bg-white text-black dark:border-white/15 dark:bg-dark-6 dark:text-white sm:m-auto sm:max-h-[90vh] sm:rounded-large",
        header: "border-b border-gray-200 dark:border-white/10",
        body: "bg-white dark:bg-dark-6",
        footer: "border-t border-gray-200 bg-white dark:border-white/10 dark:bg-dark-6",
      }}
    >
      <ModalContent className="bg-white dark:bg-dark-6">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-start gap-1">
              <p className="text-tiny font-semibold uppercase tracking-wider text-default-400">
                Journal · Mood check-in
              </p>
              <h2 className="text-xl font-semibold">How are you feeling right now?</h2>
              <p className="text-small font-normal text-default-500">
                Tap the wheel for a quick read, or open a family below for the exact word.
                Pick as many as fit.
              </p>
            </ModalHeader>

            <ModalBody className="grid gap-6 md:grid-cols-[minmax(260px,360px)_1fr]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[360px] aspect-square">
                  <FeelingWheel selected={selected} onToggle={toggle} />
                </div>
                <div className="flex gap-4 text-tiny text-default-400">
                  <span>mild</span><span>core</span><span>intense</span>
                </div>
              </div>

              <div className="flex flex-col gap-5 min-w-0">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-dark-7">
                  <p className="text-tiny font-semibold uppercase tracking-wider text-default-400 mb-2">
                    Selected feelings
                  </p>
                  {selected.size === 0 ? (
                    <p className="text-small italic text-default-400">
                      Nothing selected yet — the wheel and lists both add here.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {[...selected].map((tag) => {
                        const fam = familyOf.get(tag)!;
                        return (
                          <Chip
                            key={tag}
                            onClose={() => toggle(tag, fam)}
                            style={{
                              backgroundColor: hsl(fam.hue, 55, 88),
                              color: hsl(fam.hue, 45, 28),
                            }}
                            variant="flat"
                          >
                            {tag}
                          </Chip>
                        );
                      })}
                    </div>
                  )}
                </div>

                <ScrollShadow className="max-h-[320px]">
                  <Accordion selectionMode="single" variant="splitted">
                    {EMOTION_FAMILIES.map((fam) => (
                      <AccordionItem
                        key={fam.id}
                        aria-label={fam.name}
                        title={
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ background: hsl(fam.hue, 68, 55) }}
                            />
                            <span className="font-semibold">{fam.name}</span>
                            <span className="text-tiny text-default-400 ml-auto">
                              {[...selected].filter((t) => familyOf.get(t)?.id === fam.id).length || ""}
                            </span>
                          </div>
                        }
                      >
                        <div className="flex flex-wrap gap-2 pb-2">
                          {fam.tags.map((tag) => (
                            <Chip
                              key={tag}
                              onClick={() => toggle(tag, fam)}
                              variant={selected.has(tag) ? "solid" : "flat"}
                              className="cursor-pointer"
                              style={{
                                backgroundColor: hsl(fam.hue, 55, selected.has(tag) ? 68 : 88),
                                color: hsl(fam.hue, 45, 28),
                              }}
                            >
                              {tag}
                            </Chip>
                          ))}
                        </div>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollShadow>
              </div>
            </ModalBody>

            <ModalFooter className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-tiny text-default-400">
                {selected.size} feeling{selected.size === 1 ? "" : "s"} selected
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="light" onPress={onClose}>Skip for now</Button>
                <Button
                  color="default"
                  className="bg-foreground text-background"
                  onPress={() => { onSave([...selected]); onClose(); }}
                >
                  Save to entry
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
