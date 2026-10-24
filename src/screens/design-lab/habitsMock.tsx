/**
 * Mock habits for the Design Lab — Habits screen and habit calendar (kolo 13).
 *
 * History is generated relative to TODAY (deterministic per date), so the calendar
 * always has something to show. The day statuses follow the app's real rules
 * (technical-guides:Habits.md, "Smart Bonus Conversion"):
 * - weeks run Monday–Sunday;
 * - only PAST scheduled days without a check count as missed (today still runs);
 * - a bonus (check on a non-scheduled day) in the same week makes up the oldest
 *   missed day, 1:1, chronologically → the bonus day is a make-up (green), the
 *   missed day is covered;
 * - a paused day is never a missed day.
 * Lab-only: the real app computes this in useHabitsData / habitImmutability.
 *
 * Today's checks are shared between Home and Habits (LabTodayProvider), so a check
 * on one screen shows on the other.
 *
 * GOING LIVE: do NOT port. This is stage scenery; the app's real logic lives in
 * useHabitsData / habitImmutability (and is tested).
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { LabHabitColor } from './labTokens';
import { LabLang, MOCK_HABITS } from './mockCopy';

export type DayKind =
  | 'done'
  | 'makeup'
  | 'bonus'
  | 'missed'
  | 'covered'
  | 'paused'
  | 'planned'
  | 'todayOpen'
  | 'none';

export interface DayStatus {
  kind: DayKind;
  /** make-up → the missed day it covers; covered → the make-up day that covered it. */
  pairKey?: string;
}

export interface LabHabit {
  id: string;
  icon: string;
  color: LabHabitColor;
  name: Record<LabLang, string>;
  /** 0 = Monday … 6 = Sunday. */
  days: number[];
  /** Days ago the habit was created (nothing before that is counted). */
  createdDaysAgo: number;
  /** Paused since N days ago (open pause), or undefined. */
  pausedDaysAgo?: number;
  streak: number;
  best: number;
}

const ALL = [0, 1, 2, 3, 4, 5, 6];

export const LAB_HABITS: LabHabit[] = [
  {
    id: 'walk',
    icon: 'walk-outline',
    color: 'green',
    name: MOCK_HABITS[0]!.name,
    days: ALL,
    createdDaysAgo: 120,
    streak: 12,
    best: 31,
  },
  {
    id: 'water',
    icon: 'water-outline',
    color: 'blue',
    name: MOCK_HABITS[1]!.name,
    days: ALL,
    createdDaysAgo: 120,
    streak: 24,
    best: 24,
  },
  {
    id: 'read',
    icon: 'book-outline',
    color: 'purple',
    name: MOCK_HABITS[2]!.name,
    days: [0, 2, 4],
    createdDaysAgo: 90,
    streak: 6,
    best: 14,
  },
  {
    id: 'meditate',
    icon: 'leaf-outline',
    color: 'teal',
    name: MOCK_HABITS[3]!.name,
    days: ALL,
    createdDaysAgo: 75,
    streak: 3,
    best: 19,
  },
  {
    id: 'sleep',
    icon: 'moon-outline',
    color: 'orange',
    name: MOCK_HABITS[4]!.name,
    days: [0, 1, 2, 3, 4],
    createdDaysAgo: 75,
    streak: 4,
    best: 11,
  },
  {
    id: 'workout',
    icon: 'barbell-outline',
    color: 'pink',
    name: { en: 'Workout', de: 'Training' },
    days: [1, 3, 5],
    createdDaysAgo: 100,
    streak: 2,
    best: 9,
  },
  {
    id: 'coldShower',
    icon: 'snow-outline',
    color: 'blue',
    name: { en: 'Cold shower', de: 'Kalt duschen' },
    days: ALL,
    createdDaysAgo: 60,
    pausedDaysAgo: 5,
    streak: 0,
    best: 16,
  },
];

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function dateKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function mondayOf(d: Date): Date {
  return addDays(startOfDay(d), -weekdayIndex(d));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000
  );
}

/** Deterministic 0..1 per (habit, date). */
function roll(id: string, key: string): number {
  let h = 2166136261;
  const s = `${id}|${key}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function isScheduled(habit: LabHabit, d: Date): boolean {
  return habit.days.includes(weekdayIndex(d));
}

/** An open pause covers every day from its start up to and including today. */
export function isPaused(habit: LabHabit, d: Date, today: Date): boolean {
  if (habit.pausedDaysAgo === undefined) return false;
  const ago = daysBetween(d, today);
  return ago >= 0 && ago <= habit.pausedDaysAgo;
}

/**
 * Was the habit checked on this past day? Deterministic mock history; today comes
 * from the shared today state. Workout gets a guaranteed miss + later bonus in each
 * past week, so the make-up link always has an example.
 */
function checkedOn(
  habit: LabHabit,
  d: Date,
  today: Date,
  todayDone: boolean
): boolean {
  const ago = daysBetween(d, today);
  if (ago < 0 || ago > habit.createdDaysAgo) return false;
  if (ago === 0) return todayDone;
  if (isPaused(habit, d, today)) return false;
  const key = dateKey(d);
  const r = roll(habit.id, key);
  if (habit.id === 'workout') {
    const wd = weekdayIndex(d);
    if (wd === 1) return false; // Tuesday missed …
    if (wd === 2) return true; // … Wednesday bonus makes it up (same week)
  }
  // Petr's case (kolo 16), shown on "Read" (Mon · Wed · Fri) in the last two weeks:
  // Monday AND Wednesday missed, Thursday done as an extra day. Pairing is oldest
  // first, so Thursday rescues MONDAY — the link must not look like it touches
  // Wednesday. A Saturday check (today, if it is Saturday) then rescues Wednesday:
  // two overlapping pairs.
  if (habit.id === 'read' && ago <= 13) {
    const wd = weekdayIndex(d);
    if (wd === 0 || wd === 2) return false;
    if (wd === 3) return true;
    if (wd === 5) return true;
  }
  return isScheduled(habit, d) ? r < 0.84 : r < 0.1;
}

/** Statuses for a range of days, with the week-based make-up pairing applied. */
export function statusesFor(
  habit: LabHabit,
  from: Date,
  to: Date,
  today: Date,
  todayDone: boolean
): Map<string, DayStatus> {
  const out = new Map<string, DayStatus>();
  // Pair inside whole weeks, so a range that starts mid-week still pairs correctly.
  const start = mondayOf(from);
  const end = addDays(mondayOf(to), 6);
  for (let week = start; week <= end; week = addDays(week, 7)) {
    const missed: Date[] = [];
    const bonuses: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(week, i);
      const key = dateKey(d);
      const ago = daysBetween(d, today);
      if (ago < 0) {
        out.set(key, {
          kind:
            isScheduled(habit, d) && !isPaused(habit, d, today)
              ? 'planned'
              : 'none',
        });
        continue;
      }
      if (ago > habit.createdDaysAgo) {
        out.set(key, { kind: 'none' });
        continue;
      }
      if (isPaused(habit, d, today)) {
        out.set(key, { kind: 'paused' });
        continue;
      }
      const scheduled = isScheduled(habit, d);
      const checked = checkedOn(habit, d, today, todayDone);
      if (checked) {
        out.set(key, { kind: scheduled ? 'done' : 'bonus' });
        if (!scheduled) bonuses.push(d);
      } else if (scheduled) {
        // Only past days count as missed — today still runs.
        if (ago > 0) {
          out.set(key, { kind: 'missed' });
          missed.push(d);
        } else {
          out.set(key, { kind: 'todayOpen' });
        }
      } else {
        out.set(key, { kind: 'none' });
      }
    }
    const pairs = Math.min(missed.length, bonuses.length);
    for (let i = 0; i < pairs; i++) {
      const m = dateKey(missed[i]!);
      const b = dateKey(bonuses[i]!);
      out.set(b, { kind: 'makeup', pairKey: m });
      out.set(m, { kind: 'covered', pairKey: b });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Today's checks, shared by Home and Habits
// ---------------------------------------------------------------------------

interface LabToday {
  done: Record<string, boolean>;
  toggle: (id: string) => void;
}

const LabTodayContext = createContext<LabToday | null>(null);

export function LabTodayProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<Record<string, boolean>>(() => ({
    ...Object.fromEntries(MOCK_HABITS.map(h => [h.id, h.done])),
    workout: false,
    coldShower: false,
  }));
  const toggle = useCallback((id: string) => {
    setDone(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);
  const value = useMemo(() => ({ done, toggle }), [done, toggle]);
  return (
    <LabTodayContext.Provider value={value}>
      {children}
    </LabTodayContext.Provider>
  );
}

export function useLabToday(): LabToday {
  const ctx = useContext(LabTodayContext);
  if (!ctx) throw new Error('useLabToday must be used inside LabTodayProvider');
  return ctx;
}
