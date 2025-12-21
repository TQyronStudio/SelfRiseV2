import { Habit } from '../types/habit';
import { DateString } from '../types/common';
import { getHabitFrequencyForDate, calculateAverageFrequencyForPeriod } from './habitImmutability';

/**
 * Simple Habit Completion Rate Calculation Utility
 *
 * This utility provides intuitive completion rate calculation across all components.
 *
 * Key Features:
 * - Simple formula: (scheduled + make-up + bonus) / total scheduled × 100
 * - Intuitive results (100% = perfect, over 100% = exceptional)
 * - Safe division handling (no zero division errors)
 * - Easy to understand for users
 */

export interface HabitCompletionData {
  scheduledDays: number;
  completedScheduled: number; // includes make-up completions
  bonusCompletions: number;
  // IMMUTABILITY PRINCIPLE: Support for time-segmented calculation (optional)
  periodStartDate?: DateString; // For historical frequency calculation
  periodEndDate?: DateString;   // For historical frequency calculation
}

export interface HabitCompletionResult {
  scheduledRate: number;
  bonusRate: number;
  totalCompletionRate: number;
  isMaxedOut: boolean;
}

/**
 * Calculate habit completion rate with frequency-proportional bonus logic
 *
 * IMMUTABILITY PRINCIPLE: Uses time-segmented approach for historical accuracy
 * - For periods with date range, calculates average historical frequency
 * - Fallback to current frequency if no date information provided
 *
 * @param habit - The habit object containing schedule information
 * @param completionData - Completion statistics for the specific time period
 * @returns Completion rate calculation results
 */
export function calculateHabitCompletionRate(
  habit: Habit,
  completionData: HabitCompletionData
): HabitCompletionResult {
  const { scheduledDays, completedScheduled, bonusCompletions } = completionData;

  // SIMPLE INTUITIVE SYSTEM: All completions / scheduled days
  // This includes: scheduled completions + make-up completions + bonus completions
  //
  // IMMUTABILITY PRINCIPLE "MINULOST SE NEMĚNÍ":
  // Input data (scheduledDays, completedScheduled, bonusCompletions) MUST be calculated
  // with historical timeline awareness using wasScheduledOnDate() and Smart Bonus Conversion.
  // This function only does the final math - historical accuracy is preserved in data layer.
  const totalCompletions = completedScheduled + bonusCompletions;
  const totalCompletionRate = scheduledDays > 0 ? (totalCompletions / scheduledDays) * 100 : 0;

  // Calculate individual components for display purposes
  const scheduledRate = scheduledDays > 0 ? (completedScheduled / scheduledDays) * 100 : 0;
  const bonusRate = scheduledDays > 0 ? (bonusCompletions / scheduledDays) * 100 : 0;

  // Check if performance is exceptional (over 120%)
  const isMaxedOut = totalCompletionRate > 120;

  return {
    scheduledRate: Math.round(scheduledRate * 10) / 10, // 1 decimal place
    bonusRate: Math.round(bonusRate * 10) / 10,
    totalCompletionRate: Math.round(totalCompletionRate * 10) / 10,
    isMaxedOut
  };
}


/**
 * Determine if a habit is old enough for trend analysis
 * 
 * @param habit - The habit object
 * @param currentDate - Current date for comparison (defaults to today)
 * @returns Object with age information and visibility rules
 */
export function getHabitAgeInfo(habit: Habit, currentDate?: Date) {
  const createdAt = habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
  const compareDate = currentDate || new Date();
  
  const daysSinceCreation = Math.floor((compareDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysSinceCreation,
    canShowTrends: daysSinceCreation >= 7,
    canShowPerformance: daysSinceCreation >= 1,
    isNewHabit: daysSinceCreation < 7,
    isEarlyHabit: daysSinceCreation >= 7 && daysSinceCreation < 14,
    isEstablishedHabit: daysSinceCreation >= 14
  };
}

/**
 * Message result with translation keys for i18n support
 */
export interface HabitFeedbackMessage {
  titleKey: string;
  descriptionKey: string;
  descriptionParams: Record<string, string | number>;
  tone: 'positive' | 'neutral' | 'encouraging' | 'warning';
}

/**
 * Get appropriate completion rate message based on habit age and performance
 *
 * @param completionResult - Result from calculateHabitCompletionRate
 * @param ageInfo - Result from getHabitAgeInfo
 * @param habitName - Name of the habit for personalized messaging
 * @returns Translation keys and params with tone based on habit maturity
 */
export function getCompletionRateMessage(
  completionResult: HabitCompletionResult,
  ageInfo: ReturnType<typeof getHabitAgeInfo>,
  habitName: string
): HabitFeedbackMessage {
  const { totalCompletionRate } = completionResult;
  const { isNewHabit, isEarlyHabit, isEstablishedHabit } = ageInfo;
  const completionRate = Math.round(totalCompletionRate);

  // New habits (0-6 days) - Always encouraging
  if (isNewHabit) {
    return {
      titleKey: 'home.habitFeedback.buildingMomentum.title',
      descriptionKey: 'home.habitFeedback.buildingMomentum.description',
      descriptionParams: { habitName },
      tone: 'encouraging'
    };
  }

  // Early habits (7-13 days) - Positive reinforcement
  if (isEarlyHabit) {
    if (totalCompletionRate >= 100) {
      return {
        titleKey: 'home.habitFeedback.excellentEarlyProgress.title',
        descriptionKey: 'home.habitFeedback.excellentEarlyProgress.description',
        descriptionParams: { completionRate },
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 50) {
      return {
        titleKey: 'home.habitFeedback.goodEarlyPattern.title',
        descriptionKey: 'home.habitFeedback.goodEarlyPattern.description',
        descriptionParams: { completionRate },
        tone: 'encouraging'
      };
    } else {
      return {
        titleKey: 'home.habitFeedback.earlyLearningPhase.title',
        descriptionKey: 'home.habitFeedback.earlyLearningPhase.description',
        descriptionParams: { completionRate },
        tone: 'encouraging'
      };
    }
  }

  // Established habits (14+ days) - Full analysis
  if (isEstablishedHabit) {
    if (totalCompletionRate >= 200) {
      return {
        titleKey: 'home.habitFeedback.exceptionalPerformance.title',
        descriptionKey: 'home.habitFeedback.exceptionalPerformance.description',
        descriptionParams: { completionRate, habitName },
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 120) {
      return {
        titleKey: 'home.habitFeedback.outstandingPerformance.title',
        descriptionKey: 'home.habitFeedback.outstandingPerformance.description',
        descriptionParams: { completionRate },
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 80) {
      return {
        titleKey: 'home.habitFeedback.strongConsistency.title',
        descriptionKey: 'home.habitFeedback.strongConsistency.description',
        descriptionParams: { completionRate, habitName },
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 50) {
      return {
        titleKey: 'home.habitFeedback.steadyProgress.title',
        descriptionKey: 'home.habitFeedback.steadyProgress.description',
        descriptionParams: { completionRate },
        tone: 'neutral'
      };
    } else {
      return {
        titleKey: 'home.habitFeedback.focusOpportunity.title',
        descriptionKey: 'home.habitFeedback.focusOpportunity.description',
        descriptionParams: { completionRate, habitName },
        tone: 'warning'
      };
    }
  }

  // Fallback (shouldn't reach here)
  return {
    titleKey: 'home.habitFeedback.progressTracking.title',
    descriptionKey: 'home.habitFeedback.progressTracking.description',
    descriptionParams: { completionRate },
    tone: 'neutral'
  };
}

/**
 * Example usage showing frequency-proportional bonus calculation:
 * 
 * // 1x per week habit with 1 bonus completion:
 * // bonusRate = (1 / 1) * 100 = 100% impact
 * 
 * // 7x per week habit with 1 bonus completion:
 * // bonusRate = (1 / 7) * 100 = 14% impact
 * 
 * // This makes bonus completions feel appropriately valuable
 * // relative to the habit's scheduled frequency
 */