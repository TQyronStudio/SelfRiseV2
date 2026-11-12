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
  /** An active XP multiplier (harmony streak) — the level panel shows it. */
  multiplier: { factor: 2, minutesLeft: 14 * 60 + 20 },
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
    multiplier: (factor: number) => string;
    timeLeft: (value: number, unit: 'h' | 'min') => string;
    allLevels: string;
    close: string;
  };
  /** The monthly challenge's detail (ChallengeDetailConcept.tsx). */
  challenge: {
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
    moments: Record<'milestone' | 'finish' | 'kept' | 'lost', string>;
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
    toNextMilestone: (left: number, emoji: string) => string;
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
      multiplier: factor => `${factor}× XP multiplier`,
      timeLeft: (value, unit) => `${value} ${unit} left`,
      allLevels: 'All levels',
      close: 'Close level details',
    },
    challenge: {
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
        finish: 'Finished',
        kept: 'Month end · star kept',
        lost: 'Month end · star lost',
      },
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
      toNextMilestone: (left, emoji) =>
        left === 1 ? `1 more to ${emoji}` : `${left} more to ${emoji}`,
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
      multiplier: factor => `${factor}× XP-Multiplikator`,
      timeLeft: (value, unit) =>
        `noch ${value} ${unit === 'h' ? 'Std.' : 'Min.'}`,
      allLevels: 'Alle Level',
      close: 'Level-Details schließen',
    },
    challenge: {
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
        finish: 'Geschafft',
        kept: 'Monatsende · Stern bleibt',
        lost: 'Monatsende · Stern weg',
      },
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
      toNextMilestone: (left, emoji) =>
        left === 1 ? `Noch 1 bis ${emoji}` : `Noch ${left} bis ${emoji}`,
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
