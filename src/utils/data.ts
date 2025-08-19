import { v4 as uuidv4 } from 'uuid';
import { BaseEntity, DateString, DayOfWeek, HabitColor, HabitIcon } from '../types/common';
import { Habit, HabitCompletion, CreateHabitInput } from '../types/habit';
import { Gratitude, CreateGratitudeInput } from '../types/gratitude';
import { Goal, CreateGoalInput, GoalStatus } from '../types/goal';
import { User, AuthProvider, UserSubscriptionStatus } from '../types/user';

// UUID generation utility
export const generateId = (): string => {
  return uuidv4();
};

// Date utilities
export const getCurrentDate = (): Date => {
  return new Date();
};

export const getCurrentDateString = (): DateString => {
  return getCurrentDate().toISOString().split('T')[0]!;
};

// Entity creation utilities
export const createBaseEntity = (id?: string): BaseEntity => {
  const now = getCurrentDate();
  return {
    id: id ?? generateId(),
    createdAt: now,
    updatedAt: now,
  };
};

export const updateEntityTimestamp = <T extends BaseEntity>(entity: T): T => {
  return {
    ...entity,
    updatedAt: getCurrentDate(),
  };
};

// Habit utilities
export const createHabit = (input: CreateHabitInput, order: number = 0): Habit => {
  const habit: Habit = {
    ...createBaseEntity(),
    name: input.name,
    color: input.color,
    icon: input.icon,
    scheduledDays: input.scheduledDays,
    isActive: true,
    order,
  };
  
  if (input.description !== undefined) {
    habit.description = input.description;
  }
  
  return habit;
};

export const createHabitCompletion = (
  habitId: string,
  date: DateString,
  isBonus: boolean = false,
  note?: string
): HabitCompletion => {
  const completion: HabitCompletion = {
    ...createBaseEntity(),
    habitId,
    date,
    completed: true,
    isBonus,
    completedAt: getCurrentDate(),
  };
  
  if (note !== undefined) {
    completion.note = note;
  }
  
  return completion;
};

export const isHabitScheduledForDay = (habit: Habit, dayOfWeek: DayOfWeek): boolean => {
  return habit.scheduledDays.includes(dayOfWeek);
};

export const getHabitColorValue = (color: HabitColor): string => {
  const colorMap: Record<HabitColor, string> = {
    [HabitColor.RED]: '#FF6B6B',
    [HabitColor.BLUE]: '#4ECDC4',
    [HabitColor.GREEN]: '#45B7D1',
    [HabitColor.YELLOW]: '#F9CA24',
    [HabitColor.PURPLE]: '#6C5CE7',
    [HabitColor.ORANGE]: '#FD79A8',
    [HabitColor.PINK]: '#FDCB6E',
    [HabitColor.TEAL]: '#00B894',
  };
  return colorMap[color];
};

export const getHabitIconName = (icon: HabitIcon): string => {
  const iconMap: Record<HabitIcon, string> = {
    [HabitIcon.FITNESS]: 'figure.run',
    [HabitIcon.BOOK]: 'book.fill',
    [HabitIcon.WATER]: 'drop.fill',
    [HabitIcon.MEDITATION]: 'leaf.fill',
    [HabitIcon.MUSIC]: 'music.note',
    [HabitIcon.FOOD]: 'fork.knife',
    [HabitIcon.SLEEP]: 'moon.fill',
    [HabitIcon.WORK]: 'briefcase.fill',
    [HabitIcon.HEALTH]: 'heart.fill',
    [HabitIcon.SOCIAL]: 'person.2.fill',
    [HabitIcon.CREATIVE]: 'paintbrush.fill',
    [HabitIcon.LEARNING]: 'graduationcap.fill',
    [HabitIcon.FINANCE]: 'creditcard.fill',
    [HabitIcon.HOME]: 'house.fill',
  };
  return iconMap[icon];
};

// Gratitude utilities
export const createGratitude = (
  input: CreateGratitudeInput,
  order: number,
  isBonus: boolean = false,
  xpAwarded?: number
): Gratitude => {
  const gratitude: Gratitude = {
    ...createBaseEntity(),
    content: input.content,
    date: input.date,
    type: input.type || 'gratitude', // default typ 'gratitude'
    isBonus,
    order,
  };
  
  if (input.mood !== undefined) {
    gratitude.mood = input.mood;
  }
  
  // Store XP amount awarded for accurate deletion
  if (xpAwarded !== undefined) {
    gratitude.xpAwarded = xpAwarded;
  }
  
  return gratitude;
};

export const getGratitudeCountForDate = (gratitudes: Gratitude[], date: DateString): number => {
  return gratitudes.filter(g => g.date === date).length;
};

export const isDailyGratitudeComplete = (gratitudes: Gratitude[], date: DateString): boolean => {
  return getGratitudeCountForDate(gratitudes, date) >= 3;
};

export const hasBonusGratitude = (gratitudes: Gratitude[], date: DateString): boolean => {
  return getGratitudeCountForDate(gratitudes, date) >= 4;
};

export const getNextGratitudeOrder = (gratitudes: Gratitude[], date: DateString): number => {
  const dayGratitudes = gratitudes.filter(g => g.date === date);
  const totalCount = dayGratitudes.length + 1;
  
  // For regular gratitudes (1-3), use sequential numbering
  if (totalCount <= 3) {
    return totalCount;
  }
  
  // For bonus gratitudes (4+), restart numbering from 1
  const bonusCount = totalCount - 3;
  return bonusCount;
};

// Goal utilities
export const createGoal = (input: CreateGoalInput, order: number = 0): Goal => {
  const goal: Goal = {
    ...createBaseEntity(),
    title: input.title,
    unit: input.unit,
    targetValue: input.targetValue,
    currentValue: 0,
    status: GoalStatus.ACTIVE,
    category: input.category,
    startDate: getCurrentDateString(),
    order,
  };
  
  if (input.description !== undefined) {
    goal.description = input.description;
  }
  
  if (input.targetDate !== undefined) {
    goal.targetDate = input.targetDate;
  }
  
  return goal;
};

export const calculateGoalProgress = (goal: Goal): number => {
  if (goal.targetValue === 0) return 0;
  return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
};

export const isGoalCompleted = (goal: Goal): boolean => {
  return goal.currentValue >= goal.targetValue;
};

export const updateGoalValue = (goal: Goal, value: number, progressType: 'add' | 'subtract' | 'set'): Goal => {
  let newValue: number;
  
  switch (progressType) {
    case 'add':
      newValue = goal.currentValue + value;
      break;
    case 'subtract':
      newValue = Math.max(0, goal.currentValue - value);
      break;
    case 'set':
      newValue = Math.max(0, value);
      break;
    default:
      newValue = goal.currentValue;
  }

  const updatedGoal = updateEntityTimestamp({
    ...goal,
    currentValue: newValue,
  });

  // Auto-complete goal if target reached
  if (newValue >= goal.targetValue && goal.status === GoalStatus.ACTIVE) {
    updatedGoal.status = GoalStatus.COMPLETED;
    updatedGoal.completedDate = getCurrentDateString();
  }

  return updatedGoal;
};

// User utilities
export const createUser = (
  email: string,
  displayName: string,
  authProvider: AuthProvider = AuthProvider.EMAIL
): User => {
  return {
    ...createBaseEntity(),
    email,
    displayName,
    isAuthenticated: true,
    authProvider,
    subscriptionStatus: UserSubscriptionStatus.FREE,
    lastLoginAt: getCurrentDate(),
    isEmailVerified: false,
  };
};

// Array utilities
export const sortByOrder = <T extends { order: number }>(items: T[]): T[] => {
  return items.sort((a, b) => a.order - b.order);
};

export const sortByCreatedAt = <T extends BaseEntity>(items: T[], ascending: boolean = false): T[] => {
  return items.sort((a, b) => {
    const comparison = a.createdAt.getTime() - b.createdAt.getTime();
    return ascending ? comparison : -comparison;
  });
};

export const sortByUpdatedAt = <T extends BaseEntity>(items: T[], ascending: boolean = false): T[] => {
  return items.sort((a, b) => {
    const comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
    return ascending ? comparison : -comparison;
  });
};

export const findById = <T extends BaseEntity>(items: T[], id: string): T | undefined => {
  return items.find(item => item.id === id);
};

export const removeById = <T extends BaseEntity>(items: T[], id: string): T[] => {
  return items.filter(item => item.id !== id);
};

export const updateById = <T extends BaseEntity>(items: T[], id: string, updates: Partial<T>): T[] => {
  return items.map(item => 
    item.id === id 
      ? updateEntityTimestamp({ ...item, ...updates })
      : item
  );
};

// Pagination utilities
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const paginate = <T>(
  items: T[],
  options: PaginationOptions
): PaginatedResult<T> => {
  const { page, limit } = options;
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const data = items.slice(offset, offset + limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// Search utilities
export const searchByText = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return typeof value === 'string' && value.toLowerCase().includes(term);
    })
  );
};

// Export validation utilities from types
export * from '../types/validation';