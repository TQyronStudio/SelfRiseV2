/**
 * The rules of the Journal history calendar (migration E13, from the Design Lab's
 * JournalHistoryConcept) — pure, tested in __tests__/journalHistoryLogic.test.ts.
 *
 * A day's state is told by SHAPE (it reads in both themes and without colour):
 *   complete  — the daily goal reached (3+ entries); 4+ also wears a ★
 *   paid      — a frozen day saved with an ad (warmUpPayments), under the goal
 *   partial   — started (1–2 entries)
 *   none      — nothing written
 *   future    — after today
 * Complete and paid days carry the streak: a ribbon joins them in a week row.
 */
import { DateString } from '@/src/types/common';
import { Gratitude, WarmUpPayment } from '@/src/types/gratitude';
import { JOURNAL_DAILY_GOAL } from '@/src/utils/journalXp';

export type JournalDayState = 'complete' | 'paid' | 'partial' | 'none' | 'future';

export function journalDayState(
  date: DateString,
  today: DateString,
  count: number,
  paid: boolean
): JournalDayState {
  if (date > today) return 'future';
  if (count >= JOURNAL_DAILY_GOAL) return 'complete';
  if (paid) return 'paid';
  if (count > 0) return 'partial';
  return 'none';
}

/** Does this day keep the streak (the ribbon joins such days)? */
export function carriesStreak(state: JournalDayState | null | undefined): boolean {
  return state === 'complete' || state === 'paid';
}

/** Entries per day. */
export function countsByDay(entries: Gratitude[]): Map<DateString, number> {
  const counts = new Map<DateString, number>();
  for (const e of entries) counts.set(e.date, (counts.get(e.date) ?? 0) + 1);
  return counts;
}

/** Days saved with an ad. */
export function paidDays(payments: WarmUpPayment[] | undefined): Set<DateString> {
  return new Set((payments ?? []).filter(p => p.isComplete).map(p => p.missedDate));
}

/**
 * A month as week rows, Monday first; null = a cell outside the month.
 * `month` is 0-based.
 */
export function monthRows(year: number, month: number): (DateString | null)[][] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells: (DateString | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from(
      { length: days },
      (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}` as DateString
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
}

/** Months between two dates (b − a), by calendar month. */
export function monthDiff(a: DateString, b: DateString): number {
  const [ay, am] = a.split('-').map(Number) as [number, number];
  const [by, bm] = b.split('-').map(Number) as [number, number];
  return (by - ay) * 12 + (bm - am);
}

/** Entries whose text contains the term (case-insensitive), newest day first. */
export function searchEntries(entries: Gratitude[], term: string): Gratitude[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  return entries
    .filter(e => e.content.toLowerCase().includes(needle))
    .sort((a, b) =>
      a.date === b.date
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : a.date < b.date
          ? 1
          : -1
    );
}

/** An entry's 1-based place in its day (by time written). */
export function positionInDay(entry: Gratitude, all: Gratitude[]): number {
  const day = all
    .filter(e => e.date === entry.date)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return day.findIndex(e => e.id === entry.id) + 1;
}
