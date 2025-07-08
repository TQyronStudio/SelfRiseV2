// Common types used across the application

// Day of week enum
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

// Habit color enum
export enum HabitColor {
  RED = 'red',
  BLUE = 'blue', 
  GREEN = 'green',
  YELLOW = 'yellow',
  PURPLE = 'purple',
  ORANGE = 'orange',
  PINK = 'pink',
  TEAL = 'teal',
}

// Habit icon enum
export enum HabitIcon {
  FITNESS = 'fitness',
  BOOK = 'book',
  WATER = 'water',
  MEDITATION = 'meditation',
  MUSIC = 'music',
  FOOD = 'food',
  SLEEP = 'sleep',
  WORK = 'work',
}

// Base entity interface for all data models
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Date string type for consistent date handling
export type DateString = string; // YYYY-MM-DD format

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}