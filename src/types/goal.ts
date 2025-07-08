import { BaseEntity } from './common';

export interface Goal extends BaseEntity {
  title: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
}

export interface GoalProgress extends BaseEntity {
  goalId: string;
  value: number;
  note: string;
  date: string; // YYYY-MM-DD format
}