import { useMemo } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { Goal, GoalStatus, GoalCategory } from '../types/goal';

export function useGoalsData() {
  const { state, actions } = useGoals();

  const sortedGoals = useMemo(() => {
    return [...state.goals].sort((a, b) => a.order - b.order);
  }, [state.goals]);

  const goalsData = useMemo(() => {
    return {
      goals: sortedGoals,
      activeGoals: sortedGoals.filter(goal => goal.status === GoalStatus.ACTIVE),
      completedGoals: sortedGoals.filter(goal => goal.status === GoalStatus.COMPLETED),
      pausedGoals: sortedGoals.filter(goal => goal.status === GoalStatus.PAUSED),
      archivedGoals: sortedGoals.filter(goal => goal.status === GoalStatus.ARCHIVED),
      progress: state.progress,
      stats: state.stats,
      isLoading: state.isLoading,
      error: state.error,
    };
  }, [sortedGoals, state.progress, state.stats, state.isLoading, state.error]);

  const getGoalsByCategory = (category: GoalCategory): Goal[] => {
    return goalsData.goals.filter(goal => goal.category === category);
  };

  const getGoalsByStatus = (status: GoalStatus): Goal[] => {
    return goalsData.goals.filter(goal => goal.status === status);
  };

  const getGoalProgress = (goalId: string) => {
    return state.progress.filter(progress => progress.goalId === goalId);
  };

  const getGoalStats = (goalId: string) => {
    return state.stats.find(stat => stat.goalId === goalId);
  };

  const getGoalWithStats = (goalId: string) => {
    const goal = state.goals.find(g => g.id === goalId);
    const stats = getGoalStats(goalId);
    const progress = getGoalProgress(goalId);
    
    return goal ? {
      ...goal,
      stats,
      progress,
    } : null;
  };

  const getOverdueGoals = (): Goal[] => {
    const today = new Date();
    return goalsData.activeGoals.filter(goal => {
      if (!goal.targetDate) return false;
      return new Date(goal.targetDate) < today;
    });
  };

  const getGoalsDueThisWeek = (): Goal[] => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return goalsData.activeGoals.filter(goal => {
      if (!goal.targetDate) return false;
      const targetDate = new Date(goal.targetDate);
      return targetDate >= today && targetDate <= weekFromNow;
    });
  };

  const getGoalsDueThisMonth = (): Goal[] => {
    const today = new Date();
    const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    return goalsData.activeGoals.filter(goal => {
      if (!goal.targetDate) return false;
      const targetDate = new Date(goal.targetDate);
      return targetDate >= today && targetDate <= monthFromNow;
    });
  };

  const getGoalsOnTrack = (): Goal[] => {
    return goalsData.activeGoals.filter(goal => {
      const stats = getGoalStats(goal.id);
      return stats?.isOnTrack || false;
    });
  };

  const getGoalsBehindSchedule = (): Goal[] => {
    return goalsData.activeGoals.filter(goal => {
      const stats = getGoalStats(goal.id);
      return stats && !stats.isOnTrack;
    });
  };

  const getCompletionRate = (): number => {
    if (goalsData.goals.length === 0) return 0;
    return (goalsData.completedGoals.length / goalsData.goals.length) * 100;
  };

  const getCategoryStats = () => {
    const categoryStats = Object.values(GoalCategory).map(category => {
      const categoryGoals = getGoalsByCategory(category);
      const activeCount = categoryGoals.filter(g => g.status === GoalStatus.ACTIVE).length;
      const completedCount = categoryGoals.filter(g => g.status === GoalStatus.COMPLETED).length;
      const totalCount = categoryGoals.length;
      
      return {
        category,
        activeCount,
        completedCount,
        totalCount,
        completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      };
    });
    
    return categoryStats.filter(stat => stat.totalCount > 0);
  };

  const searchGoals = (query: string): Goal[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return goalsData.goals.filter(goal =>
      goal.title.toLowerCase().includes(searchTerm) ||
      goal.description?.toLowerCase().includes(searchTerm)
    );
  };

  return {
    ...goalsData,
    actions,
    getGoalsByCategory,
    getGoalsByStatus,
    getGoalProgress,
    getGoalStats,
    getGoalWithStats,
    getOverdueGoals,
    getGoalsDueThisWeek,
    getGoalsDueThisMonth,
    getGoalsOnTrack,
    getGoalsBehindSchedule,
    getCompletionRate,
    getCategoryStats,
    searchGoals,
  };
}