import { Gratitude, GratitudeStreak, GratitudeStats, CreateGratitudeInput, WarmUpPayment, WarmUpHistoryEntry } from '../../types/gratitude';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createGratitude, updateEntityTimestamp, getNextGratitudeOrder } from '../../utils/data';
import { DateString } from '../../types/common';
import { calculateStreak, calculateCurrentStreak, calculateContinuingStreak, calculateLongestStreak, today, yesterday, subtractDays, formatDateToString } from '../../utils/date';
import { GamificationService } from '../gamificationService';
import { XPSourceType } from '../../types/gamification';
import { XP_REWARDS } from '../../constants/gamification';
import { DeviceEventEmitter } from 'react-native';

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
      
      // Calculate base XP amount
      const baseXpAmount = this.getXPForJournalEntry(totalCount);
      const xpSource = isBonus ? XPSourceType.JOURNAL_BONUS : XPSourceType.JOURNAL_ENTRY;
      
      // Calculate milestone XP for bonuses (⭐🔥👑)
      let milestoneXpAmount = 0;
      let milestoneDescription = '';
      if (isBonus) {
        if (totalCount === 4) { // First bonus milestone ⭐
          milestoneXpAmount = XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE;
          milestoneDescription = ' + ⭐ First Bonus Milestone';
        } else if (totalCount === 8) { // Fifth bonus milestone 🔥
          milestoneXpAmount = XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE;
          milestoneDescription = ' + 🔥 Fifth Bonus Milestone';
        } else if (totalCount === 13) { // Tenth bonus milestone 👑
          milestoneXpAmount = XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE;
          milestoneDescription = ' + 👑 Tenth Bonus Milestone';
        }
      }
      
      // Combine base XP + milestone XP for single transaction
      const totalXpAmount = baseXpAmount + milestoneXpAmount;
      const description = isBonus ? 
        `Bonus journal entry #${totalCount}${milestoneDescription}` : 
        `Journal entry #${totalCount}`;
      
      // Create gratitude with base XP amount stored for accurate deletion
      const newGratitude = createGratitude(input, order, isBonus, baseXpAmount);
      
      gratitudes.push(newGratitude);
      await BaseStorage.set(STORAGE_KEYS.GRATITUDES, gratitudes);
      
      // Award combined XP in single transaction (prevents double achievement processing)
      await GamificationService.addXP(totalXpAmount, { 
        source: milestoneXpAmount > 0 ? XPSourceType.JOURNAL_BONUS_MILESTONE : xpSource, 
        description,
        sourceId: newGratitude.id,
        metadata: { 
          baseXp: baseXpAmount, 
          milestoneXp: milestoneXpAmount,
          entryPosition: totalCount,
          entryLength: newGratitude.content.length
        }
      });
      
      console.log(`✅ Journal entry created (position: ${totalCount}, +${totalXpAmount} XP)${milestoneDescription}`);
      
      // Update milestone counters if milestone was reached
      if (milestoneXpAmount > 0) {
        const currentStreak = await this.getStreak();
        const updatedStreak = { ...currentStreak };
        
        if (totalCount === 4) updatedStreak.starCount += 1;
        else if (totalCount === 8) updatedStreak.flameCount += 1;
        else if (totalCount === 13) updatedStreak.crownCount += 1;
        
        await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, updatedStreak);
        console.log(`✨ Milestone counter updated: ${totalCount === 4 ? 'starCount' : totalCount === 8 ? 'flameCount' : 'crownCount'}++`);
      }
      
      // Update streak after adding new gratitude
      await this.calculateAndUpdateStreak();
      
      return newGratitude;
    } catch (error) {
      throw new StorageError(
        'Failed to create gratitude',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.GRATITUDES
      );
    }
  }

  /**
   * Get XP amount for journal entry based on daily position
   * Anti-spam protection: Entries 14+ receive 0 XP
   */
  private getXPForJournalEntry(position: number): number {
    switch (position) {
      case 1: return XP_REWARDS.JOURNAL.FIRST_ENTRY;   // 20 XP
      case 2: return XP_REWARDS.JOURNAL.SECOND_ENTRY;  // 20 XP
      case 3: return XP_REWARDS.JOURNAL.THIRD_ENTRY;   // 20 XP
      default: 
        if (position >= 4 && position <= 13) {
          return XP_REWARDS.JOURNAL.BONUS_ENTRY;  // 8 XP (4th-13th entries)
        } else {
          return XP_REWARDS.JOURNAL.FOURTEENTH_PLUS_ENTRY;  // 0 XP (14+ entries - anti-spam)
        }
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

      // Calculate XP to subtract using stored xpAwarded value or fallback
      const deletedGratitude = gratitudes.find(g => g.id === id);
      if (deletedGratitude) {
        let xpAmount: number;
        let xpSource: XPSourceType;
        let description: string;
        
        // Use stored XP amount if available (new entries), otherwise fallback to calculation
        if (deletedGratitude.xpAwarded !== undefined) {
          // Use stored XP value - guaranteed accurate
          xpAmount = deletedGratitude.xpAwarded;
          xpSource = deletedGratitude.isBonus ? XPSourceType.JOURNAL_BONUS : XPSourceType.JOURNAL_ENTRY;
          description = `Deleted journal entry (-${xpAmount} XP stored)`;
          
          console.log(`✅ Using stored XP value for deletion: ${xpAmount} XP`);
        } else {
          // Legacy fallback: try to calculate position (may be inaccurate)
          console.log(`⚠️ Legacy entry detected - attempting position calculation`);
          
          const sameDateEntries = gratitudes
            .filter(g => g.date === deletedGratitude.date)
            .sort((a, b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
          
          const calculatedPosition = sameDateEntries.findIndex(g => g.id === id) + 1;
          
          if (calculatedPosition === 1) {
            xpAmount = XP_REWARDS.JOURNAL.FIRST_ENTRY;
            xpSource = XPSourceType.JOURNAL_ENTRY;
          } else if (calculatedPosition === 2) {
            xpAmount = XP_REWARDS.JOURNAL.SECOND_ENTRY;
            xpSource = XPSourceType.JOURNAL_ENTRY;
          } else if (calculatedPosition === 3) {
            xpAmount = XP_REWARDS.JOURNAL.THIRD_ENTRY;
            xpSource = XPSourceType.JOURNAL_ENTRY;
          } else if (calculatedPosition >= 4 && calculatedPosition <= 13) {
            xpAmount = XP_REWARDS.JOURNAL.BONUS_ENTRY;
            xpSource = XPSourceType.JOURNAL_BONUS;
          } else {
            xpAmount = 0;
            xpSource = XPSourceType.JOURNAL_ENTRY;
          }
          
          description = `Deleted legacy entry (calculated position ${calculatedPosition})`;
        }
        
        if (xpAmount > 0) {
          await GamificationService.subtractXP(xpAmount, { 
            source: xpSource, 
            description 
          });
          
          console.log(`🗑️ Journal entry deleted (-${xpAmount} XP)`);
        } else {
          console.log(`🗑️ Journal entry deleted (0 XP change)`);
        }
        
        // ========================================
        // BONUS MILESTONE REVERSAL SYSTEM
        // ========================================
        
        // Calculate milestone counts before and after deletion
        const currentDayEntries = gratitudes.filter(g => g.date === deletedGratitude.date);
        const currentCount = currentDayEntries.length;
        const newCount = currentCount - 1; // After deletion
        const currentBonusCount = Math.max(0, currentCount - 3);
        const newBonusCount = Math.max(0, newCount - 3);
        
        console.log(`🔍 Milestone reversal check: ${currentCount} → ${newCount} entries (${currentBonusCount} → ${newBonusCount} bonus)`);
        
        // Handle milestone reversal if any milestones are lost
        await this.handleBonusMilestoneReversal(currentBonusCount, newBonusCount, deletedGratitude.date);
        
        
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
        streak.preserveCurrentStreakUntil === undefined ||
        streak.streakBeforeFreeze === undefined ||
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
          preserveCurrentStreakUntil: streak.preserveCurrentStreakUntil || null,
          streakBeforeFreeze: streak.streakBeforeFreeze || 0,
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
        preserveCurrentStreakUntil: null,
        streakBeforeFreeze: 0,
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
        preserveCurrentStreakUntil: null,
        streakBeforeFreeze: 0,
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
      
      // FROZEN STREAK FIX #3: Enhanced debt calculation with debug logging
      const frozenDays = await this.calculateFrozenDays();
      const isFrozen = frozenDays > 0;
      
      console.log(`[FROZEN STREAK DEBUG] calculateAndUpdateStreak: frozenDays=${frozenDays}, isFrozen=${isFrozen}, completedToday=${completedDates.includes(currentDate)}`);
      console.log(`[FROZEN STREAK DEBUG] calculateAndUpdateStreak: currentStreak will be ${isFrozen ? 'preserved' : 'recalculated'}: ${isFrozen ? savedStreak.currentStreak : newCalculatedStreak}`);
      
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
          preserveCurrentStreakUntil: null,
          streakBeforeFreeze: 0,
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
      
      // IMPROVED BUG #3 FIX: Smart streak continuation after warm-up using pre-freeze memory
      let finalCurrentStreak: number;
      let newStreakBeforeFreeze: number | null = savedStreak.streakBeforeFreeze ?? null;
      const todayComplete = completedDates.includes(currentDate);
      
      if (isFrozen) {
        // When streak gets frozen, remember the current streak value
        if (savedStreak.streakBeforeFreeze === null || savedStreak.streakBeforeFreeze === undefined) {
          newStreakBeforeFreeze = savedStreak.currentStreak;
          console.log(`[DEBUG] calculateAndUpdateStreak: Storing streak before freeze: ${newStreakBeforeFreeze}`);
        }
        // Normal frozen behavior - keep saved streak
        finalCurrentStreak = savedStreak.currentStreak;
      } else if (!isFrozen && savedStreak.streakBeforeFreeze != null && typeof savedStreak.streakBeforeFreeze === 'number') {
        // Just unfroze after warm-up - use pre-freeze streak + continue properly
        if (todayComplete) {
          // User completed today after warm-up, so continue the streak
          finalCurrentStreak = savedStreak.streakBeforeFreeze + 1;
          console.log(`[DEBUG] calculateAndUpdateStreak: Continuing streak after warm-up: ${savedStreak.streakBeforeFreeze} + 1 = ${finalCurrentStreak}`);
        } else {
          // User hasn't completed today yet, preserve pre-freeze streak
          finalCurrentStreak = savedStreak.streakBeforeFreeze;
          console.log(`[DEBUG] calculateAndUpdateStreak: Preserving pre-freeze streak: ${finalCurrentStreak} (today not complete yet)`);
        }
        // Clear the memory once we've used it (unless still frozen)
        newStreakBeforeFreeze = null;
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
        // BUG #3 FIX: Preserve flags and streak memory system
        preserveCurrentStreak: savedStreak.preserveCurrentStreak || false, // Keep for backward compatibility
        preserveCurrentStreakUntil: savedStreak.preserveCurrentStreakUntil || null, // Old timestamp system
        // CRITICAL FIX: Always preserve streakBeforeFreeze (don't use && condition)
        streakBeforeFreeze: newStreakBeforeFreeze,
      };
      
      console.log(`[FROZEN STREAK DEBUG] calculateAndUpdateStreak: SAVING streak=${finalCurrentStreak}, frozen=${isFrozen}, frozenDays=${frozenDays}, canRecover=${canRecoverWithAd}`);
      
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

  // DEPRECATED: Milestones are now processed directly in create() to prevent double achievement processing
  // This function is kept for backward compatibility but should not be used
  async incrementMilestoneCounter(milestoneType: number): Promise<void> {
    console.warn(`⚠️ incrementMilestoneCounter is DEPRECATED - milestones are now processed in create() for performance`);
    // Function body commented out to prevent double processing
    // Original logic moved to create() method for single XP transaction
    return Promise.resolve();
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
      
      // FROZEN STREAK FIX #1: Ultra-short phantom debt prevention (5 minutes max)
      if (currentStreak.autoResetTimestamp) {
        const resetTime = new Date(currentStreak.autoResetTimestamp);
        const now = new Date();
        const minutesSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60);
        
        // Only prevent phantom debt for immediate resets (within 5 minutes)
        if (minutesSinceReset < 5) {
          console.log(`[DEBUG] calculateDebt: Very recent auto-reset ${minutesSinceReset.toFixed(1)} minutes ago. Frozen days = 0 (phantom frozen days prevention)`);
          return 0;
        } else {
          // Clear old auto-reset timestamp to prevent perpetual 0 debt
          console.log(`[DEBUG] calculateDebt: Clearing old auto-reset timestamp (${minutesSinceReset.toFixed(1)} minutes ago) - allowing normal debt calculation`);
          await this.clearAutoResetTimestamp();
        }
      }
      
      // CRITICAL FIX: If user completed today, debt is automatically 0
      if (completedDates.includes(currentDate)) {
        return 0;
      }
      
      // FROZEN STREAK FIX #2: REMOVED problematic safety check that skipped debt calculation
      // OLD BROKEN LOGIC: if (currentStreak.frozenDays === 0) return 0; 
      // NEW LOGIC: Always calculate debt properly, don't rely on stale stored values
      
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

      // BUG #3 FIX: Simplified warm up payment - let calculateAndUpdateStreak handle the logic
      const updatedStreakInfo: GratitudeStreak = {
        ...currentStreakInfo,
        frozenDays: newFrozenDays, // Update to new effective debt
        isFrozen: newFrozenDays > 0, // Unfreeze only if all streak is warmed up
        canRecoverWithAd: newFrozenDays > 0 && newFrozenDays <= 3,
        warmUpPayments: updatedPayments,
        warmUpHistory: newHistoryEntries,
        // Keep existing preserve system for backward compatibility (will be handled by calculateAndUpdateStreak)
        preserveCurrentStreak: currentStreakInfo.preserveCurrentStreak || false,
        preserveCurrentStreakUntil: currentStreakInfo.preserveCurrentStreakUntil || null,
        // CRITICAL FIX: Always preserve streakBeforeFreeze (don't use && condition)
        streakBeforeFreeze: currentStreakInfo.streakBeforeFreeze,
      };
      
      // BUG #3 FIX: Add validation log to prevent streak corruption
      if (newFrozenDays === 0) {
        console.log(`[DEBUG] warmUpStreakWithAds: STREAK FULLY WARMED UP - Original streak ${currentStreakInfo.currentStreak} will be continued by calculateAndUpdateStreak()`);
        console.log(`[DEBUG] warmUpStreakWithAds: streakBeforeFreeze=${currentStreakInfo.streakBeforeFreeze} will be used for proper continuation`);
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
  // JOURNAL STATISTICS AND ANALYTICS
  // ========================================

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

  // ========================================
  // BONUS MILESTONE REVERSAL LOGIC
  // ========================================

  /**
   * Handle bonus milestone reversal when entries are deleted
   * Subtracts XP and decrements milestone counters when bonus count drops below milestone thresholds
   */
  private async handleBonusMilestoneReversal(
    fromBonusCount: number, 
    toBonusCount: number, 
    date: DateString
  ): Promise<void> {
    try {
      let totalReversedXP = 0;
      const milestonesLost: string[] = [];
      let starCountDelta = 0;
      let flameCountDelta = 0;
      let crownCountDelta = 0;

      // Lost ⭐ milestone (had 1+ bonus, now have 0 bonus)
      if (fromBonusCount >= 1 && toBonusCount < 1) {
        const lostXP = XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE;
        await GamificationService.subtractXP(lostXP, {
          source: XPSourceType.JOURNAL_BONUS_MILESTONE,
          description: "⭐ Lost: First Bonus Milestone",
          metadata: { milestoneType: 'star_lost', date, fromBonusCount, toBonusCount }
        });
        totalReversedXP += lostXP;
        milestonesLost.push('⭐ First Bonus');
        starCountDelta = -1;
        console.log(`⭐ Milestone lost: -${lostXP} XP (${fromBonusCount} → ${toBonusCount} bonus entries)`);
      }

      // Lost 🔥 milestone (had 5+ bonus, now have 4 or fewer)
      if (fromBonusCount >= 5 && toBonusCount < 5) {
        const lostXP = XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE;
        await GamificationService.subtractXP(lostXP, {
          source: XPSourceType.JOURNAL_BONUS_MILESTONE,
          description: "🔥 Lost: Fifth Bonus Milestone",
          metadata: { milestoneType: 'flame_lost', date, fromBonusCount, toBonusCount }
        });
        totalReversedXP += lostXP;
        milestonesLost.push('🔥 Fifth Bonus');
        flameCountDelta = -1;
        console.log(`🔥 Milestone lost: -${lostXP} XP (${fromBonusCount} → ${toBonusCount} bonus entries)`);
      }

      // Lost 👑 milestone (had 10+ bonus, now have 9 or fewer) 
      if (fromBonusCount >= 10 && toBonusCount < 10) {
        const lostXP = XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE;
        await GamificationService.subtractXP(lostXP, {
          source: XPSourceType.JOURNAL_BONUS_MILESTONE,
          description: "👑 Lost: Tenth Bonus Milestone",
          metadata: { milestoneType: 'crown_lost', date, fromBonusCount, toBonusCount }
        });
        totalReversedXP += lostXP;
        milestonesLost.push('👑 Tenth Bonus');
        crownCountDelta = -1;
        console.log(`👑 Milestone lost: -${lostXP} XP (${fromBonusCount} → ${toBonusCount} bonus entries)`);
      }

      // Update milestone counters if any were lost
      if (starCountDelta !== 0 || flameCountDelta !== 0 || crownCountDelta !== 0) {
        const currentStreak = await this.getStreak();
        const updatedStreak: GratitudeStreak = {
          ...currentStreak,
          starCount: Math.max(0, currentStreak.starCount + starCountDelta),
          flameCount: Math.max(0, currentStreak.flameCount + flameCountDelta),
          crownCount: Math.max(0, currentStreak.crownCount + crownCountDelta),
        };
        await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, updatedStreak);
      }

      // Summary log if any milestones were lost
      if (milestonesLost.length > 0) {
        console.log(`💔 Total milestone XP lost: -${totalReversedXP} XP (${milestonesLost.join(', ')} milestones)`);
      } else {
        console.log(`✅ No milestones lost: ${fromBonusCount} → ${toBonusCount} bonus entries`);
      }

    } catch (error) {
      console.error('GratitudeStorage.handleBonusMilestoneReversal error:', error);
      // Don't throw - milestone reversal failure shouldn't break deletion
    }
  }

}

// Singleton instance
export const gratitudeStorage = new GratitudeStorage();