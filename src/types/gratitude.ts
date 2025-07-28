import { BaseEntity, DateString } from './common';

export interface Gratitude extends BaseEntity {
  content: string;
  date: DateString;
  isBonus: boolean; // true if it's the 4th+ gratitude of the day
  order: number; // order within the day (1, 2, 3, 4+)
  type: 'gratitude' | 'self-praise'; // typ záznamu
  mood?: number; // optional mood rating (1-5)
}

export interface GratitudeStreak {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: DateString | null;
  streakStartDate: DateString | null;
  canRecoverWithAd: boolean; // true if user can recover broken streak with ad
  // NEW: Debt tracking system
  debtDays: number; // 0-3, days of accumulated debt from missed days
  isFrozen: boolean; // true when debt > 0, streak neither grows nor resets
  // Bonus milestone counters (mysterious badges)
  starCount: number; // ⭐ - times achieved 1 bonus gratitude in a day
  flameCount: number; // 🔥 - times achieved 5 bonus gratitudes in a day  
  crownCount: number; // 👑 - times achieved 10 bonus gratitudes in a day
}

export interface DailyGratitudeStats {
  date: DateString;
  gratitudeCount: number;
  isComplete: boolean; // true if has minimum 3 gratitudes
  hasBonus: boolean; // true if has 4+ gratitudes
}

export interface GratitudeStats {
  totalGratitudes: number;
  totalDays: number;
  averagePerDay: number;
  streakInfo: GratitudeStreak;
  milestones: GratitudeMilestone[];
}

export interface GratitudeMilestone {
  type: 'streak' | 'total';
  value: number; // streak days or total gratitudes
  achievedAt: Date;
  title: string;
}

// Create gratitude input interface
export interface CreateGratitudeInput {
  content: string;
  date: DateString;
  type?: 'gratitude' | 'self-praise'; // volitelný typ, default 'gratitude'
  mood?: number;
}

// Update gratitude input interface
export interface UpdateGratitudeInput {
  content?: string;
  mood?: number;
}