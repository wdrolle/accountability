/**
 * Shared "dynamic color" system for the journal domain — one hue per entry,
 * derived from whatever the user actually told us (a chosen feeling first,
 * energy level otherwise) so the journal and lists pages read as one
 * consistent, colorful system rather than two different treatments.
 */

import { EMOTION_FAMILIES } from "@/components/EmotionWheelModal";

const FAMILY_HUE_BY_TAG = new Map<string, number>();
EMOTION_FAMILIES.forEach((family) => {
  [family.wheel.mild, family.wheel.core, family.wheel.intense, ...family.tags].forEach((tag) => {
    FAMILY_HUE_BY_TAG.set(tag.toLowerCase(), family.hue);
  });
});

/** Drained -> cool blue, Wired -> warm coral; steady sits in a neutral teal. */
const MOOD_HUE = [0, 210, 195, 165, 35, 15] as const; // index 0 unused, 1..5 map to mood

export function hueForMood(mood?: number | null): number {
  if (!mood || mood < 1 || mood > 5) return 220; // neutral slate-blue for "no data yet"
  return MOOD_HUE[mood];
}

export function hueForEntry(entry: { tags?: string[]; mood?: number }): number {
  for (const tag of entry.tags || []) {
    const hue = FAMILY_HUE_BY_TAG.get(tag.toLowerCase());
    if (hue !== undefined) return hue;
  }
  return hueForMood(entry.mood);
}

/** Hue for a single emotion-wheel tag, falling back to a neutral violet for free-form tags (work, money, etc). */
export function hueForTag(tag: string): number {
  return FAMILY_HUE_BY_TAG.get(tag.toLowerCase()) ?? 255;
}

export function catColor(hue: number, s = 62, l = 46, alpha?: number) {
  if (alpha === undefined) return `hsl(${hue}deg ${s}% ${l}%)`;
  return `hsl(${hue}deg ${s}% ${l}% / ${alpha})`;
}

/** Red (struggling) -> green (on track), for a 0-100 "how are we doing" style score. */
export function hueForScore(pct: number): number {
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round((clamped / 100) * 130);
}

export function daysAgo(dateIso: string): number {
  const then = new Date(dateIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / 86400000));
}
