/**
 * The rules of the Goals page (migration E14, from the Design Lab's
 * GoalsConcept / goalParts) — pure, tested in __tests__/goalsPageLogic.test.ts.
 * The pace itself is goalCalculations.paceOf (one rule for card, overview and
 * detail); this file only reads it.
 */
import { DateString } from '@/src/types/common';
import { AddGoalProgressInput, Goal, GoalStatus } from '@/src/types/goal';
import { MAX_GOAL_VALUE } from '@/src/constants/goals';
import { daysBetween, parseDate } from '@/src/utils/date';
import { goalDate, paceOf } from '@/src/utils/goalCalculations';

/** The milestone notches on a goal's track (their XP is the storage's). */
export const GOAL_MILESTONES = [25, 50, 75] as const;

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/** A goal's number to read: one decimal below 100, none from 100 on. */
export function formatGoalNumber(value: number, locale: string): string {
  return value.toLocaleString(locale, {
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1,
  });
}

/** "4500000.5" → "4,500,000.5" in the locale, while typing on the pad. */
export function groupTyped(text: string, locale: string): string {
  if (!text) return text;
  const [int = '', dec] = text.split('.');
  const grouped = Number(int || '0').toLocaleString(locale, {
    maximumFractionDigits: 0,
  });
  const sep = (1.5).toLocaleString(locale).charAt(1);
  return dec !== undefined ? `${grouped}${sep}${dec}` : grouped;
}

/** One key of the number pad applied to the typed text (max 13 digits). */
export function typeKey(prev: string, key: string): string {
  if (key === 'back') return prev.slice(0, -1);
  if (key === '.') return prev.includes('.') ? prev : (prev || '0') + '.';
  if (prev.replace('.', '').length >= 13) return prev;
  return prev === '0' ? key : prev + key;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export type LogMode = 'add' | 'subtract' | 'set';

/** The goal's value after a log — what the sheet previews (never below 0). */
export function valueAfter(current: number, mode: LogMode, amount: number): number {
  if (mode === 'add') return current + amount;
  if (mode === 'subtract') return Math.max(0, current - amount);
  return amount;
}

export type LogAmountError = 'valueRequired' | 'valueTooLarge';

/** The same rule as the old progress form: more than 0, at most MAX_GOAL_VALUE. */
export function logAmountError(amount: number): LogAmountError | null {
  if (!(amount > 0)) return 'valueRequired';
  if (amount > MAX_GOAL_VALUE) return 'valueTooLarge';
  return null;
}

/** The storage's input for a log — the mode maps 1:1 to its progress type. */
export function logInput(
  goalId: string,
  mode: LogMode,
  amount: number,
  note: string,
  date: DateString
): AddGoalProgressInput {
  return { goalId, value: amount, note: note.trim(), date, progressType: mode };
}

/** "+1 book", "−50 $", "40 kg" — the amount as the undo note names it. */
export function loggedAmount(
  mode: LogMode,
  amount: number,
  unit: string,
  locale: string
): string {
  const sign = mode === 'add' ? '+' : mode === 'subtract' ? '−' : '';
  const number = formatGoalNumber(amount, locale);
  // The unit is the user's own word ("books"): it cannot be made singular, so
  // a 1 goes without it rather than as "+1 books".
  return unit.trim() && amount !== 1 ? `${sign}${number} ${unit.trim()}` : `${sign}${number}`;
}

// ---------------------------------------------------------------------------
// Overview and the deadline line
// ---------------------------------------------------------------------------

export interface GoalsOverview {
  active: number;
  /** Ahead of or on the plan line. */
  onPace: number;
  /** Goals with a deadline that pace can be read against (overdue included). */
  withDeadline: number;
  completed: number;
}

export function overviewOf(goals: Goal[], today: DateString): GoalsOverview {
  const active = goals.filter(g => g.status === GoalStatus.ACTIVE);
  const states = active.map(g => paceOf(g, today).state);
  return {
    active: active.length,
    onPace: states.filter(s => s === 'ahead' || s === 'onPace').length,
    withDeadline: states.filter(s => s !== 'none' && s !== 'done').length,
    completed: goals.filter(g => g.status === GoalStatus.COMPLETED).length,
  };
}

/** Dots closer than this (px) go to another lane. */
const LANE_GAP = 30;
/** Goals due the same day overlap by this step (px) in one stack. */
export const STACK_STEP = 14;
/** The line keeps this much room at each end for the dots. */
export const LINE_PAD = 14;
/** The line always shows at least a month. */
const MIN_SPAN_DAYS = 30;
/** Month ticks under the line, at most. */
export const MAX_MONTH_TICKS = 6;

export interface DeadlineDot {
  goal: Goal;
  date: DateString;
  x: number;
  lane: number;
}

export interface DeadlineLayout {
  dots: DeadlineDot[];
  lanes: number;
  /** First days of the months between today and the last deadline. */
  months: { date: DateString; x: number }[];
  /** The nearest deadline (today or later) and the days to it. */
  next: { goal: Goal; days: number } | null;
}

/**
 * Today on the left, the farthest deadline on the right; each active goal with
 * a deadline is a dot at its date. A passed deadline sits at today. Dots that
 * would touch go to a further lane.
 */
export function deadlineLayout(
  goals: Goal[],
  today: DateString,
  width: number
): DeadlineLayout {
  const dated = goals
    .filter(g => g.status === GoalStatus.ACTIVE)
    .map(goal => ({ goal, date: goalDate(goal.targetDate) }))
    .filter((d): d is { goal: Goal; date: DateString } => d.date !== null)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (dated.length === 0) return { dots: [], lanes: 0, months: [], next: null };

  const last = dated[dated.length - 1]!.date;
  const span = Math.max(MIN_SPAN_DAYS, daysBetween(today, last));
  const usable = Math.max(1, width - 2 * LINE_PAD);
  const xOf = (date: DateString) =>
    (Math.max(0, daysBetween(today, date)) / span) * usable + LINE_PAD;

  // Goals due the same day are one stack (overlapping, like avatars) — four
  // goals ending on 24 March are one place on the line, not four rows.
  const groups: { date: DateString; goals: Goal[] }[] = [];
  for (const { goal, date } of dated) {
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.goals.push(goal);
    else groups.push({ date, goals: [goal] });
  }
  const laneEnds: number[] = [];
  const dots: DeadlineDot[] = [];
  for (const group of groups) {
    const n = group.goals.length;
    // The stack ends at its date; it never starts before the line does.
    const x = Math.max(xOf(group.date), LINE_PAD + (n - 1) * STACK_STEP);
    const left = x - (n - 1) * STACK_STEP;
    let lane = laneEnds.findIndex(end => left - end > LANE_GAP);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(x);
    } else {
      laneEnds[lane] = x;
    }
    group.goals.forEach((goal, i) =>
      dots.push({ goal, date: group.date, x: left + i * STACK_STEP, lane })
    );
  }

  // Month ticks: at most MAX_MONTH_TICKS, evenly stepped for far deadlines.
  const start = parseDate(today);
  const end = parseDate(last);
  const monthsAhead =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const step = Math.max(1, Math.ceil(monthsAhead / MAX_MONTH_TICKS));
  const months: { date: DateString; x: number }[] = [];
  for (let i = step; i <= monthsAhead; i += step) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` as DateString;
    months.push({ date, x: xOf(date) });
  }

  const upcoming = dated.find(d => d.date >= today);
  return {
    dots,
    lanes: laneEnds.length,
    months,
    next: upcoming
      ? { goal: upcoming.goal, days: daysBetween(today, upcoming.date) }
      : null,
  };
}
