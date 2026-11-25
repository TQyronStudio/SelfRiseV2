export interface HomeScreenComponent {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  configurable: boolean;
}

export interface HomeScreenPreferences {
  components: HomeScreenComponent[];
  /** True once the user reorders sections — then their order survives app updates. */
  hasCustomOrder?: boolean;
  quickActions: {
    showHabitToggle: boolean;
    showAddButtons: boolean;
  };
  theme: {
    cardStyle: 'default' | 'minimal' | 'bold';
    spacing: 'compact' | 'default' | 'spacious';
  };
}

/**
 * The Home sections below the hero, in the default order (migration E11e; the
 * hero of the day is fixed on top, R-4b). Stored layouts of the old ten
 * sections are translated by mergeHomeComponents (src/utils/homeComponents.ts).
 * `name` is an internal label; the sheet shows each card's own title.
 */
export const defaultHomeComponents: HomeScreenComponent[] = [
  { id: 'quickActions', name: 'Quick Actions', visible: true, order: 1, configurable: true },
  { id: 'todayHabits', name: "Today's Habits", visible: true, order: 2, configurable: true },
  { id: 'journalStreak', name: 'Journal Streak', visible: true, order: 3, configurable: true },
  { id: 'monthlyChallenges', name: 'Monthly Challenge', visible: true, order: 4, configurable: true },
  { id: 'habitStats', name: 'Habit Statistics', visible: true, order: 5, configurable: true },
  { id: 'insights', name: 'Insights', visible: true, order: 6, configurable: true },
  { id: 'recommendations', name: 'For You', visible: true, order: 7, configurable: true },
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