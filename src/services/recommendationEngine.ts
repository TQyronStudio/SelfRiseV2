import { Habit, HabitCompletion } from '../types/habit';
import { Goal, GoalStatus } from '../types/goal';
import { Gratitude } from '../types/gratitude';
import { DayOfWeek, DateString } from '../types/common';
import { getPast7Days, getDayOfWeek, formatDateToString } from '../utils/date';
import { goalStorage } from '../services/storage/goalStorage';

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
   * Helper function to filter dates based on habit creation date
   * Only considers days since the habit was created
   */
  private static getRelevantDatesForHabit(habit: Habit, periodDates: DateString[]): DateString[] {
    const createdAt = habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
    const creationDate = formatDateToString(createdAt);
    return periodDates.filter(date => date >= creationDate);
  }

  /**
   * Generate personalized recommendations based on user data
   */
  static async generateRecommendations(
    habits: Habit[],
    completions: HabitCompletion[],
    goals: Goal[],
    gratitudeEntries: Gratitude[]
  ): Promise<PersonalizedRecommendation[]> {
    // Safe guard against undefined arrays
    const safeHabits = habits || [];
    const safeCompletions = completions || [];
    const safeGoals = goals || [];
    const safeGratitudeEntries = gratitudeEntries || [];

    const recommendations: PersonalizedRecommendation[] = [];

    try {
      // Add habit recommendations
      recommendations.push(...this.generateHabitRecommendations(safeHabits, safeCompletions));
      
      // Add journal recommendations
      recommendations.push(...this.generateJournalRecommendations(safeGratitudeEntries));
      
      // Add goal recommendations
      recommendations.push(...await this.generateGoalRecommendations(safeGoals));
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }

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
    const past7Days = getPast7Days();

    // Analyze completion patterns
    habits.forEach(habit => {
      // Filter dates to only include days since habit creation
      const relevantDates = this.getRelevantDatesForHabit(habit, past7Days);
      
      const recentCompletions = completions.filter(c => 
        c.habitId === habit.id && 
        relevantDates.includes(c.date)
      );

      // Calculate completion rate based on days the habit actually existed
      const completionRate = relevantDates.length > 0 ? recentCompletions.length / relevantDates.length : 0;

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
      const successfulDays = this.findBestDaysForHabits(completions);
      
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
    gratitudeEntries: Gratitude[]
  ): JournalRecommendation[] {
    const recommendations: JournalRecommendation[] = [];
    const past7Days = getPast7Days();
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
  private static async generateGoalRecommendations(goals: Goal[]): Promise<GoalRecommendation[]> {
    const recommendations: GoalRecommendation[] = [];

    for (const goal of goals) {
      if (goal.status === GoalStatus.COMPLETED) continue;

      const progressPercentage = (goal.currentValue / goal.targetValue) * 100;

      // Basic progress recommendation for low progress goals
      // Show only if more than 10% of allocated time has passed AND progress < 10%
      if (progressPercentage < 10) {
        const todayDate = new Date();
        const createdDate = new Date(goal.createdAt);
        const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
        
        // Only show if goal has target date and more than 10% of time has elapsed
        if (targetDate) {
          const totalDuration = targetDate.getTime() - createdDate.getTime();
          const elapsedDuration = todayDate.getTime() - createdDate.getTime();
          const timeElapsedPercentage = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;
          
          if (timeElapsedPercentage > 10) {
            recommendations.push({
              type: 'goal_progress',
              title: 'Start Making Progress',
              description: `${goal.title} needs attention. Start making some progress!`,
              priority: 'medium',
              goalId: goal.id,
              suggestedAction: 'Log Progress',
            });
          }
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
        const todayDate = new Date();
        const targetDate = new Date(goal.targetDate);
        const daysRemaining = Math.ceil((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0 && progressPercentage < 50 && daysRemaining < 30) {
          // Add third condition: only show if estimated completion is later than target date
          try {
            const goalStats = await goalStorage.getGoalStats(goal.id);
            if (goalStats.estimatedCompletionDate && goalStats.estimatedCompletionDate > goal.targetDate) {
              recommendations.push({
                type: 'goal_adjustment',
                title: 'Timeline Check',
                description: `${goal.title} may need timeline adjustment. ${daysRemaining} days remaining.`,
                priority: 'medium',
                goalId: goal.id,
                suggestedAction: 'Adjust Timeline',
              });
            }
          } catch (error) {
            // Fallback to original logic if goal stats cannot be fetched
            console.warn('Failed to fetch goal stats for Timeline Check:', error);
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
      }
    }

    // Suggest new goals if user has few active goals
    const activeGoals = goals.filter(g => g.status === GoalStatus.ACTIVE);
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
        const dayOfWeek = getDayOfWeek(new Date(completion.date));
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