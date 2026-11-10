/**
 * Goals scenery for the Design Lab (kolo 22) — mock goals with their history, the
 * goal rules in miniature, and one shared state for the Goals tab.
 *
 * Rules follow technical-guides:Goals.md so the screens behave like the app:
 * a log earns XP_REWARDS.GOALS.PROGRESS_ENTRY at most 3× per goal per day (later
 * logs save silently with 0 XP); 25 / 50 / 75 % pay their milestone XP once ever
 * (anti re-earn); reaching 100 % first time pays the completion bonus (350 for a
 * target ≥ 10 000); progress may go past 100 %.
 *
 * NEW in the lab (proposals, plan R-16 / R-17):
 * - Two kinds of goal. COUNT adds up as you go (books, money, hours). MEASURE logs
 *   a reading from a start value towards a target in either direction (weight
 *   84.6 → 78 kg) — today the user has to do the subtraction themselves.
 * - PACE: with a deadline, the straight line from start to deadline says where
 *   the goal should be today; the app compares, in days ahead / behind.
 *
 * GOING LIVE: do NOT port. This is stage scenery; the app's logic lives in
 * SQLiteGoalStorage / useGoalsData (and is tested).
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { XP_REWARDS } from '@/src/constants/gamification';
import { addDays, dateKey, startOfDay } from './habitsMock';
import { LabHabitColor } from './labTokens';
import { LabLang } from './mockCopy';

export type GoalKind = 'count' | 'measure';
export type GoalCategoryKey =
  'health' | 'financial' | 'learning' | 'career' | 'personal' | 'other';

export const CATEGORY_LOOK: Record<
  GoalCategoryKey,
  { color: LabHabitColor; icon: string }
> = {
  health: { color: 'pink', icon: 'heart' },
  financial: { color: 'teal', icon: 'wallet' },
  learning: { color: 'blue', icon: 'school' },
  career: { color: 'purple', icon: 'briefcase' },
  personal: { color: 'orange', icon: 'person' },
  other: { color: 'green', icon: 'sparkles' },
};

export interface GoalEntry {
  id: string;
  date: string;
  /** COUNT: the amount added (negative = taken off). MEASURE: the reading. */
  value: number;
  note?: string;
  /** XP this log earned (0 once the day's 3 XP logs are used). */
  xp: number;
}

export interface LabGoal {
  id: string;
  title: Record<LabLang, string>;
  category: GoalCategoryKey;
  icon: string;
  unit: Record<LabLang, string>;
  kind: GoalKind;
  /** COUNT: usually 0. MEASURE: the first reading. */
  start: number;
  target: number;
  startDate: Date;
  targetDate: Date | null;
  entries: GoalEntry[];
  /** One-tap amounts for a COUNT goal. */
  quick: number[];
  /** Milestones (25/50/75) already paid — never paid twice. */
  paid: number[];
  completedOn: Date | null;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export { MAX_GOAL_VALUE } from '@/src/constants/goals';

/** A reading's ± step that fits the goal: kg by 0.1, a mortgage by 1 000. */
export function stepFor(goal: { start: number; target: number }): number {
  const span = Math.abs(goal.target - goal.start);
  return span >= 100000 ? 1000 : span >= 1000 ? 10 : span >= 100 ? 1 : 0.1;
}

/** "4500000.5" → "4 500 000,5" in the locale, while typing. */
export function groupTyped(text: string, locale: string): string {
  if (!text) return text;
  const [int = '', dec] = text.split('.');
  const grouped = Number(int || '0').toLocaleString(locale, {
    maximumFractionDigits: 0,
  });
  const sep = (1.5).toLocaleString(locale).charAt(1);
  return dec !== undefined ? `${grouped}${sep}${dec}` : grouped;
}

export const XP_PER_LOG = XP_REWARDS.GOALS.PROGRESS_ENTRY;
export const XP_LOGS_PER_DAY = 3;
export const MILESTONES = [25, 50, 75] as const;

export function milestoneXp(m: number): number {
  const g = XP_REWARDS.GOALS;
  return m === 25
    ? g.MILESTONE_25_PERCENT
    : m === 50
      ? g.MILESTONE_50_PERCENT
      : g.MILESTONE_75_PERCENT;
}

export function completionXp(goal: LabGoal): number {
  return goal.target >= 10000
    ? XP_REWARDS.GOALS.BIG_GOAL_COMPLETION
    : XP_REWARDS.GOALS.GOAL_COMPLETION;
}

export function currentValue(goal: LabGoal): number {
  if (goal.kind === 'measure') {
    return goal.entries.length > 0
      ? goal.entries[goal.entries.length - 1]!.value
      : goal.start;
  }
  return Math.max(
    0,
    goal.start + goal.entries.reduce((s, e) => s + e.value, 0)
  );
}

/** 0..1+ — how far from start to target (works downwards for MEASURE). */
export function fractionOf(goal: LabGoal, value = currentValue(goal)): number {
  const span = goal.target - goal.start;
  if (span === 0) return 1;
  return Math.max(0, (value - goal.start) / span);
}

const DAY = 86400000;
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
}

export type PaceState = 'ahead' | 'onPace' | 'behind' | 'none' | 'done';

export interface Pace {
  state: PaceState;
  /** Days ahead (+) or behind (−) the straight line from start to deadline. */
  days: number;
  /** Where the goal should be today (0..1), null without a deadline. */
  expected: number | null;
  daysLeft: number | null;
  /** Units per week still needed to finish on time. */
  neededPerWeek: number | null;
  /** Units per week so far. */
  yourPerWeek: number;
  /** When the goal lands at the current pace. */
  projected: Date | null;
}

export function paceOf(goal: LabGoal, today: Date): Pace {
  const fraction = fractionOf(goal);
  const elapsed = Math.max(1, daysBetween(goal.startDate, today));
  const span = Math.abs(goal.target - goal.start);
  const doneAmount = fraction * span;
  const perDay = doneAmount / elapsed;
  const remaining = Math.max(0, span - doneAmount);
  const projected =
    fraction >= 1
      ? null
      : perDay > 0
        ? addDays(today, Math.ceil(remaining / perDay))
        : null;
  if (goal.completedOn || fraction >= 1) {
    return {
      state: 'done',
      days: 0,
      expected: null,
      daysLeft: null,
      neededPerWeek: null,
      yourPerWeek: perDay * 7,
      projected: null,
    };
  }
  if (!goal.targetDate) {
    return {
      state: 'none',
      days: 0,
      expected: null,
      daysLeft: null,
      neededPerWeek: null,
      yourPerWeek: perDay * 7,
      projected,
    };
  }
  const total = Math.max(1, daysBetween(goal.startDate, goal.targetDate));
  const expected = Math.min(1, Math.max(0, elapsed / total));
  const days = Math.round((fraction - expected) * total);
  const daysLeft = Math.max(0, daysBetween(today, goal.targetDate));
  return {
    state: days > 3 ? 'ahead' : days < -3 ? 'behind' : 'onPace',
    days,
    expected,
    daysLeft,
    neededPerWeek: (remaining / Math.max(1, daysLeft)) * 7,
    yourPerWeek: perDay * 7,
    projected,
  };
}

/** Readable amount: 1 decimal for small numbers, none for big ones. */
export function fmt(value: number, locale: string): string {
  const abs = Math.abs(value);
  return value.toLocaleString(locale, {
    maximumFractionDigits: abs >= 100 ? 0 : abs >= 10 ? 1 : 1,
  });
}

// ---------------------------------------------------------------------------
// Mock goals (dates relative to today, so the lab never goes stale)
// ---------------------------------------------------------------------------

function entriesFrom(
  startDate: Date,
  points: [dayOffset: number, value: number, note?: string][]
): GoalEntry[] {
  return points.map(([d, value, note], i) => ({
    id: `e${i}-${d}`,
    date: dateKey(addDays(startDate, d)),
    value,
    xp: XP_PER_LOG,
    ...(note ? { note } : null),
  }));
}

function mockGoals(today: Date): LabGoal[] {
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearEnd = new Date(today.getFullYear(), 11, 31);
  const booksSpan = daysBetween(yearStart, today);
  const books: [number, number, string?][] = Array.from(
    { length: 10 },
    (_, k) => [Math.round(((k + 1) * booksSpan) / 10.6), 1] as [number, number]
  );
  books[9] = [books[9]![0], 1, 'The Midnight Library'];

  const savingsStart = addDays(today, -147);
  const weightStart = addDays(today, -72);
  const weightPoints: [number, number][] = [
    [4, 84.1],
    [9, 83.8],
    [14, 83.9],
    [19, 83.2],
    [25, 82.9],
    [31, 82.6],
    [37, 82.7],
    [43, 82.0],
    [50, 81.8],
    [57, 81.5],
    [64, 81.3],
    [70, 80.9],
  ];
  const spanishStart = addDays(today, -55);
  const debtStart = addDays(today, -120);
  const courseStart = addDays(today, -110);

  return [
    {
      id: 'books',
      title: { en: 'Read 12 books', de: '12 Bücher lesen' },
      category: 'learning',
      icon: 'book',
      unit: { en: 'books', de: 'Bücher' },
      kind: 'count',
      start: 0,
      target: 12,
      startDate: yearStart,
      targetDate: yearEnd,
      entries: entriesFrom(yearStart, books),
      quick: [1],
      paid: [25, 50, 75],
      completedOn: null,
    },
    {
      id: 'savings',
      title: { en: 'Emergency fund', de: 'Notgroschen' },
      category: 'financial',
      icon: 'wallet',
      unit: { en: '$', de: '€' },
      kind: 'count',
      start: 0,
      target: 5000,
      startDate: savingsStart,
      targetDate: addDays(today, 156),
      entries: entriesFrom(savingsStart, [
        [3, 350],
        [19, 350],
        [33, 350],
        [49, 350],
        [64, 350, 'Bonus'],
        [80, 350],
        [96, 350],
        [112, 350],
        [140, 350],
      ]),
      quick: [50, 100, 250],
      paid: [25, 50],
      completedOn: null,
    },
    {
      id: 'weight',
      title: { en: 'Get to 78 kg', de: 'Auf 78 kg kommen' },
      category: 'health',
      icon: 'fitness',
      unit: { en: 'kg', de: 'kg' },
      kind: 'measure',
      start: 84.6,
      target: 78,
      startDate: weightStart,
      targetDate: addDays(today, 55),
      entries: entriesFrom(weightStart, weightPoints),
      quick: [],
      paid: [25, 50],
      completedOn: null,
    },
    {
      id: 'spanish',
      title: { en: '100 hours of Spanish', de: '100 Stunden Spanisch' },
      category: 'learning',
      icon: 'language',
      unit: { en: 'hours', de: 'Stunden' },
      kind: 'count',
      start: 0,
      target: 100,
      startDate: spanishStart,
      targetDate: addDays(today, 125),
      entries: entriesFrom(spanishStart, [
        [1, 1.5],
        [3, 1],
        [6, 2],
        [10, 1],
        [13, 1.5],
        [17, 2],
        [21, 1],
        [24, 2],
        [28, 1.5],
        [33, 2],
        [37, 1],
        [41, 2.5],
        [46, 1.5],
        [50, 2],
        [53, 2.5],
      ]),
      quick: [0.5, 1, 2],
      paid: [25],
      completedOn: null,
    },
    {
      id: 'debt',
      title: { en: 'Pay off the credit card', de: 'Kreditkarte abbezahlen' },
      category: 'financial',
      icon: 'card',
      unit: { en: '$', de: '€' },
      kind: 'count',
      start: 0,
      target: 2000,
      startDate: debtStart,
      targetDate: null,
      entries: entriesFrom(debtStart, [
        [10, 200],
        [40, 200],
        [70, 100],
        [100, 100],
      ]),
      quick: [50, 100],
      paid: [25],
      completedOn: null,
    },
    {
      id: 'course',
      title: { en: 'Finish the design course', de: 'Designkurs abschließen' },
      category: 'career',
      icon: 'laptop',
      unit: { en: 'lessons', de: 'Lektionen' },
      kind: 'count',
      start: 0,
      target: 30,
      startDate: courseStart,
      targetDate: addDays(today, -20),
      entries: entriesFrom(
        courseStart,
        Array.from({ length: 15 }, (_, k) => [k * 6, 2] as [number, number])
      ),
      quick: [1],
      paid: [25, 50, 75],
      completedOn: addDays(today, -24),
    },
  ];
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface LogResult {
  entryId: string;
  xp: number;
  milestones: number[];
  milestoneXp: number;
  completed: boolean;
}

export type NewGoal = Omit<
  LabGoal,
  'id' | 'entries' | 'paid' | 'completedOn' | 'startDate'
>;

interface LabGoals {
  today: Date;
  goals: LabGoal[];
  /** COUNT: adds `value`. MEASURE: records `value` as today's reading. */
  log: (goalId: string, value: number, note?: string) => LogResult | null;
  /** Removes a log (undo / delete). Returns the XP it earned. */
  removeEntry: (goalId: string, entryId: string) => number;
  create: (goal: NewGoal) => string;
  update: (goalId: string, patch: Partial<NewGoal>) => void;
  remove: (goalId: string) => void;
  logsToday: (goalId: string) => number;
}

const LabGoalsContext = createContext<LabGoals | null>(null);

export function LabGoalsProvider({ children }: { children: ReactNode }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [goals, setGoals] = useState<LabGoal[]>(() => mockGoals(today));
  const todayKey = dateKey(today);

  const logsToday = useCallback(
    (goalId: string) =>
      goals
        .find(g => g.id === goalId)
        ?.entries.filter(e => e.date === todayKey && e.xp > 0).length ?? 0,
    [goals, todayKey]
  );

  const log = useCallback(
    (goalId: string, value: number, note?: string): LogResult | null => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return null;
      const before = fractionOf(goal);
      const positive =
        goal.kind === 'count' ? value > 0 : fractionOf(goal, value) > before;
      const xp =
        positive && logsToday(goalId) < XP_LOGS_PER_DAY ? XP_PER_LOG : 0;
      const entry: GoalEntry = {
        id: `n${Date.now()}`,
        date: todayKey,
        value,
        xp,
        ...(note ? { note } : null),
      };
      const next: LabGoal = { ...goal, entries: [...goal.entries, entry] };
      const after = fractionOf(next);
      const crossed = MILESTONES.filter(
        m => after * 100 >= m && !goal.paid.includes(m)
      );
      const completed = !goal.completedOn && after >= 1;
      next.paid = [...goal.paid, ...crossed];
      if (completed) next.completedOn = today;
      if (goal.completedOn && after < 1) next.completedOn = null;
      setGoals(prev => prev.map(g => (g.id === goalId ? next : g)));
      return {
        entryId: entry.id,
        xp,
        milestones: crossed,
        milestoneXp: crossed.reduce((s, m) => s + milestoneXp(m), 0),
        completed,
      };
    },
    [goals, logsToday, today, todayKey]
  );

  const removeEntry = useCallback(
    (goalId: string, entryId: string) => {
      const goal = goals.find(g => g.id === goalId);
      const entry = goal?.entries.find(e => e.id === entryId);
      if (!goal || !entry) return 0;
      const next: LabGoal = {
        ...goal,
        entries: goal.entries.filter(e => e.id !== entryId),
      };
      // Milestones stay paid (anti re-earn); completion is reversed below 100 %.
      if (next.completedOn && fractionOf(next) < 1) next.completedOn = null;
      setGoals(prev => prev.map(g => (g.id === goalId ? next : g)));
      return entry.xp;
    },
    [goals]
  );

  const create = useCallback(
    (goal: NewGoal) => {
      const id = `g${Date.now()}`;
      setGoals(prev => [
        ...prev,
        {
          ...goal,
          id,
          startDate: today,
          entries: [],
          paid: [],
          completedOn: null,
        },
      ]);
      return id;
    },
    [today]
  );

  const update = useCallback((goalId: string, patch: Partial<NewGoal>) => {
    setGoals(prev => prev.map(g => (g.id === goalId ? { ...g, ...patch } : g)));
  }, []);

  const remove = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);

  const value = useMemo(
    () => ({
      today,
      goals,
      log,
      removeEntry,
      create,
      update,
      remove,
      logsToday,
    }),
    [today, goals, log, removeEntry, create, update, remove, logsToday]
  );
  return (
    <LabGoalsContext.Provider value={value}>
      {children}
    </LabGoalsContext.Provider>
  );
}

export function useLabGoals(): LabGoals {
  const ctx = useContext(LabGoalsContext);
  if (!ctx) throw new Error('useLabGoals must be used inside LabGoalsProvider');
  return ctx;
}
