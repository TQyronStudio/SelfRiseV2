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
  /** The panel that grows out of the level badge (levelPanel.tsx). */
  levelPanel: {
    today: string;
    /** `factor` is already printed ("2×", "1,5×"). */
    multiplier: (factor: string) => string;
    timeLeft: (value: number, unit: 'h' | 'min') => string;
    harmony: string;
    harmonyDays: (days: number, required: number) => string;
    harmonyNext: (days: number) => string;
    harmonyHint: string;
    parts: { habits: string; journal: string; goals: string };
    partDone: (part: string) => string;
    partOpen: (part: string) => string;
    switchOn: (factor: string, hours: number) => string;
    readyTitle: (factor: string) => string;
    noteAction: string;
    badgeRunning: (factor: string) => string;
    badgeReady: (factor: string) => string;
    allLevels: string;
    close: string;
  };
  /** The monthly challenge's detail (ChallengeDetailConcept.tsx). */
  challenge: {
    /** The Home card before / without its challenge (kolo 45, L-7). */
    loadingLabel: string;
    preparingTitle: string;
    preparingText: string;
    errorTitle: string;
    errorText: string;
    retry: string;
    retrying: string;
    count: (done: number, target: number) => string;
    daysLeft: (days: number) => string;
    done: string;
    paceDone: string;
    paceOnTrack: (left: number, days: number) => string;
    paceBehind: (left: number, days: number, perDay: number) => string;
    /** The full challenge cannot be reached any more; `toKeep` protects the stars. */
    paceOut: (toKeep: number, days: number) => string;
    paceOutSafe: string;
    paceOutFar: string;
    reached: string;
    categoryName: Record<
      'habits' | 'journal' | 'goals' | 'consistency',
      string
    >;
    requirements: string;
    milestone: (percent: number, xp: number) => string;
    calendar: string;
    less: string;
    more: string;
    reward: string;
    earned: string;
    starChallenge: (stars: number) => string;
    streak: (months: number, percent: number) => string;
    streakHint: string;
    total: string;
    levelRises: (category: string, stars: number) => string;
    topLevel: string;
    warmUp: string;
    levels: string;
    labScenario: string;
    scenarios: Record<
      'onTrack' | 'behind' | 'tooLate' | 'warmUp' | 'done',
      string
    >;
    /** The moments around a challenge (challengeMoments.tsx). */
    milestoneNote: (percent: number, title: string) => string;
    /** Several milestones from one log — one note (kolo 46, L-8). */
    milestonesNote: (percents: number[], title: string) => string;
    /** The third warm-up in a row: the app steps the highest category down. */
    warmUpStepDown: (category: string, stars: number, name: string) => string;
    completeOverline: string;
    starUp: (category: string, stars: number, name: string) => string;
    multiplier: (factor: string, hours: number) => string;
    continue: string;
    recapTitle: (percent: number) => string;
    starKept: (category: string, stars: number, name: string) => string;
    starLost: (category: string, stars: number, name: string) => string;
    streakReset: string;
    newChallenge: string;
    recapButton: string;
    labMoments: string;
    moments: Record<
      'milestone' | 'milestones' | 'finish' | 'warmUpThird' | 'kept' | 'lost',
      string
    >;
  };
  /** Spoken names of the signature icons inside text (InlineIcon has no voice). */
  iconNames: Record<'star' | 'flame' | 'crown', string>;
  /** The sounds switch (feelPlayer.ts, kolo 50). */
  feel: { sounds: string; soundsDescription: string };
  /** When something goes wrong (systemScreens.tsx, kolo 49). */
  system: {
    notFoundTitle: string;
    notFoundText: string;
    notFoundButton: string;
    saveFailed: string;
    deleteFailed: string;
    retry: string;
    dismiss: string;
    retrying: string;
  };
  /** In-place help (labHelp.tsx, kolo 48): what the "i" says to a screen reader. */
  help: {
    label: Record<
      'makeUp' | 'journalDay' | 'frozen' | 'pace' | 'multiplier' | 'stars',
      string
    >;
    allRules: string;
  };
  /** "How SelfRise works" (HowItWorksConcept.tsx, kolo 47) — numbers come in as arguments. */
  howItWorks: {
    title: string;
    intro: string;
    habits: string;
    makeUpTitle: string;
    makeUp: string;
    habitXpTitle: string;
    habitXp: (planned: number, extra: number) => string;
    journal: string;
    threeTitle: string;
    three: (perEntry: number) => string;
    bonusTitle: string;
    bonus: (star: number, flame: number, crown: number, each: number) => string;
    frozenTitle: string;
    frozen: (maxDays: number) => string;
    longTitle: string;
    long: (days: string) => string;
    goals: string;
    goalXpTitle: string;
    goalXp: (perLog: number, perDay: number) => string;
    goalMilestonesTitle: string;
    goalMilestones: (
      m25: number,
      m50: number,
      m75: number,
      done: number
    ) => string;
    paceTitle: string;
    pace: string;
    levels: string;
    badgeTitle: string;
    badge: string;
    chaptersTitle: string;
    chapters: string;
    harmony: string;
    harmonyTitle: (factor: string, days: number) => string;
    harmonyText: (days: number, hours: number, cooldownDays: number) => string;
    challenge: string;
    madeTitle: string;
    made: string;
    starsTitle: string;
    stars: (keepPercent: number) => string;
    warmUpTitle: string;
    warmUp: (activeDays: number, inRow: number) => string;
    challengeXpTitle: string;
    challengeXp: (m25: number, m50: number, m75: number) => string;
    trophies: string;
    rarityTitle: string;
    rarity: (
      common: number,
      rare: number,
      epic: number,
      legendary: number
    ) => string;
    footer: string;
  };
  /** Home's insights, the "For you" card and the customise sheet (HomeSectionsConcept.tsx). */
  homeSections: {
    insights: string;
    insightsPeriod: string;
    trendUp: (points: number) => string;
    trendUpText: string;
    strongest: string;
    strongestText: (name: string, rate: number) => string;
    focus: string;
    focusText: (name: string, rate: number) => string;
    forYou: string;
    write: string;
    another: string;
    position: (index: number, count: number) => string;
    customizeHint: string;
    names: Record<'todayHabits' | 'insights', string>;
  };
  /** Home's habit statistics card (HabitStatsConcept.tsx). */
  homeStats: {
    title: string;
    periods: Record<'week' | 'month' | 'year', string>;
    vsPrevious: (
      trend: 'up' | 'down' | 'same',
      points: number,
      period: 'week' | 'month'
    ) => string;
    completed: string;
    bonus: string;
    planned: string;
    bestDay: string;
    today: string;
    ofPlanned: (done: number, planned: number) => string;
    bonusCount: (count: number) => string;
    restDay: string;
    activeDays: (active: number, total: number) => string;
    less: string;
    more: string;
  };
  /** The remaining celebrations (otherMoments.tsx). */
  moments: {
    chapterOverline: string;
    chapterLine: (from: number, to: number) => string;
    streakOverline: string;
    streakDays: (days: number) => string;
    multiplierOverline: (days: number) => string;
    multiplierTitle: (factor: string, hours: number) => string;
    multiplierLine: string;
    letsGo: string;
    /** The comeback boost's quiet note (kolo 53, L-11). */
    welcomeBack: string;
  };
  /** The levels overview as a journey (LevelsOverviewConcept.tsx). */
  levels: {
    title: string;
    ofTotal: (total: number) => string;
    range: (from: number, to: number) => string;
    reached: (count: number, size: number) => string;
    allReached: string;
    ahead: string;
    here: string;
    milestone: (level: number) => string;
    /** A milestone that unlocks a real trophy (achievementCatalog). */
    milestoneTrophy: (name: string) => string;
    nextMilestone: (level: number, left: number) => string;
    top: string;
  };
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
  journal: {
    subline: string;
    gratitudeHint: string;
    selfPraiseHint: string;
    bonusRoad: string;
    /** Followed by the milestone's icon (InlineIcon). */
    toNextMilestone: (left: number) => string;
    allMilestones: string;
    anotherPrompt: string;
    anotherQuote: string;
    entries: (count: number) => string;
    writingLocked: string;
    adPlaying: string;
    calendarHint: string;
    legend: {
      complete: string;
      bonus: string;
      partial: string;
      paid: string;
    };
    paidDay: string;
    last30: string;
    goalLine: string;
    chartAtGoal: (days: number, total: number) => string;
    chartAvg: (avg: string) => string;
    chartHint: string;
    activeDaysSub: (days: number) => string;
    milestoneMeaning: { star: string; flame: string; crown: string };
    newEntryXp: (xp: number) => string;
  };
  goals: {
    subline: string;
    onPace: string;
    ahead: (days: number) => string;
    behind: (days: number) => string;
    noDeadline: string;
    by: (date: string) => string;
    daysLeft: (days: number) => string;
    neededPerWeek: (amount: string) => string;
    yourPerWeek: (amount: string) => string;
    finish: (date: string) => string;
    shouldBe: string;
    logReading: string;
    otherAmount: string;
    reading: string;
    undo: string;
    logged: (amount: string) => string;
    milestone: (percent: number) => string;
    noXpLeft: string;
    paceTitle: string;
    plan: string;
    you: string;
    milestones: string;
    reached: (date: string) => string;
    ideas: string;
    kindCount: string;
    kindCountHint: string;
    kindMeasure: string;
    kindMeasureHint: string;
    now: string;
    deadline: string;
    presets: {
      m1: string;
      m3: string;
      m6: string;
      year: string;
      none: string;
      pick: string;
    };
    inDays: (days: number) => string;
    paceHint: (amount: string, unit: string) => string;
    previewTitle: string;
    nextDeadline: (title: string, days: number) => string;
    allDone: string;
    doneIn: (days: number) => string;
    startRequired: string;
    targetRequired: string;
    tooLarge: string;
  };
  settings: {
    subline: string;
    labLanguages: string;
    privacyLab: string;
  };
  onboarding: {
    customize: string;
    day: string;
    slotStart: string;
    slotHabit: string;
    slotGoal: string;
    slotGratitude: string;
    slotCheck: string;
    habitSmall: string;
    gratitudeHint: string;
    trophiesEarned: (count: number) => string;
    noHabitBody: string;
  };
  celebrate: {
    alsoUnlocked: string;
    trophiesUnlocked: (count: number) => string;
    openTrophies: string;
  };
  trophies: {
    subline: string;
    wall: string;
    filter: string;
    secret: string;
    secretHint: string;
    collectionReward: (xp: number) => string;
    collectionNote: string;
    nextLoyalty: (days: number, name: string) => string;
    ofTotal: (count: number, total: number) => string;
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
    levelPanel: {
      today: 'Today',
      multiplier: factor => `${factor} XP multiplier`,
      timeLeft: (value, unit) => `${value} ${unit} left`,
      harmony: 'Harmony streak',
      harmonyDays: (days, required) => `${days} of ${required} days`,
      harmonyNext: days =>
        days === 1 ? 'Next one tomorrow' : `Next one in ${days} days`,
      harmonyHint:
        'A day counts with one habit done, three journal entries and one goal step.',
      parts: { habits: 'Habits', journal: 'Journal', goals: 'Goals' },
      partDone: part => `${part}: done today`,
      partOpen: part => `${part}: not yet today`,
      switchOn: (factor, hours) => `Switch on ${factor} XP for ${hours} h`,
      readyTitle: factor => `${factor} XP is ready`,
      noteAction: 'Switch on',
      badgeRunning: factor => `${factor} XP is on`,
      badgeReady: factor => `${factor} XP is ready to switch on`,
      allLevels: 'All levels',
      close: 'Close level details',
    },
    challenge: {
      loadingLabel: 'Loading this month’s challenge',
      preparingTitle: 'Your challenge is on its way',
      preparingText:
        'It’s being put together from your recent activity and shows up here by itself.',
      errorTitle: 'This month’s challenge didn’t load',
      errorText: 'Your progress is safe. Try again in a moment.',
      retry: 'Try again',
      retrying: 'Loading…',
      count: (done, target) => `${done} of ${target}`,
      daysLeft: days => (days === 1 ? 'Last day' : `${days} days left`),
      done: 'Done',
      paceDone: 'Done. The rest of the month is yours.',
      paceOnTrack: (left, days) =>
        `You’re on track. ${left} more in ${days} ${days === 1 ? 'day' : 'days'}.`,
      paceBehind: (left, days, perDay) =>
        `A little behind. ${left} more in ${days} ${days === 1 ? 'day' : 'days'} — about ${perDay} a day gets you there.`,
      paceOut: (toKeep, days) =>
        `The full challenge is out of reach this month. ${toKeep} more in ${days} ${days === 1 ? 'day' : 'days'} keeps your star level.`,
      paceOutSafe:
        'The full challenge is out of reach this month, but your star level is safe.',
      paceOutFar:
        'The full challenge is out of reach this month. Every day you add still counts.',
      reached: 'reached',
      categoryName: {
        habits: 'Habits',
        journal: 'Journal',
        goals: 'Goals',
        consistency: 'Consistency',
      },
      requirements: 'What it takes',
      milestone: (percent, xp) => `${percent} % · +${xp} XP`,
      calendar: 'Your month',
      less: 'Less',
      more: 'More',
      reward: 'What you earn',
      earned: 'What you earned',
      starChallenge: stars => `${stars}-star challenge`,
      streak: (months, percent) => `${months} months in a row · +${percent} %`,
      streakHint: 'Finish two months in a row for a bonus.',
      total: 'Total',
      levelRises: (category, stars) =>
        `Finish it and your ${category} level rises to ${stars} stars.`,
      topLevel: 'You are at the top level. Hold it.',
      warmUp:
        'A warm-up challenge, made easy on purpose. It does not raise your star level.',
      levels: 'Your challenge levels',
      labScenario: 'Lab · situation',
      scenarios: {
        onTrack: 'On track',
        behind: 'Behind',
        tooLate: 'Out of reach',
        warmUp: 'Warm-up',
        done: 'Done',
      },
      milestoneNote: (percent, title) => `${percent} % of ${title}`,
      milestonesNote: (percents, title) => {
        const parts = percents.map(p => `${p} %`);
        const last = parts.pop();
        return `${parts.length ? `${parts.join(', ')} and ${last}` : last} of ${title}`;
      },
      warmUpStepDown: (category, stars, name) =>
        `Your third warm-up in a row, so your ${category} challenges step down to ${stars}-star · ${name}. The next ones will fit you better.`,
      completeOverline: 'Challenge complete',
      starUp: (category, stars, name) =>
        `Your ${category} level: ${stars}-star · ${name}`,
      multiplier: (factor, hours) =>
        `${factor}× XP for the next ${hours} hours`,
      continue: 'Continue',
      recapTitle: percent => `You made it ${percent} % of the way.`,
      starKept: (category, stars, name) =>
        `Your ${category} level stays: ${stars}-star · ${name}.`,
      starLost: (category, stars, name) =>
        `Your ${category} level drops to ${stars}-star · ${name} for now. Two months in a row fell short.`,
      streakReset: 'Your month streak starts again.',
      newChallenge: 'New · November challenge',
      recapButton: 'Start November',
      labMoments: 'Lab · moments',
      moments: {
        milestone: 'Milestone',
        milestones: 'Two milestones, one log',
        finish: 'Finished',
        warmUpThird: 'Third warm-up finished',
        kept: 'Month end · star kept',
        lost: 'Month end · star lost',
      },
    },
    iconNames: { star: 'star', flame: 'flame', crown: 'crown' },
    feel: {
      sounds: 'Sounds',
      soundsDescription:
        'A soft sound at the big moments: trophies, new chapters, a finished challenge. Silent mode always wins.',
    },
    system: {
      notFoundTitle: 'This page isn’t here',
      notFoundText:
        'The link may be out of date. Everything else is where you left it.',
      notFoundButton: 'Back to today',
      saveFailed: 'Your habit wasn’t saved. What you typed is still there.',
      deleteFailed: 'The habit wasn’t deleted. It’s still in your list.',
      retry: 'Try again',
      dismiss: 'Dismiss',
      retrying: 'Trying again…',
    },
    help: {
      label: {
        makeUp: 'How missed days are made up',
        journalDay: 'How the journal day works',
        frozen: 'How a frozen streak works',
        pace: 'How the pace is worked out',
        multiplier: 'How the XP multiplier works',
        stars: 'How challenge stars work',
      },
      allRules: 'All the rules',
    },
    howItWorks: {
      title: 'How SelfRise works',
      intro:
        'The rules behind your XP, streaks and stars — what happens out of sight.',
      habits: 'Habits',
      makeUpTitle: 'An extra day makes up for a missed one',
      makeUp:
        'Did a habit on a day it wasn’t planned? It covers a planned day you missed in the same week, Monday to Sunday, one for one. A golden check marks the day it saved.',
      habitXpTitle: 'Every check earns XP',
      habitXp: (planned, extra) =>
        `${planned} XP for a planned day, ${extra} XP for an extra one.`,
      journal: 'Journal',
      threeTitle: 'Three entries keep your streak',
      three: perEntry =>
        `Write three a day and the streak grows by one. Each of the three earns ${perEntry} XP.`,
      bonusTitle: 'Writing more pays a bonus',
      bonus: (star, flame, crown, each) =>
        `Entries 4, 8 and 13 of a day add +${star}, +${flame} and +${crown} XP. Entries 4 to 13 earn ${each} XP each; after the 13th, nothing more.`,
      frozenTitle: 'A missed day freezes the streak',
      frozen: maxDays =>
        `It doesn’t break. Watch one short ad for each missed day, up to ${maxDays} days, and it carries on. Or start fresh. New entries wait until you decide.`,
      longTitle: 'Long streaks pay XP',
      long: days => `At ${days} days in a row.`,
      goals: 'Goals',
      goalXpTitle: 'Progress pays',
      goalXp: (perLog, perDay) =>
        `Each log earns ${perLog} XP. One goal pays XP up to ${perDay} times a day, milestones included.`,
      goalMilestonesTitle: 'Milestones pay more',
      goalMilestones: (m25, m50, m75, done) =>
        `Reaching 25, 50 and 75 % adds ${m25}, ${m50} and ${m75} XP. Finishing a goal adds at least ${done} XP.`,
      paceTitle: 'Your pace, in plain words',
      pace: 'A goal with a deadline compares your pace with the straight line to it and tells you whether you’ll make it.',
      levels: 'XP and levels',
      badgeTitle: 'One badge, every screen',
      badge:
        'Your XP lands in the level badge at the top. Tap it to see your level, today’s XP and what is left to the next one.',
      chaptersTitle: 'Six chapters',
      chapters:
        'Levels come in six chapters, each with its own colour. A new chapter is celebrated — five times in all.',
      harmony: 'XP multiplier',
      harmonyTitle: (factor, days) =>
        `${days} days of all three = ${factor} XP`,
      harmonyText: (days, hours, cooldownDays) =>
        `A day counts with one habit done, three journal entries and one goal step. After ${days} in a row, switch it on from the level badge: everything earns double for ${hours} hours. The next one is possible ${cooldownDays} days later.`,
      challenge: 'Monthly challenge',
      madeTitle: 'One challenge a month, made for you',
      made: 'It comes from one area — habits, journal, goals or consistency — and is sized to how you did before.',
      starsTitle: 'Stars per area',
      stars: keepPercent =>
        `Each area has 1 to 5 stars, and more stars mean a bigger challenge and a bigger reward. Finishing adds a star to its area. Two months in a row without finishing take one away when the second ends under ${keepPercent} %.`,
      warmUpTitle: 'Warm-ups first',
      warmUp: (activeDays, inRow) =>
        `With fewer than ${activeDays} active days you get easy warm-ups. They don’t change your stars — but after ${inRow} in a row, your highest area steps down by one so the next ones fit.`,
      challengeXpTitle: 'Milestones and months in a row',
      challengeXp: (m25, m50, m75) =>
        `25, 50 and 75 % pay ${m25}, ${m50} and ${m75} XP. Finished months in a row raise the reward.`,
      trophies: 'Trophies',
      rarityTitle: 'Four rarities',
      rarity: (common, rare, epic, legendary) =>
        `Common and rare trophies arrive quietly next to the badge; epic and legendary get the big moment. They pay ${common}, ${rare}, ${epic} and ${legendary} XP.`,
      footer: 'Everything you can see on screen works the way it looks.',
    },
    homeSections: {
      insights: 'Insights',
      insightsPeriod: 'Last 4 weeks',
      trendUp: points => `Up ${points} points`,
      trendUpText: 'You complete more of what you plan than a month ago.',
      strongest: 'Strongest habit',
      strongestText: (name, rate) => `${name} — ${rate} % this month.`,
      focus: 'Worth a look',
      focusText: (name, rate) =>
        `${name} is at ${rate} % this month. A lighter schedule might help.`,
      forYou: 'For you',
      write: 'Write it down',
      another: 'Another suggestion',
      position: (index, count) => `${index} of ${count}`,
      customizeHint: 'Drag to change the order. Your day always stays on top.',
      names: { todayHabits: 'Today’s habits', insights: 'Insights' },
    },
    homeStats: {
      title: 'Your habits',
      periods: { week: '7 days', month: '30 days', year: 'Year' },
      vsPrevious: (trend, points, period) => {
        const before =
          period === 'week' ? 'the week before' : 'the 30 days before';
        if (trend === 'same') return `Same as ${before}`;
        return `${points} ${points === 1 ? 'point' : 'points'} ${trend === 'up' ? 'better' : 'lower'} than ${before}`;
      },
      completed: 'Completed',
      bonus: 'Bonus',
      planned: 'Planned',
      bestDay: 'Best day',
      today: 'Today',
      ofPlanned: (done, planned) => `${done} of ${planned}`,
      bonusCount: count => `${count} bonus`,
      restDay: 'Nothing planned',
      activeDays: (active, total) => `${active} of ${total} days active`,
      less: 'Less',
      more: 'More',
    },
    moments: {
      chapterOverline: 'New chapter',
      chapterLine: (from, to) => `Levels ${from}–${to} lie ahead of you.`,
      streakOverline: 'Journal streak',
      streakDays: days => `${days} days in a row`,
      multiplierOverline: days => `Harmony streak · ${days} days`,
      multiplierTitle: (factor, hours) => `${factor}× XP for ${hours} hours`,
      multiplierLine:
        'You used habits, journal and goals every day. Everything you earn now counts double.',
      letsGo: 'Let’s go',
      welcomeBack: 'Welcome back',
    },
    levels: {
      title: 'Your journey',
      ofTotal: total => `of ${total}`,
      range: (from, to) => `Levels ${from}–${to}`,
      reached: (count, size) => `${count} of ${size} reached`,
      allReached: 'All reached',
      ahead: 'Still ahead',
      here: 'You are here',
      milestone: level => `Milestone · Level ${level}`,
      milestoneTrophy: name => `Milestone · trophy “${name}”`,
      nextMilestone: (level, left) =>
        `Next milestone: Level ${level} · ${left} ${left === 1 ? 'level' : 'levels'} to go`,
      top: 'You have reached the top.',
    },
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
    journal: {
      subline: 'Three good things a day.',
      gratitudeHint: 'Something good today',
      selfPraiseHint: 'Something you did well',
      bonusRoad: 'Bonus road',
      toNextMilestone: left => `${left} more to`,
      allMilestones: 'Every milestone of the day collected.',
      anotherPrompt: 'Another prompt',
      anotherQuote: 'Another quote',
      entries: count => (count === 1 ? '1 entry' : `${count} entries`),
      writingLocked: 'Writing opens again once your streak is warm.',
      adPlaying: 'An ad would play here',
      calendarHint: 'Tap a day to read it',
      legend: {
        complete: '3+ entries',
        bonus: 'Bonus day',
        partial: 'Started',
        paid: 'Saved with an ad',
      },
      paidDay: 'Frozen day — saved with an ad, the streak went on',
      last30: 'Last 30 days',
      goalLine: 'Daily goal',
      chartAtGoal: (days, total) => `of ${total} days at the daily goal`,
      chartAvg: avg => `${avg} entries a day on average`,
      chartHint: 'Tap or slide across the bars',
      activeDaysSub: days =>
        days === 1 ? '1 day with entries' : `${days} days with entries`,
      milestoneMeaning: {
        star: '4th entry of a day',
        flame: '8th entry of a day',
        crown: '13th entry of a day',
      },
      newEntryXp: xp => `+${xp} XP`,
    },
    goals: {
      subline: 'Big things, one step at a time.',
      onPace: 'On pace',
      ahead: days => (days === 1 ? '1 day ahead' : `${days} days ahead`),
      behind: days => (days === 1 ? '1 day behind' : `${days} days behind`),
      noDeadline: 'No deadline',
      by: date => `by ${date}`,
      daysLeft: days => (days === 1 ? '1 day left' : `${days} days left`),
      neededPerWeek: amount => `${amount} a week needed`,
      yourPerWeek: amount => `${amount} a week so far`,
      finish: date => `At this pace: ${date}`,
      shouldBe: 'Where the plan is today',
      logReading: 'Log a reading',
      otherAmount: 'Other',
      reading: 'Today’s reading',
      undo: 'Undo',
      logged: amount => `${amount} logged`,
      milestone: percent => `${percent} % — milestone reached`,
      noXpLeft: 'Saved. XP for this goal returns tomorrow.',
      paceTitle: 'You vs. the plan',
      plan: 'Plan',
      you: 'You',
      milestones: 'Milestones',
      reached: date => `reached ${date}`,
      ideas: 'Start from an idea',
      kindCount: 'Count up',
      kindCountHint: 'Add as you go — books, money, hours',
      kindMeasure: 'Measure',
      kindMeasureHint: 'Log a reading — weight, balance, time',
      now: 'Now',
      deadline: 'Deadline',
      presets: {
        m1: '1 month',
        m3: '3 months',
        m6: '6 months',
        year: 'End of year',
        none: 'No deadline',
        pick: 'Pick a date',
      },
      inDays: days => (days === 1 ? 'tomorrow' : `in ${days} days`),
      paceHint: (amount, unit) => `That’s about ${amount} ${unit} a week`,
      previewTitle: 'Your new goal',
      nextDeadline: (title, days) => `Next: ${title} in ${days} days`,
      allDone: 'Nothing due — enjoy the momentum.',
      doneIn: days =>
        days === 1 ? 'reached in 1 day' : `reached in ${days} days`,
      startRequired:
        'Enter where you are now — it has to differ from the target.',
      targetRequired: 'Enter the value you want to reach (0 is fine).',
      tooLarge: 'That number is too large.',
    },
    settings: {
      subline: 'Make it yours.',
      labLanguages: 'The lab speaks EN and DE; the app adds Español.',
      privacyLab: 'In the app this opens the consent form.',
    },
    celebrate: {
      alsoUnlocked: 'Also unlocked',
      trophiesUnlocked: count => `${count} trophies unlocked`,
      openTrophies: 'Opens the Trophy Room',
    },
    onboarding: {
      customize: 'Make it yours',
      day: 'Your first day',
      slotStart: 'Start',
      slotHabit: 'Habit',
      slotGoal: 'Goal',
      slotGratitude: 'Gratitude',
      slotCheck: 'First tick',
      habitSmall:
        'Pick something small enough to do today. You can change it anytime.',
      gratitudeHint: 'A few words are enough.',
      trophiesEarned: count =>
        count === 1 ? '1 trophy earned' : `${count} trophies earned`,
      noHabitBody:
        "Add your first habit whenever you're ready. That's your Day 1.",
    },
    trophies: {
      subline: 'Everything you have earned, in one room.',
      wall: 'All trophies',
      filter: 'Filter',
      secret: 'Secret trophy',
      secretHint: 'Some things are better discovered. Keep going.',
      collectionReward: xp => `+${xp} XP for the full set`,
      collectionNote: 'Tap a trophy to see how to earn it.',
      nextLoyalty: (days, name) =>
        days === 1
          ? `1 active day to ${name}`
          : `${days} active days to ${name}`,
      ofTotal: (count, total) => `${count} of ${total}`,
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
    levelPanel: {
      today: 'Heute',
      multiplier: factor => `${factor} XP-Multiplikator`,
      timeLeft: (value, unit) =>
        `noch ${value} ${unit === 'h' ? 'Std.' : 'Min.'}`,
      harmony: 'Harmonie-Serie',
      harmonyDays: (days, required) => `${days} von ${required} Tagen`,
      harmonyNext: days =>
        days === 1 ? 'Der nächste ab morgen' : `Der nächste in ${days} Tagen`,
      harmonyHint:
        'Ein Tag zählt mit einer erledigten Gewohnheit, drei Tagebucheinträgen und einem Schritt bei einem Ziel.',
      parts: { habits: 'Gewohnheiten', journal: 'Tagebuch', goals: 'Ziele' },
      partDone: part => `${part}: heute erledigt`,
      partOpen: part => `${part}: heute noch offen`,
      switchOn: (factor, hours) => `${factor} XP für ${hours} Std. einschalten`,
      readyTitle: factor => `${factor} XP ist bereit`,
      noteAction: 'Einschalten',
      badgeRunning: factor => `${factor} XP läuft`,
      badgeReady: factor => `${factor} XP bereit zum Einschalten`,
      allLevels: 'Alle Level',
      close: 'Level-Details schließen',
    },
    challenge: {
      loadingLabel: 'Die Herausforderung dieses Monats wird geladen',
      preparingTitle: 'Deine Herausforderung ist unterwegs',
      preparingText:
        'Sie wird aus deiner letzten Aktivität zusammengestellt und erscheint hier von selbst.',
      errorTitle: 'Die Herausforderung dieses Monats wurde nicht geladen',
      errorText: 'Dein Fortschritt ist sicher. Versuch es gleich noch einmal.',
      retry: 'Erneut versuchen',
      retrying: 'Wird geladen…',
      count: (done, target) => `${done} von ${target}`,
      daysLeft: days => (days === 1 ? 'Letzter Tag' : `Noch ${days} Tage`),
      done: 'Geschafft',
      paceDone: 'Geschafft. Der Rest des Monats gehört dir.',
      paceOnTrack: (left, days) =>
        `Du liegst im Plan. Noch ${left} in ${days} ${days === 1 ? 'Tag' : 'Tagen'}.`,
      paceBehind: (left, days, perDay) =>
        `Etwas im Rückstand. Noch ${left} in ${days} ${days === 1 ? 'Tag' : 'Tagen'} – mit etwa ${perDay} pro Tag schaffst du es.`,
      paceOut: (toKeep, days) =>
        `Die volle Herausforderung ist diesen Monat nicht mehr zu schaffen. Noch ${toKeep} in ${days} ${days === 1 ? 'Tag' : 'Tagen'} und deine Sterne-Stufe bleibt.`,
      paceOutSafe:
        'Die volle Herausforderung ist diesen Monat nicht mehr zu schaffen, aber deine Sterne-Stufe ist sicher.',
      paceOutFar:
        'Die volle Herausforderung ist diesen Monat nicht mehr zu schaffen. Jeder weitere Tag zählt trotzdem.',
      reached: 'erreicht',
      categoryName: {
        habits: 'Routinen',
        journal: 'Tagebuch',
        goals: 'Ziele',
        consistency: 'Beständigkeit',
      },
      requirements: 'Was es braucht',
      milestone: (percent, xp) => `${percent} % · +${xp} XP`,
      calendar: 'Dein Monat',
      less: 'Weniger',
      more: 'Mehr',
      reward: 'Was du bekommst',
      earned: 'Was du bekommen hast',
      starChallenge: stars => `${stars}-Sterne-Herausforderung`,
      streak: (months, percent) => `${months} Monate in Folge · +${percent} %`,
      streakHint: 'Schaffe zwei Monate in Folge für einen Bonus.',
      total: 'Gesamt',
      levelRises: (category, stars) =>
        `Schaffst du sie, steigt deine Stufe für ${category} auf ${stars} Sterne.`,
      topLevel: 'Du bist auf der höchsten Stufe. Halte sie.',
      warmUp:
        'Eine Aufwärm-Herausforderung, bewusst leicht. Sie erhöht deine Sterne-Stufe nicht.',
      levels: 'Deine Herausforderungs-Stufen',
      labScenario: 'Labor · Situation',
      scenarios: {
        onTrack: 'Im Plan',
        behind: 'Rückstand',
        tooLate: 'Nicht mehr zu schaffen',
        warmUp: 'Aufwärmen',
        done: 'Geschafft',
      },
      milestoneNote: (percent, title) => `${percent} % von ${title}`,
      milestonesNote: (percents, title) => {
        const parts = percents.map(p => `${p} %`);
        const last = parts.pop();
        return `${parts.length ? `${parts.join(', ')} und ${last}` : last} von ${title}`;
      },
      warmUpStepDown: (category, stars, name) =>
        `Deine dritte Aufwärm-Herausforderung in Folge, deshalb gehen deine Herausforderungen für ${category} auf ${stars} ${stars === 1 ? 'Stern' : 'Sterne'} · ${name} zurück. Die nächsten passen besser zu dir.`,
      completeOverline: 'Herausforderung geschafft',
      starUp: (category, stars, name) =>
        `Deine Stufe für ${category}: ${stars} Sterne · ${name}`,
      multiplier: (factor, hours) =>
        `${factor}× XP für die nächsten ${hours} Stunden`,
      continue: 'Weiter',
      recapTitle: percent => `Du hast ${percent} % des Weges geschafft.`,
      starKept: (category, stars, name) =>
        `Deine Stufe für ${category} bleibt: ${stars} ${stars === 1 ? 'Stern' : 'Sterne'} · ${name}.`,
      starLost: (category, stars, name) =>
        `Deine Stufe für ${category} sinkt vorerst auf ${stars} ${stars === 1 ? 'Stern' : 'Sterne'} · ${name}. Zwei Monate in Folge haben nicht gereicht.`,
      streakReset: 'Deine Monatsserie beginnt neu.',
      newChallenge: 'Neu · November-Herausforderung',
      recapButton: 'November starten',
      labMoments: 'Labor · Momente',
      moments: {
        milestone: 'Meilenstein',
        milestones: 'Zwei Meilensteine, ein Eintrag',
        finish: 'Geschafft',
        warmUpThird: 'Dritte Aufwärm-Herausforderung geschafft',
        kept: 'Monatsende · Stern bleibt',
        lost: 'Monatsende · Stern weg',
      },
    },
    iconNames: { star: 'Stern', flame: 'Flamme', crown: 'Krone' },
    feel: {
      sounds: 'Töne',
      soundsDescription:
        'Ein leiser Ton bei den großen Momenten: Trophäen, neue Kapitel, eine geschaffte Herausforderung. Der Lautlos-Modus hat immer Vorrang.',
    },
    system: {
      notFoundTitle: 'Diese Seite gibt es nicht',
      notFoundText:
        'Der Link ist vielleicht veraltet. Alles andere ist da, wo du es gelassen hast.',
      notFoundButton: 'Zurück zu heute',
      saveFailed:
        'Deine Gewohnheit wurde nicht gespeichert. Was du geschrieben hast, ist noch da.',
      deleteFailed:
        'Die Gewohnheit wurde nicht gelöscht. Sie ist noch in deiner Liste.',
      retry: 'Erneut versuchen',
      dismiss: 'Schließen',
      retrying: 'Neuer Versuch…',
    },
    help: {
      label: {
        makeUp: 'So werden verpasste Tage ausgeglichen',
        journalDay: 'So funktioniert der Tagebuch-Tag',
        frozen: 'So funktioniert eine eingefrorene Serie',
        pace: 'So wird das Tempo berechnet',
        multiplier: 'So funktioniert der XP-Multiplikator',
        stars: 'So funktionieren die Sterne',
      },
      allRules: 'Alle Regeln',
    },
    howItWorks: {
      title: 'So funktioniert SelfRise',
      intro:
        'Die Regeln hinter deinen XP, Serien und Sternen — was im Hintergrund passiert.',
      habits: 'Gewohnheiten',
      makeUpTitle: 'Ein zusätzlicher Tag gleicht einen verpassten aus',
      makeUp:
        'Du hast eine Gewohnheit an einem ungeplanten Tag erledigt? Sie gleicht einen verpassten geplanten Tag derselben Woche aus, Montag bis Sonntag, eins zu eins. Ein goldener Haken markiert den geretteten Tag.',
      habitXpTitle: 'Jeder Haken bringt XP',
      habitXp: (planned, extra) =>
        `${planned} XP für einen geplanten Tag, ${extra} XP für einen zusätzlichen.`,
      journal: 'Tagebuch',
      threeTitle: 'Drei Einträge halten deine Serie',
      three: perEntry =>
        `Schreib drei am Tag und die Serie wächst um eins. Jeder der drei bringt ${perEntry} XP.`,
      bonusTitle: 'Mehr schreiben bringt einen Bonus',
      bonus: (star, flame, crown, each) =>
        `Die Einträge 4, 8 und 13 eines Tages bringen +${star}, +${flame} und +${crown} XP. Die Einträge 4 bis 13 bringen je ${each} XP, nach dem 13. nichts mehr.`,
      frozenTitle: 'Ein verpasster Tag friert die Serie ein',
      frozen: maxDays =>
        `Sie bricht nicht ab. Sieh dir für jeden verpassten Tag eine kurze Werbung an, bis zu ${maxDays} Tage, und sie geht weiter. Oder fang neu an. Neue Einträge warten, bis du dich entscheidest.`,
      longTitle: 'Lange Serien bringen XP',
      long: days => `Bei ${days} Tagen in Folge.`,
      goals: 'Ziele',
      goalXpTitle: 'Fortschritt zahlt sich aus',
      goalXp: (perLog, perDay) =>
        `Jeder Eintrag bringt ${perLog} XP. Ein Ziel zahlt bis zu ${perDay}-mal am Tag XP, Meilensteine eingeschlossen.`,
      goalMilestonesTitle: 'Meilensteine bringen mehr',
      goalMilestones: (m25, m50, m75, done) =>
        `25, 50 und 75 % bringen ${m25}, ${m50} und ${m75} XP. Ein geschafftes Ziel bringt mindestens ${done} XP.`,
      paceTitle: 'Dein Tempo, in klaren Worten',
      pace: 'Ein Ziel mit Termin vergleicht dein Tempo mit der geraden Linie bis dahin und sagt dir, ob du es schaffst.',
      levels: 'XP und Level',
      badgeTitle: 'Ein Abzeichen, auf jedem Bildschirm',
      badge:
        'Deine XP landen im Level-Abzeichen oben. Tipp darauf, um dein Level, die XP von heute und den Rest bis zum nächsten zu sehen.',
      chaptersTitle: 'Sechs Kapitel',
      chapters:
        'Die Level sind in sechs Kapitel mit eigener Farbe geteilt. Ein neues Kapitel wird gefeiert — insgesamt fünfmal.',
      harmony: 'XP-Multiplikator',
      harmonyTitle: (factor, days) =>
        `${days} Tage mit allen dreien = ${factor} XP`,
      harmonyText: (days, hours, cooldownDays) =>
        `Ein Tag zählt mit einer erledigten Gewohnheit, drei Tagebucheinträgen und einem Schritt bei einem Ziel. Nach ${days} Tagen in Folge schaltest du ihn am Level-Abzeichen ein: ${hours} Stunden lang zählt alles doppelt. Der nächste ist ${cooldownDays} Tage später möglich.`,
      challenge: 'Monatliche Herausforderung',
      madeTitle: 'Eine Herausforderung im Monat, für dich gemacht',
      made: 'Sie kommt aus einem Bereich — Gewohnheiten, Tagebuch, Ziele oder Beständigkeit — und richtet sich danach, wie es bisher lief.',
      starsTitle: 'Sterne pro Bereich',
      stars: keepPercent =>
        `Jeder Bereich hat 1 bis 5 Sterne; mehr Sterne heißen eine größere Herausforderung und eine größere Belohnung. Geschafft gibt es einen Stern dazu. Zwei Monate in Folge ohne Abschluss kosten einen, wenn der zweite unter ${keepPercent} % endet.`,
      warmUpTitle: 'Erst Aufwärmen',
      warmUp: (activeDays, inRow) =>
        `Mit weniger als ${activeDays} aktiven Tagen bekommst du leichte Aufwärm-Herausforderungen. Sie ändern deine Sterne nicht — nach ${inRow} in Folge geht aber dein stärkster Bereich um einen zurück, damit die nächsten passen.`,
      challengeXpTitle: 'Meilensteine und Monate in Folge',
      challengeXp: (m25, m50, m75) =>
        `25, 50 und 75 % bringen ${m25}, ${m50} und ${m75} XP. Geschaffte Monate in Folge erhöhen die Belohnung.`,
      trophies: 'Trophäen',
      rarityTitle: 'Vier Seltenheiten',
      rarity: (common, rare, epic, legendary) =>
        `Gewöhnliche und seltene Trophäen kommen leise neben dem Abzeichen; epische und legendäre bekommen den großen Moment. Sie bringen ${common}, ${rare}, ${epic} und ${legendary} XP.`,
      footer:
        'Alles, was du auf dem Bildschirm siehst, funktioniert so, wie es aussieht.',
    },
    homeSections: {
      insights: 'Einblicke',
      insightsPeriod: 'Letzte 4 Wochen',
      trendUp: points => `${points} Punkte besser`,
      trendUpText:
        'Du schaffst mehr von dem, was du planst, als vor einem Monat.',
      strongest: 'Stärkste Routine',
      strongestText: (name, rate) => `${name} – ${rate} % in diesem Monat.`,
      focus: 'Einen Blick wert',
      focusText: (name, rate) =>
        `${name} liegt bei ${rate} % in diesem Monat. Ein leichterer Plan könnte helfen.`,
      forYou: 'Für dich',
      write: 'Aufschreiben',
      another: 'Anderer Vorschlag',
      position: (index, count) => `${index} von ${count}`,
      customizeHint:
        'Ziehen, um die Reihenfolge zu ändern. Dein Tag bleibt immer oben.',
      names: { todayHabits: 'Heutige Routinen', insights: 'Einblicke' },
    },
    homeStats: {
      title: 'Deine Routinen',
      periods: { week: '7 Tage', month: '30 Tage', year: 'Jahr' },
      vsPrevious: (trend, points, period) => {
        const before =
          period === 'week' ? 'die Woche davor' : 'die 30 Tage davor';
        if (trend === 'same') return `Wie ${before}`;
        return `${points} ${points === 1 ? 'Punkt' : 'Punkte'} ${trend === 'up' ? 'besser' : 'schlechter'} als ${before}`;
      },
      completed: 'Erledigt',
      bonus: 'Bonus',
      planned: 'Geplant',
      bestDay: 'Bester Tag',
      today: 'Heute',
      ofPlanned: (done, planned) => `${done} von ${planned}`,
      bonusCount: count => `${count} Bonus`,
      restDay: 'Nichts geplant',
      activeDays: (active, total) => `${active} von ${total} Tagen aktiv`,
      less: 'Weniger',
      more: 'Mehr',
    },
    moments: {
      chapterOverline: 'Neues Kapitel',
      chapterLine: (from, to) => `Level ${from}–${to} liegen vor dir.`,
      streakOverline: 'Tagebuch-Serie',
      streakDays: days => `${days} Tage in Folge`,
      multiplierOverline: days => `Harmonie-Serie · ${days} Tage`,
      multiplierTitle: (factor, hours) => `${factor}× XP für ${hours} Stunden`,
      multiplierLine:
        'Du hast Routinen, Tagebuch und Ziele jeden Tag genutzt. Alles, was du jetzt verdienst, zählt doppelt.',
      letsGo: 'Los geht’s',
      welcomeBack: 'Willkommen zurück',
    },
    levels: {
      title: 'Dein Weg',
      ofTotal: total => `von ${total}`,
      range: (from, to) => `Level ${from}–${to}`,
      reached: (count, size) => `${count} von ${size} erreicht`,
      allReached: 'Alle erreicht',
      ahead: 'Liegt noch vor dir',
      here: 'Du bist hier',
      milestone: level => `Meilenstein · Level ${level}`,
      milestoneTrophy: name => `Meilenstein · Trophäe „${name}“`,
      nextMilestone: (level, left) =>
        `Nächster Meilenstein: Level ${level} · noch ${left} Level`,
      top: 'Du hast den Gipfel erreicht.',
    },
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
    journal: {
      subline: 'Drei gute Dinge am Tag.',
      gratitudeHint: 'Etwas Gutes heute',
      selfPraiseHint: 'Etwas, das du gut gemacht hast',
      bonusRoad: 'Bonusweg',
      toNextMilestone: left => `Noch ${left} bis`,
      allMilestones: 'Alle Meilensteine des Tages gesammelt.',
      anotherPrompt: 'Andere Frage',
      anotherQuote: 'Anderes Zitat',
      entries: count => (count === 1 ? '1 Eintrag' : `${count} Einträge`),
      writingLocked:
        'Schreiben geht wieder, sobald deine Serie aufgewärmt ist.',
      adPlaying: 'Hier liefe eine Werbung',
      calendarHint: 'Tippe auf einen Tag, um ihn zu lesen',
      legend: {
        complete: '3+ Einträge',
        bonus: 'Bonustag',
        partial: 'Begonnen',
        paid: 'Mit Werbung gerettet',
      },
      paidDay:
        'Eingefrorener Tag – mit Werbung gerettet, die Serie lief weiter',
      last30: 'Letzte 30 Tage',
      goalLine: 'Tagesziel',
      chartAtGoal: (days, total) => `von ${total} Tagen mit Tagesziel`,
      chartAvg: avg => `Ø ${avg} Einträge pro Tag`,
      chartHint: 'Tippe oder streiche über die Balken',
      activeDaysSub: days =>
        days === 1 ? '1 Tag mit Einträgen' : `${days} Tage mit Einträgen`,
      milestoneMeaning: {
        star: '4. Eintrag eines Tages',
        flame: '8. Eintrag eines Tages',
        crown: '13. Eintrag eines Tages',
      },
      newEntryXp: xp => `+${xp} XP`,
    },
    goals: {
      subline: 'Große Dinge, Schritt für Schritt.',
      onPace: 'Im Plan',
      ahead: days => (days === 1 ? '1 Tag voraus' : `${days} Tage voraus`),
      behind: days => (days === 1 ? '1 Tag zurück' : `${days} Tage zurück`),
      noDeadline: 'Ohne Termin',
      by: date => `bis ${date}`,
      daysLeft: days => (days === 1 ? 'noch 1 Tag' : `noch ${days} Tage`),
      neededPerWeek: amount => `${amount} pro Woche nötig`,
      yourPerWeek: amount => `bisher ${amount} pro Woche`,
      finish: date => `In diesem Tempo: ${date}`,
      shouldBe: 'Wo der Plan heute steht',
      logReading: 'Messwert eintragen',
      otherAmount: 'Andere',
      reading: 'Heutiger Messwert',
      undo: 'Rückgängig',
      logged: amount => `${amount} eingetragen`,
      milestone: percent => `${percent} % – Meilenstein erreicht`,
      noXpLeft: 'Gespeichert. XP für dieses Ziel gibt es morgen wieder.',
      paceTitle: 'Du und der Plan',
      plan: 'Plan',
      you: 'Du',
      milestones: 'Meilensteine',
      reached: date => `erreicht ${date}`,
      ideas: 'Mit einer Idee starten',
      kindCount: 'Hochzählen',
      kindCountHint: 'Nach und nach addieren – Bücher, Geld, Stunden',
      kindMeasure: 'Messen',
      kindMeasureHint: 'Messwert eintragen – Gewicht, Kontostand, Zeit',
      now: 'Jetzt',
      deadline: 'Termin',
      presets: {
        m1: '1 Monat',
        m3: '3 Monate',
        m6: '6 Monate',
        year: 'Jahresende',
        none: 'Ohne Termin',
        pick: 'Datum wählen',
      },
      inDays: days => (days === 1 ? 'morgen' : `in ${days} Tagen`),
      paceHint: (amount, unit) => `Das sind etwa ${amount} ${unit} pro Woche`,
      previewTitle: 'Dein neues Ziel',
      nextDeadline: (title, days) => `Als Nächstes: ${title} in ${days} Tagen`,
      allDone: 'Nichts fällig – genieße den Schwung.',
      doneIn: days =>
        days === 1 ? 'erreicht in 1 Tag' : `erreicht in ${days} Tagen`,
      startRequired:
        'Gib deinen aktuellen Wert ein – er muss sich vom Ziel unterscheiden.',
      targetRequired: 'Gib den Zielwert ein (0 ist erlaubt).',
      tooLarge: 'Diese Zahl ist zu groß.',
    },
    settings: {
      subline: 'Mach sie zu deiner App.',
      labLanguages: 'Das Labor spricht EN und DE; die App auch Español.',
      privacyLab: 'In der App öffnet sich hier das Einwilligungsformular.',
    },
    celebrate: {
      alsoUnlocked: 'Außerdem freigeschaltet',
      trophiesUnlocked: count => `${count} Trophäen freigeschaltet`,
      openTrophies: 'Öffnet die Trophäenhalle',
    },
    onboarding: {
      customize: 'Mach es zu deinem',
      day: 'Dein erster Tag',
      slotStart: 'Start',
      slotHabit: 'Routine',
      slotGoal: 'Ziel',
      slotGratitude: 'Dank',
      slotCheck: 'Abhaken',
      habitSmall:
        'Wähle etwas so Kleines, dass du es heute schaffst. Du kannst es jederzeit ändern.',
      gratitudeHint: 'Ein paar Worte genügen.',
      trophiesEarned: count =>
        count === 1 ? '1 Trophäe verdient' : `${count} Trophäen verdient`,
      noHabitBody:
        'Lege deine erste Gewohnheit an, wenn du bereit bist. Das ist dein Tag 1.',
    },
    trophies: {
      subline: 'Alles, was du dir verdient hast, in einem Raum.',
      wall: 'Alle Trophäen',
      filter: 'Filter',
      secret: 'Geheime Trophäe',
      secretHint: 'Manches entdeckt man besser selbst. Mach weiter.',
      collectionReward: xp => `+${xp} XP für das ganze Set`,
      collectionNote:
        'Tippe auf eine Trophäe, um zu sehen, wie du sie bekommst.',
      nextLoyalty: (days, name) =>
        days === 1
          ? `Noch 1 aktiver Tag bis ${name}`
          : `Noch ${days} aktive Tage bis ${name}`,
      ofTotal: (count, total) => `${count} von ${total}`,
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
