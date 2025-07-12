import { Gratitude, GratitudeStreak, GratitudeStats, CreateGratitudeInput } from '../../types/gratitude';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createGratitude, updateEntityTimestamp, getNextGratitudeOrder } from '../../utils/data';
import { DateString } from '../../types/common';

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
      });

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
      return streak || {
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
        streakStartDate: null,
        canRecoverWithAd: false,
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
      return await this.getStreak();
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
}

// Singleton instance
export const gratitudeStorage = new GratitudeStorage();