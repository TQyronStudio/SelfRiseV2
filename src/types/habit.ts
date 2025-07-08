import { BaseEntity, HabitColor, HabitIcon, DayOfWeek, DateString } from './common';

export interface Habit extends BaseEntity {
  name: string;
  color: HabitColor;
  icon: HabitIcon;
  scheduledDays: DayOfWeek[];
  isActive: boolean;
  description?: string;
  order: number; // For custom ordering in UI
}

export interface HabitCompletion extends BaseEntity {
  habitId: string;
  date: DateString;
  completed: boolean;
  isBonus: boolean; // true if completed on non-scheduled day
  completedAt?: Date; // timestamp when marked as complete
  note?: string; // optional note for completion
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // percentage (0-100)
  lastCompletedDate?: DateString;
}

// Create habit input interface
export interface CreateHabitInput {
  name: string;
  color: HabitColor;
  icon: HabitIcon;
  scheduledDays: DayOfWeek[];
  description?: string;
}

// Update habit input interface
export interface UpdateHabitInput {
  name?: string;
  color?: HabitColor;
  icon?: HabitIcon;
  scheduledDays?: DayOfWeek[];
  description?: string;
  isActive?: boolean;
  order?: number;
}