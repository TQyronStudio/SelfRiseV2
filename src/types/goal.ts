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
  completedDate?: DateString;
  order: number; // For custom ordering in UI
}

export interface GoalProgress extends BaseEntity {
  goalId: string;
  value: number;
  note: string;
  date: DateString;
  progressType: 'add' | 'subtract' | 'set'; // type of progress update
}

export interface GoalStats {
  goalId: string;
  totalProgress: number;
  progressEntries: number;
  averageDaily: number;
  daysActive: number;
  completionPercentage: number;
  estimatedCompletionDate?: DateString;
  isOnTrack: boolean;
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