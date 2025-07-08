import { useMemo } from 'react';
import { useGratitude } from '../contexts/GratitudeContext';
import { Gratitude } from '../types/gratitude';
import { DateString } from '../types/common';

export function useGratitudeData() {
  const { state, actions } = useGratitude();

  const gratitudeData = useMemo(() => {
    const sortedGratitudes = [...state.gratitudes].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime() || a.order - b.order
    );
    
    return {
      gratitudes: sortedGratitudes,
      streakInfo: state.streakInfo,
      stats: state.stats,
      isLoading: state.isLoading,
      error: state.error,
    };
  }, [state.gratitudes, state.streakInfo, state.stats, state.isLoading, state.error]);

  const getGratitudesByDate = (date: DateString): Gratitude[] => {
    return state.gratitudes
      .filter(gratitude => gratitude.date === date)
      .sort((a, b) => a.order - b.order);
  };

  const getTodaysGratitudes = (): Gratitude[] => {
    const today = new Date().toISOString().split('T')[0] as DateString;
    return getGratitudesByDate(today);
  };

  const canAddGratitude = (date: DateString): boolean => {
    const gratitudesForDate = getGratitudesByDate(date);
    return gratitudesForDate.length < 10; // Maximum 10 gratitudes per day
  };

  const isMinimumMet = (date: DateString): boolean => {
    const gratitudesForDate = getGratitudesByDate(date);
    return gratitudesForDate.length >= 3;
  };

  const hasBonus = (date: DateString): boolean => {
    const gratitudesForDate = getGratitudesByDate(date);
    return gratitudesForDate.length >= 4;
  };

  const getDailyStats = (date: DateString) => {
    const gratitudesForDate = getGratitudesByDate(date);
    
    return {
      count: gratitudesForDate.length,
      isComplete: gratitudesForDate.length >= 3,
      hasBonus: gratitudesForDate.length >= 4,
      canAdd: gratitudesForDate.length < 10,
      gratitudes: gratitudesForDate,
    };
  };

  const getRecentGratitudes = (days: number = 7): Gratitude[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return state.gratitudes
      .filter(gratitude => new Date(gratitude.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getGratitudesByMonth = (year: number, month: number): Map<string, Gratitude[]> => {
    const monthGratitudes = state.gratitudes.filter(gratitude => {
      const date = new Date(gratitude.date);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });
    
    const grouped = new Map<string, Gratitude[]>();
    monthGratitudes.forEach(gratitude => {
      const date = gratitude.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(gratitude);
    });
    
    // Sort gratitudes within each day
    grouped.forEach(dayGratitudes => {
      dayGratitudes.sort((a, b) => a.order - b.order);
    });
    
    return grouped;
  };

  const searchGratitudes = (query: string): Gratitude[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return state.gratitudes.filter(gratitude =>
      gratitude.content.toLowerCase().includes(searchTerm)
    );
  };

  return {
    ...gratitudeData,
    actions,
    getGratitudesByDate,
    getTodaysGratitudes,
    canAddGratitude,
    isMinimumMet,
    hasBonus,
    getDailyStats,
    getRecentGratitudes,
    getGratitudesByMonth,
    searchGratitudes,
  };
}