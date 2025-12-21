import { Habit, HabitCompletion } from '../types/habit';
import { Goal, GoalStatus } from '../types/goal';
import { Gratitude } from '../types/gratitude';
import { DayOfWeek, DateString } from '../types/common';
import { getPast7Days, getDayOfWeek, formatDateToString, getDayOfWeekFromDateString } from '../utils/date';
import { goalStorage } from '../services/storage/goalStorage';
import { calculateHabitCompletionRate, getHabitAgeInfo } from '../utils/habitCalculations';
import { wasScheduledOnDate } from '../utils/habitImmutability';

export interface HabitRecommendation {
  type: 'habit_schedule' | 'new_habit' | 'habit_adjustment';
  titleKey: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
  priority: 'high' | 'medium' | 'low';
  actionKey?: string;
  habitId?: string;
  suggestedDays?: DayOfWeek[];
  category?: string;
}

export interface JournalRecommendation {
  type: 'journal_prompt' | 'streak_motivation' | 'milestone_celebration';
  titleKey: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
  priority: 'high' | 'medium' | 'low';
  promptKey?: string;
}

export interface GoalRecommendation {
  type: 'goal_progress' | 'goal_adjustment' | 'new_goal';
  titleKey: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
  priority: 'high' | 'medium' | 'low';
  goalId?: string;
  actionKey?: string;
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

    // Track level up recommendations to limit to 1
    let levelUpRecommendationAdded = false;
    
    // Analyze completion patterns using unified calculation logic
    habits.forEach(habit => {
      // Skip very new habits (less than 3 days) to avoid premature recommendations
      const ageInfo = getHabitAgeInfo(habit);
      if (ageInfo.daysSinceCreation < 3) return;

      // Filter dates to only include days since habit creation
      const relevantDates = this.getRelevantDatesForHabit(habit, past7Days);
      
      // Calculate proper completion data for the past 7 days
      let scheduledDays = 0;
      let completedScheduled = 0;
      let bonusCompletions = 0;

      relevantDates.forEach(date => {
        const dayOfWeek = getDayOfWeekFromDateString(date);
        // IMMUTABILITY PRINCIPLE: Use historical scheduled days for each date
        const isScheduled = wasScheduledOnDate(habit, date, dayOfWeek);
        const recentCompletions = completions.filter(c =>
          c.habitId === habit.id && c.date === date
        );
        const isCompleted = recentCompletions.length > 0;
        
        if (isScheduled) {
          scheduledDays++;
          if (isCompleted) {
            completedScheduled++;
          }
        } else if (isCompleted) {
          bonusCompletions++;
        }
      });

      // Use unified calculation for proper completion rate
      const completionResult = calculateHabitCompletionRate(habit, {
        scheduledDays,
        completedScheduled,
        bonusCompletions
      });

      const completionRate = completionResult.totalCompletionRate / 100; // Convert to 0-1 scale

      // Low completion rate - suggest schedule adjustment
      // Only for established habits (7+ days) with genuinely low performance
      if (completionRate < 0.3 && habit.isActive && ageInfo.isEstablishedHabit) {
        recommendations.push({
          type: 'habit_schedule',
          titleKey: 'home.recommendationCards.habits.adjustSchedule.title',
          descriptionKey: 'home.recommendationCards.habits.adjustSchedule.description',
          descriptionParams: { habitName: habit.name, completionRate: Math.round(completionResult.totalCompletionRate) },
          priority: 'medium',
          habitId: habit.id,
          actionKey: 'home.recommendationCards.habits.adjustSchedule.action',
        });
      }

      // High completion rate - suggest more challenging goals (limit to 1)
      // Only for established habits with consistent high performance
      if (completionRate > 0.8 && habit.isActive && !levelUpRecommendationAdded && ageInfo.isEstablishedHabit) {
        recommendations.push({
          type: 'habit_adjustment',
          titleKey: 'home.recommendationCards.habits.levelUp.title',
          descriptionKey: 'home.recommendationCards.habits.levelUp.description',
          descriptionParams: { habitName: habit.name, completionRate: Math.round(completionResult.totalCompletionRate) },
          priority: 'low',
          habitId: habit.id,
          actionKey: 'home.recommendationCards.habits.levelUp.action',
        });
        levelUpRecommendationAdded = true; // Only one Level Up recommendation
      }
    });

    // Suggest new habits based on successful patterns
    const activeHabits = habits.filter(h => h.isActive);
    // Only suggest new habits if user has at least one established habit (14+ days) with good performance
    const establishedSuccessfulHabits = activeHabits.filter(habit => {
      const ageInfo = getHabitAgeInfo(habit);
      if (!ageInfo.isEstablishedHabit) return false;
      
      // Check if this habit has good performance
      const relevantDates = this.getRelevantDatesForHabit(habit, past7Days);
      let scheduledDays = 0;
      let completedScheduled = 0;
      let bonusCompletions = 0;

      relevantDates.forEach(date => {
        const dayOfWeek = getDayOfWeekFromDateString(date);
        // IMMUTABILITY PRINCIPLE: Use historical scheduled days for each date
        const isScheduled = wasScheduledOnDate(habit, date, dayOfWeek);
        const recentCompletions = completions.filter(c =>
          c.habitId === habit.id && c.date === date
        );
        const isCompleted = recentCompletions.length > 0;
        
        if (isScheduled) {
          scheduledDays++;
          if (isCompleted) completedScheduled++;
        } else if (isCompleted) {
          bonusCompletions++;
        }
      });

      const completionResult = calculateHabitCompletionRate(habit, {
        scheduledDays,
        completedScheduled,
        bonusCompletions
      });

      return completionResult.totalCompletionRate >= 60; // Good performance threshold
    });

    if (establishedSuccessfulHabits.length > 0 && activeHabits.length < 5) {
      const successfulDays = this.findBestDaysForHabits(completions);

      recommendations.push({
        type: 'new_habit',
        titleKey: 'home.recommendationCards.habits.addNewHabit.title',
        descriptionKey: 'home.recommendationCards.habits.addNewHabit.description',
        descriptionParams: { successfulDays: successfulDays.join(', ') },
        priority: 'low',
        suggestedDays: successfulDays,
        actionKey: 'home.recommendationCards.habits.addNewHabit.action',
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
        titleKey: 'home.recommendationCards.journal.buildStreak.title',
        descriptionKey: 'home.recommendationCards.journal.buildStreak.description',
        priority: 'high',
        promptKey: 'home.recommendationCards.journal.buildStreak.prompt',
      });
    }

    // Good streak - encourage milestone
    if (recentEntries.length >= 5) {
      recommendations.push({
        type: 'milestone_celebration',
        titleKey: 'home.recommendationCards.journal.onFire.title',
        descriptionKey: 'home.recommendationCards.journal.onFire.description',
        priority: 'medium',
        promptKey: 'home.recommendationCards.journal.onFire.prompt',
      });
    }

    // Suggest deeper prompts based on entries
    const hasGratitudeOnly = recentEntries.every(e => e.type === 'gratitude');
    if (hasGratitudeOnly && recentEntries.length > 0) {
      recommendations.push({
        type: 'journal_prompt',
        titleKey: 'home.recommendationCards.journal.trySelfPraise.title',
        descriptionKey: 'home.recommendationCards.journal.trySelfPraise.description',
        priority: 'medium',
        promptKey: 'home.recommendationCards.journal.trySelfPraise.prompt',
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
              titleKey: 'home.recommendationCards.goals.startProgress.title',
              descriptionKey: 'home.recommendationCards.goals.startProgress.description',
              descriptionParams: { goalTitle: goal.title },
              priority: 'medium',
              goalId: goal.id,
              actionKey: 'home.recommendationCards.goals.startProgress.action',
            });
          }
        }
      }

      // Near completion
      if (progressPercentage > 80) {
        recommendations.push({
          type: 'goal_progress',
          titleKey: 'home.recommendationCards.goals.almostThere.title',
          descriptionKey: 'home.recommendationCards.goals.almostThere.description',
          descriptionParams: { goalTitle: goal.title, progressPercent: Math.round(progressPercentage) },
          priority: 'high',
          goalId: goal.id,
          actionKey: 'home.recommendationCards.goals.almostThere.action',
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
                titleKey: 'home.recommendationCards.goals.timelineCheck.title',
                descriptionKey: 'home.recommendationCards.goals.timelineCheck.description',
                descriptionParams: { goalTitle: goal.title, daysRemaining },
                priority: 'medium',
                goalId: goal.id,
                actionKey: 'home.recommendationCards.goals.timelineCheck.action',
              });
            }
          } catch (error) {
            // Fallback to original logic if goal stats cannot be fetched
            console.warn('Failed to fetch goal stats for Timeline Check:', error);
            recommendations.push({
              type: 'goal_adjustment',
              titleKey: 'home.recommendationCards.goals.timelineCheck.title',
              descriptionKey: 'home.recommendationCards.goals.timelineCheck.description',
              descriptionParams: { goalTitle: goal.title, daysRemaining },
              priority: 'medium',
              goalId: goal.id,
              actionKey: 'home.recommendationCards.goals.timelineCheck.action',
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
        titleKey: 'home.recommendationCards.goals.setNewGoal.title',
        descriptionKey: 'home.recommendationCards.goals.setNewGoal.description',
        priority: 'low',
        actionKey: 'home.recommendationCards.goals.setNewGoal.action',
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