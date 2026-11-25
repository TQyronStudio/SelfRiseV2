import { Gratitude } from '@/src/types/gratitude';
import {
  carriesStreak,
  journalDayState,
  monthDiff,
  monthRows,
  paidDays,
  positionInDay,
  searchEntries,
} from '../journalHistoryLogic';

const entry = (id: string, date: string, content: string, at: number): Gratitude =>
  ({
    id,
    date,
    content,
    type: 'gratitude',
    createdAt: new Date(at),
    updatedAt: new Date(at),
  }) as unknown as Gratitude;

describe('journalDayState', () => {
  const T = '2026-11-25';
  it('tells the shapes apart', () => {
    expect(journalDayState('2026-11-26', T, 0, false)).toBe('future');
    expect(journalDayState(T, T, 3, false)).toBe('complete');
    expect(journalDayState(T, T, 1, true)).toBe('paid');
    expect(journalDayState(T, T, 2, false)).toBe('partial');
    expect(journalDayState(T, T, 0, false)).toBe('none');
  });
  it('a complete day stays complete even if it was also paid', () => {
    expect(journalDayState(T, T, 4, true)).toBe('complete');
  });
  it('complete and paid days carry the streak', () => {
    expect(carriesStreak('complete')).toBe(true);
    expect(carriesStreak('paid')).toBe(true);
    expect(carriesStreak('partial')).toBe(false);
    expect(carriesStreak(null)).toBe(false);
  });
});

describe('paidDays', () => {
  it('only complete payments', () => {
    const set = paidDays([
      { missedDate: '2026-11-20', isComplete: true },
      { missedDate: '2026-11-21', isComplete: false },
    ] as never);
    expect([...set]).toEqual(['2026-11-20']);
  });
});

describe('monthRows', () => {
  it('Monday first, padded to whole weeks', () => {
    // November 2026 starts on a Sunday.
    const rows = monthRows(2026, 10);
    expect(rows[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(rows.every(r => r.length === 7)).toBe(true);
    expect(rows.flat().filter(Boolean)).toHaveLength(30);
  });
});

describe('monthDiff', () => {
  it('counts calendar months across a year', () => {
    expect(monthDiff('2026-11-25', '2026-11-01')).toBe(0);
    expect(monthDiff('2026-11-25', '2027-01-10')).toBe(2);
    expect(monthDiff('2026-11-25', '2026-08-31')).toBe(-3);
  });
});

describe('search', () => {
  const all = [
    entry('a', '2026-11-20', 'Coffee with Anna', 1),
    entry('b', '2026-11-25', 'A long walk', 3),
    entry('c', '2026-11-25', 'Morning coffee', 2),
  ];
  it('case-insensitive, newest day first, then by time', () => {
    expect(searchEntries(all, ' COFFEE ').map(e => e.id)).toEqual(['c', 'a']);
    expect(searchEntries(all, '   ')).toEqual([]);
  });
  it('an entry keeps its place in its day', () => {
    expect(positionInDay(all[1]!, all)).toBe(2);
    expect(positionInDay(all[2]!, all)).toBe(1);
  });
});
