import { BaseEntity, Color, Icon, DayOfWeek } from './common';

export interface Habit extends BaseEntity {
  name: string;
  color: Color;
  icon: Icon;
  scheduledDays: DayOfWeek[];
  isActive: boolean;
}

export interface HabitCompletion extends BaseEntity {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  isBonus: boolean; // true if completed on non-scheduled day
}