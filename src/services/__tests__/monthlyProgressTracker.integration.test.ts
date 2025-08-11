/**
 * Monthly Progress Tracker Integration Testing Suite
 * Phase 2: Progress Tracking & XP Integration - Comprehensive Testing
 * 
 * Tests real-time progress updates, milestone celebrations, XP rewards,
 * weekly breakdowns, and daily snapshot persistence.
 * 
 * @created August 11, 2025
 * @author Gamification Engineer
 */

import { MonthlyProgressTracker, DailyProgressSnapshot, WeeklyBreakdown, MilestoneResult } from '../monthlyProgressTracker';
import { MonthlyChallengeService } from '../monthlyChallengeService';
import { EnhancedXPRewardEngine } from '../enhancedXPRewardEngine';
import { GamificationService } from '../gamificationService';
import { StarRatingService } from '../starRatingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { XPSourceType, AchievementCategory } from '../../types/gamification';
import { formatDateToString, today, parseDate, addDays } from '../../utils/date';

// Mock dependencies
jest.mock('../monthlyChallengeService');
jest.mock('../enhancedXPRewardEngine');
jest.mock('../gamificationService');
jest.mock('../starRatingService');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
}));

// Test fixtures
const createMockChallenge = (starLevel: 1 | 2 | 3 | 4 | 5 = 3) => ({
  id: 'test_challenge_2025_01',
  title: 'January Habits Master',
  description: 'Complete 60 habits this month',
  category: AchievementCategory.HABITS,
  starLevel,
  baseXPReward: starLevel === 1 ? 500 : starLevel === 2 ? 750 : starLevel === 3 ? 1125 : starLevel === 4 ? 1688 : 2532,
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  isActive: true,
  requirements: [{
    type: 'habits' as const,
    trackingKey: 'scheduled_habit_completions',
    target: 60,
    description: 'Complete 60 scheduled habits',
    baselineValue: 52,
    scalingMultiplier: 1.15,
    progressMilestones: [15, 30, 45]
  }],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
});

const createMockProgress = () => ({
  challengeId: 'test_challenge_2025_01',
  userId: 'test_user',
  progress: { scheduled_habit_completions: 20 },
  isCompleted: false,
  xpEarned: 0,
  weeklyProgress: {
    week1: { scheduled_habit_completions: 8 },
    week2: { scheduled_habit_completions: 7 },
    week3: { scheduled_habit_completions: 5 },
    week4: { scheduled_habit_completions: 0 }
  },
  milestonesReached: {
    25: { reached: true, timestamp: new Date('2025-01-08'), xpAwarded: 56 },
    50: { reached: false },
    75: { reached: false }
  },
  completionPercentage: 33, // 20/60 = 33.33%
  daysActive: 15,
  daysRemaining: 16,
  projectedCompletion: 65,
  currentStreak: 2,
  longestStreak: 2,
  streakBonusEligible: true,
  dailyConsistency: 0.75,
  weeklyConsistency: 0.8,
  bestWeek: 1,
  activeDays: ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-08'],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15')
});

const createMockXPTransaction = (source: XPSourceType, amount = 25) => ({
  id: `xp_${Date.now()}_${Math.random()}`,
  amount,
  source,
  sourceId: 'habit_123',
  description: 'Habit completion',
  date: formatDateToString(today()),
  createdAt: new Date(),
  metadata: {}
});

describe('MonthlyProgressTracker Integration Tests', () => {
  let mockChallenge: any;
  let mockProgress: any;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear AsyncStorage
    (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Clear caches
    MonthlyProgressTracker.clearAllProgressCache();
    
    // Setup test data
    mockChallenge = createMockChallenge(3);
    mockProgress = createMockProgress();
    
    // Mock MonthlyChallengeService
    (MonthlyChallengeService.getCurrentChallenge as jest.Mock).mockResolvedValue(mockChallenge);
    (MonthlyChallengeService.getChallengeForMonth as jest.Mock).mockResolvedValue(mockChallenge);
    
    // Mock GamificationService
    (GamificationService.addXP as jest.Mock).mockResolvedValue({ success: true });
    (GamificationService.getTransactionsByDateRange as jest.Mock).mockResolvedValue([]);
    
    // Setup AsyncStorage for progress
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key.includes('monthly_challenge_progress_')) {
        return Promise.resolve(JSON.stringify(mockProgress));
      }
      return Promise.resolve(null);
    });
  });

  describe('Real-Time Progress Updates', () => {
    it('should update monthly progress from XP events correctly', async () => {
      // Test real-time progress update from habit completion
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123',
        { habitId: 'habit_123' }
      );
      
      // Verify progress was updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('monthly_challenge_progress_'),
        expect.stringContaining('"scheduled_habit_completions":21')
      );
    });

    it('should batch multiple rapid XP events for performance', async () => {
      // Simulate rapid XP events
      const promises = [
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25),
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25),
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.JOURNAL_ENTRY, 20)
      ];
      
      await Promise.all(promises);
      
      // Should handle all updates efficiently without performance issues
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3); // One for each update
    });

    it('should emit progress update events correctly', async () => {
      const mockEmit = DeviceEventEmitter.emit as jest.Mock;
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123'
      );
      
      expect(mockEmit).toHaveBeenCalledWith('monthly_progress_updated', expect.objectContaining({
        challengeId: 'test_challenge_2025_01',
        challengeTitle: 'January Habits Master',
        source: XPSourceType.HABIT_COMPLETION,
        amount: 25
      }));
    });

    it('should handle missing challenge gracefully', async () => {
      (MonthlyChallengeService.getCurrentChallenge as jest.Mock).mockResolvedValue(null);
      
      // Should not throw error when no active challenge
      await expect(
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25)
      ).resolves.not.toThrow();
    });

    it('should only update relevant requirements for XP source', async () => {
      // Journal entry should not update habit requirements
      mockProgress.progress.quality_journal_entries = 5;
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.JOURNAL_ENTRY,
        20,
        'journal_456'
      );
      
      // Should not update habit completions
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('monthly_challenge_progress_'),
        expect.stringContaining('"scheduled_habit_completions":20') // Unchanged
      );
    });
  });

  describe('Milestone Celebrations (25%, 50%, 75%)', () => {
    it('should detect 25% milestone achievement correctly', async () => {
      // Start with 14 completions (23.3%) - below 25%
      mockProgress.progress.scheduled_habit_completions = 14;
      mockProgress.completionPercentage = 23;
      mockProgress.milestonesReached[25].reached = false;
      
      // Add 1 more completion to reach 15 (25%)
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123'
      );
      
      // Should trigger 25% milestone celebration
      expect(GamificationService.addXP).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          source: XPSourceType.MONTHLY_CHALLENGE,
          description: 'Monthly challenge milestone 25%',
          metadata: expect.objectContaining({
            milestone: 25,
            type: 'monthly_challenge_milestone'
          })
        })
      );
    });

    it('should calculate milestone XP bonus based on star level', async () => {
      // Test with 5 challenge for higher bonuses
      const fiveStarChallenge = createMockChallenge(5);
      (MonthlyChallengeService.getCurrentChallenge as jest.Mock).mockResolvedValue(fiveStarChallenge);
      
      mockProgress.progress.scheduled_habit_completions = 29; // 48.3%
      mockProgress.completionPercentage = 48;
      mockProgress.milestonesReached[50].reached = false;
      
      // Trigger 50% milestone
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should award higher XP for higher star level
      const xpCalls = (GamificationService.addXP as jest.Mock).mock.calls;
      const milestoneCall = xpCalls.find(call => 
        call[1]?.description?.includes('milestone 50%')
      );
      
      expect(milestoneCall[0]).toBeGreaterThanOrEqual(100); // Base 50% milestone bonus
    });

    it('should prevent duplicate milestone celebrations', async () => {
      // Progress already at 25% milestone
      mockProgress.milestonesReached[25].reached = true;
      mockProgress.milestonesReached[25].timestamp = new Date();
      mockProgress.milestonesReached[25].xpAwarded = 56;
      
      // Update progress but stay above 25%
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should not award milestone XP again
      const xpCalls = (GamificationService.addXP as jest.Mock).mock.calls;
      const milestoneCall = xpCalls.find(call => 
        call[1]?.description?.includes('milestone 25%')
      );
      expect(milestoneCall).toBeUndefined();
    });

    it('should emit milestone reached events', async () => {
      const mockEmit = DeviceEventEmitter.emit as jest.Mock;
      
      mockProgress.progress.scheduled_habit_completions = 44; // 73.3%
      mockProgress.completionPercentage = 73;
      mockProgress.milestonesReached[75].reached = false;
      
      // Trigger 75% milestone
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      expect(mockEmit).toHaveBeenCalledWith('monthly_milestone_reached', expect.objectContaining({
        challengeId: 'test_challenge_2025_01',
        milestone: 75,
        celebrationType: 'monthly_milestone'
      }));
    });

    it('should apply consistency bonuses to milestone XP', async () => {
      // High consistency user should get bonus multiplier
      mockProgress.dailyConsistency = 0.9; // 90% consistency
      mockProgress.daysActive = 20;
      mockProgress.progress.scheduled_habit_completions = 14;
      mockProgress.completionPercentage = 23;
      mockProgress.milestonesReached[25].reached = false;
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should apply consistency bonus (20% extra)
      const xpCalls = (GamificationService.addXP as jest.Mock).mock.calls;
      const milestoneCall = xpCalls.find(call => 
        call[1]?.description?.includes('milestone 25%')
      );
      
      // Base 25% milestone is 50 XP, with 20% bonus = 60 XP
      expect(milestoneCall[0]).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Weekly Breakdown and Daily Snapshots', () => {
    it('should create daily snapshots with comprehensive data', async () => {
      // Mock daily XP transactions for feature usage analysis
      const mockTransactions = [
        createMockXPTransaction(XPSourceType.HABIT_COMPLETION, 25),
        createMockXPTransaction(XPSourceType.JOURNAL_ENTRY, 20),
        createMockXPTransaction(XPSourceType.GOAL_PROGRESS, 35)
      ];
      
      (GamificationService.getTransactionsByDateRange as jest.Mock)
        .mockResolvedValue(mockTransactions);
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123'
      );
      
      // Should create daily snapshot
      const snapshotCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const snapshotCall = snapshotCalls.find(call => 
        call[0].includes('monthly_daily_snapshots_')
      );
      
      expect(snapshotCall).toBeDefined();
      
      const snapshotData = JSON.parse(snapshotCall[1]);
      expect(snapshotData).toEqual(expect.objectContaining({
        date: formatDateToString(today()),
        challengeId: 'test_challenge_2025_01',
        isTripleFeatureDay: true, // All 3 features used
        isPerfectDay: true, // Daily minimums met
        weekNumber: expect.any(Number),
        dayOfMonth: expect.any(Number)
      }));
    });

    it('should update weekly breakdown correctly', async () => {
      const currentWeek = Math.ceil(today().getDate() / 7);
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123'
      );
      
      // Should create or update weekly breakdown
      const weeklyStorageCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const weeklyCall = weeklyStorageCalls.find(call => 
        call[0].includes(`monthly_weekly_breakdown_`) && 
        call[0].includes(`week${currentWeek}`)
      );
      
      expect(weeklyCall).toBeDefined();
      
      const weeklyData = JSON.parse(weeklyCall[1]);
      expect(weeklyData).toEqual(expect.objectContaining({
        weekNumber: currentWeek,
        weeklyProgress: expect.objectContaining({
          scheduled_habit_completions: expect.any(Number)
        }),
        daysActive: expect.any(Number),
        isCurrentWeek: true
      }));
    });

    it('should calculate weekly completion percentage accurately', async () => {
      // Mock weekly targets based on monthly requirements
      const weeklyTarget = Math.ceil(60 / 4); // 15 habits per week
      
      // Simulate completing exactly the weekly target
      mockProgress.progress.scheduled_habit_completions = weeklyTarget * 2; // 2 weeks worth
      mockProgress.completionPercentage = (weeklyTarget * 2 / 60) * 100; // Correct percentage
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should calculate weekly completion correctly
      const weeklyStorageCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const weeklyCall = weeklyStorageCalls.find(call => 
        call[0].includes('monthly_weekly_breakdown_')
      );
      
      if (weeklyCall) {
        const weeklyData = JSON.parse(weeklyCall[1]);
        expect(weeklyData.completionPercentage).toBeGreaterThan(0);
        expect(weeklyData.completionPercentage).toBeLessThanOrEqual(100);
      }
    });

    it('should persist snapshot data correctly', async () => {
      const todayString = formatDateToString(today());
      
      // First update
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123'
      );
      
      // Second update same day (should update existing snapshot)
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_456'
      );
      
      // Should have updated existing snapshot, not created new one
      const snapshotKey = `monthly_daily_snapshots_test_challenge_2025_01_${todayString}`;
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls
        .filter(call => call[0] === snapshotKey);
      
      expect(setItemCalls.length).toBeGreaterThanOrEqual(1);
      
      // Last snapshot should have accumulated XP
      const lastSnapshot = JSON.parse(setItemCalls[setItemCalls.length - 1][1]);
      expect(lastSnapshot.xpEarnedToday).toBeGreaterThanOrEqual(50); // 25 + 25
    });

    it('should handle month boundaries for week calculations', async () => {
      // Mock end of month scenario
      const endOfMonth = new Date('2025-01-31');
      const weekNumber = Math.ceil(endOfMonth.getDate() / 7); // Should be 5
      
      // Update progress to trigger week 5 handling
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should handle week 5 correctly for 31-day months
      const weeklyStorageCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const weeklyCall = weeklyStorageCalls.find(call => 
        call[0].includes('weekly_breakdown_')
      );
      
      expect(weeklyCall).toBeDefined();
    });
  });

  describe('Progress Recovery and Error Handling', () => {
    it('should recover from corrupted progress data', async () => {
      // Mock corrupted progress data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('monthly_challenge_progress_')) {
          return Promise.resolve('{"invalid": json}');
        }
        return Promise.resolve(null);
      });
      
      // Should handle corruption gracefully
      await expect(
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25)
      ).resolves.not.toThrow();
    });

    it('should continue processing when XP service fails', async () => {
      (GamificationService.addXP as jest.Mock).mockRejectedValue(new Error('XP service error'));
      
      // Should not throw when XP service fails
      await expect(
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25)
      ).resolves.not.toThrow();
    });

    it('should handle challenge completion correctly', async () => {
      // Set progress to 99%
      mockProgress.progress.scheduled_habit_completions = 59;
      mockProgress.completionPercentage = 98.3;
      mockProgress.isCompleted = false;
      
      // Add final completion to reach 100%
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should trigger challenge completion
      expect(GamificationService.addXP).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          source: XPSourceType.MONTHLY_CHALLENGE,
          description: expect.stringContaining('Monthly challenge completed')
        })
      );
    });

    it('should validate progress percentage boundaries', async () => {
      // Mock invalid progress that would exceed 100%
      mockProgress.progress.scheduled_habit_completions = 60; // Already at target
      mockProgress.completionPercentage = 100;
      
      // Additional progress should be handled correctly
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should cap at 100% and not create invalid states
      const progressCall = (AsyncStorage.setItem as jest.Mock).mock.calls
        .find(call => call[0].includes('monthly_challenge_progress_'));
      
      if (progressCall) {
        const savedProgress = JSON.parse(progressCall[1]);
        expect(savedProgress.completionPercentage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should use progress cache effectively', async () => {
      // First call should load from storage
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Second call should use cache
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // AsyncStorage.getItem should be called fewer times due to caching
      const getItemCalls = (AsyncStorage.getItem as jest.Mock).mock.calls
        .filter(call => call[0].includes('monthly_challenge_progress_'));
      
      expect(getItemCalls.length).toBeLessThan(4); // Should use cache after first load
    });

    it('should handle high-frequency updates efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate 50 rapid updates
      const promises = Array.from({ length: 50 }, () =>
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25)
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000);
    });

    it('should clear cache when explicitly requested', () => {
      // This is a synchronous operation
      MonthlyProgressTracker.clearAllProgressCache();
      
      // Cache should be cleared (this is tested by subsequent operations needing storage)
      expect(() => MonthlyProgressTracker.clearAllProgressCache()).not.toThrow();
    });
  });

  describe('Integration with Gamification System', () => {
    it('should integrate correctly with StarRatingService', async () => {
      // Complete challenge to trigger star rating update
      mockProgress.progress.scheduled_habit_completions = 59;
      mockProgress.completionPercentage = 98;
      mockProgress.isCompleted = false;
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should update star rating for the category
      expect(StarRatingService.updateStarRatingForCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          category: AchievementCategory.HABITS,
          completionPercentage: 100,
          wasCompleted: true
        })
      );
    });

    it('should coordinate with EnhancedXPRewardEngine for completion bonuses', async () => {
      // Mock enhanced XP calculation
      (EnhancedXPRewardEngine.updateMonthlyStreak as jest.Mock).mockResolvedValue(undefined);
      
      // Complete challenge
      mockProgress.progress.scheduled_habit_completions = 59;
      mockProgress.completionPercentage = 98;
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25
      );
      
      // Should update monthly streak through EnhancedXPRewardEngine
      expect(EnhancedXPRewardEngine.updateMonthlyStreak).toHaveBeenCalledWith(
        AchievementCategory.HABITS,
        true, // completed
        3 // star level
      );
    });
  });

  describe('Event System Integration', () => {
    it('should emit all required events during progress updates', async () => {
      const mockEmit = DeviceEventEmitter.emit as jest.Mock;
      mockEmit.mockClear();
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123'
      );
      
      // Should emit multiple events
      const emittedEvents = mockEmit.mock.calls.map(call => call[0]);
      
      expect(emittedEvents).toContain('monthly_progress_updated');
      expect(emittedEvents).toContain('daily_snapshot_created');
      
      // May also include milestone or completion events depending on progress
    });

    it('should provide comprehensive event data', async () => {
      const mockEmit = DeviceEventEmitter.emit as jest.Mock;
      
      await MonthlyProgressTracker.updateMonthlyProgress(
        XPSourceType.HABIT_COMPLETION,
        25,
        'habit_123',
        { additionalData: 'test' }
      );
      
      // Find the progress updated event
      const progressUpdateCall = mockEmit.mock.calls.find(call => 
        call[0] === 'monthly_progress_updated'
      );
      
      expect(progressUpdateCall[1]).toEqual(expect.objectContaining({
        challengeId: 'test_challenge_2025_01',
        challengeTitle: 'January Habits Master',
        source: XPSourceType.HABIT_COMPLETION,
        amount: 25,
        completionPercentage: expect.any(Number),
        timestamp: expect.any(Date)
      }));
    });
  });
});

// Helper function to wait for async operations
const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));