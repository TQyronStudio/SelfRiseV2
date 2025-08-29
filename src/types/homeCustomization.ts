export interface HomeScreenComponent {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  configurable: boolean;
}

export interface HomeScreenPreferences {
  components: HomeScreenComponent[];
  quickActions: {
    showHabitToggle: boolean;
    showAddButtons: boolean;
  };
  theme: {
    cardStyle: 'default' | 'minimal' | 'bold';
    spacing: 'compact' | 'default' | 'spacious';
  };
}

export const defaultHomeComponents: HomeScreenComponent[] = [
  {
    id: 'xpProgressBar',
    name: 'XP Progress',
    visible: true,
    order: 0,
    configurable: true,
  },
  {
    id: 'xpMultiplier',
    name: 'XP Multiplier',
    visible: true,
    order: 1,
    configurable: true,
  },
  {
    id: 'quickActions',
    name: 'Quick Actions',
    visible: true,
    order: 2,
    configurable: true,
  },
  {
    id: 'journalStreak',
    name: 'Journal Streak',
    visible: true,
    order: 3,
    configurable: true,
  },
  {
    id: 'streakHistory',
    name: 'Streak History',
    visible: true,
    order: 4,
    configurable: true,
  },
  {
    id: 'monthlyChallenges',
    name: 'Monthly Challenges',
    visible: true,
    order: 5,
    configurable: true,
  },
  {
    id: 'dailyQuote',
    name: 'Daily Quote',
    visible: true,
    order: 6,
    configurable: true,
  },
  {
    id: 'habitStats',
    name: 'Habit Statistics',
    visible: true,
    order: 7,
    configurable: true,
  },
  {
    id: 'recommendations',
    name: 'Recommendations',
    visible: true,
    order: 8,
    configurable: true,
  },
  {
    id: 'habitPerformance',
    name: 'Performance Indicators',
    visible: true,
    order: 9,
    configurable: true,
  },
  {
    id: 'habitTrends',
    name: 'Trend Analysis',
    visible: true,
    order: 10,
    configurable: true,
  },
];

export const defaultHomePreferences: HomeScreenPreferences = {
  components: defaultHomeComponents,
  quickActions: {
    showHabitToggle: true,
    showAddButtons: true,
  },
  theme: {
    cardStyle: 'default',
    spacing: 'default',
  },
};