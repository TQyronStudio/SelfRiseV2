/**
 * Journal scenery for the Design Lab (kolo 20) — mock entries, the journal's rules
 * in miniature, and one shared state for Home and the Journal tab.
 *
 * The rules follow technical-guides:My-Journal.md so the screens behave like the
 * app: 3 entries = a complete day; position N earns the app's XP for position N
 * (XP_REWARDS.JOURNAL); positions 4 / 8 / 13 add ⭐ / 🔥 / 👑; a day is always
 * numbered 1..N (a deletion closes the gap) and a deletion takes back the value of
 * the LAST position, not of the deleted row; a paid warm-up day bridges the streak
 * without counting as +1.
 *
 * History (counted back from yesterday): 9 complete days, one frozen day paid with
 * an ad, 15 complete days → a 24-day streak; a 2-entry day broke the run before, and
 * a 31-day run earlier is the longest.
 *
 * GOING LIVE: do NOT port. This is stage scenery; the app's real logic lives in
 * GratitudeContext / SQLiteGratitudeStorage (and is tested).
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
import { LabLang } from './mockCopy';

export type EntryType = 'gratitude' | 'self-praise';

export interface LabEntry {
  id: string;
  date: string;
  type: EntryType;
  text: Record<LabLang, string>;
  /** "07:42" — when it was written. */
  time: string;
}

/** Entries per day, index 0 = yesterday. */
const HISTORY: number[] = [
  // 0–8: the current run (9 days)
  3, 4, 3, 5, 3, 3, 8, 3, 4,
  // 9: frozen, then paid with an ad (bridge)
  1,
  // 10–24: the run before the freeze (15 days)
  3, 3, 3, 3, 3, 13, 3, 3, 5, 3, 3, 3, 3, 3, 3,
  // 25: 2 entries — this broke the run before
  2,
  // 26–56: the longest run (31 days)
  3, 3, 3, 4, 3, 3, 3, 3, 8, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 8, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3,
  // 57–74: the first weeks of the journal
  0, 1, 0, 0, 3, 2, 3, 3, 0, 3, 1, 3, 0, 0, 3, 3, 2, 3,
];
const PAID_BACK = [9];

const GRATITUDE: Record<LabLang, string>[] = [
  {
    en: 'A slow coffee before work, in silence.',
    de: 'Ein ruhiger Kaffee vor der Arbeit, ganz in Stille.',
  },
  {
    en: 'Mum called just to ask how I am.',
    de: 'Mama hat angerufen, nur um zu fragen, wie es mir geht.',
  },
  {
    en: 'The sun came out on my walk home.',
    de: 'Auf dem Heimweg kam die Sonne heraus.',
  },
  {
    en: 'A colleague covered for me without being asked.',
    de: 'Eine Kollegin ist ungefragt für mich eingesprungen.',
  },
  {
    en: 'Fresh bread from the bakery on the corner.',
    de: 'Frisches Brot vom Bäcker an der Ecke.',
  },
  {
    en: 'Laughing with Tom until we cried.',
    de: 'Mit Tom gelacht, bis uns die Tränen kamen.',
  },
  { en: 'Eight hours of sleep, finally.', de: 'Endlich acht Stunden Schlaf.' },
  {
    en: 'A quiet evening with a good book.',
    de: 'Ein ruhiger Abend mit einem guten Buch.',
  },
  {
    en: 'My legs still work after the long run.',
    de: 'Meine Beine tragen mich noch nach dem langen Lauf.',
  },
  {
    en: 'The neighbour’s dog waiting for me at the gate.',
    de: 'Der Hund der Nachbarn, der am Tor auf mich wartet.',
  },
  {
    en: 'Dinner with the whole family at one table.',
    de: 'Abendessen mit der ganzen Familie an einem Tisch.',
  },
  {
    en: 'Rain on the window while I worked.',
    de: 'Regen am Fenster, während ich gearbeitet habe.',
  },
  {
    en: 'A stranger held the door and smiled.',
    de: 'Ein Fremder hielt mir die Tür auf und lächelte.',
  },
  {
    en: 'Warm socks on a cold morning.',
    de: 'Warme Socken an einem kalten Morgen.',
  },
];
const SELF_PRAISE: Record<LabLang, string>[] = [
  {
    en: 'Finally sent the hard email.',
    de: 'Die schwierige E-Mail endlich abgeschickt.',
  },
  {
    en: 'Went for a run even though I didn’t feel like it.',
    de: 'Laufen gewesen, obwohl ich keine Lust hatte.',
  },
  {
    en: 'Said no to a meeting I didn’t need.',
    de: 'Nein zu einem Meeting gesagt, das ich nicht brauchte.',
  },
  {
    en: 'Cooked instead of ordering in.',
    de: 'Selbst gekocht statt bestellt.',
  },
  {
    en: 'Stayed calm in a tense call.',
    de: 'In einem angespannten Gespräch ruhig geblieben.',
  },
  {
    en: 'Read twenty pages before bed.',
    de: 'Vor dem Schlafen zwanzig Seiten gelesen.',
  },
  {
    en: 'Asked for help instead of struggling alone.',
    de: 'Um Hilfe gebeten, statt mich allein durchzukämpfen.',
  },
  {
    en: 'Cleaned the kitchen before it got bad.',
    de: 'Die Küche geputzt, bevor es schlimm wurde.',
  },
  {
    en: 'Kept my phone away during dinner.',
    de: 'Beim Abendessen das Handy weggelegt.',
  },
  {
    en: 'Finished the report a day early.',
    de: 'Den Bericht einen Tag früher fertig gemacht.',
  },
];

const TIMES = ['07:42', '12:15', '18:30', '20:05', '20:40', '21:10', '21:25'];

function historyEntries(today: Date): LabEntry[] {
  const out: LabEntry[] = [];
  HISTORY.forEach((count, back) => {
    const key = dateKey(addDays(today, -(back + 1)));
    for (let n = 0; n < count; n++) {
      const seed = back * 7 + n * 3;
      const selfPraise = (back + n) % 3 === 1;
      const pool = selfPraise ? SELF_PRAISE : GRATITUDE;
      out.push({
        id: `${key}-${n}`,
        date: key,
        type: selfPraise ? 'self-praise' : 'gratitude',
        text: pool[seed % pool.length]!,
        time: TIMES[Math.min(n, TIMES.length - 1)]!,
      });
    }
  });
  // Today: two entries — the third completes the day.
  const todayKey = dateKey(today);
  out.push(
    {
      id: `${todayKey}-0`,
      date: todayKey,
      type: 'gratitude',
      text: GRATITUDE[0]!,
      time: '07:42',
    },
    {
      id: `${todayKey}-1`,
      date: todayKey,
      type: 'self-praise',
      text: SELF_PRAISE[0]!,
      time: '12:15',
    }
  );
  return out;
}

// ---------------------------------------------------------------------------
// The journal's rules (technical-guides:My-Journal.md, Gamification-Core.md)
// ---------------------------------------------------------------------------

export const DAILY_GOAL = 3;
export const MILESTONE_POSITIONS = [4, 8, 13] as const;
export type MilestoneKind = 'star' | 'flame' | 'crown';

export function milestoneAt(position: number): MilestoneKind | null {
  return position === 4
    ? 'star'
    : position === 8
      ? 'flame'
      : position === 13
        ? 'crown'
        : null;
}

/** XP for the N-th entry of a day — the app's own constants. */
export function entryXp(position: number): number {
  const j = XP_REWARDS.JOURNAL;
  if (position <= 3) return j.FIRST_ENTRY;
  if (position <= 13) return j.BONUS_ENTRY;
  return j.FOURTEENTH_PLUS_ENTRY;
}

export function milestoneXp(position: number): number {
  const j = XP_REWARDS.JOURNAL;
  const kind = milestoneAt(position);
  return kind === 'star'
    ? j.FIRST_BONUS_MILESTONE
    : kind === 'flame'
      ? j.FIFTH_BONUS_MILESTONE
      : kind === 'crown'
        ? j.TENTH_BONUS_MILESTONE
        : 0;
}

export type DayState = 'none' | 'partial' | 'complete' | 'paid' | 'future';

export interface JournalStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  activeDays: number;
  averagePerActiveDay: number;
  stars: number;
  flames: number;
  crowns: number;
  gratitude: number;
  selfPraise: number;
  /** Entries per day for the last 30 days, oldest first (today last). */
  last30: number[];
}

export interface FrozenPreview {
  /** Missed days to pay (1 ad = 1 day). */
  days: number;
  paid: number;
}

interface LabJournal {
  today: Date;
  entries: LabEntry[];
  /** Entries of a day in order — position = index + 1 (always 1..N). */
  entriesOn: (key: string) => LabEntry[];
  countOn: (key: string) => number;
  dayState: (d: Date) => DayState;
  stats: JournalStats;
  todayCount: number;
  /** Adds an entry for today; returns its id and position (1-based). */
  add: (type: EntryType, text: string) => { id: string; position: number };
  edit: (id: string, text: string) => void;
  /** Removes an entry; returns the XP taken back (the day's LAST position). */
  remove: (id: string) => number;
  /** Frozen streak preview (the debt gate): null = streak is warm. */
  frozen: FrozenPreview | null;
  setFrozen: (next: FrozenPreview | null) => void;
}

const LabJournalContext = createContext<LabJournal | null>(null);

export function LabJournalProvider({ children }: { children: ReactNode }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [entries, setEntries] = useState<LabEntry[]>(() =>
    historyEntries(today)
  );
  const [frozen, setFrozen] = useState<FrozenPreview | null>(null);
  const paid = useMemo(
    () => new Set(PAID_BACK.map(back => dateKey(addDays(today, -(back + 1))))),
    [today]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, LabEntry[]>();
    entries.forEach(e => {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    });
    return map;
  }, [entries]);

  const entriesOn = useCallback((key: string) => byDay.get(key) ?? [], [byDay]);
  const countOn = useCallback(
    (key: string) => byDay.get(key)?.length ?? 0,
    [byDay]
  );
  const todayKey = dateKey(today);

  const dayState = useCallback(
    (d: Date): DayState => {
      const key = dateKey(d);
      if (d > today) return 'future';
      if (paid.has(key)) return 'paid';
      const n = byDay.get(key)?.length ?? 0;
      if (n >= DAILY_GOAL) return 'complete';
      return n > 0 ? 'partial' : 'none';
    },
    [byDay, paid, today]
  );

  const stats = useMemo<JournalStats>(() => {
    // Oldest day first; a paid day bridges, an incomplete day ends the run —
    // except today, which is still open.
    const first = addDays(today, -HISTORY.length);
    let run = 0;
    let longest = 0;
    for (let d = first; d <= today; d = addDays(d, 1)) {
      const key = dateKey(d);
      const n = byDay.get(key)?.length ?? 0;
      if (n >= DAILY_GOAL) run += 1;
      else if (paid.has(key)) continue;
      else if (key !== todayKey) run = 0;
      longest = Math.max(longest, run);
    }
    let stars = 0;
    let flames = 0;
    let crowns = 0;
    let activeDays = 0;
    byDay.forEach(list => {
      if (list.length > 0) activeDays++;
      if (list.length >= 4) stars++;
      if (list.length >= 8) flames++;
      if (list.length >= 13) crowns++;
    });
    const gratitude = entries.filter(e => e.type === 'gratitude').length;
    return {
      currentStreak: run,
      longestStreak: longest,
      totalEntries: entries.length,
      activeDays,
      averagePerActiveDay: activeDays === 0 ? 0 : entries.length / activeDays,
      stars,
      flames,
      crowns,
      gratitude,
      selfPraise: entries.length - gratitude,
      last30: Array.from(
        { length: 30 },
        (_, i) => byDay.get(dateKey(addDays(today, i - 29)))?.length ?? 0
      ),
    };
  }, [byDay, entries, paid, today, todayKey]);

  const add = useCallback(
    (type: EntryType, text: string) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const position = (byDay.get(todayKey)?.length ?? 0) + 1;
      const id = `${todayKey}-new-${now.getTime()}`;
      setEntries(prev => [
        ...prev,
        {
          id,
          date: todayKey,
          type,
          text: { en: text, de: text },
          time,
        },
      ]);
      return { id, position };
    },
    [byDay, todayKey]
  );

  const edit = useCallback((id: string, text: string) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, text: { en: text, de: text } } : e))
    );
  }, []);

  const remove = useCallback(
    (id: string) => {
      const entry = entries.find(e => e.id === id);
      if (!entry) return 0;
      // The day renumbers to 1..N-1, so the position that disappears is the last.
      const n = byDay.get(entry.date)?.length ?? 0;
      setEntries(prev => prev.filter(e => e.id !== id));
      return entryXp(n) + milestoneXp(n);
    },
    [byDay, entries]
  );

  const value = useMemo(
    () => ({
      today,
      entries,
      entriesOn,
      countOn,
      dayState,
      stats,
      todayCount: byDay.get(todayKey)?.length ?? 0,
      add,
      edit,
      remove,
      frozen,
      setFrozen,
    }),
    [
      today,
      entries,
      entriesOn,
      countOn,
      dayState,
      stats,
      byDay,
      todayKey,
      add,
      edit,
      remove,
      frozen,
    ]
  );

  return (
    <LabJournalContext.Provider value={value}>
      {children}
    </LabJournalContext.Provider>
  );
}

export function useLabJournal(): LabJournal {
  const ctx = useContext(LabJournalContext);
  if (!ctx)
    throw new Error('useLabJournal must be used inside LabJournalProvider');
  return ctx;
}
