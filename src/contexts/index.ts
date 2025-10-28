export * from './ThemeContext';
export * from './AppContext';
export * from './HabitsContext';
export * from './GratitudeContext';
export * from './GoalsContext';
export * from './HomeCustomizationContext';
// GamificationContext and OptimizedGamificationContext removed - components use GamificationService directly
export {
  AchievementProvider,
  useAchievements as useAchievementSystem,
  useAchievementStats,
  useFilteredAchievements,
  useAchievement
} from './AchievementContext';
export * from './RootProvider';