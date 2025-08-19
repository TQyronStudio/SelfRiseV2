import { BaseEntity, DateString } from './common';

export interface Gratitude extends BaseEntity {
  content: string;
  date: DateString;
  isBonus: boolean; // true if it's the 4th+ gratitude of the day
  order: number; // order within the day (1, 2, 3, 4+)
  type: 'gratitude' | 'self-praise'; // typ záznamu
  mood?: number; // optional mood rating (1-5)
  xpAwarded?: number; // XP amount awarded when this gratitude was created (for accurate deletion)
}

export interface GratitudeStreak {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: DateString | null;
  streakStartDate: DateString | null;
  canRecoverWithAd: boolean; // true if user can recover broken streak with ad
  // ENHANCED: Frozen streak tracking system with warm up payment persistence
  frozenDays: number; // 0-3, days of accumulated missed days that froze the streak
  isFrozen: boolean; // true when frozenDays > 0, streak neither grows nor resets
  preserveCurrentStreak?: boolean; // true after warm up payment to preserve streak instead of recalculating
  warmUpPayments: WarmUpPayment[]; // Track individual ad payments per missed day
  warmUpHistory: WarmUpHistoryEntry[]; // Audit trail for debugging warm up issues
  // CRITICAL FIX BUG #2: Auto-reset state tracking to prevent phantom debt
  autoResetTimestamp: Date | null; // When auto-reset occurred (24h validity)
  autoResetReason: string | null; // Why auto-reset happened (debugging)
  // Bonus milestone counters (mysterious badges)
  starCount: number; // ⭐ - times achieved 1 bonus gratitude in a day
  flameCount: number; // 🔥 - times achieved 5 bonus gratitudes in a day  
  crownCount: number; // 👑 - times achieved 10 bonus gratitudes in a day
}

// NEW: Individual warm up payment tracking
export interface WarmUpPayment {
  missedDate: DateString; // Which specific missed day was warmed up
  adsWatched: number; // How many ads watched for this specific day (1 ad = 1 day cleared)
  paymentTimestamp: Date; // When the warm up was made
  isComplete: boolean; // Whether this missed day is fully warmed up (1 ad = complete)
}

// NEW: Comprehensive audit trail for warm up system debugging
export interface WarmUpHistoryEntry {
  action: 'warm_up' | 'accumulation' | 'auto_reset' | 'manual_reset' | 'quick_warm_up';
  timestamp: Date;
  frozenDaysBefore: number; // Frozen days before action
  frozenDaysAfter: number; // Frozen days after action
  details: string; // Human-readable description of what happened
  missedDates?: DateString[]; // Which dates were involved
  adsInvolved?: number; // How many ads were involved in this action
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