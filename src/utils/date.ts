import { DateString, DayOfWeek } from '../types/common';
import { WarmUpPayment } from '../types/gratitude';
import i18next from 'i18next';

// Date formatting constants
export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:MM';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:MM:SS';

// Day of week utilities
export const getDayOfWeek = (date: Date): DayOfWeek => {
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayMap: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
  return dayMap[dayIndex]!;
};

export const getDayOfWeekFromDateString = (dateString: DateString): DayOfWeek => {
  return getDayOfWeek(parseDate(dateString));
};

// Date string utilities
export const formatDateToString = (date: Date): DateString => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateString: DateString): Date => {
  return new Date(dateString + 'T00:00:00.000Z');
};

export const isValidDateString = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && formatDateToString(date) === dateString;
};

// Current date utilities
export const today = (): DateString => {
  return formatDateToString(new Date());
};

export const yesterday = (): DateString => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDateToString(date);
};

export const tomorrow = (): DateString => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateToString(date);
};

// Date arithmetic
export const addDays = (date: DateString | Date, days: number): DateString | Date => {
  if (date instanceof Date) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  } else {
    const parsedDate = parseDate(date);
    parsedDate.setDate(parsedDate.getDate() + days);
    return formatDateToString(parsedDate);
  }
};

export const subtractDays = (dateString: DateString, days: number): DateString => {
  const result = addDays(dateString, -days);
  return typeof result === 'string' ? result : formatDateToString(result);
};

export const addWeeks = (dateString: DateString, weeks: number): DateString => {
  const result = addDays(dateString, weeks * 7);
  return typeof result === 'string' ? result : formatDateToString(result);
};

export const addMonths = (dateString: DateString, months: number): DateString => {
  const date = parseDate(dateString);
  date.setMonth(date.getMonth() + months);
  return formatDateToString(date);
};

// Date comparison
export const isToday = (dateString: DateString): boolean => {
  return dateString === today();
};

export const isYesterday = (dateString: DateString): boolean => {
  return dateString === yesterday();
};

export const isTomorrow = (dateString: DateString): boolean => {
  return dateString === tomorrow();
};

export const isBefore = (date1: DateString, date2: DateString): boolean => {
  return date1 < date2;
};

export const isAfter = (date1: DateString, date2: DateString): boolean => {
  return date1 > date2;
};

export const isSameDate = (date1: DateString, date2: DateString): boolean => {
  return date1 === date2;
};

export const daysBetween = (startDate: DateString, endDate: DateString): number => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Week utilities
export const getWeekStart = (dateString: DateString): DateString => {
  const date = parseDate(dateString);
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
  date.setDate(diff);
  return formatDateToString(date);
};

export const getWeekEnd = (dateString: DateString): DateString => {
  const weekStart = getWeekStart(dateString);
  const result = addDays(weekStart, 6);
  return typeof result === 'string' ? result : formatDateToString(result);
};

export const getWeekDates = (dateString?: DateString): DateString[] => {
  const targetDate = dateString || today();
  const weekStart = getWeekStart(targetDate);
  const dates: DateString[] = [];
  for (let i = 0; i < 7; i++) {
    const result = addDays(weekStart, i);
    dates.push(typeof result === 'string' ? result : formatDateToString(result));
  }
  return dates;
};

export const getPast7Days = (): DateString[] => {
  const dates: DateString[] = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(subtractDays(today(), i));
  }
  return dates; // [today-6, today-5, ..., today-1, today]
};

export const getPast30Days = (): DateString[] => {
  const dates: DateString[] = [];
  for (let i = 29; i >= 0; i--) {
    dates.push(subtractDays(today(), i));
  }
  return dates; // Array of 30 dates ending with today
};

export const getPast365Days = (): DateString[] => {
  const dates: DateString[] = [];
  for (let i = 364; i >= 0; i--) {
    dates.push(subtractDays(today(), i));
  }
  return dates; // Array of 365 dates ending with today
};

// Month utilities
export const getMonthStart = (dateString: DateString): DateString => {
  const date = parseDate(dateString);
  date.setDate(1);
  return formatDateToString(date);
};

export const getMonthEnd = (dateString: DateString): DateString => {
  const date = parseDate(dateString);
  date.setMonth(date.getMonth() + 1, 0); // Last day of current month
  return formatDateToString(date);
};

export const getMonthDates = (dateString: DateString): DateString[] => {
  const monthStart = getMonthStart(dateString);
  const monthEnd = getMonthEnd(dateString);
  const dates: DateString[] = [];
  
  let currentDate = monthStart;
  while (currentDate <= monthEnd) {
    dates.push(currentDate);
    const result = addDays(currentDate, 1);
    currentDate = typeof result === 'string' ? result : formatDateToString(result);
  }
  
  return dates;
};

export const getDaysInMonth = (dateString: DateString): number => {
  const date = parseDate(dateString);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Year utilities
export const getYearStart = (dateString: DateString): DateString => {
  const date = parseDate(dateString);
  date.setMonth(0, 1);
  return formatDateToString(date);
};

export const getYearEnd = (dateString: DateString): DateString => {
  const date = parseDate(dateString);
  date.setMonth(11, 31);
  return formatDateToString(date);
};

// Date range utilities
export const getDateRange = (startDate: DateString, endDate: DateString): DateString[] => {
  const dates: DateString[] = [];
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    dates.push(currentDate);
    const result = addDays(currentDate, 1);
    currentDate = typeof result === 'string' ? result : formatDateToString(result);
  }
  
  return dates;
};

export const isInDateRange = (
  dateToCheck: DateString,
  startDate: DateString,
  endDate: DateString
): boolean => {
  return dateToCheck >= startDate && dateToCheck <= endDate;
};

// Time utilities
export const formatTime = (hours: number, minutes: number): string => {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m}`;
};

export const parseTime = (timeString: string): { hours: number; minutes: number } | null => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const match = timeString.match(regex);
  
  if (!match) return null;
  
  return {
    hours: parseInt(match[1]!, 10),
    minutes: parseInt(match[2]!, 10),
  };
};

export const isValidTimeString = (timeString: string): boolean => {
  return parseTime(timeString) !== null;
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return formatTime(now.getHours(), now.getMinutes());
};

// Streak calculation utilities
export const calculateStreak = (dates: DateString[], endDate?: DateString): number => {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...dates].sort().reverse(); // Most recent first
  const targetEndDate = endDate || today();
  
  let streak = 0;
  let expectedDate = targetEndDate;
  
  for (const date of sortedDates) {
    if (date === expectedDate) {
      streak++;
      expectedDate = subtractDays(expectedDate, 1);
    } else if (date < expectedDate) {
      break; // Gap found, streak ends
    }
  }
  
  return streak;
};

// Calculate current streak from most recent completed date
export const calculateCurrentStreak = (dates: DateString[]): number => {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...dates].sort().reverse(); // Most recent first
  const mostRecentDate = sortedDates[0]!; // Start from most recent completed date
  
  let streak = 0;
  let expectedDate = mostRecentDate;
  
  for (const date of sortedDates) {
    if (date === expectedDate) {
      streak++;
      expectedDate = subtractDays(expectedDate, 1);
    } else if (date < expectedDate) {
      break; // Gap found, streak ends
    }
  }
  
  return streak;
};

// Calculate "continuing streak" - shows ongoing streak even if today isn't completed yet
export const calculateContinuingStreak = (dates: DateString[], currentDate?: DateString): number => {
  if (dates.length === 0) return 0;
  
  const today = currentDate || new Date().toISOString().split('T')[0] as DateString;
  const yesterday = subtractDays(today, 1);
  
  // If today is already completed, use normal streak calculation
  if (dates.includes(today)) {
    return calculateStreak(dates, today);
  }
  
  // If yesterday is completed, calculate continuing streak from yesterday
  if (dates.includes(yesterday)) {
    return calculateStreak(dates, yesterday);
  }
  
  // No recent completion, streak is 0
  return 0;
};

export const calculateLongestStreak = (dates: DateString[]): number => {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...dates].sort();
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currentDate = sortedDates[i];
    
    if (daysBetween(prevDate!, currentDate!) === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return longestStreak;
};

// Display utilities
export const getRelativeDateText = (dateString: DateString): string => {
  if (isToday(dateString)) return 'Today';
  if (isYesterday(dateString)) return 'Yesterday';
  if (isTomorrow(dateString)) return 'Tomorrow';

  const date = parseDate(dateString);
  const daysDiff = daysBetween(today(), dateString);
  const locale = i18next.language || 'en';

  if (Math.abs(daysDiff) <= 7) {
    const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
    return daysDiff > 0 ? `Next ${dayName}` : `Last ${dayName}`;
  }

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

export const formatDate = (date: Date, format: string): string => {
  const locale = i18next.language || 'en';

  switch (format) {
    case 'YYYY-MM-DD':
      return formatDateToString(date);
    case 'dd':
      return date.toLocaleDateString(locale, { weekday: 'long' });
    default:
      return date.toLocaleDateString(locale);
  }
};

export const formatDateForDisplay = (dateString: DateString, format: 'short' | 'long' | 'full' = 'short'): string => {
  const date = parseDate(dateString);
  const locale = i18next.language || 'en';

  switch (format) {
    case 'short':
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    case 'long':
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    case 'full':
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    default:
      return dateString;
  }
};

// Data availability utilities
export const findEarliestDate = (dates: DateString[]): DateString | null => {
  if (dates.length === 0) return null;
  return dates.sort()[0] || null;
};

export const findLatestDate = (dates: DateString[]): DateString | null => {
  if (dates.length === 0) return null;
  return dates.sort().reverse()[0] || null;
};

export const getDateRangeFromToday = (startDate: DateString): DateString[] => {
  if (startDate > today()) return [];
  return getDateRange(startDate, today());
};

// Week utilities with Date parameter support
export const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust if sunday
  d.setDate(diff);
  return d;
};

export const endOfWeek = (date: Date): Date => {
  const startWeek = startOfWeek(date);
  return addDays(startWeek, 6) as Date;
};

// 🎯 WARM-UP AWARE CALCULATION: Smart streak calculation that bridges paid gaps
export const calculateStreakWithWarmUp = (
  dates: DateString[],
  currentDate: DateString,
  warmUpPayments: WarmUpPayment[]
): number => {
  // 🚨 CRITICAL FIX: Don't require today to be complete for warm-up to work
  // This allows warm-up to preserve streak even before user writes today's entries

  // Get paid dates that bridge gaps (don't count as +1, just allow continuation)
  const paidDates = warmUpPayments
    .filter(payment => payment.isComplete)
    .map(payment => payment.missedDate);

  let streak = 0;
  let checkDate = subtractDays(currentDate, 1); // Start from yesterday

  while (true) {
    if (dates.includes(checkDate)) {
      // Real completed day - count it
      streak++;
      checkDate = subtractDays(checkDate, 1);
    } else if (paidDates.includes(checkDate)) {
      // Paid gap - continue but don't count as +1 (just bridges the gap)
      checkDate = subtractDays(checkDate, 1);
    } else {
      // Real gap - streak ends here
      break;
    }
  }

  // If today is complete, add it to the streak
  if (dates.includes(currentDate)) {
    streak++;
  }

  return streak;
};