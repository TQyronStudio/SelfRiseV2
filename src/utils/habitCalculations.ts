import { Habit } from '../types/habit';
import { DateString } from '../types/common';

/**
 * Unified Habit Completion Rate Calculation Utility
 * 
 * This utility provides consistent bonus completion calculation across all components
 * while preserving each component's original time period measurement.
 * 
 * Key Features:
 * - Frequency-proportional bonus calculation (1x/week = +100%, 7x/week = +14%)
 * - Safe division handling (no zero division errors)
 * - Real performance tracking (no artificial caps)
 * - Time-period agnostic (works with any date range)
 */

export interface HabitCompletionData {
  scheduledDays: number;
  completedScheduled: number;
  bonusCompletions: number;
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
 * @param habit - The habit object containing schedule information
 * @param completionData - Completion statistics for the specific time period
 * @returns Completion rate calculation results
 */
export function calculateHabitCompletionRate(
  habit: Habit,
  completionData: HabitCompletionData
): HabitCompletionResult {
  const { scheduledDays, completedScheduled, bonusCompletions } = completionData;
  
  // Calculate base scheduled completion rate
  const scheduledRate = scheduledDays > 0 ? (completedScheduled / scheduledDays) * 100 : 0;
  
  // Calculate frequency-proportional bonus rate
  const habitFrequencyPerWeek = habit.scheduledDays.length;
  const bonusRate = habitFrequencyPerWeek > 0 ? (bonusCompletions / habitFrequencyPerWeek) * 100 : 0;
  
  // Calculate total completion rate (no artificial cap)
  const totalCompletionRate = scheduledRate + bonusRate;
  const isMaxedOut = false; // No longer applicable - real performance matters
  
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
 * Get appropriate completion rate message based on habit age and performance
 * 
 * @param completionResult - Result from calculateHabitCompletionRate
 * @param ageInfo - Result from getHabitAgeInfo
 * @param habitName - Name of the habit for personalized messaging
 * @returns Appropriate message with tone based on habit maturity
 */
export function getCompletionRateMessage(
  completionResult: HabitCompletionResult,
  ageInfo: ReturnType<typeof getHabitAgeInfo>,
  habitName: string
): {
  title: string;
  description: string;
  tone: 'positive' | 'neutral' | 'encouraging' | 'warning';
} {
  const { totalCompletionRate, isMaxedOut } = completionResult;
  const { isNewHabit, isEarlyHabit, isEstablishedHabit } = ageInfo;
  
  // New habits (0-6 days) - Always encouraging
  if (isNewHabit) {
    return {
      title: '🌱 Building Momentum',
      description: `Great start with ${habitName}! Keep going to establish the pattern.`,
      tone: 'encouraging'
    };
  }
  
  // Early habits (7-13 days) - Positive reinforcement
  if (isEarlyHabit) {
    if (totalCompletionRate >= 100) {
      return {
        title: '🚀 Excellent Early Progress',
        description: `${Math.round(totalCompletionRate)}% completion! You're building a strong foundation.`,
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 50) {
      return {
        title: '📈 Good Early Pattern',
        description: `${Math.round(totalCompletionRate)}% completion. You're on the right track!`,
        tone: 'encouraging'
      };
    } else {
      return {
        title: '💪 Early Learning Phase',
        description: `${Math.round(totalCompletionRate)}% completion. Every step counts in building habits!`,
        tone: 'encouraging'
      };
    }
  }
  
  // Established habits (14+ days) - Full analysis
  if (isEstablishedHabit) {
    if (totalCompletionRate >= 200) {
      return {
        title: '⭐ Exceptional Performance',
        description: `${Math.round(totalCompletionRate)}% completion rate! Your dedication to ${habitName} is extraordinary.`,
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 120) {
      return {
        title: '🏆 Outstanding Performance',
        description: `${Math.round(totalCompletionRate)}% completion with bonus effort. Excellent consistency!`,
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 80) {
      return {
        title: '✅ Strong Consistency',
        description: `${Math.round(totalCompletionRate)}% completion rate. Well done maintaining ${habitName}!`,
        tone: 'positive'
      };
    } else if (totalCompletionRate >= 50) {
      return {
        title: '📊 Steady Progress',
        description: `${Math.round(totalCompletionRate)}% completion. Consider small adjustments to improve consistency.`,
        tone: 'neutral'
      };
    } else {
      return {
        title: '💪 Focus Opportunity',
        description: `${Math.round(totalCompletionRate)}% completion for ${habitName}. Try breaking it into smaller steps.`,
        tone: 'warning'
      };
    }
  }
  
  // Fallback (shouldn't reach here)
  return {
    title: '📈 Progress Tracking',
    description: `${Math.round(totalCompletionRate)}% completion rate.`,
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