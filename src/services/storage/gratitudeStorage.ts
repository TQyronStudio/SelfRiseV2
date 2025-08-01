import { Gratitude, GratitudeStreak, GratitudeStats, CreateGratitudeInput } from '../../types/gratitude';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createGratitude, updateEntityTimestamp, getNextGratitudeOrder } from '../../utils/data';
import { DateString } from '../../types/common';
import { calculateStreak, calculateLongestStreak, today, yesterday, subtractDays, formatDateToString } from '../../utils/date';
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';

export class GratitudeStorage implements EntityStorage<Gratitude> {
  // Gratitude CRUD operations
  async getAll(): Promise<Gratitude[]> {
    try {
      const gratitudes = await BaseStorage.get<Gratitude[]>(STORAGE_KEYS.GRATITUDES);
      return gratitudes || [];
    } catch (error) {
      throw new StorageError(
        'Failed to get all gratitudes',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async getById(id: string): Promise<Gratitude | null> {
    try {
      const gratitudes = await this.getAll();
      return gratitudes.find(gratitude => gratitude.id === id) || null;
    } catch (error) {
      throw new StorageError(
        `Failed to get gratitude with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async create(input: CreateGratitudeInput): Promise<Gratitude> {
    try {
      const gratitudes = await this.getAll();
      const dayGratitudes = gratitudes.filter(g => g.date === input.date);
      const totalCount = dayGratitudes.length + 1;
      const isBonus = totalCount > 3; // 4th+ gratitude is bonus
      const order = getNextGratitudeOrder(gratitudes, input.date);
      
      const newGratitude = createGratitude(input, order, isBonus);
      
      gratitudes.push(newGratitude);
      await BaseStorage.set(STORAGE_KEYS.GRATITUDES, gratitudes);
      
      // Update streak after adding new gratitude
      await this.calculateAndUpdateStreak();
      
      // Award XP based on entry position and anti-spam logic
      await this.awardJournalXP(totalCount, input.date);
      
      return newGratitude;
    } catch (error) {
      throw new StorageError(
        'Failed to create gratitude',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async update(id: string, updates: Partial<Gratitude>): Promise<Gratitude> {
    try {
      const gratitudes = await this.getAll();
      const gratitudeIndex = gratitudes.findIndex(gratitude => gratitude.id === id);
      
      if (gratitudeIndex === -1) {
        throw new StorageError(
          `Gratitude with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GRATITUDES
        );
      }

      const updatedGratitude = updateEntityTimestamp({
        ...gratitudes[gratitudeIndex],
        ...updates,
      } as Gratitude);

      gratitudes[gratitudeIndex] = updatedGratitude;
      await BaseStorage.set(STORAGE_KEYS.GRATITUDES, gratitudes);

      return updatedGratitude;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to update gratitude with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const gratitudes = await this.getAll();
      const originalLength = gratitudes.length;
      const filteredGratitudes = gratitudes.filter(gratitude => gratitude.id !== id);
      
      if (filteredGratitudes.length === originalLength) {
        throw new StorageError(
          `Gratitude with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.GRATITUDES
        );
      }

      // Reorder remaining gratitudes for the same date
      const deletedGratitude = gratitudes.find(g => g.id === id);
      if (deletedGratitude) {
        const sameDate = filteredGratitudes.filter(g => g.date === deletedGratitude.date);
        const reorderedGratitudes = filteredGratitudes.map(gratitude => {
          if (gratitude.date === deletedGratitude.date) {
            const positionIndex = sameDate.findIndex(g => g.id === gratitude.id) + 1;
            const isBonus = positionIndex > 3;
            
            // Calculate new order: 1-3 for regular, 1+ for bonus
            let newOrder;
            if (positionIndex <= 3) {
              newOrder = positionIndex; // Regular: 1, 2, 3
            } else {
              newOrder = positionIndex - 3; // Bonus: 1, 2, 3, 4...
            }
            
            return updateEntityTimestamp({ ...gratitude, order: newOrder, isBonus });
          }
          return gratitude;
        });
        
        await BaseStorage.set(STORAGE_KEYS.GRATITUDES, reorderedGratitudes);
      } else {
        await BaseStorage.set(STORAGE_KEYS.GRATITUDES, filteredGratitudes);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to delete gratitude with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await BaseStorage.remove(STORAGE_KEYS.GRATITUDES);
      await BaseStorage.remove(STORAGE_KEYS.GRATITUDE_STREAK);
    } catch (error) {
      throw new StorageError(
        'Failed to delete all gratitudes',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async count(): Promise<number> {
    try {
      const gratitudes = await this.getAll();
      return gratitudes.length;
    } catch (error) {
      throw new StorageError(
        'Failed to count gratitudes',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // Date-specific operations
  async getByDate(date: DateString): Promise<Gratitude[]> {
    try {
      const gratitudes = await this.getAll();
      return gratitudes
        .filter(gratitude => gratitude.date === date)
        .sort((a, b) => a.order - b.order);
    } catch (error) {
      throw new StorageError(
        `Failed to get gratitudes for date ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async getByDateRange(startDate: DateString, endDate: DateString): Promise<Gratitude[]> {
    try {
      const gratitudes = await this.getAll();
      return gratitudes
        .filter(gratitude => gratitude.date >= startDate && gratitude.date <= endDate)
        .sort((a, b) => {
          if (a.date === b.date) {
            return a.order - b.order;
          }
          return a.date.localeCompare(b.date);
        });
    } catch (error) {
      throw new StorageError(
        `Failed to get gratitudes for date range ${startDate} to ${endDate}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async countByDate(date: DateString): Promise<number> {
    try {
      const gratitudes = await this.getByDate(date);
      return gratitudes.length;
    } catch (error) {
      throw new StorageError(
        `Failed to count gratitudes for date ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async isDayComplete(date: DateString): Promise<boolean> {
    try {
      const count = await this.countByDate(date);
      return count >= 3;
    } catch (error) {
      throw new StorageError(
        `Failed to check if day ${date} is complete`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async hasBonus(date: DateString): Promise<boolean> {
    try {
      const count = await this.countByDate(date);
      return count >= 4;
    } catch (error) {
      throw new StorageError(
        `Failed to check if day ${date} has bonus`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // Streak operations
  async getStreak(): Promise<GratitudeStreak> {
    try {
      const streak = await BaseStorage.get<GratitudeStreak>(STORAGE_KEYS.GRATITUDE_STREAK);
      
      // Migration: Add new properties if they don't exist
      if (streak && (streak.debtDays === undefined || streak.isFrozen === undefined)) {
        const migratedStreak: GratitudeStreak = {
          ...streak,
          debtDays: streak.debtDays || 0,
          isFrozen: streak.isFrozen || false,
        };
        await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, migratedStreak);
        return migratedStreak;
      }
      
      return streak || {
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
        streakStartDate: null,
        canRecoverWithAd: false,
        debtDays: 0,
        isFrozen: false,
        starCount: 0,
        flameCount: 0,
        crownCount: 0,
      };
    } catch (error) {
      throw new StorageError(
        'Failed to get gratitude streak',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDE_STREAK
      );
    }
  }

  async updateStreak(streak: Partial<GratitudeStreak>): Promise<GratitudeStreak> {
    try {
      const currentStreak = await this.getStreak();
      const updatedStreak = { ...currentStreak, ...streak };
      
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, updatedStreak);
      return updatedStreak;
    } catch (error) {
      throw new StorageError(
        'Failed to update gratitude streak',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDE_STREAK
      );
    }
  }

  async resetStreak(): Promise<GratitudeStreak> {
    try {
      const resetStreak: GratitudeStreak = {
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
        streakStartDate: null,
        canRecoverWithAd: false,
        debtDays: 0,
        isFrozen: false,
        starCount: 0,
        flameCount: 0,
        crownCount: 0,
      };
      
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, resetStreak);
      return resetStreak;
    } catch (error) {
      throw new StorageError(
        'Failed to reset gratitude streak',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDE_STREAK
      );
    }
  }

  // Calculate and update streak based on completed dates
  async calculateAndUpdateStreak(): Promise<GratitudeStreak> {
    try {
      const completedDates = await this.getCompletedDates();
      const bonusDates = await this.getBonusDates();
      const currentDate = today();
      
      // Get current saved streak for frozen streak handling
      const savedStreak = await this.getStreak();
      
      // Calculate new streak value
      const newCalculatedStreak = calculateStreak(completedDates, currentDate);
      
      // Calculate longest streak
      const longestStreak = Math.max(
        calculateLongestStreak(completedDates),
        newCalculatedStreak
      );

      // Calculate bonus milestone counters from actual data
      const { starCount, flameCount, crownCount } = await this.calculateMilestoneCounters();
      
      // NEW: Calculate debt and freeze status first
      const debtDays = await this.calculateDebt();
      const isFrozen = debtDays > 0;
      
      // Determine last entry date and streak start
      let lastEntryDate: DateString | null = null;
      let streakStartDate: DateString | null = null;
      
      if (completedDates.length > 0) {
        const sortedDates = [...completedDates].sort();
        const newLastEntryDate = sortedDates[sortedDates.length - 1]!;
        
        // Use saved values when frozen, new values when not frozen
        lastEntryDate = isFrozen ? savedStreak.lastEntryDate : newLastEntryDate;
        
        if (newCalculatedStreak > 0) {
          // Calculate streak start date
          const streakDates = completedDates.filter(date => {
            const streak = calculateStreak(completedDates, date);
            return streak > 0;
          }).sort();
          
          if (streakDates.length > 0) {
            const newStreakStartDate = streakDates[Math.max(0, streakDates.length - newCalculatedStreak)]!;
            streakStartDate = isFrozen ? savedStreak.streakStartDate : newStreakStartDate;
          }
        }
      }
      
      // Calculate debt excluding today for auto-reset decision
      const debtExcludingToday = await this.calculateDebtExcludingToday();
      
      // Auto-reset if debt exceeds 3 days (excluding today)
      if (debtExcludingToday > 3) {
        // If today is complete, start new streak from 1, otherwise reset to 0
        const todayComplete = completedDates.includes(currentDate);
        const newCurrentStreak = todayComplete ? 1 : 0;
        const newLastEntryDate = todayComplete ? currentDate : null;
        const newStreakStartDate = todayComplete ? currentDate : null;
        
        const resetStreak: GratitudeStreak = {
          currentStreak: newCurrentStreak,
          longestStreak,
          lastEntryDate: newLastEntryDate,
          streakStartDate: newStreakStartDate,
          canRecoverWithAd: false,
          debtDays: 0,
          isFrozen: false,
          starCount,
          flameCount,
          crownCount,
        };
        await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, resetStreak);
        return resetStreak;
      }
      
      // Update recovery logic for debt system
      const canRecoverWithAd = debtDays > 0 && debtDays <= 3;
      
      const updatedStreak: GratitudeStreak = {
        currentStreak: isFrozen ? savedStreak.currentStreak : newCalculatedStreak, // Frozen streaks don't change, unfrozen recalculate
        longestStreak,
        lastEntryDate,
        streakStartDate,
        canRecoverWithAd,
        debtDays,
        isFrozen,
        starCount,
        flameCount,
        crownCount,
      };
      
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, updatedStreak);
      return updatedStreak;
    } catch (error) {
      throw new StorageError(
        'Failed to calculate and update streak',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDE_STREAK
      );
    }
  }

  // Search operations
  async searchByContent(searchTerm: string): Promise<Gratitude[]> {
    try {
      const gratitudes = await this.getAll();
      const term = searchTerm.toLowerCase();
      
      return gratitudes.filter(gratitude =>
        gratitude.content.toLowerCase().includes(term)
      ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new StorageError(
        `Failed to search gratitudes by content: ${searchTerm}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // Get dates with bonus gratitudes (4+ per day)
  async getBonusDates(): Promise<DateString[]> {
    try {
      const gratitudes = await this.getAll();
      const dateCountMap = new Map<DateString, number>();
      
      gratitudes.forEach(gratitude => {
        const current = dateCountMap.get(gratitude.date) || 0;
        dateCountMap.set(gratitude.date, current + 1);
      });
      
      return Array.from(dateCountMap.entries())
        .filter(([, count]) => count >= 4)
        .map(([date]) => date)
        .sort();
    } catch (error) {
      throw new StorageError(
        'Failed to get bonus dates',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async calculateMilestoneCounters(): Promise<{ starCount: number; flameCount: number; crownCount: number }> {
    try {
      const gratitudes = await this.getAll();
      const dateCountMap = new Map<DateString, number>();
      
      // Count entries per date
      gratitudes.forEach(gratitude => {
        const current = dateCountMap.get(gratitude.date) || 0;
        dateCountMap.set(gratitude.date, current + 1);
      });
      
      let starCount = 0;
      let flameCount = 0;
      let crownCount = 0;
      
      // Calculate milestone counters based on actual data
      dateCountMap.forEach((count, date) => {
        if (count >= 4) { // 1st bonus entry (4th total)
          starCount++;
        }
        if (count >= 8) { // 5th bonus entry (8th total)
          flameCount++;
        }
        if (count >= 13) { // 10th bonus entry (13th total)
          crownCount++;
        }
      });
      
      return { starCount, flameCount, crownCount };
    } catch (error) {
      throw new StorageError(
        'Failed to calculate milestone counters',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // Statistics
  async getCompletedDates(): Promise<DateString[]> {
    try {
      const gratitudes = await this.getAll();
      const dateCountMap = new Map<DateString, number>();
      
      gratitudes.forEach(gratitude => {
        const current = dateCountMap.get(gratitude.date) || 0;
        dateCountMap.set(gratitude.date, current + 1);
      });
      
      return Array.from(dateCountMap.entries())
        .filter(([, count]) => count >= 3)
        .map(([date]) => date)
        .sort();
    } catch (error) {
      throw new StorageError(
        'Failed to get completed dates',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async getTotalDaysWithGratitude(): Promise<number> {
    try {
      const gratitudes = await this.getAll();
      const uniqueDates = new Set(gratitudes.map(g => g.date));
      return uniqueDates.size;
    } catch (error) {
      throw new StorageError(
        'Failed to get total days with gratitude',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  async getAverageGratitudesPerDay(): Promise<number> {
    try {
      const totalGratitudes = await this.count();
      const totalDays = await this.getTotalDaysWithGratitude();
      
      return totalDays > 0 ? totalGratitudes / totalDays : 0;
    } catch (error) {
      throw new StorageError(
        'Failed to get average gratitudes per day',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // Missing methods required by GratitudeContext
  async getStreakInfo(): Promise<GratitudeStreak> {
    try {
      // Always calculate and return fresh streak data
      return await this.calculateAndUpdateStreak();
    } catch (error) {
      throw new StorageError(
        'Failed to get streak info',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDE_STREAK
      );
    }
  }

  async getStats(): Promise<GratitudeStats> {
    try {
      const [totalGratitudes, totalDays, averagePerDay, streakInfo] = await Promise.all([
        this.count(),
        this.getTotalDaysWithGratitude(),
        this.getAverageGratitudesPerDay(),
        this.getStreakInfo(),
      ]);

      // For now, return basic stats without milestones
      // Milestones can be added later when needed
      return {
        totalGratitudes,
        totalDays,
        averagePerDay,
        streakInfo,
        milestones: [],
      };
    } catch (error) {
      throw new StorageError(
        'Failed to get gratitude stats',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // Increment milestone counter based on specific milestone reached
  async incrementMilestoneCounter(milestoneType: number): Promise<void> {
    try {
      const currentStreak = await this.getStreak();
      let starCount = currentStreak.starCount;
      let flameCount = currentStreak.flameCount;
      let crownCount = currentStreak.crownCount;

      // Increment only the specific milestone reached
      if (milestoneType === 1) {
        starCount++;
      } else if (milestoneType === 5) {
        flameCount++;
      } else if (milestoneType === 10) {
        crownCount++;
      }

      const updatedStreak: GratitudeStreak = {
        ...currentStreak,
        starCount,
        flameCount,
        crownCount,
      };

      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, updatedStreak);
    } catch (error) {
      throw new StorageError(
        'Failed to increment milestone counter',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDE_STREAK
      );
    }
  }

  // Check if current streak represents a milestone
  private checkStreakMilestone(currentStreak: number): number | null {
    const milestones = [
      7, 14, 21, 30, 50, 60, 75, 90, 100, 
      150, 180, 200, 250, 365, 500, 750, 1000
    ];
    
    // Return milestone if current streak matches one of the predefined milestones
    return milestones.includes(currentStreak) ? currentStreak : null;
  }

  // Streak recovery system (for future ad integration)
  async canRecoverStreak(): Promise<boolean> {
    try {
      const streak = await this.getStreak();
      return streak.canRecoverWithAd;
    } catch (error) {
      return false;
    }
  }

  async recoverStreak(): Promise<GratitudeStreak> {
    try {
      const currentStreak = await this.getStreak();
      
      if (!currentStreak.canRecoverWithAd) {
        throw new StorageError(
          'Streak cannot be recovered',
          STORAGE_ERROR_CODES.UNKNOWN,
          STORAGE_KEYS.GRATITUDE_STREAK
        );
      }

      // Extend the streak by adding yesterday as a completed day
      const yesterdayDate = yesterday();
      await this.create({
        content: 'Streak recovery - Ad watched',
        date: yesterdayDate,
      });

      // Recalculate streak
      return await this.calculateAndUpdateStreak();
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        'Failed to recover streak',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDE_STREAK
      );
    }
  }

  // Migration function to fix existing data with old numbering
  async migrateGratitudeNumbering(): Promise<void> {
    try {
      const gratitudes = await this.getAll();
      let hasChanges = false;
      
      // Group by date and fix numbering
      const dateGroups = new Map<string, Gratitude[]>();
      gratitudes.forEach(gratitude => {
        if (!dateGroups.has(gratitude.date)) {
          dateGroups.set(gratitude.date, []);
        }
        dateGroups.get(gratitude.date)!.push(gratitude);
      });
      
      const updatedGratitudes = gratitudes.map(gratitude => {
        const dayGratitudes = dateGroups.get(gratitude.date)!
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        const position = dayGratitudes.findIndex(g => g.id === gratitude.id) + 1;
        const isBonus = position > 3;
        const newOrder = isBonus ? position - 3 : position;
        
        if (gratitude.order !== newOrder || gratitude.isBonus !== isBonus) {
          hasChanges = true;
          return updateEntityTimestamp({
            ...gratitude,
            order: newOrder,
            isBonus,
          });
        }
        
        return gratitude;
      });
      
      if (hasChanges) {
        await BaseStorage.set(STORAGE_KEYS.GRATITUDES, updatedGratitudes);
      }
    } catch (error) {
      throw new StorageError(
        'Failed to migrate gratitude numbering',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // NEW: Debt tracking methods for 3-day recovery system
  
  /**
   * Calculate debt days (consecutive days without 3+ entries from yesterday backwards)
   * Returns actual number of missed days (can be > 3 for auto-reset detection)
   * CRITICAL FIX: If user completed today, debt is automatically 0
   */
  async calculateDebt(): Promise<number> {
    try {
      const currentDate = today();
      const completedDates = await this.getCompletedDates();
      
      // CRITICAL FIX: If user completed today, debt is automatically 0
      // This maintains logical consistency - if user has 3+ entries today,
      // it means they either had no debt or already paid it
      if (completedDates.includes(currentDate)) {
        return 0;
      }
      
      let debtDays = 0;
      let checkDate = subtractDays(currentDate, 1); // Start with yesterday
      
      // Check backwards until we find a completed day or reach reasonable limit
      for (let i = 0; i < 10; i++) { // Check up to 10 days back for auto-reset detection
        if (completedDates.includes(checkDate)) {
          break; // Found a completed day, no more debt from earlier days
        }
        debtDays++;
        checkDate = subtractDays(checkDate, 1);
      }
      
      return debtDays;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate debt days excluding today (for auto-reset decision)
   * This prevents auto-reset when user completes today after missing previous days
   */
  async calculateDebtExcludingToday(): Promise<number> {
    try {
      const currentDate = today();
      const completedDates = await this.getCompletedDates();
      
      let debtDays = 0;
      let checkDate = subtractDays(currentDate, 1); // Start with yesterday (skip today)
      
      // Check backwards until we find a completed day or reach reasonable limit
      for (let i = 0; i < 10; i++) { // Check up to 10 days back
        if (completedDates.includes(checkDate)) {
          break; // Found a completed day, no more debt from earlier days
        }
        debtDays++;
        checkDate = subtractDays(checkDate, 1);
      }
      
      return debtDays;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if user can recover with ads (debt <= 3 days)
   */
  async canRecoverDebt(): Promise<boolean> {
    try {
      const debtDays = await this.calculateDebt();
      return debtDays > 0 && debtDays <= 3;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate how many ads user needs to watch to pay debt only
   * After debt is paid, user can write entries normally without ads
   * CRITICAL FIX: If user has 3+ entries today, no ads needed
   */
  async requiresAdsToday(): Promise<number> {
    try {
      const currentDate = today();
      const todayCount = await this.countByDate(currentDate);
      
      // CRITICAL FIX: If user has 3+ entries today, no ads needed
      // This maintains system consistency - user already completed today
      if (todayCount >= 3) {
        return 0;
      }
      
      const debtDays = await this.calculateDebt();
      
      // If debt > 3, automatic reset (handled elsewhere)
      if (debtDays > 3) return 0;
      
      // Only need ads to pay off debt
      // After debt is paid, entries can be written normally
      return debtDays;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Pay off debt by watching ads - creates fake entries for missed days
   */
  async payDebtWithAds(adsWatched: number): Promise<void> {
    try {
      const debtDays = await this.calculateDebt();
      
      if (adsWatched < debtDays) {
        throw new Error(`Not enough ads watched. Need ${debtDays}, got ${adsWatched}`);
      }

      // Create fake entries for debt days to "fill the gaps"
      const currentDate = today();
      for (let i = 1; i <= debtDays; i++) {
        const debtDate = subtractDays(currentDate, i);
        
        // Create 3 fake entries for each debt day
        for (let j = 1; j <= 3; j++) {
          await this.create({
            content: `Debt recovery - Ad ${i}.${j}`,
            date: debtDate,
            type: 'gratitude',
          });
        }
      }

      // Recalculate streak after paying debt
      await this.calculateAndUpdateStreak();
    } catch (error) {
      throw new StorageError(
        'Failed to pay debt with ads',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  /**
   * Debug method to simulate debt scenarios for testing
   */
  async simulateDebtScenario(missedDays: number): Promise<GratitudeStreak> {
    try {
      // Clear recent entries to simulate missed days
      const currentDate = today();
      for (let i = 1; i <= missedDays; i++) {
        const missedDate = subtractDays(currentDate, i);
        // Remove entries for this date to simulate missing day
        const allGratitudes = await this.getAll();
        const filteredGratitudes = allGratitudes.filter(g => g.date !== missedDate);
        await BaseStorage.set(STORAGE_KEYS.GRATITUDES, filteredGratitudes);
      }
      
      // Recalculate streak which will trigger auto-reset if needed
      return await this.calculateAndUpdateStreak();
    } catch (error) {
      throw new StorageError(
        'Failed to simulate debt scenario',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  // ========================================
  // XP INTEGRATION METHODS
  // ========================================

  /**
   * Award XP for journal entries with anti-spam logic and milestone rewards
   * 
   * @param entryPosition Position of this entry for the day (1-based)
   * @param date Date of the entry for tracking
   */
  private async awardJournalXP(entryPosition: number, date: DateString): Promise<void> {
    try {
      // Base XP calculation with anti-spam logic
      let xpToAward = 0;
      let xpSourceType: XPSourceType;
      let description = '';

      if (entryPosition <= 3) {
        // First 3 entries: 20 XP each
        xpToAward = XP_REWARDS.JOURNAL.FIRST_ENTRY;
        xpSourceType = XPSourceType.JOURNAL_ENTRY;
        description = `Journal entry #${entryPosition}`;
      } else if (entryPosition <= 13) {
        // Entries 4-13: 8 XP each (bonus entries)
        xpToAward = XP_REWARDS.JOURNAL.BONUS_ENTRY;
        xpSourceType = XPSourceType.JOURNAL_BONUS;
        description = `Bonus journal entry #${entryPosition}`;
      } else {
        // Entries 14+: 0 XP (spam prevention)
        xpToAward = 0;
        xpSourceType = XPSourceType.JOURNAL_BONUS;
        description = `Journal entry #${entryPosition} (no XP - daily limit reached)`;
      }

      // Award base entry XP if applicable
      if (xpToAward > 0) {
        await GamificationService.addXP(xpToAward, {
          source: xpSourceType,
          description,
          sourceId: `journal_${date}_${entryPosition}`,
        });
      }

      // Check for milestone rewards (awarded in addition to base XP)
      await this.checkAndAwardJournalMilestones(entryPosition, date);

      // Check for streak milestones after every entry
      await this.checkAndAwardStreakMilestones();

    } catch (error) {
      console.error('GratitudeStorage.awardJournalXP error:', error);
      // Don't throw - XP failure shouldn't block gratitude creation
    }
  }

  /**
   * Check and award milestone XP for bonus entries (⭐🔥👑)
   */
  private async checkAndAwardJournalMilestones(entryPosition: number, date: DateString): Promise<void> {
    try {
      let milestoneXP = 0;
      let description = '';

      if (entryPosition === 4) {
        // First bonus entry ⭐ (entry #4)
        milestoneXP = XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE;
        description = 'First bonus journal entry ⭐';
      } else if (entryPosition === 8) {
        // Fifth bonus entry 🔥 (entry #8)
        milestoneXP = XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE;
        description = 'Fifth bonus journal entry 🔥';
      } else if (entryPosition === 13) {
        // Tenth bonus entry 👑 (entry #13)
        milestoneXP = XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE;
        description = 'Tenth bonus journal entry 👑';
      }

      // Award milestone XP if applicable
      if (milestoneXP > 0) {
        await GamificationService.addXP(milestoneXP, {
          source: XPSourceType.JOURNAL_BONUS_MILESTONE,
          description,
          sourceId: `journal_milestone_${date}_${entryPosition}`,
        });
      }
    } catch (error) {
      console.error('GratitudeStorage.checkAndAwardJournalMilestones error:', error);
    }
  }

  /**
   * Check and award streak milestone XP rewards
   */
  private async checkAndAwardStreakMilestones(): Promise<void> {
    try {
      const streak = await this.getStreak();
      const currentStreak = streak.currentStreak;

      // Define streak milestones that should award XP
      const streakMilestones = [
        { days: 7, xp: XP_REWARDS.JOURNAL.STREAK_7_DAYS, description: '7-day journal streak!' },
        { days: 21, xp: XP_REWARDS.JOURNAL.STREAK_21_DAYS, description: '21-day journal streak!' },
        { days: 30, xp: XP_REWARDS.JOURNAL.STREAK_30_DAYS, description: '30-day journal streak!' },
        { days: 100, xp: XP_REWARDS.JOURNAL.STREAK_100_DAYS, description: '100-day journal streak!' },
        { days: 365, xp: XP_REWARDS.JOURNAL.STREAK_365_DAYS, description: '365-day journal streak!' },
      ];

      // Check if current streak matches any milestone
      const milestone = streakMilestones.find(m => m.days === currentStreak);
      if (milestone) {
        await GamificationService.addXP(milestone.xp, {
          source: XPSourceType.JOURNAL_STREAK_MILESTONE,
          description: milestone.description,
          sourceId: `journal_streak_${currentStreak}`,
        });
      }
    } catch (error) {
      console.error('GratitudeStorage.checkAndAwardStreakMilestones error:', error);
    }
  }

  /**
   * Get journal statistics for achievements and progress tracking
   */
  async getJournalStatistics(): Promise<{
    totalEntries: number;
    totalDays: number;
    currentStreak: number;
    longestStreak: number;
    totalBonusEntries: number;
    starsEarned: number;  // ⭐ milestones (4th entries)
    flamesEarned: number; // 🔥 milestones (8th entries)
    crownsEarned: number; // 👑 milestones (13th entries)
    averageEntriesPerDay: number;
  }> {
    try {
      const [totalEntries, totalDays, averagePerDay, streakInfo] = await Promise.all([
        this.count(),
        this.getTotalDaysWithGratitude(),
        this.getAverageGratitudesPerDay(),
        this.getStreakInfo(),
      ]);

      // Calculate bonus entries and milestones
      const gratitudes = await this.getAll();
      let totalBonusEntries = 0;
      let starsEarned = 0;
      let flamesEarned = 0;
      let crownsEarned = 0;

      const dateCountMap = new Map<DateString, number>();
      
      // Count entries per date
      gratitudes.forEach(gratitude => {
        const current = dateCountMap.get(gratitude.date) || 0;
        dateCountMap.set(gratitude.date, current + 1);
      });

      // Calculate bonus entries and milestone counts
      dateCountMap.forEach((count) => {
        if (count > 3) {
          totalBonusEntries += (count - 3); // Bonus entries are 4th+ entries
        }
        if (count >= 4) starsEarned++;     // ⭐ for 4th entry
        if (count >= 8) flamesEarned++;    // 🔥 for 8th entry  
        if (count >= 13) crownsEarned++;   // 👑 for 13th entry
      });

      return {
        totalEntries,
        totalDays,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        totalBonusEntries,
        starsEarned,
        flamesEarned,
        crownsEarned,
        averageEntriesPerDay: averagePerDay,
      };
    } catch (error) {
      console.error('GratitudeStorage.getJournalStatistics error:', error);
      // Return safe defaults
      return {
        totalEntries: 0,
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalBonusEntries: 0,
        starsEarned: 0,
        flamesEarned: 0,
        crownsEarned: 0,
        averageEntriesPerDay: 0,
      };
    }
  }
}

// Singleton instance
export const gratitudeStorage = new GratitudeStorage();