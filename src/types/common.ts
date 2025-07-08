// Common types used across the application
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'teal';

export type Icon = 'fitness' | 'book' | 'water' | 'meditation' | 'music' | 'food' | 'sleep' | 'work';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}