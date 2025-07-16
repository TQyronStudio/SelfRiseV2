import { User, UserSettings, UserStats, UserSubscriptionStatus } from '../../types/user';
import { BaseStorage, STORAGE_KEYS, StorageError, STORAGE_ERROR_CODES } from './base';
import { updateEntityTimestamp } from '../../utils/data';

export class UserStorage {
  // User operations
  async getUser(): Promise<User | null> {
    try {
      return await BaseStorage.get<User>(STORAGE_KEYS.USER);
    } catch (error) {
      throw new StorageError(
        'Failed to get user',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  async setUser(user: User): Promise<void> {
    try {
      await BaseStorage.set(STORAGE_KEYS.USER, user);
    } catch (error) {
      throw new StorageError(
        'Failed to set user',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = await this.getUser();
      if (!currentUser) {
        throw new StorageError(
          'No user found to update',
          STORAGE_ERROR_CODES.NOT_FOUND,
          STORAGE_KEYS.USER
        );
      }

      const updatedUser = updateEntityTimestamp({
        ...currentUser,
        ...updates,
      });

      await this.setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        'Failed to update user',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  async deleteUser(): Promise<void> {
    try {
      await BaseStorage.remove(STORAGE_KEYS.USER);
    } catch (error) {
      throw new StorageError(
        'Failed to delete user',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getUser();
      return user?.isAuthenticated || false;
    } catch (error) {
      return false;
    }
  }

  // User Settings operations
  async getSettings(): Promise<UserSettings> {
    try {
      const settings = await BaseStorage.get<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
      return settings || this.getDefaultSettings();
    } catch (error) {
      throw new StorageError(
        'Failed to get user settings',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER_SETTINGS
      );
    }
  }

  async setSettings(settings: UserSettings): Promise<void> {
    try {
      await BaseStorage.set(STORAGE_KEYS.USER_SETTINGS, settings);
    } catch (error) {
      throw new StorageError(
        'Failed to set user settings',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER_SETTINGS
      );
    }
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        ...updates,
      };

      await this.setSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        'Failed to update user settings',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER_SETTINGS
      );
    }
  }

  async resetSettings(): Promise<UserSettings> {
    try {
      const defaultSettings = this.getDefaultSettings();
      await this.setSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      throw new StorageError(
        'Failed to reset user settings',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER_SETTINGS
      );
    }
  }

  private getDefaultSettings(): UserSettings {
    return {
      language: 'en',
      morningNotificationTime: '08:00',
      eveningNotificationTime: '20:00',
      notificationsEnabled: true,
      morningNotificationEnabled: true,
      eveningNotificationEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      theme: 'light',
      dataBackupEnabled: true,
      analyticsEnabled: true,
    };
  }

  // User Statistics operations (computed from other storage services)
  async getStats(): Promise<UserStats | null> {
    try {
      const user = await this.getUser();
      if (!user) return null;

      // Import storage services to compute stats
      const { habitStorage } = await import('./habitStorage');
      const { gratitudeStorage } = await import('./gratitudeStorage');
      const { goalStorage } = await import('./goalStorage');

      const [
        habits,
        gratitudes,
        goals,
        gratitudeStreak,
      ] = await Promise.all([
        habitStorage.getAll(),
        gratitudeStorage.getAll(),
        goalStorage.getAll(),
        gratitudeStorage.getStreak(),
      ]);

      const activeHabits = habits.filter(h => h.isActive);
      const completedGoals = goals.filter(g => g.status === 'completed');

      const stats: UserStats = {
        userId: user.id,
        totalHabits: habits.length,
        activeHabits: activeHabits.length,
        totalGratitudes: gratitudes.length,
        currentGratitudeStreak: gratitudeStreak.currentStreak,
        totalGoals: goals.length,
        completedGoals: completedGoals.length,
        joinedAt: user.createdAt,
        lastActiveAt: user.lastLoginAt,
      };

      return stats;
    } catch (error) {
      throw new StorageError(
        'Failed to get user stats',
        STORAGE_ERROR_CODES.UNKNOWN,
        'user_stats'
      );
    }
  }

  // Authentication helpers
  async login(user: User): Promise<void> {
    try {
      const updatedUser = updateEntityTimestamp({
        ...user,
        isAuthenticated: true,
        lastLoginAt: new Date(),
      });
      
      await this.setUser(updatedUser);
    } catch (error) {
      throw new StorageError(
        'Failed to login user',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  async logout(): Promise<void> {
    try {
      const user = await this.getUser();
      if (user) {
        const updatedUser = updateEntityTimestamp({
          ...user,
          isAuthenticated: false,
        });
        await this.setUser(updatedUser);
      }
    } catch (error) {
      throw new StorageError(
        'Failed to logout user',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  // Data cleanup
  async clearUserData(): Promise<void> {
    try {
      await Promise.all([
        this.deleteUser(),
        BaseStorage.remove(STORAGE_KEYS.USER_SETTINGS),
      ]);
    } catch (error) {
      throw new StorageError(
        'Failed to clear user data',
        STORAGE_ERROR_CODES.UNKNOWN,
        'user_data'
      );
    }
  }

  // Profile image helpers
  async updateProfileImage(imageUrl: string): Promise<User> {
    try {
      return await this.updateUser({ profileImageUrl: imageUrl });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        'Failed to update profile image',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  async removeProfileImage(): Promise<User> {
    try {
      const updates: Partial<User> = {};
      delete (updates as any).profileImageUrl;
      return await this.updateUser(updates);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        'Failed to remove profile image',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  // Subscription helpers
  async updateSubscription(
    status: 'free' | 'premium',
    expiresAt?: Date
  ): Promise<User> {
    try {
      const updates: Partial<User> = {
        subscriptionStatus: status as UserSubscriptionStatus,
      };
      if (expiresAt !== undefined) {
        updates.subscriptionExpiresAt = expiresAt;
      }
      return await this.updateUser(updates);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        'Failed to update subscription',
        STORAGE_ERROR_CODES.UNKNOWN,
        STORAGE_KEYS.USER
      );
    }
  }

  async isPremium(): Promise<boolean> {
    try {
      const user = await this.getUser();
      if (!user || user.subscriptionStatus !== 'premium') {
        return false;
      }

      // Check if subscription is still valid
      if (user.subscriptionExpiresAt) {
        return new Date() < user.subscriptionExpiresAt;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const userStorage = new UserStorage();