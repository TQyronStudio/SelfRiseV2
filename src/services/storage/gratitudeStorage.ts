import { Gratitude, GratitudeStreak, GratitudeStats, CreateGratitudeInput, WarmUpPayment, WarmUpHistoryEntry } from '../../types/gratitude';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createGratitude, updateEntityTimestamp, getNextGratitudeOrder } from '../../utils/data';
import { DateString } from '../../types/common';
import { calculateStreak, calculateCurrentStreak, calculateContinuingStreak, calculateLongestStreak, today, yesterday, subtractDays, formatDateToString } from '../../utils/date';
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';

export class GratitudeStorage implements EntityStorage<Gratitude> {
  // XP system enabled for journal entries
  // DISABLED: XP is now handled in UI layer (GratitudeInput) for real-time updates
  private static XP_ENABLED = false;
  
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

      // Calculate XP to subtract BEFORE deletion and reordering
      const deletedGratitude = gratitudes.find(g => g.id === id);
      if (deletedGratitude) {
        // Get all entries for this date to determine true position (not based on order field)
        const sameDateEntries = gratitudes
          .filter(g => g.date === deletedGratitude.date)
          .sort((a, b) => {
            // Sort by creation time to get true chronological order
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
        
        // Find original position (1-based index) based on chronological creation order
        const originalPosition = sameDateEntries.findIndex(g => g.id === id) + 1;
        
        // Subtract XP for the deleted entry
        await this.subtractJournalXP(originalPosition, deletedGratitude.date);
        
        // Reorder remaining gratitudes for the same date
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
      
      // Migration: Add new properties if they don't exist (including Bug #2 fix fields)
      if (streak && (
        streak.frozenDays === undefined || 
        streak.isFrozen === undefined || 
        streak.preserveCurrentStreak === undefined ||
        streak.warmUpPayments === undefined ||
        streak.warmUpHistory === undefined ||
        streak.autoResetTimestamp === undefined ||
        streak.autoResetReason === undefined
      )) {
        const migratedStreak: GratitudeStreak = {
          ...streak,
          frozenDays: streak.frozenDays || 0,
          isFrozen: streak.isFrozen || false,
          preserveCurrentStreak: streak.preserveCurrentStreak || false,
          warmUpPayments: streak.warmUpPayments || [],
          warmUpHistory: streak.warmUpHistory || [],
          autoResetTimestamp: streak.autoResetTimestamp || null,
          autoResetReason: streak.autoResetReason || null,
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
        frozenDays: 0,
        isFrozen: false,
        preserveCurrentStreak: false,
        warmUpPayments: [],
        warmUpHistory: [],
        autoResetTimestamp: null,
        autoResetReason: null,
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
        frozenDays: 0,
        isFrozen: false,
        preserveCurrentStreak: false,
        warmUpPayments: [],
        warmUpHistory: [],
        autoResetTimestamp: new Date(), // CRITICAL: Mark manual reset timestamp
        autoResetReason: 'Manual reset by user',
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
      
      // Calculate continuing streak - shows current streak even if today isn't completed yet
      const newCalculatedStreak = calculateContinuingStreak(completedDates, currentDate);
      
      // Calculate longest streak
      const longestStreak = Math.max(
        calculateLongestStreak(completedDates),
        newCalculatedStreak
      );

      // Calculate bonus milestone counters from actual data
      const { starCount, flameCount, crownCount } = await this.calculateMilestoneCounters();
      
      // NEW: Calculate debt and freeze status first
      const frozenDays = await this.calculateFrozenDays();
      const isFrozen = frozenDays > 0;
      
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
      const debtExcludingToday = await this.calculateFrozenDaysExcludingToday();
      
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
          frozenDays: 0,
          isFrozen: false,
          preserveCurrentStreak: false,
          warmUpPayments: [],
          warmUpHistory: [],
          autoResetTimestamp: new Date(), // CRITICAL BUG #2 FIX: Mark auto-reset
          autoResetReason: `Auto-reset after ${debtExcludingToday} days debt`,
          starCount,
          flameCount,
          crownCount,
        };
        await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, resetStreak);
        return resetStreak;
      }
      
      // Update recovery logic for debt system
      const canRecoverWithAd = frozenDays > 0 && frozenDays <= 3;
      
      // CRITICAL BUG #3 FIX: Handle warm up payment - preserve current streak if flag is set
      let finalCurrentStreak: number;
      let shouldResetPreserveFlag = false; // BUG #3 FIX: Control flag reset timing
      
      if (savedStreak.preserveCurrentStreak && !isFrozen) {
        // Debt was just paid - preserve the streak value from before warm up payment
        finalCurrentStreak = savedStreak.currentStreak;
        shouldResetPreserveFlag = true; // Reset flag after successful preservation
        console.log(`[DEBUG] calculateAndUpdateStreak: Preserving streak ${finalCurrentStreak} after warm up payment`);
      } else if (isFrozen) {
        // Normal frozen behavior - keep saved streak (don't reset preserve flag)
        finalCurrentStreak = savedStreak.currentStreak;
      } else {
        // Normal unfrozen behavior - recalculate streak
        finalCurrentStreak = newCalculatedStreak;
      }

      const updatedStreak: GratitudeStreak = {
        currentStreak: finalCurrentStreak,
        longestStreak,
        lastEntryDate,
        streakStartDate,
        canRecoverWithAd,
        frozenDays,
        isFrozen,
        starCount,
        flameCount,
        crownCount,
        // Preserve existing debt tracking data
        warmUpPayments: savedStreak.warmUpPayments || [],
        warmUpHistory: savedStreak.warmUpHistory || [],
        // Preserve existing auto-reset tracking (don't overwrite)
        autoResetTimestamp: savedStreak.autoResetTimestamp || null,
        autoResetReason: savedStreak.autoResetReason || null,
        // BUG #3 FIX: Only reset preserve flag when actually used to prevent corruption
        preserveCurrentStreak: shouldResetPreserveFlag ? false : (savedStreak.preserveCurrentStreak || false),
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

  // REMOVED: recoverStreak() method - BUG #3 FIX
  // This method created fake entries which corrupted streak calculation
  // Debt recovery now uses proper warm up payment system without creating entries

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
   * ENHANCED: Calculate effective frozen days accounting for warm up payments
   * CRITICAL BUG #2 FIX: Respects auto-reset state to prevent phantom frozen days
   * Returns 0 if recent auto-reset occurred, preventing inconsistency issues
   */
  async calculateFrozenDays(): Promise<number> {
    try {
      const currentDate = today();
      const completedDates = await this.getCompletedDates();
      const currentStreak = await this.getStreak();
      
      // CRITICAL BUG #2 FIX: Check for recent auto-reset first
      if (currentStreak.autoResetTimestamp) {
        const resetTime = new Date(currentStreak.autoResetTimestamp);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60);
        
        // If auto-reset occurred within 24 hours, debt is definitively 0
        if (hoursSinceReset < 24) {
          console.log(`[DEBUG] calculateDebt: Auto-reset ${hoursSinceReset.toFixed(1)}h ago. Frozen days = 0 (phantom frozen days prevention)`);
          return 0;
        } else {
          // Clear old auto-reset timestamp to prevent perpetual 0 debt
          console.log(`[DEBUG] calculateDebt: Clearing old auto-reset timestamp (${hoursSinceReset.toFixed(1)}h ago)`);
          await this.clearAutoResetTimestamp();
        }
      }
      
      // CRITICAL FIX: If user completed today, debt is automatically 0
      if (completedDates.includes(currentDate)) {
        return 0;
      }
      
      // SAFETY CHECK: Use streak.frozenDays as authoritative source if available
      if (currentStreak.frozenDays !== undefined && currentStreak.frozenDays === 0) {
        console.log(`[DEBUG] calculateDebt: streak.frozenDays = 0, using authoritative source`);
        return 0;
      }
      
      // Normal debt calculation logic
      const rawMissedDays = await this.calculateRawMissedDays();
      const paidDays = new Set<DateString>();
      
      // Count all days that have been fully paid via ads
      currentStreak.warmUpPayments.forEach(payment => {
        if (payment.isComplete) {
          paidDays.add(payment.missedDate);
        }
      });
      
      // Calculate which missed days are still unpaid
      const missedDates = this.getMissedDatesFromToday(rawMissedDays);
      const unpaidMissedDays = missedDates.filter(date => !paidDays.has(date));
      const effectiveFrozenDays = unpaidMissedDays.length;
      
      // CONSISTENCY VALIDATION: Warn if discrepancy detected
      if (currentStreak.frozenDays !== effectiveFrozenDays) {
        console.warn(`[DEBUG] calculateDebt: Discrepancy detected! streak.frozenDays=${currentStreak.frozenDays}, calculated=${effectiveFrozenDays}`);
        console.warn(`[DEBUG] Missed dates:`, missedDates);
        console.warn(`[DEBUG] Paid dates:`, Array.from(paidDays));
      }
      
      console.log(`[DEBUG] calculateDebt: rawMissedDays=${rawMissedDays}, paidDays=${paidDays.size}, effectiveFrozenDays=${effectiveFrozenDays}`);
      
      return effectiveFrozenDays;
    } catch (error) {
      console.error('[DEBUG] calculateDebt error:', error);
      return 0;
    }
  }

  /**
   * HELPER: Clear old auto-reset timestamp to prevent perpetual 0 debt
   */
  private async clearAutoResetTimestamp(): Promise<void> {
    try {
      const currentStreak = await this.getStreak();
      const updatedStreak: GratitudeStreak = {
        ...currentStreak,
        autoResetTimestamp: null,
        autoResetReason: null,
      };
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, updatedStreak);
    } catch (error) {
      console.error('[DEBUG] clearAutoResetTimestamp error:', error);
    }
  }

  /**
   * HELPER: Calculate raw missed days without considering ad payments
   * Returns actual number of consecutive missed days from yesterday backwards
   */
  private async calculateRawMissedDays(): Promise<number> {
    try {
      const currentDate = today();
      const completedDates = await this.getCompletedDates();
      
      let missedDays = 0;
      let checkDate = subtractDays(currentDate, 1); // Start with yesterday
      
      // Check backwards until we find a completed day or reach reasonable limit
      for (let i = 0; i < 10; i++) { // Check up to 10 days back for auto-reset detection
        if (completedDates.includes(checkDate)) {
          break; // Found a completed day, no more debt from earlier days
        }
        missedDays++;
        checkDate = subtractDays(checkDate, 1);
      }
      
      return missedDays;
    } catch (error) {
      return 0;
    }
  }

  /**
   * HELPER: Get list of missed dates from today backwards
   */
  private getMissedDatesFromToday(missedDayCount: number): DateString[] {
    const currentDate = today();
    const missedDates: DateString[] = [];
    
    for (let i = 1; i <= missedDayCount; i++) {
      const missedDate = subtractDays(currentDate, i);
      missedDates.push(missedDate);
    }
    
    return missedDates;
  }

  /**
   * ENHANCED: Calculate effective debt days excluding today (for auto-reset decision)
   * This prevents auto-reset when user completes today after missing previous days
   * Now accounts for ad payments made for previous days
   */
  async calculateFrozenDaysExcludingToday(): Promise<number> {
    try {
      const currentDate = today();
      const completedDates = await this.getCompletedDates();
      
      // Get raw missed days excluding today
      let rawMissedDays = 0;
      let checkDate = subtractDays(currentDate, 1); // Start with yesterday (skip today)
      
      // Check backwards until we find a completed day or reach reasonable limit
      for (let i = 0; i < 10; i++) { // Check up to 10 days back
        if (completedDates.includes(checkDate)) {
          break; // Found a completed day, no more debt from earlier days
        }
        rawMissedDays++;
        checkDate = subtractDays(checkDate, 1);
      }
      
      // Get current warm up payment tracking
      const currentStreak = await this.getStreak();
      const paidDays = new Set<DateString>();
      
      // Count all days that have been fully paid via ads (excluding today)
      currentStreak.warmUpPayments.forEach(payment => {
        if (payment.isComplete && payment.missedDate !== currentDate) {
          paidDays.add(payment.missedDate);
        }
      });
      
      // Calculate which missed days are still unpaid (excluding today)
      const missedDates = this.getMissedDatesFromToday(rawMissedDays);
      const unpaidMissedDays = missedDates.filter(date => !paidDays.has(date) && date !== currentDate);
      
      const effectiveFrozenDays = unpaidMissedDays.length;
      
      console.log(`[DEBUG] calculateFrozenDaysExcludingToday: rawMissedDays=${rawMissedDays}, paidDays=${paidDays.size}, effectiveFrozenDays=${effectiveFrozenDays}`);
      
      return effectiveFrozenDays;
    } catch (error) {
      console.error('[DEBUG] calculateFrozenDaysExcludingToday error:', error);
      return 0;
    }
  }

  /**
   * Check if user can recover with ads (debt <= 3 days)
   */
  async canRecoverDebt(): Promise<boolean> {
    try {
      const frozenDays = await this.calculateFrozenDays();
      return frozenDays > 0 && frozenDays <= 3;
    } catch (error) {
      return false;
    }
  }

  /**
   * ENHANCED: Calculate how many ads user needs to watch to pay outstanding frozen days
   * After streak is warmed up, user can write entries normally without ads
   * CRITICAL FIX: Accounts for already paid debt via previous ad sessions
   */
  async adsNeededToWarmUp(): Promise<number> {
    try {
      const currentDate = today();
      const todayCount = await this.countByDate(currentDate);
      
      // CRITICAL FIX: If user has 3+ entries today, no ads needed
      // This maintains system consistency - user already completed today
      if (todayCount >= 3) {
        return 0;
      }
      
      const effectiveFrozenDays = await this.calculateFrozenDays(); // Now accounts for payments
      
      // If debt > 3, automatic reset (handled elsewhere)
      if (effectiveFrozenDays > 3) return 0;
      
      // Return effective unpaid debt (each ad pays 1 day)
      return effectiveFrozenDays;
    } catch (error) {
      return 0;
    }
  }

  /**
   * ENHANCED: Warm up frozen streak with incremental ad tracking
   * Supports partial payments that persist across sessions
   * CRITICAL FIX: Tracks individual ad payments per missed day
   */
  async warmUpStreakWithAds(adsToApply: number): Promise<void> {
    try {
      console.log(`[DEBUG] warmUpStreakWithAds: adsToApply=${adsToApply}`);
      
      const currentStreakInfo = await this.getStreak();
      const currentFrozenDays = await this.calculateFrozenDays();
      
      console.log(`[DEBUG] warmUpStreakWithAds: currentFrozenDays=${currentFrozenDays}, existing payments=${currentStreakInfo.warmUpPayments.length}`);
      
      if (currentFrozenDays === 0) {
        console.log(`[DEBUG] warmUpStreakWithAds: No frozen days to warm up, returning early`);
        return; // No frozen days to warm up
      }

      if (adsToApply <= 0) {
        throw new Error(`Invalid number of ads: ${adsToApply}`);
      }

      // Get the list of unpaid missed days
      const unpaidMissedDays = await this.getUnpaidMissedDays();
      console.log(`[DEBUG] warmUpStreakWithAds: unpaidMissedDays=${JSON.stringify(unpaidMissedDays)}`);

      if (adsToApply > unpaidMissedDays.length) {
        console.log(`[DEBUG] warmUpStreakWithAds: More ads than needed. Required: ${unpaidMissedDays.length}, provided: ${adsToApply}`);
        // Allow overpayment, just use what's needed
      }

      // Apply ads to unpaid days (1 ad = 1 day cleared)
      const updatedPayments = [...currentStreakInfo.warmUpPayments];
      const newHistoryEntries = [...currentStreakInfo.warmUpHistory];
      let adsApplied = 0;

      for (let i = 0; i < Math.min(adsToApply, unpaidMissedDays.length); i++) {
        const missedDate = unpaidMissedDays[i]!; // Safe: index is within array bounds
        
        // Find existing payment for this date or create new one
        const existingPaymentIndex = updatedPayments.findIndex(p => p.missedDate === missedDate);
        
        if (existingPaymentIndex >= 0) {
          // Update existing payment (though for this system 1 ad = complete)
          updatedPayments[existingPaymentIndex] = {
            ...updatedPayments[existingPaymentIndex],
            missedDate, // Ensure missedDate is properly set
            adsWatched: 1,
            isComplete: true,
            paymentTimestamp: new Date(),
          };
        } else {
          // Create new payment
          const newPayment: WarmUpPayment = {
            missedDate,
            adsWatched: 1, // 1 ad per day according to spec
            paymentTimestamp: new Date(),
            isComplete: true,
          };
          updatedPayments.push(newPayment);
        }
        
        adsApplied++;
        
        // Add to audit trail
        const historyEntry: WarmUpHistoryEntry = {
          action: 'warm_up',
          timestamp: new Date(),
          frozenDaysBefore: currentFrozenDays,
          frozenDaysAfter: currentFrozenDays - adsApplied,
          details: `Paid 1 ad for missed day ${missedDate}`,
          missedDates: [missedDate],
          adsInvolved: 1,
        };
        newHistoryEntries.push(historyEntry);
      }

      // Calculate new effective debt
      const newFrozenDays = await this.calculateFrozenDaysWithPayments(updatedPayments);
      console.log(`[DEBUG] warmUpStreakWithAds: newFrozenDays=${newFrozenDays} after applying ${adsApplied} ads`);

      // BUG #3 FIX: Strict streak preservation during warm up payment
      const updatedStreakInfo: GratitudeStreak = {
        ...currentStreakInfo,
        frozenDays: newFrozenDays, // Update to new effective debt
        isFrozen: newFrozenDays > 0, // Unfreeze only if all streak is warmed up
        canRecoverWithAd: newFrozenDays > 0 && newFrozenDays <= 3,
        preserveCurrentStreak: newFrozenDays === 0, // Preserve streak only when fully paid
        warmUpPayments: updatedPayments,
        warmUpHistory: newHistoryEntries,
      };
      
      // BUG #3 FIX: Add validation log to prevent streak corruption
      if (newFrozenDays === 0) {
        console.log(`[DEBUG] warmUpStreakWithAds: STREAK FULLY WARMED UP - Preserving original streak ${currentStreakInfo.currentStreak}`);
        console.log(`[DEBUG] warmUpStreakWithAds: Setting preserveCurrentStreak=true to prevent recalculation`);
      }
      
      // Save updated streak info
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, updatedStreakInfo);
      
      // BUG #3 FIX: Validate streak integrity after warm up payment
      if (newFrozenDays === 0) {
        console.log(`[DEBUG] warmUpStreakWithAds: VALIDATION - Debt fully paid, streak should remain ${currentStreakInfo.currentStreak}`);
        console.log(`[DEBUG] warmUpStreakWithAds: VALIDATION - No entries should be created during warm up payment`);
        console.log(`[DEBUG] warmUpStreakWithAds: VALIDATION - preserveCurrentStreak flag should be true`);
      }
      
      console.log(`[DEBUG] warmUpStreakWithAds: Successfully applied ${adsApplied} ads. New debt: ${newFrozenDays}`);
      
    } catch (error) {
      console.error(`[DEBUG] warmUpStreakWithAds: Error occurred:`, error);
      throw new Error(`Failed to pay frozen streak with ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * PUBLIC: Get list of unpaid missed days (exposed for component use)
   */
  async getUnpaidMissedDays(): Promise<DateString[]> {
    try {
      const rawMissedDays = await this.calculateRawMissedDays();
      const currentStreak = await this.getStreak();
      const paidDays = new Set<DateString>();
      
      // Get all fully paid days
      currentStreak.warmUpPayments.forEach(payment => {
        if (payment.isComplete) {
          paidDays.add(payment.missedDate);
        }
      });
      
      // Filter out paid days
      const allMissedDays = this.getMissedDatesFromToday(rawMissedDays);
      const unpaidDays = allMissedDays.filter(date => !paidDays.has(date));
      
      return unpaidDays;
    } catch (error) {
      console.error('[DEBUG] getUnpaidMissedDays error:', error);
      return [];
    }
  }

  /**
   * HELPER: Calculate frozen streak with given payment data (for testing new debt levels)
   */
  private async calculateFrozenDaysWithPayments(payments: WarmUpPayment[]): Promise<number> {
    try {
      const currentDate = today();
      const completedDates = await this.getCompletedDates();
      
      // If user completed today, debt is automatically 0
      if (completedDates.includes(currentDate)) {
        return 0;
      }
      
      // Get raw missed days
      const rawMissedDays = await this.calculateRawMissedDays();
      const paidDays = new Set<DateString>();
      
      // Count all days that have been fully paid via ads
      payments.forEach(payment => {
        if (payment.isComplete) {
          paidDays.add(payment.missedDate);
        }
      });
      
      // Calculate which missed days are still unpaid
      const missedDates = this.getMissedDatesFromToday(rawMissedDays);
      const unpaidMissedDays = missedDates.filter(date => !paidDays.has(date));
      
      return unpaidMissedDays.length;
    } catch (error) {
      console.error('[DEBUG] calculateFrozenDaysWithPayments error:', error);
      return 0;
    }
  }

  /**
   * NEW: Apply single ad payment (called after each successful ad watch)
   * This method should be called incrementally as user watches ads one by one
   */
  async applySingleWarmUpPayment(): Promise<{ remainingFrozenDays: number; isFullyWarmed: boolean }> {
    try {
      console.log(`[DEBUG] applySingleWarmUpPayment: Starting single ad application`);
      
      const currentFrozenDays = await this.calculateFrozenDays();
      
      if (currentFrozenDays === 0) {
        console.log(`[DEBUG] applySingleWarmUpPayment: No frozen days to warm up`);
        return { remainingFrozenDays: 0, isFullyWarmed: true };
      }

      // Apply 1 ad to the debt
      await this.warmUpStreakWithAds(1);
      
      // Calculate new debt after payment
      const newFrozenDays = await this.calculateFrozenDays();
      const isFullyWarmed = newFrozenDays === 0;
      
      console.log(`[DEBUG] applySingleWarmUpPayment: Applied 1 ad. Remaining debt: ${newFrozenDays}, Fully paid: ${isFullyWarmed}`);
      
      return { remainingFrozenDays: newFrozenDays, isFullyWarmed };
    } catch (error) {
      console.error(`[DEBUG] applySingleWarmUpPayment error:`, error);
      throw new Error(`Failed to apply single ad payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * NEW: Get warm up payment progress for UI display
   */
  async getWarmUpPaymentProgress(): Promise<{
    totalMissedDays: number;
    paidDays: number;
    unpaidDays: number;
    paidDates: DateString[];
    unpaidDates: DateString[];
  }> {
    try {
      const totalMissedDays = await this.calculateRawMissedDays();
      const unpaidDates = await this.getUnpaidMissedDays();
      const allMissedDates = this.getMissedDatesFromToday(totalMissedDays);
      const paidDates = allMissedDates.filter(date => !unpaidDates.includes(date));
      
      return {
        totalMissedDays,
        paidDays: paidDates.length,
        unpaidDays: unpaidDates.length,
        paidDates,
        unpaidDates,
      };
    } catch (error) {
      console.error(`[DEBUG] getWarmUpPaymentProgress error:`, error);
      return {
        totalMissedDays: 0,
        paidDays: 0,
        unpaidDays: 0,
        paidDates: [],
        unpaidDates: [],
      };
    }
  }

  /**
   * BUG #3 FIX: Clean up fake entries created by old debt recovery system
   * This method removes entries with "Streak recovery - Ad watched" content
   */
  async cleanupFakeEntries(): Promise<number> {
    try {
      const allGratitudes = await this.getAll();
      const originalCount = allGratitudes.length;
      
      // Filter out fake entries
      const cleanedGratitudes = allGratitudes.filter(entry => 
        !entry.content.includes('Streak recovery - Ad watched') &&
        !entry.content.includes('Fake entry') &&
        entry.content.trim().length > 0 // Remove any empty entries
      );
      
      const removedCount = originalCount - cleanedGratitudes.length;
      
      if (removedCount > 0) {
        console.log(`[DEBUG] cleanupFakeEntries: Removing ${removedCount} fake entries`);
        await BaseStorage.set(STORAGE_KEYS.GRATITUDES, cleanedGratitudes);
        
        // Recalculate streak after cleanup
        await this.calculateAndUpdateStreak();
      }
      
      return removedCount;
    } catch (error) {
      console.error('[DEBUG] cleanupFakeEntries error:', error);
      return 0;
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

      // CRITICAL FIX: Batch all XP into single transaction to prevent multiple level-ups
      let totalXP = 0;
      let descriptions: string[] = [];
      
      // Add base entry XP if applicable
      if (xpToAward > 0) {
        totalXP += xpToAward;
        descriptions.push(description);
      }

      // Check for milestone XP and add to batch (instead of separate award)
      const milestoneXP = await this.getMilestoneXPData(entryPosition, date);
      if (milestoneXP.xp > 0) {
        totalXP += milestoneXP.xp;
        descriptions.push(milestoneXP.description);
      }

      // Check for streak milestone XP and add to batch
      const streakXP = await this.getStreakMilestoneXPData();
      if (streakXP.xp > 0) {
        totalXP += streakXP.xp;
        descriptions.push(streakXP.description);
      }

      // Award all XP in single transaction to prevent multiple level-ups - only if enabled
      if (totalXP > 0 && GratitudeStorage.XP_ENABLED) {
        await GamificationService.addXP(totalXP, {
          source: xpSourceType,
          description: descriptions.join(' + '),
          sourceId: `journal_batch_${date}_${entryPosition}`,
        });
      }

    } catch (error) {
      console.error('GratitudeStorage.awardJournalXP error:', error);
      // Don't throw - XP failure shouldn't block gratitude creation
    }
  }

  /**
   * Get milestone XP data for bonus entries (⭐🔥👑) without awarding
   */
  private async getMilestoneXPData(entryPosition: number, date: DateString): Promise<{xp: number, description: string}> {
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

      return { xp: milestoneXP, description };
    } catch (error) {
      console.error('GratitudeStorage.getMilestoneXPData error:', error);
      return { xp: 0, description: '' };
    }
  }

  /**
   * Legacy function for backward compatibility - now just calls getMilestoneXPData and awards
   */
  private async checkAndAwardJournalMilestones(entryPosition: number, date: DateString): Promise<void> {
    try {
      const milestoneData = await this.getMilestoneXPData(entryPosition, date);
      if (milestoneData.xp > 0 && GratitudeStorage.XP_ENABLED) {
        await GamificationService.addXP(milestoneData.xp, {
          source: XPSourceType.JOURNAL_BONUS_MILESTONE,
          description: milestoneData.description,
          sourceId: `journal_milestone_${date}_${entryPosition}`,
        });
      }
    } catch (error) {
      console.error('GratitudeStorage.checkAndAwardJournalMilestones error:', error);
    }
  }

  /**
   * Get streak milestone XP data without awarding
   */
  private async getStreakMilestoneXPData(): Promise<{xp: number, description: string}> {
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
        return { xp: milestone.xp, description: milestone.description };
      }

      return { xp: 0, description: '' };
    } catch (error) {
      console.error('GratitudeStorage.getStreakMilestoneXPData error:', error);
      return { xp: 0, description: '' };
    }
  }

  /**
   * Legacy function for backward compatibility - now just calls getStreakMilestoneXPData and awards
   */
  private async checkAndAwardStreakMilestones(): Promise<void> {
    try {
      const streakData = await this.getStreakMilestoneXPData();
      if (streakData.xp > 0 && GratitudeStorage.XP_ENABLED) {
        const streak = await this.getStreak();
        await GamificationService.addXP(streakData.xp, {
          source: XPSourceType.JOURNAL_STREAK_MILESTONE,
          description: streakData.description,
          sourceId: `journal_streak_${streak.currentStreak}`,
        });
      }
    } catch (error) {
      console.error('GratitudeStorage.checkAndAwardStreakMilestones error:', error);
    }
  }

  /**
   * Subtract XP for deleted journal entry based on its original position
   * 
   * @param originalPosition Original position of deleted entry (1-based)
   * @param date Date of the deleted entry
   */
  private async subtractJournalXP(originalPosition: number, date: DateString): Promise<void> {
    try {
      // Calculate XP to subtract based on original position
      let xpToSubtract = 0;
      let xpSourceType: XPSourceType;
      let description = '';

      if (originalPosition <= 3) {
        // First 3 entries: subtract 20 XP each
        xpToSubtract = XP_REWARDS.JOURNAL.FIRST_ENTRY;
        xpSourceType = XPSourceType.JOURNAL_ENTRY;
        description = `Removed journal entry #${originalPosition}`;
      } else if (originalPosition <= 13) {
        // Entries 4-13: subtract 8 XP each (bonus entries)
        xpToSubtract = XP_REWARDS.JOURNAL.BONUS_ENTRY;
        xpSourceType = XPSourceType.JOURNAL_BONUS;
        description = `Removed bonus journal entry #${originalPosition}`;
      } else {
        // Entries 14+: no XP to subtract (they didn't give any)
        return;
      }

      // Calculate total XP to subtract including milestones
      let totalXP = xpToSubtract;
      let descriptions: string[] = [description];

      // Don't subtract milestone XP - milestones are achievements that shouldn't be lost

      // Subtract XP in single transaction
      if (totalXP > 0) {
        await GamificationService.subtractXP(totalXP, {
          source: xpSourceType,
          description: descriptions.join(' + '),
          sourceId: `journal_subtract_${date}_${originalPosition}`,
        });
      }

    } catch (error) {
      console.error('GratitudeStorage.subtractJournalXP error:', error);
      // Don't throw - XP failure shouldn't block gratitude deletion
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

  // ========================================
  // WEEKLY CHALLENGE SUPPORT METHODS
  // ========================================

  /**
   * Get entries for a specific date
   */
  async getEntriesForDate(date: DateString): Promise<Gratitude[]> {
    try {
      return await this.getByDate(date);
    } catch (error) {
      console.error('GratitudeStorage.getEntriesForDate error:', error);
      return [];
    }
  }

  /**
   * Get entries in a date range
   */
  async getEntriesInRange(startDate: Date, endDate: Date): Promise<Gratitude[]> {
    try {
      const startDateStr = formatDateToString(startDate);
      const endDateStr = formatDateToString(endDate);
      return await this.getByDateRange(startDateStr, endDateStr);
    } catch (error) {
      console.error('GratitudeStorage.getEntriesInRange error:', error);
      return [];
    }
  }

  /**
   * Get bonus journal entries count for challenges
   */
  async getBonusJournalEntriesCount(): Promise<number> {
    try {
      const stats = await this.getJournalStatistics();
      return stats.totalBonusEntries;
    } catch (error) {
      console.error('GratitudeStorage.getBonusJournalEntriesCount error:', error);
      return 0;
    }
  }
}

// Singleton instance
export const gratitudeStorage = new GratitudeStorage();