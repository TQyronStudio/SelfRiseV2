export * from './AppContext';
export * from './HabitsContext';
export * from './GratitudeContext';
export * from './GoalsContext';
export * from './HomeCustomizationContext';
// GamificationContext removed - using OptimizedGamificationContext only
export * from './OptimizedGamificationContext';
export { 
  AchievementProvider, 
  useAchievements as useAchievementSystem, 
  useAchievementStats, 
  useFilteredAchievements,
  useAchievement 
} from './AchievementContext';
export * from './RootProvider';