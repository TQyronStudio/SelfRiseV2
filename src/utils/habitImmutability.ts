import { Habit, ScheduleTimeline } from '../types/habit';
import { DateString, DayOfWeek } from '../types/common';
import { formatDateToString } from './date';

/**
 * ROBUST SCHEDULED DAYS IMMUTABILITY UTILITIES
 *
 * Implements the "MINULOST SE NEMĚNÍ" principle from technical-guides:Habits.md
 *
 * Core Principles:
 * - Changes in scheduledDays apply only from change date forward
 * - Historical data preservation for all calculations
 * - Time-segmented approach with perfect backward compatibility
 * - Smart Bonus Conversion immutability
 *
 * MINIMAL INVASIVE DESIGN:
 * - Preserves existing habit.scheduledDays for UI components
 * - Adds optional scheduleHistory for historical calculations
 * - Perfect fallbacks for existing data without timeline
 */

/**
 * Get the scheduled days that were effective for a specific date
 *
 * ROBUST IMPLEMENTATION with perfect backward compatibility:
 * - Uses timeline if available for historical accuracy
 * - Falls back to current scheduledDays for existing data
 * - Handles all edge cases gracefully
 *
 * @param habit - The habit object with optional timeline
 * @param date - The date to check (YYYY-MM-DD format)
 * @returns The scheduled days array that was effective for that date
 */
export function getScheduledDaysForDate(habit: Habit, date: DateString): DayOfWeek[] {
  // FALLBACK: No timeline - use current schedule for all dates (existing behavior)
  if (!habit.scheduleHistory?.entries || habit.scheduleHistory.entries.length === 0) {
    return habit.scheduledDays;
  }

  // TIMELINE APPROACH: Find effective schedule for the specific date
  const timeline = habit.scheduleHistory.entries;

  // Sort entries by effective date (oldest first)
  const sortedEntries = [...timeline].sort((a, b) =>
    a.effectiveFromDate.localeCompare(b.effectiveFromDate)
  );

  // Find the most recent entry that was effective on or before the target date
  let effectiveEntry = null;

  for (let i = sortedEntries.length - 1; i >= 0; i--) {
    const entry = sortedEntries[i];
    if (entry && entry.effectiveFromDate <= date) {
      effectiveEntry = entry;
      break;
    }
  }

  // If found historical entry, use it
  if (effectiveEntry) {
    return effectiveEntry.scheduledDays;
  }

  // EDGE CASE: Date is before any timeline entries
  // This means date is before the first recorded change
  // For such dates, we assume the original creation schedule
  // Since we don't track "pre-first-change" schedule, use current as fallback
  return habit.scheduledDays;
}

/**
 * Get the habit frequency (scheduled days per week) that was effective for a specific date
 *
 * This is used for frequency-proportional bonus calculations in completion rate
 *
 * @param habit - The habit object with optional history
 * @param date - The date to check (YYYY-MM-DD format)
 * @returns The number of scheduled days per week that was effective for that date
 */
export function getHabitFrequencyForDate(habit: Habit, date: DateString): number {
  const scheduledDaysForDate = getScheduledDaysForDate(habit, date);
  return scheduledDaysForDate.length;
}

/**
 * Check if a specific day was scheduled on a given date
 *
 * @param habit - The habit object with optional history
 * @param date - The date to check (YYYY-MM-DD format)
 * @param dayOfWeek - The day of week to check
 * @returns True if the day was scheduled on that date
 */
export function wasScheduledOnDate(habit: Habit, date: DateString, dayOfWeek: DayOfWeek): boolean {
  const scheduledDaysForDate = getScheduledDaysForDate(habit, date);
  return scheduledDaysForDate.includes(dayOfWeek);
}

/**
 * Calculate average frequency (scheduled days per week) for a period
 *
 * This is critical for completion rate calculations that span schedule changes.
 * The function respects historical frequency changes and calculates a proper average.
 *
 * @param habit - The habit object with optional history
 * @param startDate - Start of the period (YYYY-MM-DD format)
 * @param endDate - End of the period (YYYY-MM-DD format)
 * @returns Average number of scheduled days per week for the period
 */
export function calculateAverageFrequencyForPeriod(
  habit: Habit,
  startDate: DateString,
  endDate: DateString
): number {
  // Parse dates and calculate total days in period
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new Error('Start date must be before or equal to end date');
  }

  let totalFrequency = 0;
  let dayCount = 0;

  // Iterate through each day in the period
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateString = formatDateToString(currentDate);
    const frequency = getHabitFrequencyForDate(habit, dateString);
    totalFrequency += frequency;
    dayCount++;

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Return average frequency per week (scale from per day to per week)
  const averageFrequencyPerDay = dayCount > 0 ? totalFrequency / dayCount : 0;
  return averageFrequencyPerDay * 7; // Convert to frequency per week
}

/**
 * Create a schedule change entry when habit.scheduledDays is being updated
 *
 * ROBUST IMPLEMENTATION:
 * - Records the new schedule with effective date
 * - Initializes timeline if this is the first change
 * - Preserves all previous timeline data
 * - Perfect backward compatibility
 *
 * @param habit - The habit being updated
 * @param newScheduledDays - The new scheduled days array
 * @param changeDate - The date when the change takes effect (defaults to today)
 * @returns Updated habit with preserved timeline
 */
export function createScheduleChangeEntry(
  habit: Habit,
  newScheduledDays: DayOfWeek[],
  changeDate?: DateString
): Habit {
  // INPUT VALIDATION
  if (!habit) {
    throw new Error('Habit is required');
  }

  if (!newScheduledDays || !Array.isArray(newScheduledDays)) {
    throw new Error('newScheduledDays must be an array');
  }

  if (newScheduledDays.length === 0) {
    throw new Error('newScheduledDays cannot be empty');
  }

  // Validate day names
  const validDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const invalidDays = newScheduledDays.filter(day => !validDays.includes(day));
  if (invalidDays.length > 0) {
    throw new Error(`Invalid day names: ${invalidDays.join(', ')}`);
  }

  const effectiveDate = changeDate || formatDateToString(new Date());

  // Initialize timeline if it doesn't exist
  let timeline: ScheduleTimeline;

  if (!habit.scheduleHistory?.entries) {
    // FIRST CHANGE: Create timeline with the original schedule
    // We assume current schedule was effective since habit creation
    const habitCreationDate = habit.createdAt instanceof Date
      ? formatDateToString(habit.createdAt)
      : formatDateToString(new Date(habit.createdAt));

    timeline = {
      entries: [
        // Add original schedule as first timeline entry
        {
          scheduledDays: [...habit.scheduledDays],
          effectiveFromDate: habitCreationDate
        }
      ]
    };
  } else {
    // SUBSEQUENT CHANGE: Preserve existing timeline
    timeline = {
      entries: [...habit.scheduleHistory.entries]
    };
  }

  // Add new schedule change to timeline
  timeline.entries.push({
    scheduledDays: [...newScheduledDays],
    effectiveFromDate: effectiveDate
  });

  // Return updated habit with new schedule and preserved timeline
  return {
    ...habit,
    scheduledDays: newScheduledDays,
    scheduleHistory: timeline,
    updatedAt: new Date()
  };
}

/**
 * Get the complete schedule timeline for a habit
 *
 * ROBUST IMPLEMENTATION:
 * - Shows complete schedule history with periods
 * - Perfect backward compatibility with fallbacks
 * - Useful for debugging and understanding schedule changes
 *
 * @param habit - The habit object
 * @returns Array of all schedule periods ordered chronologically
 */
export function getScheduleTimeline(habit: Habit): Array<{
  scheduledDays: DayOfWeek[];
  effectiveFromDate: DateString;
  effectiveUntilDate?: DateString;
}> {
  // FALLBACK: No timeline - show current schedule since creation
  if (!habit.scheduleHistory?.entries || habit.scheduleHistory.entries.length === 0) {
    const habitCreationDate = habit.createdAt instanceof Date
      ? formatDateToString(habit.createdAt)
      : formatDateToString(new Date(habit.createdAt));

    return [{
      scheduledDays: habit.scheduledDays,
      effectiveFromDate: habitCreationDate
      // No effectiveUntilDate - ongoing
    }];
  }

  // TIMELINE APPROACH: Build periods from timeline entries
  const sortedEntries = [...habit.scheduleHistory.entries].sort((a, b) =>
    a.effectiveFromDate.localeCompare(b.effectiveFromDate)
  );

  const periods: Array<{
    scheduledDays: DayOfWeek[];
    effectiveFromDate: DateString;
    effectiveUntilDate?: DateString;
  }> = [];

  // Create periods from consecutive entries
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    if (!entry) continue;

    const nextEntry = sortedEntries[i + 1];
    const effectiveUntilDate = nextEntry?.effectiveFromDate;

    periods.push({
      scheduledDays: entry.scheduledDays,
      effectiveFromDate: entry.effectiveFromDate,
      ...(effectiveUntilDate ? { effectiveUntilDate } : {})
    });
  }

  return periods;
}

/**
 * Validate that habit timeline is consistent and properly ordered
 *
 * ROBUST VALIDATION:
 * - Checks timeline integrity and chronological order
 * - Validates dates are not before habit creation
 * - Reports specific issues for debugging
 *
 * @param habit - The habit to validate
 * @returns Validation result with any issues found
 */
export function validateHabitTimeline(habit: Habit): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // FALLBACK: No timeline to validate
  if (!habit.scheduleHistory?.entries) {
    return { isValid: true, issues: [] };
  }

  const entries = habit.scheduleHistory.entries;

  // Check for duplicate effective dates
  const dates = entries.map(entry => entry.effectiveFromDate);
  const uniqueDates = new Set(dates);
  if (dates.length !== uniqueDates.size) {
    issues.push('Duplicate effective dates found in timeline');
  }

  // Check chronological order
  const sortedDates = [...dates].sort();
  const isChronological = dates.every((date, index) => date === sortedDates[index]);
  if (!isChronological) {
    issues.push('Timeline entries are not in chronological order');
  }

  // Check that all effective dates are valid (not before habit creation)
  const habitCreationDate = habit.createdAt instanceof Date
    ? formatDateToString(habit.createdAt)
    : formatDateToString(new Date(habit.createdAt));

  const invalidDates = dates.filter(date => date < habitCreationDate);
  if (invalidDates.length > 0) {
    issues.push(`Effective dates before habit creation: ${invalidDates.join(', ')}`);
  }

  // Check that each entry has valid scheduled days
  const invalidEntries = entries.filter(entry =>
    !entry.scheduledDays ||
    entry.scheduledDays.length === 0 ||
    entry.scheduledDays.length > 7
  );
  if (invalidEntries.length > 0) {
    issues.push(`Invalid scheduled days in ${invalidEntries.length} timeline entries`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// =============================================================================
// MIGRATION UTILITIES
// =============================================================================

/**
 * Migrate existing habit data to new timeline format
 *
 * SAFE MIGRATION APPROACH:
 * - Only adds timeline if not already present
 * - Preserves all existing data
 * - ASSUMPTION: Current scheduledDays have been effective since creation
 *
 * ⚠️ LIMITATION: For habits that had schedule changes before timeline implementation,
 * this migration cannot recover historical schedule changes. It assumes current
 * schedule was always in effect since creation.
 *
 * This is the safest approach - alternative would be to not migrate automatically
 * and require manual schedule change to enable timeline tracking.
 *
 * @param habit - Habit to migrate
 * @returns Migrated habit with timeline (if applicable)
 */
export function migrateHabitToTimeline(habit: Habit): Habit {
  // Already has timeline - no migration needed
  if (habit.scheduleHistory?.entries) {
    return habit;
  }

  // CONSERVATIVE MIGRATION: Assume current schedule was effective since creation
  // This preserves existing behavior and avoids changing historical data meaning
  const habitCreationDate = habit.createdAt instanceof Date
    ? formatDateToString(habit.createdAt)
    : formatDateToString(new Date(habit.createdAt));

  const timeline: ScheduleTimeline = {
    entries: [{
      scheduledDays: [...habit.scheduledDays],
      effectiveFromDate: habitCreationDate
    }]
  };

  return {
    ...habit,
    scheduleHistory: timeline
  };
}

/**
 * Check if habit needs migration to timeline format
 *
 * @param habit - Habit to check
 * @returns True if migration is needed
 */
export function needsTimelineMigration(habit: Habit): boolean {
  return !habit.scheduleHistory?.entries;
}