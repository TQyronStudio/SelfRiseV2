/**
 * The pure rules of the Habits list in the new look (migration E5, from the
 * Design Lab's HabitsConcept / habitsMock). Tested in
 * __tests__/habitListLogic.test.ts.
 *
 * The app's own logic decides everything that matters — this file only reads it:
 * - make-up pairing comes from useHabitsData().getHabitCompletionsWithConversion()
 *   (Smart Bonus Conversion: `isConverted` + `convertedFromDate`, `isCovered`);
 * - "scheduled that day" is wasScheduledOnDate() (schedule history, pauses);
 * - "paused that day" is isHabitPausedOnDate().
 *
 * A day's STATUS is told by SHAPE (R-11, P18–23), the habit's colour is only its
 * identity: ● done or the extra day that rescued one · ○ the rescued day ·
 * ★ bonus · × missed · ━ paused · thin ring = planned / today still open.
 */
import { DateString } from '@/src/types/common';
import { Habit, HabitCompletion } from '@/src/types/habit';
import {
  daysBetween,
  formatDateToString,
  getDayOfWeekFromDateString,
  getWeekDates,
  parseDate,
} from '@/src/utils/date';
import {
  isHabitPausedOnDate,
  wasScheduledOnDate,
} from '@/src/utils/habitImmutability';

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
  /** makeup → the missed day it covers; covered → the make-up day that covered it. */
  pairKey?: DateString;
}

/** Monday … Sunday of the week `day` lies in. */
export function weekOf(day: DateString): DateString[] {
  return getWeekDates(day);
}

/**
 * The habit's schedule in words: "Every day", or its days in week order
 * ("Mon · Wed · Fri"), in the app's language. One copy for the Habits list, the
 * habit detail and Home's today section.
 */
export function scheduleLabel(
  habit: Habit,
  today: DateString,
  locale: string,
  everyDay: string
): string {
  if (habit.scheduledDays.length === 7) return everyDay;
  return weekOf(today)
    .filter(day =>
      habit.scheduledDays.includes(getDayOfWeekFromDateString(day))
    )
    .map(day => parseDate(day).toLocaleDateString(locale, { weekday: 'short' }))
    .join(' · ');
}

function creationDay(habit: Habit): DateString {
  const created =
    habit.createdAt instanceof Date
      ? habit.createdAt
      : new Date(habit.createdAt);
  return formatDateToString(created);
}

/**
 * The status of each day for one habit. `converted` is the habit's completions
 * after Smart Bonus Conversion (the app's pairing). Days before the habit existed
 * and future days without a plan are 'none'.
 */
export function dayStatuses(
  habit: Habit,
  converted: HabitCompletion[],
  days: DateString[],
  today: DateString
): Map<DateString, DayStatus> {
  const byDate = new Map<DateString, HabitCompletion>();
  for (const completion of converted) {
    if (completion.habitId === habit.id)
      byDate.set(completion.date, completion);
  }
  const born = creationDay(habit);
  const out = new Map<DateString, DayStatus>();

  for (const day of days) {
    const scheduled = wasScheduledOnDate(
      habit,
      day,
      getDayOfWeekFromDateString(day)
    );
    if (day > today) {
      out.set(day, { kind: scheduled ? 'planned' : 'none' });
      continue;
    }
    if (day < born) {
      out.set(day, { kind: 'none' });
      continue;
    }
    const record = byDate.get(day);
    if (record?.isConverted && record.completed) {
      out.set(day, {
        kind: 'makeup',
        ...(record.convertedFromDate
          ? { pairKey: record.convertedFromDate }
          : {}),
      });
      continue;
    }
    if (record?.isCovered) {
      // The covered day carries no link back: find the make-up that covers it.
      const rescuer = converted.find(
        c =>
          c.habitId === habit.id && c.isConverted && c.convertedFromDate === day
      );
      out.set(day, {
        kind: 'covered',
        ...(rescuer ? { pairKey: rescuer.date } : {}),
      });
      continue;
    }
    if (record?.completed) {
      out.set(day, { kind: record.isBonus ? 'bonus' : 'done' });
      continue;
    }
    if (isHabitPausedOnDate(habit, day)) {
      out.set(day, { kind: 'paused' });
      continue;
    }
    if (scheduled) {
      // Only past days count as missed — today still runs.
      out.set(day, { kind: day < today ? 'missed' : 'todayOpen' });
      continue;
    }
    out.set(day, { kind: 'none' });
  }
  return out;
}

/** A day that was on the plan (kept, rescued, missed, open or still to come). */
const PLANNED_KINDS: ReadonlySet<DayKind> = new Set([
  'done',
  'covered',
  'missed',
  'todayOpen',
  'planned',
]);
const KEPT_KINDS: ReadonlySet<DayKind> = new Set(['done', 'covered']);

/**
 * The week strip: for each day, how much of that day's plan was kept (0…1) over
 * all habits — a rescued day counts as kept, a bonus is not on the plan.
 */
export function weekFractions(
  perHabit: Map<DateString, DayStatus>[],
  days: DateString[]
): number[] {
  return days.map(day => {
    let planned = 0;
    let kept = 0;
    for (const statuses of perHabit) {
      const kind = statuses.get(day)?.kind;
      if (kind && PLANNED_KINDS.has(kind)) planned++;
      if (kind && KEPT_KINDS.has(kind)) kept++;
    }
    return planned === 0 ? 0 : kept / planned;
  });
}

export interface MakeupLink {
  /** Index of the earlier day in the week (0 = Monday). */
  from: number;
  to: number;
  /** Row of brackets under the dots: overlapping pairs get their own (P22). */
  lane: number;
}

/**
 * Make-up pairs inside the week as brackets UNDER the dots (kolo 16): a line
 * through the dots would seem to include the days between. Overlapping pairs
 * get their own lane.
 */
export function makeupLinks(
  week: Map<DateString, DayStatus>,
  days: DateString[]
): MakeupLink[] {
  const links: MakeupLink[] = [];
  days.forEach((day, i) => {
    const status = week.get(day);
    if (status?.kind === 'makeup' && status.pairKey) {
      const j = days.indexOf(status.pairKey);
      if (j >= 0)
        links.push({ from: Math.min(i, j), to: Math.max(i, j), lane: 0 });
    }
  });
  links.sort((a, b) => a.from - b.from);
  const laneEnds: number[] = [];
  for (const link of links) {
    let lane = laneEnds.findIndex(end => end < link.from);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(link.to);
    } else {
      laneEnds[lane] = link.to;
    }
    link.lane = lane;
  }
  return links;
}

export type DotShape = 'dot' | 'ring' | 'star' | 'cross' | 'bar' | 'tiny';
/** Which colour a dot takes: the habit's own, or a neutral role of the palette. */
export type DotTone = 'habit' | 'missed' | 'faint' | 'muted' | 'track';

/** Every status has its own SHAPE, so any habit colour works (kolo 19). */
export function dotLook(kind: DayKind): { shape: DotShape; tone: DotTone } {
  switch (kind) {
    case 'done':
    case 'makeup':
      return { shape: 'dot', tone: 'habit' };
    case 'covered':
      return { shape: 'ring', tone: 'habit' };
    case 'bonus':
      return { shape: 'star', tone: 'habit' };
    case 'missed':
      return { shape: 'cross', tone: 'missed' };
    case 'paused':
      return { shape: 'bar', tone: 'faint' };
    case 'todayOpen':
      return { shape: 'ring', tone: 'muted' };
    case 'planned':
      return { shape: 'ring', tone: 'track' };
    default:
      return { shape: 'tiny', tone: 'track' };
  }
}

/**
 * Days a paused habit has been paused (its open pause period). A pause made
 * after today's check starts tomorrow: that is 0, never negative ("Paused today").
 */
export function pausedDays(habit: Habit, today: DateString): number {
  const open = (habit.pausePeriods ?? []).find(p => !p.endDate);
  if (!open) return 0;
  return Math.max(0, daysBetween(open.startDate, today));
}

/**
 * The three sections: on today's plan, bonus (active but not planned today) and
 * paused — in the user's order. `isActive` decides paused NOW, the plan comes
 * from the habit's schedule history.
 */
export function splitHabits(
  habits: Habit[],
  today: DateString
): { planned: Habit[]; bonus: Habit[]; paused: Habit[] } {
  const ordered = [...habits].sort((a, b) => a.order - b.order);
  const dayOfWeek = getDayOfWeekFromDateString(today);
  const planned: Habit[] = [];
  const bonus: Habit[] = [];
  const paused: Habit[] = [];
  for (const habit of ordered) {
    if (!habit.isActive) paused.push(habit);
    else if (wasScheduledOnDate(habit, today, dayOfWeek)) planned.push(habit);
    else bonus.push(habit);
  }
  return { planned, bonus, paused };
}

/** Is the habit checked off today? */
export function doneToday(
  habitId: string,
  completions: HabitCompletion[],
  today: DateString
): boolean {
  return completions.some(
    c => c.habitId === habitId && c.date === today && c.completed
  );
}

/**
 * Props of a habit card are equal when every value is the same — the week, the
 * days and the letters compared by content (they are rebuilt on every change of
 * the list), everything else by identity (callbacks must be stable). Checking one
 * habit therefore re-renders only its own card (P42, P47).
 */
export function sameCardProps<P extends object>(prev: P, next: P): boolean {
  const keys = Object.keys(next) as (keyof P)[];
  if (keys.length !== Object.keys(prev).length) return false;
  return keys.every(key => {
    const a = prev[key] as unknown;
    const b = next[key] as unknown;
    if (key === 'week') return sameWeek(a as DayStatus[], b as DayStatus[]);
    if (Array.isArray(a) && Array.isArray(b))
      return a.join('|') === b.join('|');
    return a === b;
  });
}

function sameWeek(a: DayStatus[], b: DayStatus[]): boolean {
  return (
    a.length === b.length &&
    a.every((s, i) => s.kind === b[i]?.kind && s.pairKey === b[i]?.pairKey)
  );
}

// ---------------------------------------------------------------------------
// Habit detail (migration E6)
// ---------------------------------------------------------------------------

/**
 * A habit's streak counted in PLANNED days (E6, decided 2026-11-24): a planned
 * day kept — done, or rescued by a make-up — adds one; a missed planned day ends
 * it; days off the plan, paused days and today while it still runs leave it as
 * it is. The app's calendar-day streak (useHabitsData) would show at most 1 for a
 * Mon/Wed/Fri habit and 0 every morning.
 *
 * `statuses` = dayStatuses() of the days from the habit's creation to today,
 * oldest first.
 */
export function planStreaks(
  days: DateString[],
  statuses: Map<DateString, DayStatus>
): { current: number; best: number } {
  let run = 0;
  let best = 0;
  for (const day of days) {
    const kind = statuses.get(day)?.kind;
    if (kind === 'done' || kind === 'covered') {
      run++;
      if (run > best) best = run;
    } else if (kind === 'missed') {
      run = 0;
    }
  }
  return { current: run, best };
}

/**
 * Share of planned days kept over the last `span` days (today excluded while it
 * runs): kept = done or rescued; planned = kept + missed. null when nothing was
 * planned — the detail shows a dash, never a made-up 100 %.
 */
export function keptRate(
  days: DateString[],
  statuses: Map<DateString, DayStatus>
): number | null {
  let kept = 0;
  let planned = 0;
  for (const day of days) {
    const kind = statuses.get(day)?.kind;
    if (kind === 'done' || kind === 'covered') {
      kept++;
      planned++;
    } else if (kind === 'missed') {
      planned++;
    }
  }
  return planned === 0 ? null : Math.round((kept / planned) * 100);
}

/** The month grid: the month's days and how many empty cells precede day 1 (weeks start Monday). */
export function monthLayout(year: number, month: number): {
  days: DateString[];
  lead: number;
} {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const days: DateString[] = [];
  for (let d = 1; d <= count; d++) {
    days.push(formatDateToString(new Date(year, month, d)));
  }
  return { days, lead: (first.getDay() + 6) % 7 };
}
