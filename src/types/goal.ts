import { BaseEntity, DateString } from './common';

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum GoalCategory {
  FINANCIAL = 'financial',
  HEALTH = 'health',
  LEARNING = 'learning',
  PERSONAL = 'personal',
  CAREER = 'career',
  OTHER = 'other',
}

export interface Goal extends BaseEntity {
  title: string;
  description?: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  status: GoalStatus;
  category: GoalCategory;
  targetDate?: DateString;
  startDate: DateString;
  completedDate?: DateString | undefined;
  order: number; // For custom ordering in UI
}

export interface GoalProgress extends BaseEntity {
  goalId: string;
  value: number;
  note: string;
  date: DateString;
  progressType: 'add' | 'subtract' | 'set'; // type of progress update
  /**
   * The XP this entry really got (0 over the daily cap or for "set", negative
   * for a subtraction); null = unknown — an entry from before 2026-11-25.
   */
  xpAwarded?: number | null;
}

/** What a new log did: the entry, and the milestones (25/50/75) it paid. */
export interface LoggedGoalProgress extends GoalProgress {
  milestonesPaid: number[];
}

// Timeline status for goal progress tracking
export type GoalTimelineStatus = 'wayAhead' | 'ahead' | 'onTrack' | 'behind' | 'wayBehind';

export interface GoalStats {
  goalId: string;
  totalProgress: number;
  progressEntries: number;
  averageDaily: number;
  daysActive: number;
  daysWithProgress: number;
  completionPercentage: number;
  estimatedCompletionDate?: DateString | undefined;
  isOnTrack: boolean;
  timelineStatus?: GoalTimelineStatus;
}

// Create goal input interface
export interface CreateGoalInput {
  title: string;
  description?: string | undefined;
  unit: string;
  targetValue: number;
  category: GoalCategory;
  targetDate?: DateString | undefined;
}

// Update goal input interface
export interface UpdateGoalInput {
  title?: string;
  description?: string | undefined;
  unit?: string;
  targetValue?: number;
  status?: GoalStatus;
  category?: GoalCategory;
  targetDate?: DateString | undefined;
  order?: number;
}

// Add progress input interface
export interface AddGoalProgressInput {
  goalId: string;
  value: number;
  note: string;
  date: DateString;
  progressType: 'add' | 'subtract' | 'set';
}