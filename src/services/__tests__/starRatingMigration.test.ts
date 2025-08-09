// Star Rating Migration Tests
// Tests for migrating legacy MonthlyChallengeService star ratings to StarRatingService

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StarRatingMigration } from '../starRatingMigration';
import { AchievementCategory } from '../../types/gamification';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn()
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('StarRatingMigration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Migration Status', () => {
    it('should detect uncompleted migration', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const isCompleted = await StarRatingMigration.isMigrationCompleted();
      
      expect(isCompleted).toBe(false);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('star_rating_migration_status');
    });

    it('should detect completed migration', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('completed');
      
      const isCompleted = await StarRatingMigration.isMigrationCompleted();
      
      expect(isCompleted).toBe(true);
    });
  });

  describe('Legacy Data Detection', () => {
    it('should detect presence of legacy data', async () => {
      const legacyData = {
        habits: 3,
        journal: 2,
        goals: 4,
        consistency: 1,
        history: []
      };
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(legacyData));
      
      const hasLegacy = await StarRatingMigration.hasLegacyData();
      
      expect(hasLegacy).toBe(true);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user_challenge_ratings');
    });

    it('should detect absence of legacy data', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const hasLegacy = await StarRatingMigration.hasLegacyData();
      
      expect(hasLegacy).toBe(false);
    });
  });

  describe('Migration Process', () => {
    it('should skip migration if already completed', async () => {
      // Mock migration already completed
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'star_rating_migration_status') return Promise.resolve('completed');
        return Promise.resolve(null);
      });

      const result = await StarRatingMigration.migrateLegacyStarRatings();

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Migration already completed');
    });

    it('should migrate valid legacy data', async () => {
      const legacyData = {
        habits: 3,
        journal: 2,
        goals: 4,
        consistency: 1,
        history: [
          {
            month: '2025-08',
            category: 'habits',
            previousStars: 2,
            newStars: 3,
            challengeCompleted: true,
            completionPercentage: 100,
            reason: 'success',
            timestamp: new Date('2025-08-01')
          }
        ]
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'star_rating_migration_status') return Promise.resolve(null);
        if (key === 'user_challenge_ratings') return Promise.resolve(JSON.stringify(legacyData));
        if (key === 'user_star_ratings') return Promise.resolve(null); // No existing data
        return Promise.resolve(null);
      });

      const result = await StarRatingMigration.migrateLegacyStarRatings();

      expect(result.success).toBe(true);
      expect(result.migratedRatings).toBeDefined();
      expect(result.migratedRatings?.habits).toBe(3);
      expect(result.migratedRatings?.journal).toBe(2);
      expect(result.migratedRatings?.goals).toBe(4);
      expect(result.migratedRatings?.consistency).toBe(1);
      expect(result.migratedHistoryEntries).toBe(1);
    });

    it('should handle invalid legacy data gracefully', async () => {
      const invalidLegacyData = {
        habits: 'invalid',
        journal: -1,
        goals: 10,
        consistency: null
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'star_rating_migration_status') return Promise.resolve(null);
        if (key === 'user_challenge_ratings') return Promise.resolve(JSON.stringify(invalidLegacyData));
        return Promise.resolve(null);
      });

      const result = await StarRatingMigration.migrateLegacyStarRatings();

      expect(result.success).toBe(true);
      expect(result.migratedRatings?.habits).toBe(1); // Default value
      expect(result.migratedRatings?.journal).toBe(1); // Default value
      expect(result.migratedRatings?.goals).toBe(1); // Clamped value
      expect(result.migratedRatings?.consistency).toBe(1); // Default value
    });

    it('should handle corrupted legacy data', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'star_rating_migration_status') return Promise.resolve(null);
        if (key === 'user_challenge_ratings') return Promise.resolve('invalid json{');
        return Promise.resolve(null);
      });

      const result = await StarRatingMigration.migrateLegacyStarRatings();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to parse legacy star ratings data');
    });

    it('should not overwrite existing StarRatingService data', async () => {
      const legacyData = { habits: 3, journal: 2, goals: 4, consistency: 1 };
      const existingData = {
        habits: 4,
        journal: 3,
        goals: 2,
        consistency: 1,
        history: [{ /* existing history */ }],
        lastUpdated: new Date()
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'star_rating_migration_status') return Promise.resolve(null);
        if (key === 'user_challenge_ratings') return Promise.resolve(JSON.stringify(legacyData));
        if (key === 'user_star_ratings') return Promise.resolve(JSON.stringify(existingData));
        return Promise.resolve(null);
      });

      const result = await StarRatingMigration.migrateLegacyStarRatings();

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('StarRatingService already has data - skipping migration to avoid data loss');
    });
  });

  describe('Migration Info', () => {
    it('should provide comprehensive migration information', async () => {
      const legacyData = {
        habits: 3,
        journal: 2,
        goals: 4,
        consistency: 1,
        lastUpdated: '2025-08-01T10:00:00.000Z'
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'star_rating_migration_status') return Promise.resolve('completed');
        if (key === 'user_challenge_ratings') return Promise.resolve(JSON.stringify(legacyData));
        return Promise.resolve(null);
      });

      const info = await StarRatingMigration.getMigrationInfo();

      expect(info.isCompleted).toBe(true);
      expect(info.hasLegacyData).toBe(true);
      expect(info.legacyDataPreview?.habits).toBe(3);
      expect(info.legacyDataPreview?.journal).toBe(2);
    });
  });

  describe('Force Migration', () => {
    it('should reset migration status and re-run migration', async () => {
      const legacyData = { habits: 2, journal: 3, goals: 1, consistency: 2 };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'user_challenge_ratings') return Promise.resolve(JSON.stringify(legacyData));
        return Promise.resolve(null);
      });

      const result = await StarRatingMigration.forceMigration();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('star_rating_migration_status');
      expect(result.success).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clean up legacy data after completed migration', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('completed');

      await StarRatingMigration.cleanupLegacyData();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_challenge_ratings');
    });

    it('should skip cleanup if migration not completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      await StarRatingMigration.cleanupLegacyData();

      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});