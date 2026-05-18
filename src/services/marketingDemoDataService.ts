import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { getDatabase } from './database/init';
import { getCurrentLevel, getXPRequiredForLevel } from './levelCalculation';
import { CORE_ACHIEVEMENTS } from '../constants/achievementCatalog';
import { AchievementCategory, AchievementRarity, XPSourceType } from '../types/gamification';
import { DayOfWeek, HabitColor, HabitIcon } from '../types/common';
import { GoalCategory, GoalStatus } from '../types/goal';
import { addDays, formatDateToString, getDayOfWeek, subtractDays, today } from '../utils/date';
import { setMarketingDemoModeEnabled } from './marketingDemoModeService';

type DemoHabit = {
  id: string;
  color: HabitColor;
  icon: HabitIcon;
  scheduledDays: DayOfWeek[];
  order: number;
};

type DemoGoal = {
  id: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  category: GoalCategory;
  order: number;
};

type DemoHabitText = {
  name: string;
  description: string;
};

type DemoGoalText = {
  title: string;
  description: string;
  unit?: string;
};

type MarketingDemoContent = {
  locale: MarketingDemoLocale;
  habits: Record<string, DemoHabitText>;
  goals: Record<string, DemoGoalText>;
  gratitudeSamples: string[];
  notes: {
    habitCompletion: string;
    habitBonus: string;
    goalProgress: string;
    xpDailyMomentum: string;
    goalMilestone: (percentage: number) => string;
  };
  challenge: {
    title: string;
    description: string;
    habitRequirement: string;
    journalRequirement: string;
    goalRequirement: string;
    bonusConditions: string[];
    tags: string[];
  };
};

export type MarketingDemoLocale = 'en' | 'de' | 'es';

const demoLevel = 16;
const demoLevelProgressXP = 1180;

const legacyGamificationKeys = {
  TOTAL_XP: 'gamification_total_xp',
  XP_TRANSACTIONS: 'gamification_xp_transactions',
  XP_BY_SOURCE: 'gamification_xp_by_source',
  DAILY_XP_TRACKING: 'gamification_daily_xp',
  LAST_ACTIVITY: 'gamification_last_activity',
  XP_MULTIPLIER: 'gamification_xp_multiplier',
  LEVEL_UP_HISTORY: 'gamification_level_up_history',
} as const;

const allDays = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const weekdays = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

const demoHabits: DemoHabit[] = [
  {
    id: 'marketing-habit-morning-walk',
    color: HabitColor.BLUE,
    icon: HabitIcon.FITNESS,
    scheduledDays: allDays,
    order: 0,
  },
  {
    id: 'marketing-habit-water',
    color: HabitColor.TEAL,
    icon: HabitIcon.WATER,
    scheduledDays: allDays,
    order: 1,
  },
  {
    id: 'marketing-habit-reading',
    color: HabitColor.PURPLE,
    icon: HabitIcon.BOOK,
    scheduledDays: weekdays,
    order: 2,
  },
  {
    id: 'marketing-habit-meditation',
    color: HabitColor.GREEN,
    icon: HabitIcon.MEDITATION,
    scheduledDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY, DayOfWeek.SUNDAY],
    order: 3,
  },
  {
    id: 'marketing-habit-sleep',
    color: HabitColor.ORANGE,
    icon: HabitIcon.SLEEP,
    scheduledDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, DayOfWeek.SATURDAY],
    order: 4,
  },
];

const demoGoals: DemoGoal[] = [
  {
    id: 'marketing-goal-books',
    unit: 'books',
    targetValue: 12,
    currentValue: 8,
    category: GoalCategory.LEARNING,
    order: 0,
  },
  {
    id: 'marketing-goal-run',
    unit: 'km',
    targetValue: 100,
    currentValue: 64,
    category: GoalCategory.HEALTH,
    order: 1,
  },
  {
    id: 'marketing-goal-save',
    unit: '$',
    targetValue: 5000,
    currentValue: 2750,
    category: GoalCategory.FINANCIAL,
    order: 2,
  },
  {
    id: 'marketing-goal-spanish',
    unit: 'sessions',
    targetValue: 100,
    currentValue: 42,
    category: GoalCategory.PERSONAL,
    order: 3,
  },
];

const demoContent: Record<MarketingDemoLocale, MarketingDemoContent> = {
  en: {
    locale: 'en',
    habits: {
      'marketing-habit-morning-walk': {
        name: 'Morning Walk',
        description: 'Start the day with movement, fresh air, and a clear head.',
      },
      'marketing-habit-water': {
        name: 'Drink Water',
        description: 'Hydrate steadily throughout the day.',
      },
      'marketing-habit-reading': {
        name: 'Read 10 Pages',
        description: 'Build knowledge one quiet block at a time.',
      },
      'marketing-habit-meditation': {
        name: 'Meditate',
        description: 'Five minutes of calm attention.',
      },
      'marketing-habit-sleep': {
        name: 'Sleep Early',
        description: 'Protect recovery with a consistent bedtime.',
      },
    },
    goals: {
      'marketing-goal-books': {
        title: 'Read 12 Books',
        description: 'A focused reading goal for the year.',
      },
      'marketing-goal-run': {
        title: 'Run 100 km',
        description: 'Build endurance with consistent weekly mileage.',
      },
      'marketing-goal-save': {
        title: 'Save $5,000',
        description: 'Grow a calm, resilient emergency fund.',
        unit: '$',
      },
      'marketing-goal-spanish': {
        title: 'Spanish Practice',
        description: 'Reach 100 focused study sessions.',
      },
    },
    gratitudeSamples: [
      'A calm morning and a clear plan for the day.',
      'The quiet confidence that comes from keeping promises to myself.',
      'A short walk that reset my mood.',
      'Progress that feels small in the moment but obvious in the graph.',
      'Healthy food, good sleep, and another chance to improve.',
      'A meaningful conversation that stayed with me.',
      'Finishing one hard thing before lunch.',
      'The feeling of seeing a streak continue.',
      'A book that gave me exactly the idea I needed.',
      'Enough energy left for tomorrow.',
      'Choosing patience instead of rushing.',
      'The little moment when discipline turns into pride.',
      'A peaceful evening without unnecessary noise.',
    ],
    notes: {
      habitCompletion: 'Marketing demo completion',
      habitBonus: 'Bonus effort. This can cover a missed scheduled day via Smart Make-up.',
      goalProgress: 'Marketing demo progress update',
      xpDailyMomentum: 'Marketing demo daily momentum',
      goalMilestone: percentage => `${percentage}% milestone`,
    },
    challenge: {
      title: 'Balanced Momentum',
      description: 'Complete habits, journal entries, and goal updates in one strong month.',
      habitRequirement: 'Complete 75 habits this month',
      journalRequirement: 'Write 90 gratitude entries',
      goalRequirement: 'Log 12 goal progress updates',
      bonusConditions: ['Perfect balance bonus', 'Weekly consistency bonus'],
      tags: ['marketing', 'balance', 'make-up-ready'],
    },
  },
  de: {
    locale: 'de',
    habits: {
      'marketing-habit-morning-walk': {
        name: 'Morgenspaziergang',
        description: 'Starte den Tag mit Bewegung, frischer Luft und einem klaren Kopf.',
      },
      'marketing-habit-water': {
        name: 'Wasser trinken',
        description: 'Trinke über den Tag verteilt genug Wasser.',
      },
      'marketing-habit-reading': {
        name: '10 Seiten lesen',
        description: 'Baue Wissen in ruhigen, fokussierten Einheiten auf.',
      },
      'marketing-habit-meditation': {
        name: 'Meditieren',
        description: 'Fünf Minuten ruhige Aufmerksamkeit.',
      },
      'marketing-habit-sleep': {
        name: 'Früh schlafen',
        description: 'Schütze deine Erholung mit einer festen Schlafenszeit.',
      },
    },
    goals: {
      'marketing-goal-books': {
        title: '12 Bücher lesen',
        description: 'Ein klares Leseziel für dieses Jahr.',
      },
      'marketing-goal-run': {
        title: '100 km laufen',
        description: 'Baue Ausdauer mit regelmäßigen Laufeinheiten auf.',
      },
      'marketing-goal-save': {
        title: '5.000 € sparen',
        description: 'Baue einen ruhigen, stabilen Notgroschen auf.',
        unit: '€',
      },
      'marketing-goal-spanish': {
        title: 'Spanisch üben',
        description: 'Erreiche 100 fokussierte Lerneinheiten.',
      },
    },
    gratitudeSamples: [
      'Ein ruhiger Morgen und ein klarer Plan für den Tag.',
      'Das leise Vertrauen, das entsteht, wenn ich Versprechen an mich selbst halte.',
      'Ein kurzer Spaziergang, der meine Stimmung neu ausgerichtet hat.',
      'Fortschritt, der im Moment klein wirkt, aber im Verlauf sichtbar wird.',
      'Gutes Essen, erholsamer Schlaf und eine neue Chance, besser zu werden.',
      'Ein wertvolles Gespräch, das mir im Kopf geblieben ist.',
      'Eine schwierige Aufgabe noch vor dem Mittag erledigt.',
      'Das gute Gefühl, wenn eine Serie weiterläuft.',
      'Ein Buch, das mir genau den richtigen Gedanken gegeben hat.',
      'Genug Energie für morgen.',
      'Geduld gewählt statt Eile.',
      'Der kleine Moment, in dem Disziplin zu Stolz wird.',
      'Ein friedlicher Abend ohne unnötigen Lärm.',
    ],
    notes: {
      habitCompletion: 'Marketing-Demo abgeschlossen',
      habitBonus: 'Bonus-Einsatz. Kann mit Smart Make-up einen verpassten geplanten Tag ausgleichen.',
      goalProgress: 'Fortschritt für die Marketing-Demo',
      xpDailyMomentum: 'Täglicher Schwung der Marketing-Demo',
      goalMilestone: percentage => `${percentage}%-Meilenstein`,
    },
    challenge: {
      title: 'Ausgewogener Schwung',
      description: 'Erledige Gewohnheiten, Journaleinträge und Zielfortschritte in einem starken Monat.',
      habitRequirement: 'Schließe diesen Monat 75 Gewohnheiten ab',
      journalRequirement: 'Schreibe 90 Dankbarkeitseinträge',
      goalRequirement: 'Protokolliere 12 Zielfortschritte',
      bonusConditions: ['Bonus für perfekte Balance', 'Bonus für wöchentliche Konstanz'],
      tags: ['marketing', 'balance', 'make-up-bereit'],
    },
  },
  es: {
    locale: 'es',
    habits: {
      'marketing-habit-morning-walk': {
        name: 'Paseo matutino',
        description: 'Empieza el día con movimiento, aire fresco y una mente clara.',
      },
      'marketing-habit-water': {
        name: 'Beber agua',
        description: 'Mantén una buena hidratación durante todo el día.',
      },
      'marketing-habit-reading': {
        name: 'Leer 10 páginas',
        description: 'Construye conocimiento en bloques tranquilos y enfocados.',
      },
      'marketing-habit-meditation': {
        name: 'Meditar',
        description: 'Cinco minutos de atención tranquila.',
      },
      'marketing-habit-sleep': {
        name: 'Dormir temprano',
        description: 'Protege tu recuperación con una hora de sueño constante.',
      },
    },
    goals: {
      'marketing-goal-books': {
        title: 'Leer 12 libros',
        description: 'Un objetivo de lectura claro para este año.',
        unit: 'libros',
      },
      'marketing-goal-run': {
        title: 'Correr 100 km',
        description: 'Desarrolla resistencia con entrenamientos semanales constantes.',
      },
      'marketing-goal-save': {
        title: 'Ahorrar 5.000 €',
        description: 'Construye un fondo de emergencia tranquilo y estable.',
        unit: '€',
      },
      'marketing-goal-spanish': {
        title: 'Practicar español',
        description: 'Completa 100 sesiones de estudio enfocadas.',
        unit: 'sesiones',
      },
    },
    gratitudeSamples: [
      'Una mañana tranquila y un plan claro para el día.',
      'La confianza serena de cumplir las promesas que me hago.',
      'Un paseo corto que cambió mi estado de ánimo.',
      'Un progreso que parece pequeño ahora, pero se ve claro en el gráfico.',
      'Buena comida, buen descanso y otra oportunidad para mejorar.',
      'Una conversación valiosa que se quedó conmigo.',
      'Terminar una tarea difícil antes del mediodía.',
      'La satisfacción de mantener una racha viva.',
      'Un libro que me dio justo la idea que necesitaba.',
      'Energía suficiente para mañana.',
      'Elegir paciencia en lugar de prisa.',
      'Ese pequeño momento en que la disciplina se convierte en orgullo.',
      'Una tarde tranquila sin ruido innecesario.',
    ],
    notes: {
      habitCompletion: 'Completado para la demo de marketing',
      habitBonus: 'Esfuerzo extra. Puede cubrir un día programado perdido con Smart Make-up.',
      goalProgress: 'Progreso para la demo de marketing',
      xpDailyMomentum: 'Impulso diario de la demo de marketing',
      goalMilestone: percentage => `Hito del ${percentage}%`,
    },
    challenge: {
      title: 'Impulso equilibrado',
      description: 'Completa hábitos, entradas del diario y avances de objetivos en un mes fuerte.',
      habitRequirement: 'Completa 75 hábitos este mes',
      journalRequirement: 'Escribe 90 entradas de gratitud',
      goalRequirement: 'Registra 12 avances de objetivos',
      bonusConditions: ['Bonus por equilibrio perfecto', 'Bonus por constancia semanal'],
      tags: ['marketing', 'equilibrio', 'make-up-listo'],
    },
  },
};

const getDemoContent = (locale: MarketingDemoLocale): MarketingDemoContent => demoContent[locale] ?? demoContent.en;

const unlockedAchievementIds = [
  'first-habit',
  'habit-builder',
  'century-club',
  'streak-champion',
  'multi-tasker',
  'first-journal',
  'deep-thinker',
  'journal-enthusiast',
  'grateful-heart',
  'bonus-seeker',
  'first-goal',
  'goal-getter',
  'progress-tracker',
  'weekly-warrior',
  'monthly-master',
  'level-up',
  'selfrise-expert',
  'first-star',
  'five-stars',
  'flame-achiever',
  'crown-royalty',
  'bonus-week',
];

const id = (prefix: string, value: string | number) => `marketing-${prefix}-${value}`;
const asTimestamp = (dateString: string, hour = 9, minute = 0): number =>
  new Date(`${dateString}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`).getTime();
const currentMonth = () => today().substring(0, 7);
const monthStart = () => `${currentMonth()}-01`;
const getDemoTotalXP = () => getXPRequiredForLevel(demoLevel) + demoLevelProgressXP;

const getDateRange = (daysBack: number): string[] => {
  const end = today();
  return Array.from({ length: daysBack }, (_, index) => subtractDays(end, daysBack - index - 1));
};

const shouldCompleteHabit = (habit: DemoHabit, dateString: string): boolean => {
  const day = getDayOfWeek(new Date(`${dateString}T12:00:00`));

  if (!habit.scheduledDays.includes(day)) {
    return false;
  }

  const dayOfMonth = Number(dateString.slice(-2));

  if (habit.id === 'marketing-habit-reading' && [7, 14].includes(dayOfMonth)) {
    return false;
  }

  if (habit.id === 'marketing-habit-meditation' && [10, 17].includes(dayOfMonth)) {
    return false;
  }

  if (habit.id === 'marketing-habit-sleep' && [12, 19].includes(dayOfMonth)) {
    return false;
  }

  return true;
};

const getBonusDatesForHabit = (habit: DemoHabit, dates: string[]): string[] => {
  const missedScheduledDates = dates.filter(dateString => {
    const day = getDayOfWeek(new Date(`${dateString}T12:00:00`));
    return habit.scheduledDays.includes(day) && !shouldCompleteHabit(habit, dateString);
  });

  const bonusDates = missedScheduledDates
    .map(missedDate => {
      const missedIndex = dates.indexOf(missedDate);
      const weekWindow = dates.slice(missedIndex + 1, missedIndex + 7);

      return weekWindow.find(dateString => {
        const day = getDayOfWeek(new Date(`${dateString}T12:00:00`));
        return !habit.scheduledDays.includes(day);
      });
    })
    .filter((dateString): dateString is string => Boolean(dateString));

  return [...new Set(bonusDates)].slice(0, 3);
};

const createEmptyXPBySource = (): Record<XPSourceType, number> => ({
  [XPSourceType.HABIT_COMPLETION]: 0,
  [XPSourceType.HABIT_BONUS]: 0,
  [XPSourceType.HABIT_STREAK_MILESTONE]: 0,
  [XPSourceType.JOURNAL_ENTRY]: 0,
  [XPSourceType.JOURNAL_BONUS]: 0,
  [XPSourceType.JOURNAL_BONUS_MILESTONE]: 0,
  [XPSourceType.JOURNAL_STREAK_MILESTONE]: 0,
  [XPSourceType.GOAL_PROGRESS]: 0,
  [XPSourceType.GOAL_COMPLETION]: 0,
  [XPSourceType.GOAL_MILESTONE]: 0,
  [XPSourceType.RECOMMENDATION_FOLLOW]: 0,
  [XPSourceType.ACHIEVEMENT_UNLOCK]: 0,
  [XPSourceType.MONTHLY_CHALLENGE]: 0,
  [XPSourceType.XP_MULTIPLIER_BONUS]: 0,
  [XPSourceType.LOYALTY_MILESTONE]: 0,
  [XPSourceType.DAILY_ACTIVITY]: 0,
  [XPSourceType.INACTIVE_USER_RETURN]: 0,
});

async function clearLegacyGamificationData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(legacyGamificationKeys));
}

async function ensureMarketingDemoSchema(): Promise<void> {
  const db = getDatabase();
  const tableInfo = await db.getAllAsync(`PRAGMA table_info(challenge_daily_snapshots)`);
  const columns = new Set(tableInfo.map((column: any) => column.name));

  if (tableInfo.length > 0 && !columns.has('daily_contributions')) {
    await db.execAsync(`ALTER TABLE challenge_daily_snapshots ADD COLUMN daily_contributions TEXT;`);
  }
}

async function clearDemoData(): Promise<void> {
  const db = getDatabase();
  const tables = [
    'challenge_previews',
    'challenge_error_log',
    'challenge_state_history',
    'challenge_history',
    'user_challenge_ratings',
    'challenge_lifecycle_state',
    'challenge_weekly_breakdown',
    'challenge_daily_snapshots',
    'challenge_requirements',
    'monthly_challenges',
    'achievement_unlock_events',
    'achievement_progress',
    'achievement_stats_cache',
    'level_up_history',
    'xp_state',
    'xp_daily_summary',
    'xp_transactions',
    'xp_multipliers',
    'daily_activity_log',
    'loyalty_state',
    'goal_progress',
    'goal_milestones',
    'goals',
    'habit_completions',
    'habit_schedule_history',
    'habits',
    'warm_up_payments',
    'journal_entries',
  ];

  for (const table of tables) {
    await db.runAsync(`DELETE FROM ${table}`);
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO streak_state (
      id, current_streak, longest_streak, last_entry_date, streak_start_date,
      frozen_days, is_frozen, can_recover_with_ad, streak_before_freeze,
      just_unfroze_today, star_count, flame_count, crown_count,
      auto_reset_timestamp, auto_reset_reason, updated_at
    ) VALUES (1, 0, 0, NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, NULL, ?)`,
    [Date.now()]
  );

  const now = Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO xp_state (id, total_xp, current_level, last_activity, updated_at)
     VALUES (1, 0, 1, ?, ?)`,
    [now, now]
  );
}

async function seedHabits(content: MarketingDemoContent): Promise<number> {
  const db = getDatabase();
  const now = Date.now();
  const dates = getDateRange(30);
  const firstDate = dates[0] ?? today();
  let completionCount = 0;

  for (const habit of demoHabits) {
    const habitText = content.habits[habit.id] ?? demoContent.en.habits[habit.id]!;
    const createdAt = asTimestamp(dates[0]!, 7, habit.order);

    await db.runAsync(
      `INSERT INTO habits (
        id, name, color, icon, scheduled_days, order_index,
        is_active, description, created_at, updated_at, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 0)`,
      [
        habit.id,
        habitText.name,
        habit.color,
        habit.icon,
        JSON.stringify(habit.scheduledDays),
        habit.order,
        habitText.description,
        createdAt,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO habit_schedule_history (
        id, habit_id, scheduled_days, effective_from_date, created_at
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        `${habit.id}-schedule`,
        habit.id,
        JSON.stringify(habit.scheduledDays),
        firstDate,
        createdAt,
      ]
    );

    for (const dateString of dates) {
      if (!shouldCompleteHabit(habit, dateString)) {
        continue;
      }

      completionCount += 1;
      const completedAt = asTimestamp(dateString, 8 + (habit.order % 4), 10 + habit.order);

      await db.runAsync(
        `INSERT INTO habit_completions (
          id, habit_id, date, completed, is_bonus, completed_at, note,
          is_converted, converted_from_date, converted_to_date, created_at, updated_at
        ) VALUES (?, ?, ?, 1, 0, ?, ?, 0, NULL, NULL, ?, ?)`,
        [
          id('completion', `${habit.id}-${dateString}`),
          habit.id,
          dateString,
          completedAt,
          content.notes.habitCompletion,
          completedAt,
          completedAt,
        ]
      );
    }

    for (const dateString of getBonusDatesForHabit(habit, dates)) {
      completionCount += 1;
      const completedAt = asTimestamp(dateString, 17, 20 + habit.order);

      await db.runAsync(
        `INSERT INTO habit_completions (
          id, habit_id, date, completed, is_bonus, completed_at, note,
          is_converted, converted_from_date, converted_to_date, created_at, updated_at
        ) VALUES (?, ?, ?, 1, 1, ?, ?, 0, NULL, NULL, ?, ?)`,
        [
          id('bonus-completion', `${habit.id}-${dateString}`),
          habit.id,
          dateString,
          completedAt,
          content.notes.habitBonus,
          completedAt,
          completedAt,
        ]
      );
    }
  }

  return completionCount;
}

async function seedJournal(content: MarketingDemoContent): Promise<number> {
  const db = getDatabase();
  const dates = getDateRange(24);
  let entryCount = 0;

  for (const dateString of dates) {
    const isToday = dateString === today();
    const dayOfMonth = Number(dateString.slice(-2));
    const entriesForDay = isToday ? 13 : dayOfMonth % 7 === 0 ? 8 : dayOfMonth % 5 === 0 ? 5 : 3;

    for (let entryNumber = 1; entryNumber <= entriesForDay; entryNumber += 1) {
      entryCount += 1;
      const createdAt = asTimestamp(dateString, 19, entryNumber);

      await db.runAsync(
        `INSERT INTO journal_entries (
          id, text, type, date, gratitude_number, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id('journal', `${dateString}-${entryNumber}`),
          content.gratitudeSamples[(entryNumber + dayOfMonth) % content.gratitudeSamples.length] ?? content.gratitudeSamples[0]!,
          entryNumber % 4 === 0 ? 'self-praise' : 'gratitude',
          dateString,
          entryNumber,
          createdAt,
          createdAt,
        ]
      );
    }
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO streak_state (
      id, current_streak, longest_streak, last_entry_date, streak_start_date,
      frozen_days, is_frozen, can_recover_with_ad, streak_before_freeze,
      just_unfroze_today, star_count, flame_count, crown_count,
      auto_reset_timestamp, auto_reset_reason, updated_at
    ) VALUES (1, ?, ?, ?, ?, 0, 0, 0, NULL, 0, ?, ?, ?, NULL, NULL, ?)`,
    [
      dates.length,
      31,
      today(),
      dates[0] ?? today(),
      9,
      4,
      1,
      Date.now(),
    ]
  );

  return entryCount;
}

async function seedGoals(content: MarketingDemoContent): Promise<number> {
  const db = getDatabase();
  const now = Date.now();
  const startDate = subtractDays(today(), 60);
  const targetDate = formatDateToString(addDays(new Date(), 120) as Date);
  let progressEntries = 0;

  for (const goal of demoGoals) {
    const goalText = content.goals[goal.id] ?? demoContent.en.goals[goal.id]!;
    await db.runAsync(
      `INSERT INTO goals (
        id, title, description, unit, target_value, current_value, target_date,
        category, status, order_index, start_date, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        goal.id,
        goalText.title,
        goalText.description,
        goalText.unit ?? goal.unit,
        goal.targetValue,
        goal.currentValue,
        targetDate,
        goal.category,
        GoalStatus.ACTIVE,
        goal.order,
        startDate,
        asTimestamp(startDate, 10, goal.order),
        now,
      ]
    );

    const milestones = [0.25, 0.5, 0.75, 1].map((ratio, index) => ({
      id: id('goal-milestone', `${goal.id}-${index + 1}`),
      value: Math.round(goal.targetValue * ratio),
      description: content.notes.goalMilestone(Math.round(ratio * 100)),
      isCompleted: goal.currentValue >= goal.targetValue * ratio,
    }));

    for (const milestone of milestones) {
      await db.runAsync(
        `INSERT INTO goal_milestones (
          id, goal_id, value, description, is_completed, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          milestone.id,
          goal.id,
          milestone.value,
          milestone.description,
          milestone.isCompleted ? 1 : 0,
          milestone.isCompleted ? now : null,
        ]
      );
    }

    const increments = [0.18, 0.34, 0.51, 0.68, 0.84, 1];
    for (const [index, ratio] of increments.entries()) {
      progressEntries += 1;
      const dateString = subtractDays(today(), (increments.length - index - 1) * 6 + goal.order);
      const createdAt = asTimestamp(dateString, 18, index + goal.order);
      const value = Math.round(goal.currentValue * ratio * 10) / 10;

      await db.runAsync(
        `INSERT INTO goal_progress (
          id, goal_id, value, date, note, progress_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'set', ?, ?)`,
        [
          id('goal-progress', `${goal.id}-${index + 1}`),
          goal.id,
          value,
          dateString,
          content.notes.goalProgress,
          createdAt,
          createdAt,
        ]
      );
    }
  }

  return progressEntries;
}

async function seedXPAndActivity(content: MarketingDemoContent): Promise<void> {
  const db = getDatabase();
  const dates = getDateRange(30);
  const totalXP = getDemoTotalXP();
  const currentLevel = getCurrentLevel(totalXP);
  const now = Date.now();

  await db.runAsync(
    `INSERT OR REPLACE INTO xp_state (id, total_xp, current_level, last_activity, updated_at)
     VALUES (1, ?, ?, ?, ?)`,
    [totalXP, currentLevel, now, now]
  );

  for (const [index, dateString] of dates.entries()) {
    const habitXP = 70 + (index % 4) * 10;
    const journalXP = 45 + (index % 5) * 15;
    const goalXP = index % 3 === 0 ? 35 : 0;
    const achievementXP = index % 9 === 0 ? 100 : 0;
    const dailyTotal = habitXP + journalXP + goalXP + achievementXP;
    const timestamp = asTimestamp(dateString, 20, index % 60);

    await db.runAsync(
      `INSERT INTO xp_daily_summary (
        date, total_xp, habit_xp, journal_xp, goal_xp,
        achievement_xp, transaction_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dateString, dailyTotal, habitXP, journalXP, goalXP, achievementXP, 3 + (goalXP > 0 ? 1 : 0), timestamp]
    );

    await db.runAsync(
      `INSERT INTO xp_transactions (
        id, amount, source, source_id, timestamp, description, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id('xp', dateString),
        dailyTotal,
        XPSourceType.DAILY_ACTIVITY,
        dateString,
        timestamp,
        content.notes.xpDailyMomentum,
        JSON.stringify({ habitXP, journalXP, goalXP, achievementXP }),
      ]
    );

    await db.runAsync(
      `INSERT OR REPLACE INTO daily_activity_log (
        date, has_habit_activity, has_journal_activity, has_goal_activity,
        habit_completions, journal_entries, goal_progress_updates
      ) VALUES (?, 1, 1, ?, ?, ?, ?)`,
      [dateString, goalXP > 0 ? 1 : 0, 3 + (index % 3), 3 + (index % 5), goalXP > 0 ? 1 : 0]
    );
  }

  for (let level = 2; level <= currentLevel; level += 1) {
    const timestamp = asTimestamp(subtractDays(today(), currentLevel - level), 21, level % 60);
    await db.runAsync(
      `INSERT INTO level_up_history (
        id, level, timestamp, total_xp_at_levelup, is_milestone
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        id('level-up', level),
        level,
        timestamp,
        getXPRequiredForLevel(level),
        [5, 10, 15, 25, 50].includes(level) ? 1 : 0,
      ]
    );
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO loyalty_state (
      id, total_active_days, current_streak, longest_streak,
      last_active_date, milestones_unlocked, updated_at
    ) VALUES (1, 74, 30, 46, ?, ?, ?)`,
    [today(), JSON.stringify(['loyalty-first-week', 'loyalty-two-weeks-strong']), now]
  );
}

async function seedLegacyGamificationData(content: MarketingDemoContent): Promise<void> {
  const dates = getDateRange(30);
  const totalXP = getDemoTotalXP();
  const currentLevel = getCurrentLevel(totalXP);
  const xpBySource = createEmptyXPBySource();
  const transactions: Array<{
    id: string;
    amount: number;
    source: XPSourceType;
    sourceId: string;
    description: string;
    date: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const [index, dateString] of dates.entries()) {
    const habitXP = 70 + (index % 4) * 10;
    const journalXP = 45 + (index % 5) * 15;
    const goalXP = index % 3 === 0 ? 35 : 0;
    const achievementXP = index % 9 === 0 ? 100 : 0;
    const dailyTotal = habitXP + journalXP + goalXP + achievementXP;
    const timestamp = asTimestamp(dateString, 20, index % 60);

    xpBySource[XPSourceType.HABIT_COMPLETION] += habitXP;
    xpBySource[XPSourceType.JOURNAL_ENTRY] += journalXP;
    xpBySource[XPSourceType.GOAL_PROGRESS] += goalXP;
    xpBySource[XPSourceType.ACHIEVEMENT_UNLOCK] += achievementXP;

    transactions.push({
      id: id('xp', dateString),
      amount: dailyTotal,
      source: XPSourceType.DAILY_ACTIVITY,
      sourceId: dateString,
      description: content.notes.xpDailyMomentum,
      date: dateString,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
    });
  }

  const todayTransaction = transactions.find(transaction => transaction.date === today());
  const dailyXPData = {
    date: today(),
    totalXP: todayTransaction?.amount ?? 0,
    xpBySource: createEmptyXPBySource(),
    transactionCount: todayTransaction ? 1 : 0,
    lastTransactionTime: todayTransaction?.createdAt.getTime() ?? 0,
    journalEntryCount: todayTransaction ? 3 : 0,
    goalTransactions: {},
  };

  const levelUpHistory = Array.from({ length: currentLevel - 1 }, (_, index) => {
    const level = index + 2;
    const date = subtractDays(today(), currentLevel - level);
    return {
      id: id('level-up', level),
      timestamp: new Date(asTimestamp(date, 21, level % 60)),
      date,
      previousLevel: level - 1,
      newLevel: level,
      totalXPAtLevelUp: getXPRequiredForLevel(level),
      triggerSource: XPSourceType.DAILY_ACTIVITY,
      isMilestone: [5, 10, 15, 25, 50].includes(level),
      shown: true,
    };
  });

  await AsyncStorage.multiSet([
    [legacyGamificationKeys.TOTAL_XP, String(totalXP)],
    [legacyGamificationKeys.XP_TRANSACTIONS, JSON.stringify(transactions)],
    [legacyGamificationKeys.XP_BY_SOURCE, JSON.stringify(xpBySource)],
    [legacyGamificationKeys.DAILY_XP_TRACKING, JSON.stringify(dailyXPData)],
    [legacyGamificationKeys.LAST_ACTIVITY, today()],
    [legacyGamificationKeys.XP_MULTIPLIER, JSON.stringify(null)],
    [legacyGamificationKeys.LEVEL_UP_HISTORY, JSON.stringify(levelUpHistory)],
  ]);
}

async function seedAchievements(): Promise<void> {
  const db = getDatabase();
  const now = Date.now();
  const selected = CORE_ACHIEVEMENTS.filter(achievement => unlockedAchievementIds.includes(achievement.id));
  const byCategory: Record<AchievementCategory, number> = {
    [AchievementCategory.HABITS]: 0,
    [AchievementCategory.JOURNAL]: 0,
    [AchievementCategory.GOALS]: 0,
    [AchievementCategory.CONSISTENCY]: 0,
    [AchievementCategory.MASTERY]: 0,
    [AchievementCategory.SPECIAL]: 0,
  };
  const byRarity: Record<AchievementRarity, number> = {
    [AchievementRarity.COMMON]: 0,
    [AchievementRarity.RARE]: 0,
    [AchievementRarity.EPIC]: 0,
    [AchievementRarity.LEGENDARY]: 0,
  };

  for (const [index, achievement] of selected.entries()) {
    const unlockedAt = asTimestamp(subtractDays(today(), selected.length - index), 15, index % 60);
    byCategory[achievement.category] += 1;
    byRarity[achievement.rarity] += 1;

    await db.runAsync(
      `INSERT OR REPLACE INTO achievement_progress (
        achievement_id, current_value, target_value, unlocked,
        unlocked_at, xp_awarded, updated_at
      ) VALUES (?, ?, ?, 1, ?, ?, ?)`,
      [
        achievement.id,
        achievement.condition.target,
        achievement.condition.target,
        unlockedAt,
        achievement.xpReward,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO achievement_unlock_events (
        id, achievement_id, unlocked_at, xp_awarded, category
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        id('achievement-event', achievement.id),
        achievement.id,
        unlockedAt,
        achievement.xpReward,
        achievement.category,
      ]
    );
  }

  const totalXP = selected.reduce((sum, achievement) => sum + achievement.xpReward, 0);
  await db.runAsync(
    `INSERT OR REPLACE INTO achievement_stats_cache (
      id, total_unlocked, total_xp_earned, by_category, by_rarity, last_updated
    ) VALUES (1, ?, ?, ?, ?, ?)`,
    [selected.length, totalXP, JSON.stringify(byCategory), JSON.stringify(byRarity), now]
  );
}

async function seedMonthlyChallenge(content: MarketingDemoContent): Promise<void> {
  const db = getDatabase();
  const now = Date.now();
  const challengeId = 'marketing-challenge-balanced-month';
  const month = currentMonth();
  const startDate = monthStart();
  const dates = getDateRange(18);
  const requirements = [
    {
      id: `${challengeId}-habits`,
      type: 'habits',
      description: content.challenge.habitRequirement,
      trackingKey: 'habit_completions',
      target: 75,
      current: 58,
      weeklyTarget: 19,
      dailyTarget: 3,
    },
    {
      id: `${challengeId}-journal`,
      type: 'journal',
      description: content.challenge.journalRequirement,
      trackingKey: 'journal_entries',
      target: 90,
      current: 71,
      weeklyTarget: 23,
      dailyTarget: 3,
    },
    {
      id: `${challengeId}-goals`,
      type: 'goals',
      description: content.challenge.goalRequirement,
      trackingKey: 'goal_progress_updates',
      target: 12,
      current: 8,
      weeklyTarget: 3,
      dailyTarget: 1,
    },
  ];

  await db.runAsync(
    `INSERT INTO monthly_challenges (
      id, month, category, template_id, title, description,
      star_level, base_xp_reward, status, progress,
      created_at, completed_at, expired_at, updated_at,
      generation_context, bonus_conditions, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NULL, NULL, ?, ?, ?, ?)`,
    [
      challengeId,
      month,
      AchievementCategory.CONSISTENCY,
      'marketing-balanced-month',
      content.challenge.title,
      content.challenge.description,
      4,
      1688,
      74,
      asTimestamp(startDate, 8, 0),
      now,
      JSON.stringify({ dataQuality: 'complete', totalActiveDays: 74, locale: content.locale }),
      JSON.stringify(content.challenge.bonusConditions),
      JSON.stringify(content.challenge.tags),
    ]
  );

  for (const requirement of requirements) {
    await db.runAsync(
      `INSERT INTO challenge_requirements (
        id, challenge_id, requirement_type, description, tracking_key,
        target_value, current_value, progress_percentage,
        weekly_target, daily_target, milestones, milestone_statuses, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requirement.id,
        challengeId,
        requirement.type,
        requirement.description,
        requirement.trackingKey,
        requirement.target,
        requirement.current,
        Math.round((requirement.current / requirement.target) * 100),
        requirement.weeklyTarget,
        requirement.dailyTarget,
        JSON.stringify([0.25, 0.5, 0.75]),
        JSON.stringify([true, true, false]),
        now,
      ]
    );
  }

  for (const [index, dateString] of dates.entries()) {
    const habitsCompleted = 2 + (index % 4);
    const journalEntries = 3 + (index % 6);
    const goalUpdates = index % 3 === 0 ? 1 : 0;
    await db.runAsync(
      `INSERT OR REPLACE INTO challenge_daily_snapshots (
        id, challenge_id, date, habits_completed, journal_entries,
        goal_progress_updates, xp_earned_today, balance_score,
        calculated_at, daily_contributions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id('challenge-snapshot', dateString),
        challengeId,
        dateString,
        habitsCompleted,
        journalEntries,
        goalUpdates,
        90 + index * 4,
        0.78 + (index % 5) * 0.03,
        asTimestamp(dateString, 23, 0),
        JSON.stringify({
          habit_completions: habitsCompleted,
          journal_entries: journalEntries,
          goal_progress_updates: goalUpdates,
        }),
      ]
    );
  }

  for (let week = 1; week <= 4; week += 1) {
    const start = formatDateToString(addDays(new Date(`${startDate}T12:00:00`), (week - 1) * 7) as Date);
    const end = formatDateToString(addDays(new Date(`${start}T12:00:00`), 6) as Date);
    await db.runAsync(
      `INSERT INTO challenge_weekly_breakdown (
        id, challenge_id, week_number, start_date, end_date,
        progress, target_achieved, days_active, contributions, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id('challenge-week', week),
        challengeId,
        week,
        start,
        end,
        [62, 71, 83, 74][week - 1] ?? 74,
        week < 4 ? 1 : 0,
        week < 4 ? 7 : 4,
        JSON.stringify({
          habit_completions: [19, 21, 18, 10][week - 1],
          journal_entries: [24, 26, 21, 12][week - 1],
          goal_progress_updates: [3, 2, 2, 1][week - 1],
        }),
        now,
      ]
    );
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO challenge_lifecycle_state (
      month, current_state, current_challenge_id, preview_challenge_id,
      last_state_change, pending_actions, state_history, error_log, updated_at
    ) VALUES (?, 'active', ?, NULL, ?, ?, ?, ?, ?)`,
    [
      month,
      challengeId,
      now,
      JSON.stringify([]),
      JSON.stringify([{ state: 'active', timestamp: now, reason: 'marketing_demo' }]),
      JSON.stringify([]),
      now,
    ]
  );
}

export async function loadMarketingDemoData(locale: MarketingDemoLocale = 'en'): Promise<{
  habits: number;
  habitCompletions: number;
  journalEntries: number;
  goals: number;
  goalProgressEntries: number;
  achievements: number;
  locale: MarketingDemoLocale;
}> {
  const db = getDatabase();
  const content = getDemoContent(locale);
  let habitCompletions = 0;
  let journalEntries = 0;
  let goalProgressEntries = 0;

  await ensureMarketingDemoSchema();
  await db.execAsync('BEGIN TRANSACTION');

  try {
    await clearDemoData();
    habitCompletions = await seedHabits(content);
    journalEntries = await seedJournal(content);
    goalProgressEntries = await seedGoals(content);
    await seedXPAndActivity(content);
    await seedAchievements();
    await seedMonthlyChallenge(content);
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }

  await seedLegacyGamificationData(content);
  const totalXP = getDemoTotalXP();
  const currentLevel = getCurrentLevel(totalXP);

  DeviceEventEmitter.emit('marketing_demo_data_loaded');
  DeviceEventEmitter.emit('xpGained', {
    amount: 0,
    finalAmount: 0,
    source: XPSourceType.DAILY_ACTIVITY,
    totalXP,
  });
  DeviceEventEmitter.emit('levelUp', {
    newLevel: currentLevel,
    previousLevel: Math.max(1, currentLevel - 1),
    totalXP,
    triggerSource: XPSourceType.DAILY_ACTIVITY,
    isMilestone: false,
  });
  await setMarketingDemoModeEnabled(true);
  DeviceEventEmitter.emit('monthly_challenge_challenge_generated', { challengeId: 'marketing-challenge-balanced-month' });
  DeviceEventEmitter.emit('monthly_progress_updated', { challengeId: 'marketing-challenge-balanced-month' });

  return {
    habits: demoHabits.length,
    habitCompletions,
    journalEntries,
    goals: demoGoals.length,
    goalProgressEntries,
    achievements: unlockedAchievementIds.length,
    locale: content.locale,
  };
}

export async function clearMarketingDemoData(): Promise<void> {
  const db = getDatabase();

  await ensureMarketingDemoSchema();
  await db.execAsync('BEGIN TRANSACTION');

  try {
    await clearDemoData();
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }

  await clearLegacyGamificationData();
  await setMarketingDemoModeEnabled(false);
  DeviceEventEmitter.emit('marketing_demo_data_cleared');
  DeviceEventEmitter.emit('xpGained', {
    amount: 0,
    finalAmount: 0,
    source: XPSourceType.DAILY_ACTIVITY,
    totalXP: 0,
  });
  DeviceEventEmitter.emit('monthly_progress_updated', { challengeId: 'marketing-challenge-balanced-month' });
}
