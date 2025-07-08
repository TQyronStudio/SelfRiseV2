import { BaseEntity } from './common';

export interface Gratitude extends BaseEntity {
  content: string;
  date: string; // YYYY-MM-DD format
  isBonus: boolean; // true if it's the 4th+ gratitude of the day
}

export interface GratitudeStreak {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null; // YYYY-MM-DD format
}