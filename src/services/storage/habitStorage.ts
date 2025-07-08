import { Habit, HabitCompletion, CreateHabitInput } from '../../types/habit';
import { BaseStorage, STORAGE_KEYS, EntityStorage, StorageError, STORAGE_ERROR_CODES } from './base';
import { createHabit, createHabitCompletion, updateEntityTimestamp } from '../../utils/data';
import { DateString } from '../../types/common';

export class HabitStorage implements EntityStorage<Habit> {
  // Habit CRUD operations
  async getAll(): Promise<Habit[]> {
    try {
      const habits = await BaseStorage.get<Habit[]>(STORAGE_KEYS.HABITS);
      return habits || [];
    } catch (error) {
      throw new StorageError(
        'Failed to get all habits',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async getById(id: string): Promise<Habit | null> {
    try {
      const habits = await this.getAll();
      return habits.find(habit => habit.id === id) || null;
    } catch (error) {
      throw new StorageError(
        `Failed to get habit with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async create(input: CreateHabitInput): Promise<Habit> {
    try {
      const habits = await this.getAll();
      const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order)) : -1;
      const newHabit = createHabit(input, maxOrder + 1);
      
      habits.push(newHabit);
      await BaseStorage.set(STORAGE_KEYS.HABITS, habits);
      
      return newHabit;
    } catch (error) {
      throw new StorageError(
        'Failed to create habit',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async update(id: string, updates: Partial<Habit>): Promise<Habit> {
    try {
      const habits = await this.getAll();
      const habitIndex = habits.findIndex(habit => habit.id === id);
      
      if (habitIndex === -1) {
        throw new StorageError(
          `Habit with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABITS
        );
      }

      const updatedHabit = updateEntityTimestamp({
        ...habits[habitIndex],
        ...updates,
      });

      habits[habitIndex] = updatedHabit;
      await BaseStorage.set(STORAGE_KEYS.HABITS, habits);

      return updatedHabit;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to update habit with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const habits = await this.getAll();
      const filteredHabits = habits.filter(habit => habit.id !== id);
      
      if (filteredHabits.length === habits.length) {
        throw new StorageError(
          `Habit with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABITS
        );
      }

      await BaseStorage.set(STORAGE_KEYS.HABITS, filteredHabits);
      
      // Also delete related completions
      await this.deleteCompletionsByHabitId(id);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to delete habit with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await BaseStorage.remove(STORAGE_KEYS.HABITS);
      await BaseStorage.remove(STORAGE_KEYS.HABIT_COMPLETIONS);
    } catch (error) {
      throw new StorageError(
        'Failed to delete all habits',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  async count(): Promise<number> {
    try {
      const habits = await this.getAll();
      return habits.length;
    } catch (error) {
      throw new StorageError(
        'Failed to count habits',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }

  // Habit completion operations
  async getAllCompletions(): Promise<HabitCompletion[]> {
    try {
      const completions = await BaseStorage.get<HabitCompletion[]>(STORAGE_KEYS.HABIT_COMPLETIONS);
      return completions || [];
    } catch (error) {
      throw new StorageError(
        'Failed to get all habit completions',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async getCompletionsByHabitId(habitId: string): Promise<HabitCompletion[]> {
    try {
      const completions = await this.getAllCompletions();
      return completions.filter(completion => completion.habitId === habitId);
    } catch (error) {
      throw new StorageError(
        `Failed to get completions for habit ${habitId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async getCompletionsByDate(date: DateString): Promise<HabitCompletion[]> {
    try {
      const completions = await this.getAllCompletions();
      return completions.filter(completion => completion.date === date);
    } catch (error) {
      throw new StorageError(
        `Failed to get completions for date ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async getCompletion(habitId: string, date: DateString): Promise<HabitCompletion | null> {
    try {
      const completions = await this.getAllCompletions();
      return completions.find(
        completion => completion.habitId === habitId && completion.date === date
      ) || null;
    } catch (error) {
      throw new StorageError(
        `Failed to get completion for habit ${habitId} on ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async createCompletion(
    habitId: string,
    date: DateString,
    isBonus: boolean = false,
    note?: string
  ): Promise<HabitCompletion> {
    try {
      // Check if completion already exists
      const existingCompletion = await this.getCompletion(habitId, date);
      if (existingCompletion) {
        throw new StorageError(
          `Completion for habit ${habitId} on ${date} already exists`,
          STORAGE_ERROR_CODES.UNKNOWN,
          STORAGE_KEYS.HABIT_COMPLETIONS
        );
      }

      const completions = await this.getAllCompletions();
      const newCompletion = createHabitCompletion(habitId, date, isBonus, note);
      
      completions.push(newCompletion);
      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, completions);
      
      return newCompletion;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to create completion for habit ${habitId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async updateCompletion(id: string, updates: Partial<HabitCompletion>): Promise<HabitCompletion> {
    try {
      const completions = await this.getAllCompletions();
      const completionIndex = completions.findIndex(completion => completion.id === id);
      
      if (completionIndex === -1) {
        throw new StorageError(
          `Completion with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABIT_COMPLETIONS
        );
      }

      const updatedCompletion = updateEntityTimestamp({
        ...completions[completionIndex],
        ...updates,
      });

      completions[completionIndex] = updatedCompletion;
      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, completions);

      return updatedCompletion;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to update completion with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async deleteCompletion(id: string): Promise<void> {
    try {
      const completions = await this.getAllCompletions();
      const filteredCompletions = completions.filter(completion => completion.id !== id);
      
      if (filteredCompletions.length === completions.length) {
        throw new StorageError(
          `Completion with id ${id} not found`,
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.HABIT_COMPLETIONS
        );
      }

      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, filteredCompletions);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to delete completion with id ${id}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async deleteCompletionsByHabitId(habitId: string): Promise<void> {
    try {
      const completions = await this.getAllCompletions();
      const filteredCompletions = completions.filter(
        completion => completion.habitId !== habitId
      );
      
      await BaseStorage.set(STORAGE_KEYS.HABIT_COMPLETIONS, filteredCompletions);
    } catch (error) {
      throw new StorageError(
        `Failed to delete completions for habit ${habitId}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  async toggleCompletion(habitId: string, date: DateString, isBonus: boolean = false): Promise<HabitCompletion | null> {
    try {
      const existingCompletion = await this.getCompletion(habitId, date);
      
      if (existingCompletion) {
        // If completed, remove the completion
        await this.deleteCompletion(existingCompletion.id);
        return null;
      } else {
        // If not completed, create completion
        return await this.createCompletion(habitId, date, isBonus);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to toggle completion for habit ${habitId} on ${date}`,
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABIT_COMPLETIONS
      );
    }
  }

  // Bulk operations
  async updateHabitOrder(habitOrders: Array<{ id: string; order: number }>): Promise<void> {
    try {
      const habits = await this.getAll();
      const updates = new Map(habitOrders.map(item => [item.id, item.order]));
      
      const updatedHabits = habits.map(habit => {
        const newOrder = updates.get(habit.id);
        return newOrder !== undefined 
          ? updateEntityTimestamp({ ...habit, order: newOrder })
          : habit;
      });

      await BaseStorage.set(STORAGE_KEYS.HABITS, updatedHabits);
    } catch (error) {
      throw new StorageError(
        'Failed to update habit order',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.HABITS
      );
    }
  }
}

// Singleton instance
export const habitStorage = new HabitStorage();