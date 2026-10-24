/**
 * Mock content for the Design Lab Home concept. Not real data and not i18n keys:
 * the lab is an internal tool. German is here so the longest strings can be
 * tried on the real layout (the app's own wording: habits are "Routinen").
 *
 * Texts that would ship (greeting, encouragement) still need Petr's approval
 * and proper keys in src/locales before they reach a real screen (plan R-6).
 *
 * GOING LIVE: texts move into src/locales as keys (EN/DE/ES — Spanish is missing
 * here) after Petr approves them. Do not import this file from real screens.
 */

export type LabLang = 'en' | 'de';

export interface MockHabit {
  id: string;
  icon:
    | 'walk-outline'
    | 'water-outline'
    | 'book-outline'
    | 'leaf-outline'
    | 'moon-outline';
  color: 'blue' | 'green' | 'purple' | 'teal' | 'orange' | 'pink';
  name: Record<LabLang, string>;
  schedule: Record<LabLang, string>;
  done: boolean;
}

export const MOCK_HABITS: MockHabit[] = [
  {
    id: 'walk',
    icon: 'walk-outline',
    color: 'green',
    name: { en: 'Morning walk', de: 'Morgenspaziergang' },
    schedule: { en: 'Every day', de: 'Jeden Tag' },
    done: true,
  },
  {
    id: 'water',
    icon: 'water-outline',
    color: 'blue',
    name: { en: 'Drink water', de: 'Wasser trinken' },
    schedule: { en: 'Every day', de: 'Jeden Tag' },
    done: true,
  },
  {
    id: 'read',
    icon: 'book-outline',
    color: 'purple',
    name: { en: 'Read 10 pages', de: '10 Seiten lesen' },
    schedule: { en: 'Mon · Wed · Fri', de: 'Mo · Mi · Fr' },
    done: true,
  },
  {
    id: 'meditate',
    icon: 'leaf-outline',
    color: 'teal',
    name: { en: 'Meditate', de: 'Meditieren' },
    schedule: { en: 'Every day', de: 'Jeden Tag' },
    done: false,
  },
  {
    id: 'sleep',
    icon: 'moon-outline',
    color: 'orange',
    name: { en: 'Sleep early', de: 'Vor Mitternacht schlafen gehen' },
    schedule: { en: 'Weekdays', de: 'Werktags' },
    done: false,
  },
];

/** Values the mock screen shows. One level, one streak, one challenge — enough to judge the look. */
export const MOCK_STATS = {
  streakDays: 12,
  xpToday: 145,
  level: 16,
  levelTitle: 'Apprentice I',
  // Close to the real curve (levelCalculation.ts): level 16 spans ~15 270 → ~17 937 XP.
  levelXp: 16512,
  levelStartXp: 15270,
  nextLevelXp: 17937,
  journalStreak: 24,
  journalToday: 2,
  stars: 9,
  flames: 4,
  crowns: 1,
  challengeDone: 14,
  challengeTarget: 22,
  challengeStars: 3,
  monthDay: 22,
  monthDays: 31,
  /** Habits completed per day this week, Monday first; null = not reached yet. */
  week: [4, 5, 3, 5, 3, null, null] as (number | null)[],
  weekTotal: 5,
  todayIndex: 4,
};

interface Copy {
  greeting: (hour: number) => string;
  subline: string;
  today: string;
  habitsDone: (done: number, total: number) => string;
  encouragement: (remaining: number, done: number) => string;
  streakChip: (days: number) => string;
  xpChip: (xp: number) => string;
  /** Word after the counting XP number in the hero chip ("+145 XP today"). */
  xpChipWord: string;
  quick: {
    addHabit: string;
    gratitude: string;
    selfPraise: string;
    addGoal: string;
  };
  todaysHabits: string;
  level: (level: number) => string;
  toNext: (xp: string, level: number) => string;
  journalStreak: string;
  days: string;
  streakActive: string;
  entriesToday: (count: number) => string;
  writeEntry: string;
  challengeOverline: string;
  challengeTitle: string;
  challengeGoal: (target: number) => string;
  challengeProgress: (done: number, target: number) => string;
  challengeDay: (day: number, total: number) => string;
  thisWeek: string;
  consistent: (percent: number) => string;
  weekdays: string[];
  tabs: string[];
  adSlot: string;
  nextInLab: string;
  streakFrozen: string;
  streakWarming: string;
  flameHint: string;
  markerDone: string;
  markerOpen: string;
  arcHint: string;
  habits: {
    title: string;
    subline: string;
    week: string;
    today: string;
    doneOf: (done: number, total: number) => string;
    bonusSection: string;
    bonusHint: string;
    pausedSection: string;
    pausedFor: (days: number) => string;
    resume: string;
    makeupCovers: (day: string) => string;
    bonusTag: string;
    actions: {
      edit: string;
      pause: string;
      delete: string;
      stats: string;
      cancel: string;
    };
    currentStreak: string;
    bestStreak: string;
    rate: string;
    explainTitle: string;
    explainBody: string;
    tapHint: string;
    reorderTitle: string;
    reorderHint: string;
    reorderDone: string;
    composer: {
      title: string;
      placeholder: string;
      previewName: string;
      ideas: string;
      everyDay: string;
      weekdays: string;
      weekends: string;
      create: string;
    };
    status: {
      done: string;
      makeup: (day: string) => string;
      covered: (day: string) => string;
      bonus: string;
      missed: string;
      paused: string;
      planned: string;
      todayOpen: string;
      none: string;
    };
  };
  detail: {
    title: string;
    today: string;
    entries: string[];
    emptySlot: string;
    week: string;
    close: string;
  };
  thousandsSeparator: string;
  locale: string;
}

export const MOCK_COPY: Record<LabLang, Copy> = {
  en: {
    greeting: hour =>
      hour < 5
        ? 'Good night'
        : hour < 12
          ? 'Good morning'
          : hour < 18
            ? 'Good afternoon'
            : 'Good evening',
    subline: 'One small step a day.',
    today: 'Today',
    habitsDone: (done, total) => `${done} of ${total} habits done`,
    encouragement: (remaining, done) =>
      remaining === 0
        ? 'All done for today. Be proud of yourself.'
        : done === 0
          ? 'A fresh start. Pick one small step.'
          : remaining === 1
            ? 'One more to go. You’ve got this.'
            : `${remaining} more to go. You’ve got this.`,
    streakChip: days => `${days}-day streak`,
    xpChip: xp => `+${xp} XP today`,
    xpChipWord: 'today',
    quick: {
      addHabit: 'Add habit',
      gratitude: 'Gratitude',
      selfPraise: 'Self-praise',
      addGoal: 'Add goal',
    },
    todaysHabits: 'Today’s habits',
    level: level => `Level ${level}`,
    toNext: (xp, level) => `${xp} XP to Level ${level}`,
    journalStreak: 'Journal streak',
    days: 'days',
    streakActive: 'Streak active',
    entriesToday: count => `${count} of 3 entries today`,
    writeEntry: 'Write an entry',
    challengeOverline: 'October challenge',
    challengeTitle: 'Consistency Master',
    challengeGoal: target =>
      `Complete your habits on ${target} days this month`,
    challengeProgress: (done, target) => `${done} of ${target} days`,
    challengeDay: (day, total) => `Day ${day} of ${total}`,
    thisWeek: 'This week',
    consistent: percent => `${percent}% consistent`,
    weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    tabs: ['Home', 'Habits', 'My Journal', 'Goals', 'Settings'],
    adSlot: 'Ad banner · 320×50',
    nextInLab:
      'This screen gets its new look next. For now the lab shows Home.',
    streakFrozen: 'Streak frozen',
    streakWarming: 'Warming up…',
    flameHint: 'Tap the flame to preview a frozen streak',
    markerDone: 'Done today',
    markerOpen: 'Still to do',
    arcHint: 'Tap or slide along the arc',
    habits: {
      title: 'Habits',
      subline: 'Small steps, kept.',
      week: 'This week',
      today: 'Today',
      doneOf: (done, total) => `${done} of ${total} done`,
      bonusSection: 'Bonus — not on today’s plan',
      bonusHint:
        'Check one for bonus XP — or to make up a missed day this week.',
      pausedSection: 'Paused',
      pausedFor: days => `Paused for ${days} days — never counted as missed`,
      resume: 'Resume',
      makeupCovers: day => `Make-up · covers ${day}`,
      bonusTag: 'Bonus',
      actions: {
        edit: 'Edit',
        pause: 'Pause',
        delete: 'Delete',
        stats: 'Calendar & stats',
        cancel: 'Cancel',
      },
      currentStreak: 'Current streak',
      bestStreak: 'Best streak',
      rate: 'Completion',
      explainTitle: 'How make-up works',
      explainBody:
        'Missed a planned day? An extra day in the same week (Mon–Sun) makes it up. The line shows which day covered which.',
      tapHint: 'Tap a day to see what happened',
      reorderTitle: 'Reorder',
      reorderHint:
        'Hold a handle and drag. The new order shows on every screen.',
      reorderDone: 'Done',
      composer: {
        title: 'New habit',
        placeholder: 'What will you do?',
        previewName: 'Your new habit',
        ideas: 'Start from an idea',
        everyDay: 'Every day',
        weekdays: 'Weekdays',
        weekends: 'Weekends',
        create: 'Create habit',
      },
      status: {
        done: 'Done',
        makeup: day => `Make-up — covers ${day}`,
        covered: day => `Missed — made up on ${day}`,
        bonus: 'Bonus — an extra day',
        missed: 'Missed',
        paused: 'Paused — never counted as missed',
        planned: 'Planned',
        todayOpen: 'Today — still open',
        none: 'Not planned',
      },
    },
    detail: {
      title: 'My Journal',
      today: 'Today',
      entries: [
        'Grateful for a slow coffee before work.',
        'Proud I finally sent the hard email.',
      ],
      emptySlot: 'One more for today — what went well?',
      week: 'Last 7 days',
      close: 'Close',
    },
    thousandsSeparator: ',',
    locale: 'en-US',
  },
  de: {
    greeting: hour =>
      hour < 5
        ? 'Gute Nacht'
        : hour < 12
          ? 'Guten Morgen'
          : hour < 18
            ? 'Guten Tag'
            : 'Guten Abend',
    subline: 'Ein kleiner Schritt pro Tag.',
    today: 'Heute',
    habitsDone: (done, total) => `${done} von ${total} Routinen erledigt`,
    encouragement: (remaining, done) =>
      remaining === 0
        ? 'Für heute alles erledigt. Sei stolz auf dich.'
        : done === 0
          ? 'Ein neuer Anfang. Wähle einen kleinen Schritt.'
          : remaining === 1
            ? 'Noch eine. Du schaffst das.'
            : `Noch ${remaining}. Du schaffst das.`,
    streakChip: days => `${days} Tage in Folge`,
    xpChip: xp => `+${xp} XP heute`,
    xpChipWord: 'heute',
    quick: {
      addHabit: 'Neue Routine',
      gratitude: 'Dankbarkeit',
      selfPraise: 'Selbstlob',
      addGoal: 'Neues Ziel',
    },
    todaysHabits: 'Heutige Routinen',
    level: level => `Level ${level}`,
    toNext: (xp, level) => `Noch ${xp} XP bis Level ${level}`,
    journalStreak: 'Tagebuch-Serie',
    days: 'Tage',
    streakActive: 'Serie aktiv',
    entriesToday: count => `${count} von 3 Einträgen heute`,
    writeEntry: 'Eintrag schreiben',
    challengeOverline: 'Oktober-Herausforderung',
    challengeTitle: 'Meister der Beständigkeit',
    challengeGoal: target =>
      `Erledige an ${target} Tagen in diesem Monat deine Routinen`,
    challengeProgress: (done, target) => `${done} von ${target} Tagen`,
    challengeDay: (day, total) => `Tag ${day} von ${total}`,
    thisWeek: 'Diese Woche',
    consistent: percent => `${percent} % beständig`,
    weekdays: ['M', 'D', 'M', 'D', 'F', 'S', 'S'],
    tabs: ['Home', 'Routine', 'Tagebuch', 'Ziele', 'Menü'],
    adSlot: 'Werbebanner · 320×50',
    nextInLab:
      'Dieser Bildschirm bekommt als Nächstes sein neues Aussehen. Vorerst zeigt das Labor Home.',
    streakFrozen: 'Serie eingefroren',
    streakWarming: 'Wird aufgewärmt…',
    flameHint: 'Tippe auf die Flamme: Vorschau einer eingefrorenen Serie',
    markerDone: 'Heute erledigt',
    markerOpen: 'Noch offen',
    arcHint: 'Tippe oder streiche über den Bogen',
    habits: {
      title: 'Routinen',
      subline: 'Kleine Schritte, die bleiben.',
      week: 'Diese Woche',
      today: 'Heute',
      doneOf: (done, total) => `${done} von ${total} erledigt`,
      bonusSection: 'Bonus – heute nicht geplant',
      bonusHint:
        'Abhaken bringt Bonus-XP – oder holt einen verpassten Tag dieser Woche nach.',
      pausedSection: 'Pausiert',
      pausedFor: days => `Seit ${days} Tagen pausiert – zählt nie als verpasst`,
      resume: 'Fortsetzen',
      makeupCovers: day => `Nachgeholt · ersetzt ${day}`,
      bonusTag: 'Bonus',
      actions: {
        edit: 'Bearbeiten',
        pause: 'Pausieren',
        delete: 'Löschen',
        stats: 'Kalender & Statistik',
        cancel: 'Abbrechen',
      },
      currentStreak: 'Aktuelle Serie',
      bestStreak: 'Beste Serie',
      rate: 'Erfüllung',
      explainTitle: 'So funktioniert Nachholen',
      explainBody:
        'Einen geplanten Tag verpasst? Ein zusätzlicher Tag in derselben Woche (Mo–So) holt ihn nach. Die Linie zeigt, welcher Tag welchen ersetzt.',
      tapHint: 'Tippe auf einen Tag, um zu sehen, was passiert ist',
      reorderTitle: 'Reihenfolge',
      reorderHint:
        'Halte einen Griff und ziehe. Die neue Reihenfolge gilt überall.',
      reorderDone: 'Fertig',
      composer: {
        title: 'Neue Routine',
        placeholder: 'Was möchtest du tun?',
        previewName: 'Deine neue Routine',
        ideas: 'Mit einer Idee starten',
        everyDay: 'Jeden Tag',
        weekdays: 'Werktags',
        weekends: 'Wochenende',
        create: 'Routine erstellen',
      },
      status: {
        done: 'Erledigt',
        makeup: day => `Nachgeholt – ersetzt ${day}`,
        covered: day => `Verpasst – nachgeholt am ${day}`,
        bonus: 'Bonus – ein zusätzlicher Tag',
        missed: 'Verpasst',
        paused: 'Pausiert – zählt nie als verpasst',
        planned: 'Geplant',
        todayOpen: 'Heute – noch offen',
        none: 'Nicht geplant',
      },
    },
    detail: {
      title: 'Tagebuch',
      today: 'Heute',
      entries: [
        'Dankbar für einen ruhigen Kaffee vor der Arbeit.',
        'Stolz, dass ich die schwierige E-Mail endlich abgeschickt habe.',
      ],
      emptySlot: 'Noch einer für heute – was lief gut?',
      week: 'Letzte 7 Tage',
      close: 'Schließen',
    },
    thousandsSeparator: '.',
    locale: 'de-DE',
  },
};

/** Worklet-safe integer formatting with a thousands separator (runs on the UI thread). */
export function formatThousands(value: number, separator: string): string {
  'worklet';
  const rounded = Math.round(value).toString();
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
