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
  // ENHANCED: Debt tracking system with payment persistence
  debtDays: number; // 0-3, days of accumulated debt from missed days
  isFrozen: boolean; // true when debt > 0, streak neither grows nor resets
  preserveCurrentStreak?: boolean; // true after debt payment to preserve streak instead of recalculating
  debtPayments: DebtPayment[]; // Track individual ad payments per missed day
  debtHistory: DebtHistoryEntry[]; // Audit trail for debugging debt issues
  // CRITICAL FIX BUG #2: Auto-reset state tracking to prevent phantom debt
  autoResetTimestamp: Date | null; // When auto-reset occurred (24h validity)
  autoResetReason: string | null; // Why auto-reset happened (debugging)
  // Bonus milestone counters (mysterious badges)
  starCount: number; // ⭐ - times achieved 1 bonus gratitude in a day
  flameCount: number; // 🔥 - times achieved 5 bonus gratitudes in a day  
  crownCount: number; // 👑 - times achieved 10 bonus gratitudes in a day
}

// NEW: Individual debt payment tracking
export interface DebtPayment {
  missedDate: DateString; // Which specific missed day was paid for
  adsWatched: number; // How many ads watched for this specific day (1 ad = 1 day cleared)
  paymentTimestamp: Date; // When the payment was made
  isComplete: boolean; // Whether this missed day is fully paid (1 ad = complete)
}

// NEW: Comprehensive audit trail for debt system debugging
export interface DebtHistoryEntry {
  action: 'payment' | 'accumulation' | 'auto_reset' | 'manual_reset' | 'force_reset';
  timestamp: Date;
  debtBefore: number; // Debt days before action
  debtAfter: number; // Debt days after action
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