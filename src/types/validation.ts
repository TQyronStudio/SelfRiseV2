import { ValidationResult, HabitColor, HabitIcon, DayOfWeek } from './common';
import { GoalStatus, GoalCategory } from './goal';

// Validation utility functions
export class Validator {
  static required(value: any, fieldName: string): string | null {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  static minLength(value: string, min: number, fieldName: string): string | null {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters long`;
    }
    return null;
  }

  static maxLength(value: string, max: number, fieldName: string): string | null {
    if (value && value.length > max) {
      return `${fieldName} must be at most ${max} characters long`;
    }
    return null;
  }

  static email(value: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static minValue(value: number, min: number, fieldName: string): string | null {
    if (value !== undefined && value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  }

  static maxValue(value: number, max: number, fieldName: string): string | null {
    if (value !== undefined && value > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return null;
  }

  static dateString(value: string): string | null {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (value && !dateRegex.test(value)) {
      return 'Date must be in YYYY-MM-DD format';
    }
    if (value && isNaN(Date.parse(value))) {
      return 'Please enter a valid date';
    }
    return null;
  }

  static timeString(value: string): string | null {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (value && !timeRegex.test(value)) {
      return 'Time must be in HH:MM format (24-hour)';
    }
    return null;
  }

  static enumValue<T extends Record<string, string>>(
    value: string,
    enumObject: T,
    fieldName: string
  ): string | null {
    const validValues = Object.values(enumObject);
    if (value && !validValues.includes(value)) {
      return `${fieldName} must be one of: ${validValues.join(', ')}`;
    }
    return null;
  }

  static arrayNotEmpty<T>(value: T[], fieldName: string): string | null {
    if (!value || value.length === 0) {
      return `${fieldName} must contain at least one item`;
    }
    return null;
  }

  static runValidations(validations: (string | null)[]): ValidationResult {
    const errors = validations.filter((error): error is string => error !== null);
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Habit validation schemas
export const validateCreateHabit = (data: any): ValidationResult => {
  const validations = [
    Validator.required(data.name, 'Habit name'),
    Validator.minLength(data.name, 1, 'Habit name'),
    Validator.maxLength(data.name, 100, 'Habit name'),
    Validator.required(data.color, 'Color'),
    Validator.enumValue(data.color, HabitColor, 'Color'),
    Validator.required(data.icon, 'Icon'),
    Validator.enumValue(data.icon, HabitIcon, 'Icon'),
    Validator.arrayNotEmpty(data.scheduledDays, 'Scheduled days'),
    data.description ? Validator.maxLength(data.description, 500, 'Description') : null,
  ];

  // Validate scheduled days
  if (data.scheduledDays && Array.isArray(data.scheduledDays)) {
    data.scheduledDays.forEach((day: string, index: number) => {
      validations.push(
        Validator.enumValue(day, DayOfWeek, `Scheduled day ${index + 1}`)
      );
    });
  }

  return Validator.runValidations(validations);
};

export const validateUpdateHabit = (data: any): ValidationResult => {
  const validations = [
    data.name ? Validator.minLength(data.name, 1, 'Habit name') : null,
    data.name ? Validator.maxLength(data.name, 100, 'Habit name') : null,
    data.color ? Validator.enumValue(data.color, HabitColor, 'Color') : null,
    data.icon ? Validator.enumValue(data.icon, HabitIcon, 'Icon') : null,
    data.description ? Validator.maxLength(data.description, 500, 'Description') : null,
  ];

  // Validate scheduled days if provided
  if (data.scheduledDays && Array.isArray(data.scheduledDays)) {
    validations.push(Validator.arrayNotEmpty(data.scheduledDays, 'Scheduled days'));
    data.scheduledDays.forEach((day: string, index: number) => {
      validations.push(
        Validator.enumValue(day, DayOfWeek, `Scheduled day ${index + 1}`)
      );
    });
  }

  return Validator.runValidations(validations);
};

// Gratitude validation schemas
export const validateCreateGratitude = (data: any): ValidationResult => {
  const validations = [
    Validator.required(data.content, 'Gratitude content'),
    Validator.minLength(data.content, 3, 'Gratitude content'),
    Validator.maxLength(data.content, 1000, 'Gratitude content'),
    Validator.required(data.date, 'Date'),
    Validator.dateString(data.date),
    data.mood ? Validator.minValue(data.mood, 1, 'Mood') : null,
    data.mood ? Validator.maxValue(data.mood, 5, 'Mood') : null,
  ];

  return Validator.runValidations(validations);
};

export const validateUpdateGratitude = (data: any): ValidationResult => {
  const validations = [
    data.content ? Validator.minLength(data.content, 3, 'Gratitude content') : null,
    data.content ? Validator.maxLength(data.content, 1000, 'Gratitude content') : null,
    data.mood ? Validator.minValue(data.mood, 1, 'Mood') : null,
    data.mood ? Validator.maxValue(data.mood, 5, 'Mood') : null,
  ];

  return Validator.runValidations(validations);
};

// Goal validation schemas
export const validateCreateGoal = (data: any): ValidationResult => {
  const validations = [
    Validator.required(data.title, 'Goal title'),
    Validator.minLength(data.title, 1, 'Goal title'),
    Validator.maxLength(data.title, 200, 'Goal title'),
    Validator.required(data.unit, 'Unit'),
    Validator.minLength(data.unit, 1, 'Unit'),
    Validator.maxLength(data.unit, 50, 'Unit'),
    Validator.required(data.targetValue, 'Target value'),
    Validator.minValue(data.targetValue, 0.01, 'Target value'),
    Validator.required(data.category, 'Category'),
    Validator.enumValue(data.category, GoalCategory, 'Category'),
    data.description ? Validator.maxLength(data.description, 1000, 'Description') : null,
    data.targetDate ? Validator.dateString(data.targetDate) : null,
  ];

  return Validator.runValidations(validations);
};

export const validateUpdateGoal = (data: any): ValidationResult => {
  const validations = [
    data.title ? Validator.minLength(data.title, 1, 'Goal title') : null,
    data.title ? Validator.maxLength(data.title, 200, 'Goal title') : null,
    data.unit ? Validator.minLength(data.unit, 1, 'Unit') : null,
    data.unit ? Validator.maxLength(data.unit, 50, 'Unit') : null,
    data.targetValue ? Validator.minValue(data.targetValue, 0.01, 'Target value') : null,
    data.status ? Validator.enumValue(data.status, GoalStatus, 'Status') : null,
    data.category ? Validator.enumValue(data.category, GoalCategory, 'Category') : null,
    data.description ? Validator.maxLength(data.description, 1000, 'Description') : null,
    data.targetDate ? Validator.dateString(data.targetDate) : null,
  ];

  return Validator.runValidations(validations);
};

export const validateAddGoalProgress = (data: any): ValidationResult => {
  const validations = [
    Validator.required(data.goalId, 'Goal ID'),
    Validator.required(data.value, 'Progress value'),
    Validator.required(data.note, 'Progress note'),
    Validator.minLength(data.note, 1, 'Progress note'),
    Validator.maxLength(data.note, 500, 'Progress note'),
    Validator.required(data.date, 'Date'),
    Validator.dateString(data.date),
    Validator.required(data.progressType, 'Progress type'),
  ];

  const validProgressTypes = ['add', 'subtract', 'set'];
  if (data.progressType && !validProgressTypes.includes(data.progressType)) {
    validations.push('Progress type must be one of: add, subtract, set');
  }

  return Validator.runValidations(validations);
};

// User validation schemas
export const validateLoginCredentials = (data: any): ValidationResult => {
  const validations = [
    Validator.required(data.email, 'Email'),
    Validator.email(data.email),
    Validator.required(data.password, 'Password'),
    Validator.minLength(data.password, 6, 'Password'),
  ];

  return Validator.runValidations(validations);
};

export const validateRegisterCredentials = (data: any): ValidationResult => {
  const validations = [
    Validator.required(data.email, 'Email'),
    Validator.email(data.email),
    Validator.required(data.password, 'Password'),
    Validator.minLength(data.password, 8, 'Password'),
    Validator.required(data.displayName, 'Display name'),
    Validator.minLength(data.displayName, 2, 'Display name'),
    Validator.maxLength(data.displayName, 100, 'Display name'),
  ];

  return Validator.runValidations(validations);
};

export const validateUpdateProfile = (data: any): ValidationResult => {
  const validations = [
    data.displayName ? Validator.minLength(data.displayName, 2, 'Display name') : null,
    data.displayName ? Validator.maxLength(data.displayName, 100, 'Display name') : null,
  ];

  return Validator.runValidations(validations);
};

export const validateUpdateSettings = (data: any): ValidationResult => {
  const validLanguages = ['en', 'de', 'es'];
  const validThemes = ['light', 'dark', 'system'];

  const validations = [
    data.language && !validLanguages.includes(data.language) 
      ? 'Language must be one of: en, de, es' 
      : null,
    data.theme && !validThemes.includes(data.theme) 
      ? 'Theme must be one of: light, dark, system' 
      : null,
    data.morningNotificationTime ? Validator.timeString(data.morningNotificationTime) : null,
    data.eveningNotificationTime ? Validator.timeString(data.eveningNotificationTime) : null,
  ];

  return Validator.runValidations(validations);
};