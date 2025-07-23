import { Habit, HabitCompletion } from '../types/habit';
import { Goal } from '../types/goal';
import { GratitudeEntry } from '../types/gratitude';
import { DateString, DayOfWeek } from '../types/common';
import { today, subtractDays, getDateRangeFromToday, getDayOfWeek } from '../utils/date';

export interface HabitRecommendation {
  type: 'habit_schedule' | 'new_habit' | 'habit_adjustment';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionText?: string;
  habitId?: string;
  suggestedDays?: DayOfWeek[];
  category?: string;
}

export interface JournalRecommendation {
  type: 'journal_prompt' | 'streak_motivation' | 'milestone_celebration';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  prompt?: string;
}

export interface GoalRecommendation {
  type: 'goal_progress' | 'goal_adjustment' | 'new_goal';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  goalId?: string;
  suggestedAction?: string;
}

export type PersonalizedRecommendation = 
  | HabitRecommendation 
  | JournalRecommendation 
  | GoalRecommendation;

export class RecommendationEngine {
  /**
   * Generate personalized recommendations based on user data
   */
  static generateRecommendations(
    habits: Habit[],
    completions: HabitCompletion[],
    goals: Goal[],
    gratitudeEntries: GratitudeEntry[]
  ): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];

    // Add habit recommendations
    recommendations.push(...this.generateHabitRecommendations(habits, completions));
    
    // Add journal recommendations
    recommendations.push(...this.generateJournalRecommendations(gratitudeEntries));
    
    // Add goal recommendations
    recommendations.push(...this.generateGoalRecommendations(goals));

    // Sort by priority and limit to top 4
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 4);
  }

  /**
   * Generate habit-specific recommendations
   */
  private static generateHabitRecommendations(
    habits: Habit[],
    completions: HabitCompletion[]
  ): HabitRecommendation[] {
    const recommendations: HabitRecommendation[] = [];
    const todayDate = today();
    const past7Days = getDateRangeFromToday(7);
    const past30Days = getDateRangeFromToday(30);

    // Analyze completion patterns
    habits.forEach(habit => {
      const recentCompletions = completions.filter(c => 
        c.habitId === habit.id && 
        past7Days.includes(c.date)
      );

      const completionRate = recentCompletions.length / 7;

      // Low completion rate - suggest schedule adjustment
      if (completionRate < 0.3 && habit.isActive) {
        recommendations.push({
          type: 'habit_schedule',
          title: 'Adjust Schedule',
          description: `${habit.name} has low completion rate. Consider reducing frequency.`,
          priority: 'medium',
          habitId: habit.id,
          actionText: 'Adjust Schedule',
        });
      }

      // High completion rate - suggest more challenging goals
      if (completionRate > 0.8 && habit.isActive) {
        recommendations.push({
          type: 'habit_adjustment',
          title: 'Level Up',
          description: `You're crushing ${habit.name}! Ready for a new challenge?`,
          priority: 'low',
          habitId: habit.id,
          actionText: 'Add Challenge',
        });
      }
    });

    // Suggest new habits based on successful patterns
    const activeHabits = habits.filter(h => h.isActive);
    if (activeHabits.length > 0 && activeHabits.length < 5) {
      const successfulDays = this.findBestDaysForHabits(activeHabits, completions);
      
      recommendations.push({
        type: 'new_habit',
        title: 'Add New Habit',
        description: `Based on your success pattern, ${successfulDays.join(', ')} are your best days.`,
        priority: 'low',
        suggestedDays: successfulDays,
        actionText: 'Create Habit',
      });
    }

    return recommendations;
  }

  /**
   * Generate journal-specific recommendations
   */
  private static generateJournalRecommendations(
    gratitudeEntries: GratitudeEntry[]
  ): JournalRecommendation[] {
    const recommendations: JournalRecommendation[] = [];
    const past7Days = getDateRangeFromToday(7);
    const recentEntries = gratitudeEntries.filter(entry => 
      past7Days.includes(entry.date)
    );

    // Low journal activity
    if (recentEntries.length < 3) {
      recommendations.push({
        type: 'streak_motivation',
        title: 'Build Your Streak',
        description: 'Regular journaling builds mindfulness. Start with just 3 entries today.',
        priority: 'high',
        prompt: 'What made you smile today?',
      });
    }

    // Good streak - encourage milestone
    if (recentEntries.length >= 5) {
      recommendations.push({
        type: 'milestone_celebration',
        title: 'You\'re on Fire!',
        description: 'Your journaling consistency is impressive. Keep the momentum!',
        priority: 'medium',
        prompt: 'Reflect on how journaling has impacted your mindset this week.',
      });
    }

    // Suggest deeper prompts based on entries
    const hasGratitudeOnly = recentEntries.every(e => e.type === 'gratitude');
    if (hasGratitudeOnly && recentEntries.length > 0) {
      recommendations.push({
        type: 'journal_prompt',
        title: 'Try Self-Praise',
        description: 'Balance gratitude with self-recognition. What did you do well today?',
        priority: 'medium',
        prompt: 'What personal quality helped you succeed today?',
      });
    }

    return recommendations;
  }

  /**
   * Generate goal-specific recommendations
   */
  private static generateGoalRecommendations(goals: Goal[]): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];

    goals.forEach(goal => {
      if (goal.isCompleted) return;

      const progressPercentage = (goal.currentValue / goal.targetValue) * 100;

      // Stalled progress
      if (progressPercentage < 10 && goal.progressEntries.length > 0) {
        const lastEntry = goal.progressEntries[goal.progressEntries.length - 1];
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceUpdate > 7) {
          recommendations.push({
            type: 'goal_progress',
            title: 'Update Progress',
            description: `${goal.title} hasn't been updated in ${daysSinceUpdate} days.`,
            priority: 'high',
            goalId: goal.id,
            suggestedAction: 'Log Progress',
          });
        }
      }

      // Near completion
      if (progressPercentage > 80) {
        recommendations.push({
          type: 'goal_progress',
          title: 'Almost There!',
          description: `${goal.title} is ${Math.round(progressPercentage)}% complete. Push to finish!`,
          priority: 'high',
          goalId: goal.id,
          suggestedAction: 'Final Push',
        });
      }

      // Behind schedule
      if (goal.targetDate) {
        const today = new Date();
        const targetDate = new Date(goal.targetDate);
        const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0 && progressPercentage < 50 && daysRemaining < 30) {
          recommendations.push({
            type: 'goal_adjustment',
            title: 'Timeline Check',
            description: `${goal.title} may need timeline adjustment. ${daysRemaining} days remaining.`,
            priority: 'medium',
            goalId: goal.id,
            suggestedAction: 'Adjust Timeline',
          });
        }
      }
    });

    // Suggest new goals if user has few active goals
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length < 2) {
      recommendations.push({
        type: 'new_goal',
        title: 'Set New Goal',
        description: 'Goals provide direction and motivation. What would you like to achieve?',
        priority: 'low',
        suggestedAction: 'Create Goal',
      });
    }

    return recommendations;
  }

  /**
   * Find the best days for new habits based on existing success patterns
   */
  private static findBestDaysForHabits(
    habits: Habit[],
    completions: HabitCompletion[]
  ): DayOfWeek[] {
    const dayStats: Record<DayOfWeek, number> = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    };

    // Count completions by day of week
    completions.forEach(completion => {
      if (completion.completed) {
        const dayOfWeek = getDayOfWeek(completion.date);
        dayStats[dayOfWeek]++;
      }
    });

    // Return top 3 days
    return Object.entries(dayStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day as DayOfWeek);
  }
}