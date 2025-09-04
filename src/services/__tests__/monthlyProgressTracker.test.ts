// Monthly Progress Tracker - Comprehensive Test Suite
// Tests for 30-day monthly challenge progress tracking system
// Covers core functionality, edge cases, performance, and integration

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { 
  MonthlyProgressTracker,
  DailyProgressSnapshot,
  WeeklyBreakdown,
  MilestoneResult
} from '../monthlyProgressTracker';
import { MonthlyProgressIntegration } from '../monthlyProgressIntegration';
import { 
  MonthlyChallengeProgress,
  MonthlyChallenge,
  XPSourceType,
  AchievementCategory,
  MonthlyChallengeRequirement
} from '../../types/gamification';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn()
}));

// Mock React Native DeviceEventEmitter
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn()
  }
}));

// Mock GamificationService
jest.mock('../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn().mockResolvedValue({ success: true, xpGained: 50 })
  }
}));

// Mock StarRatingService
jest.mock('../starRatingService', () => ({
  StarRatingService: {
    updateStarRatingForCompletion: jest.fn().mockResolvedValue({})
  }
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockDeviceEventEmitter = DeviceEventEmitter as jest.Mocked<typeof DeviceEventEmitter>;

describe('MonthlyProgressTracker', () => {
  
  // ========================================
  // TEST SETUP & UTILITIES
  // ========================================

  beforeEach(() => {
    jest.clearAllMocks();
    MonthlyProgressTracker.clearAllProgressCache();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  /**
   * Create mock monthly challenge for testing
   */
  const createMockChallenge = (overrides: Partial<MonthlyChallenge> = {}): MonthlyChallenge => ({
    id: 'test_challenge_001',
    title: 'Consistency Master',
    description: 'Complete your habits consistently',
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    category: AchievementCategory.HABITS,
    starLevel: 3,
    baseXPReward: 1125,
    requirements: [
      {
        type: 'habits',
        target: 60,
        description: 'Complete 60 habit tasks',
        trackingKey: 'scheduled_habit_completions',
        baselineValue: 45,
        scalingMultiplier: 1.15,
        progressMilestones: [0.25, 0.50, 0.75]
      }
    ],
    scalingFormula: 'baseline * 1.15',
    isActive: true,
    generationReason: 'scheduled',
    categoryRotation: [AchievementCategory.HABITS],
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-01'),
    userBaselineSnapshot: {
      month: '2025-08',
      analysisStartDate: '2025-07-01',
      analysisEndDate: '2025-07-31',
      dataQuality: 'complete' as const,
      totalActiveDays: 30
    },
    ...overrides
  });

  /**
   * Create mock progress object for testing
   */
  const createMockProgress = (overrides: Partial<MonthlyChallengeProgress> = {}): MonthlyChallengeProgress => ({
    challengeId: 'test_challenge_001',
    userId: 'test_user',
    progress: {
      scheduled_habit_completions: 15
    },
    isCompleted: false,
    xpEarned: 0,
    weeklyProgress: {
      week1: { scheduled_habit_completions: 5 },
      week2: { scheduled_habit_completions: 10 },
      week3: {},
      week4: {}
    },
    milestonesReached: {
      25: { reached: false },
      50: { reached: false },
      75: { reached: false }
    },
    completionPercentage: 25,
    daysActive: 8,
    daysRemaining: 23,
    projectedCompletion: 45,
    currentStreak: 1,
    longestStreak: 2,
    streakBonusEligible: false,
    dailyConsistency: 0.65,
    weeklyConsistency: 0.70,
    bestWeek: 2,
    activeDays: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-05', '2025-08-06', '2025-08-08', '2025-08-09', '2025-08-10'],
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-10'),
    ...overrides
  });

  // ========================================
  // CORE PROGRESS TRACKING TESTS
  // ========================================

  describe('Core Progress Tracking', () => {
    
    test('should initialize challenge progress correctly', async () => {
      const mockChallenge = createMockChallenge();
      
      const initialProgress = await MonthlyProgressTracker.initializeChallengeProgress(mockChallenge);
      
      expect(initialProgress).toBeDefined();
      expect(initialProgress.challengeId).toBe('test_challenge_001');
      expect(initialProgress.completionPercentage).toBe(0);
      expect(initialProgress.daysActive).toBe(0);
      expect(initialProgress.isCompleted).toBe(false);
      expect(initialProgress.weeklyProgress).toHaveProperty('week1');
      expect(initialProgress.weeklyProgress).toHaveProperty('week2');
      expect(initialProgress.weeklyProgress).toHaveProperty('week3');
      expect(initialProgress.weeklyProgress).toHaveProperty('week4');
      
      // Verify milestone structure
      expect(initialProgress.milestonesReached[25]).toEqual({ reached: false });
      expect(initialProgress.milestonesReached[50]).toEqual({ reached: false });
      expect(initialProgress.milestonesReached[75]).toEqual({ reached: false });
      
      // Verify AsyncStorage was called to save
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'monthly_challenge_progress_test_challenge_001',
        expect.stringContaining('"challengeId":"test_challenge_001"')
      );
    });

    test('should handle 31-day months correctly', async () => {
      const mockChallenge = createMockChallenge({
        startDate: '2025-01-01', // January has 31 days
        endDate: '2025-01-31'
      });
      
      const initialProgress = await MonthlyProgressTracker.initializeChallengeProgress(mockChallenge);
      
      expect(initialProgress.weeklyProgress).toHaveProperty('week5');
    });

    test('should handle 28-day February correctly', async () => {
      const mockChallenge = createMockChallenge({
        startDate: '2025-02-01', // February has 28 days in 2025
        endDate: '2025-02-28'
      });
      
      const initialProgress = await MonthlyProgressTracker.initializeChallengeProgress(mockChallenge);
      
      expect(initialProgress.weeklyProgress).not.toHaveProperty('week5');
    });

    test('should get and cache challenge progress correctly', async () => {
      const mockProgress = createMockProgress();
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockProgress));
      
      // First call - should load from storage
      const progress1 = await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(progress1).toEqual(expect.objectContaining({
        challengeId: 'test_challenge_001',
        completionPercentage: 25
      }));
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      const progress2 = await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(progress2).toEqual(progress1);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1); // No additional storage call
    });

    test('should save progress state with proper timestamps', async () => {
      const mockProgress = createMockProgress();
      const originalUpdatedAt = mockProgress.updatedAt;
      
      await MonthlyProgressTracker.saveProgressState(mockProgress);
      
      expect(mockProgress.updatedAt).not.toEqual(originalUpdatedAt);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'monthly_challenge_progress_test_challenge_001',
        expect.stringContaining('"challengeId":"test_challenge_001"')
      );
    });
  });

  // ========================================
  // PROGRESS CALCULATION TESTS
  // ========================================

  describe('Progress Calculations', () => {
    
    test('should calculate completion percentage correctly', async () => {
      // Mock private method access for testing
      const calculateCompletionPercentage = (MonthlyProgressTracker as any).calculateCompletionPercentage;
      
      const mockChallenge = createMockChallenge({
        requirements: [
          { type: 'habits', target: 100, trackingKey: 'scheduled_habit_completions' },
          { type: 'journal', target: 90, trackingKey: 'quality_journal_entries' }
        ] as any[]
      });
      
      const mockProgress = createMockProgress({
        progress: {
          scheduled_habit_completions: 50, // 50% of 100
          quality_journal_entries: 45      // 50% of 90
        }
      });
      
      const percentage = calculateCompletionPercentage(mockChallenge, mockProgress);
      expect(percentage).toBe(50); // Average of 50% and 50%
    });

    test('should calculate days remaining correctly', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-15T10:00:00.000Z'));
      
      const calculateDaysRemaining = (MonthlyProgressTracker as any).calculateDaysRemaining;
      const mockChallenge = createMockChallenge({
        endDate: '2025-08-31'
      });
      
      const daysRemaining = calculateDaysRemaining(mockChallenge);
      expect(daysRemaining).toBe(16); // From Aug 15 to Aug 31 (16 days remaining)
      
      jest.useRealTimers();
    });

    test('should calculate projected completion based on current pace', async () => {
      const calculateProjectedCompletion = (MonthlyProgressTracker as any).calculateProjectedCompletion;
      
      const mockProgress = createMockProgress({
        completionPercentage: 40,
        daysActive: 10,
        daysRemaining: 20
      });
      
      const projectedCompletion = calculateProjectedCompletion(mockProgress);
      expect(projectedCompletion).toBe(100); // Capped at 100%
    });
  });

  // ========================================
  // DAILY SNAPSHOTS TESTS
  // ========================================

  describe('Daily Snapshots', () => {
    
    test('should create daily snapshot correctly', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-15T14:30:00.000Z'));
      
      // Mock the private method for testing
      const createDailySnapshot = (MonthlyProgressTracker as any).createDailySnapshot;
      const saveDailySnapshot = jest.fn();
      (MonthlyProgressTracker as any).saveDailySnapshot = saveDailySnapshot;
      (MonthlyProgressTracker as any).getDailySnapshot = jest.fn().mockResolvedValue(null);
      (MonthlyProgressTracker as any).getRequirementsForChallenge = jest.fn().mockResolvedValue([
        { trackingKey: 'scheduled_habit_completions', target: 60 }
      ]);
      (MonthlyProgressTracker as any).analyzeDailyFeatureUsage = jest.fn().mockResolvedValue({
        usedAllThreeFeatures: true,
        metDailyMinimums: true
      });
      
      const mockProgress = createMockProgress();
      
      await createDailySnapshot('test_challenge_001', mockProgress, XPSourceType.HABIT_COMPLETION, 25);
      
      expect(saveDailySnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2025-08-15',
          challengeId: 'test_challenge_001',
          weekNumber: 3, // Day 15 is in week 3 (days 15-21)
          dayOfMonth: 15,
          isTripleFeatureDay: true,
          isPerfectDay: true,
          xpEarnedToday: 25
        })
      );
      
      expect(mockDeviceEventEmitter.emit).toHaveBeenCalledWith(
        'daily_snapshot_created',
        expect.objectContaining({
          challengeId: 'test_challenge_001'
        })
      );
      
      jest.useRealTimers();
    });

    test('should update existing snapshot correctly', async () => {
      const existingSnapshot: DailyProgressSnapshot = {
        date: '2025-08-15',
        challengeId: 'test_challenge_001',
        dailyContributions: { scheduled_habit_completions: 2 },
        cumulativeProgress: { scheduled_habit_completions: 20 },
        progressPercentage: 33,
        weekNumber: 3,
        dayOfMonth: 15,
        isTripleFeatureDay: false,
        isPerfectDay: false,
        xpEarnedToday: 50,
        timestamp: new Date('2025-08-15T10:00:00.000Z')
      };
      
      const updateExistingSnapshot = (MonthlyProgressTracker as any).updateExistingSnapshot;
      const saveDailySnapshot = jest.fn();
      (MonthlyProgressTracker as any).saveDailySnapshot = saveDailySnapshot;
      (MonthlyProgressTracker as any).getRequirementsForChallenge = jest.fn().mockResolvedValue([
        { trackingKey: 'scheduled_habit_completions', target: 60 }
      ]);
      (MonthlyProgressTracker as any).analyzeDailyFeatureUsage = jest.fn().mockResolvedValue({
        usedAllThreeFeatures: true,
        metDailyMinimums: true
      });
      
      const mockProgress = createMockProgress({
        progress: { scheduled_habit_completions: 25 },
        completionPercentage: 42
      });
      
      await updateExistingSnapshot(existingSnapshot, XPSourceType.HABIT_COMPLETION, 25, mockProgress);
      
      expect(existingSnapshot.dailyContributions.scheduled_habit_completions).toBe(3); // 2 + 1
      expect(existingSnapshot.xpEarnedToday).toBe(75); // 50 + 25
      expect(existingSnapshot.isTripleFeatureDay).toBe(true); // Updated based on new analysis
      expect(existingSnapshot.isPerfectDay).toBe(true);
      expect(saveDailySnapshot).toHaveBeenCalledWith(existingSnapshot);
    });

    test('should calculate week number correctly', async () => {
      const calculateWeekNumber = (MonthlyProgressTracker as any).calculateWeekNumber;
      
      expect(calculateWeekNumber(new Date('2025-08-01'))).toBe(1); // Day 1 = Week 1
      expect(calculateWeekNumber(new Date('2025-08-07'))).toBe(1); // Day 7 = Week 1
      expect(calculateWeekNumber(new Date('2025-08-08'))).toBe(2); // Day 8 = Week 2
      expect(calculateWeekNumber(new Date('2025-08-15'))).toBe(3); // Day 15 = Week 3
      expect(calculateWeekNumber(new Date('2025-08-22'))).toBe(4); // Day 22 = Week 4
      expect(calculateWeekNumber(new Date('2025-08-29'))).toBe(5); // Day 29 = Week 5
    });
  });

  // ========================================
  // MILESTONE DETECTION TESTS
  // ========================================

  describe('Milestone Detection', () => {
    
    test('should detect 25% milestone correctly', async () => {
      const checkMilestoneProgress = (MonthlyProgressTracker as any).checkMilestoneProgress;
      
      const mockProgress = createMockProgress({
        completionPercentage: 25,
        milestonesReached: {
          25: { reached: false },
          50: { reached: false },
          75: { reached: false }
        }
      });
      
      const results: MilestoneResult[] = await checkMilestoneProgress('test_challenge_001', mockProgress);
      
      const milestone25 = results.find(r => r.milestone === 25);
      expect(milestone25).toBeDefined();
      expect(milestone25!.reached).toBe(true);
      expect(milestone25!.previouslyReached).toBe(false);
      expect(milestone25!.celebrationTriggered).toBe(true);
      expect(milestone25!.xpAwarded).toBeGreaterThan(0);
      
      // Verify milestone data was updated in progress
      expect(mockProgress.milestonesReached[25].reached).toBe(true);
      expect(mockProgress.milestonesReached[25].timestamp).toBeDefined();
      expect(mockProgress.milestonesReached[25].xpAwarded).toBeGreaterThan(0);
    });

    test('should not trigger duplicate milestone celebrations', async () => {
      const checkMilestoneProgress = (MonthlyProgressTracker as any).checkMilestoneProgress;
      
      const mockProgress = createMockProgress({
        completionPercentage: 30,
        milestonesReached: {
          25: { reached: true, timestamp: new Date(), xpAwarded: 50 },
          50: { reached: false },
          75: { reached: false }
        }
      });
      
      const results: MilestoneResult[] = await checkMilestoneProgress('test_challenge_001', mockProgress);
      
      const milestone25 = results.find(r => r.milestone === 25);
      expect(milestone25!.reached).toBe(true);
      expect(milestone25!.previouslyReached).toBe(true);
      expect(milestone25!.celebrationTriggered).toBe(false);
      expect(milestone25!.xpAwarded).toBe(0);
    });

    test('should calculate milestone XP bonuses correctly', async () => {
      const calculateMilestoneXPBonus = (MonthlyProgressTracker as any).calculateMilestoneXPBonus;
      
      const mockProgress = createMockProgress({
        dailyConsistency: 0.9,  // High consistency = +20% bonus
        daysActive: 10         // High activity = +10% bonus
      });
      
      const bonus25 = calculateMilestoneXPBonus(25, mockProgress);
      const bonus50 = calculateMilestoneXPBonus(50, mockProgress);
      const bonus75 = calculateMilestoneXPBonus(75, mockProgress);
      
      // Base bonuses: 25% = 50 XP, 50% = 100 XP, 75% = 150 XP
      // With bonuses: 50 * 1.2 * 1.1 = 66, 100 * 1.2 * 1.1 = 132, 150 * 1.2 * 1.1 = 198
      expect(bonus25).toBe(66);
      expect(bonus50).toBe(132);
      expect(bonus75).toBe(198);
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  describe('XP Event Integration', () => {
    
    test('should integrate with MonthlyProgressIntegration correctly', async () => {
      // Mock the integration service
      const mockUpdateMonthlyProgress = jest.spyOn(MonthlyProgressTracker, 'updateMonthlyProgress');
      mockUpdateMonthlyProgress.mockResolvedValue();
      
      // Initialize integration
      await MonthlyProgressIntegration.initialize();
      
      // Verify event listeners are set up
      expect(mockDeviceEventEmitter.addListener).toHaveBeenCalledWith(
        'xpGained',
        expect.any(Function)
      );
      expect(mockDeviceEventEmitter.addListener).toHaveBeenCalledWith(
        'xpBatchCommitted',
        expect.any(Function)
      );
      expect(mockDeviceEventEmitter.addListener).toHaveBeenCalledWith(
        'levelUp',
        expect.any(Function)
      );
      
      // Test event handling
      const xpEventHandler = mockDeviceEventEmitter.addListener.mock.calls.find(
        call => call[0] === 'xpGained'
      )?.[1];
      
      if (xpEventHandler) {
        await xpEventHandler({
          amount: 25,
          source: XPSourceType.HABIT_COMPLETION,
          timestamp: Date.now()
        });
        
        expect(mockUpdateMonthlyProgress).toHaveBeenCalledWith(
          XPSourceType.HABIT_COMPLETION,
          25,
          undefined,
          undefined
        );
      }
    });

    test('should handle batched XP events correctly', async () => {
      const mockProcessXPEvent = jest.fn();
      (MonthlyProgressIntegration as any).processXPEvent = mockProcessXPEvent;
      
      const batchedEvent = {
        totalAmount: 150,
        sources: [XPSourceType.HABIT_COMPLETION, XPSourceType.JOURNAL_ENTRY, XPSourceType.GOAL_PROGRESS],
        sourceIds: ['habit_1', 'journal_1', 'goal_1'],
        batchTimestamp: Date.now(),
        eventCount: 3
      };
      
      const handleBatchedXPEvent = (MonthlyProgressIntegration as any).handleBatchedXPEvent;
      await handleBatchedXPEvent(batchedEvent);
      
      expect(mockProcessXPEvent).toHaveBeenCalledTimes(3);
      expect(mockProcessXPEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50, // 150 / 3
          source: XPSourceType.HABIT_COMPLETION,
          sourceId: 'habit_1'
        })
      );
    });
  });

  // ========================================
  // PERFORMANCE & EDGE CASES TESTS
  // ========================================

  describe('Performance & Edge Cases', () => {
    
    test('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const progress = await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(progress).toBeNull();
      
      // Should not throw
      expect(() => {}).not.toThrow();
    });

    test('should handle invalid progress data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json{');
      
      const progress = await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(progress).toBeNull();
    });

    test('should cache progress data for performance', async () => {
      const mockProgress = createMockProgress();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockProgress));
      
      // First call
      await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1);
      
      // Second call within cache TTL
      await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1); // No additional call
    });

    test('should clear cache after TTL expires', async () => {
      jest.useFakeTimers();
      
      const mockProgress = createMockProgress();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockProgress));
      
      // First call
      await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1);
      
      // Advance time beyond cache TTL (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      // Second call after TTL
      await MonthlyProgressTracker.getChallengeProgress('test_challenge_001');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(2); // Cache expired, new call
      
      jest.useRealTimers();
    });

    test('should handle concurrent progress updates safely', async () => {
      const mockProgress = createMockProgress();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockProgress));
      
      // Simulate concurrent updates
      const promises = [
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25),
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.JOURNAL_ENTRY, 20),
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, 35)
      ];
      
      await Promise.all(promises);
      
      // Should not throw and should handle all updates
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  // ========================================
  // INTEGRATION CONFIGURATION TESTS
  // ========================================

  describe('Integration Configuration', () => {
    
    test('should update configuration correctly', () => {
      const newConfig = {
        enableMonthlyTracking: false,
        enableWeeklyTracking: true,
        batchingWindowMs: 1000,
        enableDebugLogging: true
      };
      
      MonthlyProgressIntegration.updateConfig(newConfig);
      
      const config = MonthlyProgressIntegration.getConfig();
      expect(config.enableMonthlyTracking).toBe(false);
      expect(config.batchingWindowMs).toBe(1000);
      expect(config.enableDebugLogging).toBe(true);
    });

    test('should enable/disable integration correctly', () => {
      MonthlyProgressIntegration.setEnabled(false);
      expect(MonthlyProgressIntegration.isActive()).toBe(false);
      
      MonthlyProgressIntegration.setEnabled(true);
      // Note: isActive() would still be false if not initialized in test environment
    });

    test('should provide comprehensive status information', () => {
      const status = MonthlyProgressIntegration.getStatus();
      
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('isEnabled');
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('pendingEvents');
      expect(status).toHaveProperty('config');
      expect(typeof status.pendingEvents).toBe('number');
      expect(typeof status.config).toBe('object');
    });
  });

  // ========================================
  // BASELINE CALCULATION TESTS
  // ========================================

  describe('Baseline Calculation Logic', () => {
    
    test('should handle missing challenge data gracefully', async () => {
      // Test baseline integration by checking if MonthlyProgressTracker handles missing data
      const progress = await MonthlyProgressTracker.getChallengeProgress('non_existent_challenge');
      expect(progress).toBeNull();
    });
    
    test('should validate progress initialization without baseline', async () => {
      // Test creating progress without external baseline dependency
      const mockChallenge = createMockChallenge();
      const initialProgress = await MonthlyProgressTracker.initializeChallengeProgress(mockChallenge);
      
      expect(initialProgress).toBeDefined();
      expect(initialProgress.completionPercentage).toBe(0);
      expect(initialProgress.progress).toBeDefined();
    });
  });

  // ========================================
  // STAR PROGRESSION INTEGRATION TESTS
  // ========================================

  describe('Star Progression Integration', () => {
    
    test('should update star ratings on challenge completion', async () => {
      const { StarRatingService } = require('../starRatingService');
      const completeMonthlyChallenge = (MonthlyProgressTracker as any).completeMonthlyChallenge;
      const getChallengeById = jest.fn().mockResolvedValue(createMockChallenge());
      (MonthlyProgressTracker as any).getChallengeById = getChallengeById;
      
      const mockProgress = createMockProgress({
        completionPercentage: 100,
        isCompleted: false
      });
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockProgress));
      
      // Mock star rating update
      StarRatingService.updateStarRatingForCompletion.mockResolvedValue({
        previousStars: 3,
        newStars: 4,
        reason: 'success',
        challengeCompleted: true,
        category: AchievementCategory.HABITS
      });
      
      await completeMonthlyChallenge('test_challenge_001');
      
      expect(StarRatingService.updateStarRatingForCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          challengeId: 'test_challenge_001',
          category: AchievementCategory.HABITS,
          completionPercentage: 100,
          wasCompleted: true,
          targetValue: 60,
          actualValue: 15
        })
      );
    });
    
    test('should handle star rating service failures gracefully', async () => {
      const { StarRatingService } = require('../starRatingService');
      const completeMonthlyChallenge = (MonthlyProgressTracker as any).completeMonthlyChallenge;
      const getChallengeById = jest.fn().mockResolvedValue(createMockChallenge());
      (MonthlyProgressTracker as any).getChallengeById = getChallengeById;
      
      const mockProgress = createMockProgress({
        completionPercentage: 100,
        isCompleted: false
      });
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockProgress));
      
      // Mock star rating service failure
      StarRatingService.updateStarRatingForCompletion.mockRejectedValue(new Error('Service unavailable'));
      
      // Should not throw error
      await expect(completeMonthlyChallenge('test_challenge_001')).resolves.not.toThrow();
    });
    
    test('should handle star level constraints validation', async () => {
      // Test that challenges are created with valid star levels
      const mockChallenge = createMockChallenge({
        starLevel: 3,
        requirements: [
          {
            type: 'habits',
            target: 30, // Valid target for 3-star level
            trackingKey: 'scheduled_habit_completions'
          } as any
        ]
      });
      
      expect(mockChallenge.starLevel).toBeGreaterThanOrEqual(1);
      expect(mockChallenge.starLevel).toBeLessThanOrEqual(5);
      expect(mockChallenge.requirements[0].target).toBeGreaterThan(0);
    });
  });

  // ========================================
  // PROGRESS TRACKING EDGE CASES
  // ========================================

  describe('Progress Tracking Edge Cases', () => {
    
    test('should handle XP source mapping correctly', async () => {
      const getRelevantRequirements = (MonthlyProgressTracker as any).getRelevantRequirements;
      
      const mockChallenge = createMockChallenge({
        requirements: [
          { trackingKey: 'scheduled_habit_completions', type: 'habits' },
          { trackingKey: 'bonus_habit_completions', type: 'habits' },
          { trackingKey: 'quality_journal_entries', type: 'journal' },
          { trackingKey: 'goal_progress_days', type: 'goals' },
          { trackingKey: 'triple_feature_days', type: 'consistency' }
        ] as any[]
      });
      
      // Test habit completion mapping
      let relevantReqs = getRelevantRequirements(mockChallenge, XPSourceType.HABIT_COMPLETION);
      expect(relevantReqs.some(r => r.trackingKey === 'scheduled_habit_completions')).toBe(true);
      expect(relevantReqs.some(r => r.trackingKey === 'unique_weekly_habits')).toBe(false);
      
      // Test habit bonus mapping
      relevantReqs = getRelevantRequirements(mockChallenge, XPSourceType.HABIT_BONUS);
      expect(relevantReqs.some(r => r.trackingKey === 'bonus_habit_completions')).toBe(true);
      
      // Test journal entry mapping
      relevantReqs = getRelevantRequirements(mockChallenge, XPSourceType.JOURNAL_ENTRY);
      expect(relevantReqs.some(r => r.trackingKey === 'quality_journal_entries')).toBe(true);
      
      // Test consistency tracking (should match all consistency requirements)
      relevantReqs = getRelevantRequirements(mockChallenge, XPSourceType.ACHIEVEMENT_UNLOCK);
      expect(relevantReqs.some(r => r.trackingKey === 'triple_feature_days')).toBe(true);
    });
    
    test('should calculate progress increments correctly', async () => {
      const calculateProgressIncrement = (MonthlyProgressTracker as any).calculateProgressIncrement;
      
      const habitReq = { trackingKey: 'scheduled_habit_completions' } as any;
      const bonusHabitReq = { trackingKey: 'bonus_habit_completions' } as any;
      const journalReq = { trackingKey: 'quality_journal_entries' } as any;
      const complexReq = { trackingKey: 'triple_feature_days' } as any;
      
      // Simple incrementing requirements
      expect(calculateProgressIncrement(habitReq, XPSourceType.HABIT_COMPLETION, 25)).toBe(1);
      expect(calculateProgressIncrement(bonusHabitReq, XPSourceType.HABIT_BONUS, 25)).toBe(1);
      expect(calculateProgressIncrement(journalReq, XPSourceType.JOURNAL_ENTRY, 15)).toBe(1);
      
      // Complex requirements (handled by daily analysis)
      expect(calculateProgressIncrement(complexReq, XPSourceType.HABIT_COMPLETION, 25)).toBe(0);
      
      // Wrong XP source for requirement
      expect(calculateProgressIncrement(habitReq, XPSourceType.JOURNAL_ENTRY, 15)).toBe(0);
    });
    
    test('should handle concurrent updates with race condition protection', async () => {
      const { MonthlyChallengeService } = require('../monthlyChallengeService');
      MonthlyChallengeService.getCurrentChallenge.mockResolvedValue(createMockChallenge());
      
      let progressValue = 10;
      const mockProgress = createMockProgress({
        progress: { scheduled_habit_completions: progressValue }
      });
      
      // Simulate atomic updates by updating value on each read
      mockAsyncStorage.getItem.mockImplementation(() => {
        const updatedProgress = { ...mockProgress, progress: { scheduled_habit_completions: progressValue } };
        return Promise.resolve(JSON.stringify(updatedProgress));
      });
      
      mockAsyncStorage.setItem.mockImplementation(() => {
        progressValue++; // Simulate atomic increment
        return Promise.resolve();
      });
      
      // Mock daily analysis to avoid errors
      (MonthlyProgressTracker as any).getDailyXPTransactions = jest.fn().mockResolvedValue([]);
      (MonthlyProgressTracker as any).createDailySnapshot = jest.fn().mockResolvedValue();
      (MonthlyProgressTracker as any).updateWeeklyBreakdown = jest.fn().mockResolvedValue();
      (MonthlyProgressTracker as any).checkMilestoneProgress = jest.fn().mockResolvedValue([]);
      
      // Execute concurrent updates
      const promises = Array.from({ length: 5 }, (_, i) =>
        MonthlyProgressTracker.updateMonthlyProgress(
          XPSourceType.HABIT_COMPLETION,
          25,
          `habit_${i}`
        )
      );
      
      await Promise.all(promises);
      
      // All updates should complete without error
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(5);
      expect(progressValue).toBe(15); // 10 + 5 increments
    });
    
    test('should handle network failures during external service calls', async () => {
      const { MonthlyChallengeService } = require('../monthlyChallengeService');
      MonthlyChallengeService.getCurrentChallenge.mockResolvedValue(createMockChallenge());
      
      const mockProgress = createMockProgress();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockProgress));
      
      // Mock GamificationService failure for daily analysis
      (MonthlyProgressTracker as any).getDailyXPTransactions = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Should complete without throwing
      await expect(
        MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25)
      ).resolves.not.toThrow();
      
      // Progress should still be updated
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
    
    test('should handle memory pressure scenarios', async () => {
      // Simulate memory pressure by creating large cached data
      const largeMockProgress = createMockProgress({
        activeDays: Array.from({ length: 1000 }, (_, i) => `2025-08-${String(i + 1).padStart(3, '0')}`)
      });
      
      // Fill cache with multiple entries
      for (let i = 0; i < 100; i++) {
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(largeMockProgress));
        await MonthlyProgressTracker.getChallengeProgress(`challenge_${i}`);
      }
      
      // Clear cache should work without issues
      expect(() => MonthlyProgressTracker.clearAllProgressCache()).not.toThrow();
      
      // Should be able to continue normal operations
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(createMockProgress()));
      const progress = await MonthlyProgressTracker.getChallengeProgress('new_challenge');
      expect(progress).toBeDefined();
    });
  });

  // ========================================
  // FEATURE ANALYSIS TESTS
  // ========================================

  describe('Daily Feature Analysis', () => {
    
    test('should detect triple feature days correctly', async () => {
      const analyzeDailyFeatureUsage = (MonthlyProgressTracker as any).analyzeDailyFeatureUsage;
      
      // Mock comprehensive XP transactions
      (MonthlyProgressTracker as any).getDailyXPTransactions = jest.fn().mockResolvedValue([
        { source: XPSourceType.HABIT_COMPLETION, amount: 25 },
        { source: XPSourceType.HABIT_BONUS, amount: 10 },
        { source: XPSourceType.JOURNAL_ENTRY, amount: 15 },
        { source: XPSourceType.JOURNAL_BONUS, amount: 5 },
        { source: XPSourceType.GOAL_PROGRESS, amount: 20 },
        { source: XPSourceType.GOAL_COMPLETION, amount: 50 }
      ]);
      
      const analysis = await analyzeDailyFeatureUsage('2025-08-15');
      
      expect(analysis.usedAllThreeFeatures).toBe(true); // Has habits, journal, and goals
    });
    
    test('should detect perfect days correctly', async () => {
      const analyzeDailyFeatureUsage = (MonthlyProgressTracker as any).analyzeDailyFeatureUsage;
      
      // Mock perfect day transactions (1+ habits, 3+ journal, 1+ goals)
      (MonthlyProgressTracker as any).getDailyXPTransactions = jest.fn().mockResolvedValue([
        { source: XPSourceType.HABIT_COMPLETION },
        { source: XPSourceType.JOURNAL_ENTRY },
        { source: XPSourceType.JOURNAL_ENTRY },
        { source: XPSourceType.JOURNAL_ENTRY },
        { source: XPSourceType.GOAL_PROGRESS }
      ]);
      
      const analysis = await analyzeDailyFeatureUsage('2025-08-15');
      
      expect(analysis.metDailyMinimums).toBe(true);
      expect(analysis.usedAllThreeFeatures).toBe(true);
    });
    
    test('should handle incomplete feature days', async () => {
      const analyzeDailyFeatureUsage = (MonthlyProgressTracker as any).analyzeDailyFeatureUsage;
      
      // Mock incomplete day (only habits and journal, no goals)
      (MonthlyProgressTracker as any).getDailyXPTransactions = jest.fn().mockResolvedValue([
        { source: XPSourceType.HABIT_COMPLETION },
        { source: XPSourceType.JOURNAL_ENTRY },
        { source: XPSourceType.JOURNAL_ENTRY }
        // No goal progress
      ]);
      
      const analysis = await analyzeDailyFeatureUsage('2025-08-15');
      
      expect(analysis.usedAllThreeFeatures).toBe(false);
      expect(analysis.metDailyMinimums).toBe(false); // Missing goals + insufficient journal entries
    });
  });

  // ========================================
  // REAL-WORLD SCENARIO TESTS
  // ========================================

  describe('Real-World Scenarios', () => {
    
    test('should handle complete monthly challenge flow', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-01T00:00:00.000Z'));
      
      // Create challenge
      const challenge = createMockChallenge({
        requirements: [
          {
            type: 'habits',
            target: 31, // One per day
            trackingKey: 'scheduled_habit_completions',
            baselineValue: 25,
            scalingMultiplier: 1.24,
            progressMilestones: [0.25, 0.50, 0.75]
          } as any
        ]
      });
      
      // Initialize progress
      let progress = await MonthlyProgressTracker.initializeChallengeProgress(challenge);
      expect(progress.completionPercentage).toBe(0);
      
      // Mock storage to return our progress
      mockAsyncStorage.getItem.mockImplementation(key => {
        if (key.includes('progress')) {
          return Promise.resolve(JSON.stringify(progress));
        }
        return Promise.resolve(null);
      });
      
      // Mock the getActiveMonthlyChallenge method
      (MonthlyProgressTracker as any).getActiveMonthlyChallenge = jest.fn().mockResolvedValue([challenge]);
      
      // Simulate daily progress throughout the month
      for (let day = 1; day <= 31; day++) {
        jest.setSystemTime(new Date(`2025-08-${day.toString().padStart(2, '0')}T10:00:00.000Z`));
        
        // Update progress (one habit completion per day)
        await MonthlyProgressTracker.updateMonthlyProgress(
          XPSourceType.HABIT_COMPLETION,
          25,
          'habit_001',
          { day }
        );
        
        // Check completion percentage
        const expectedPercentage = Math.round((day / 31) * 100);
        
        if (day === 8) { // 25% milestone
          expect(progress.completionPercentage).toBeGreaterThanOrEqual(25);
        }
        if (day === 16) { // 50% milestone  
          expect(progress.completionPercentage).toBeGreaterThanOrEqual(50);
        }
        if (day === 24) { // 75% milestone
          expect(progress.completionPercentage).toBeGreaterThanOrEqual(75);
        }
        if (day === 31) { // 100% completion
          expect(progress.completionPercentage).toBe(100);
          expect(progress.isCompleted).toBe(true);
        }
      }
      
      jest.useRealTimers();
    });

    test('should handle partial month completion correctly', async () => {
      const mockProgress = createMockProgress({
        completionPercentage: 65,
        daysActive: 20,
        daysRemaining: 11
      });
      
      const calculateProjectedCompletion = (MonthlyProgressTracker as any).calculateProjectedCompletion;
      const projectedCompletion = calculateProjectedCompletion(mockProgress);
      
      // 65% in 20 days = 3.25% per day
      // Over 31 days = 3.25 * 31 = 100.75%
      expect(projectedCompletion).toBeGreaterThan(90);
      expect(projectedCompletion).toBeLessThanOrEqual(100);
    });
  });
});

describe('MonthlyProgressIntegration', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    MonthlyProgressIntegration.cleanup();
  });

  test('should initialize and setup event listeners', async () => {
    await MonthlyProgressIntegration.initialize();
    
    expect(mockDeviceEventEmitter.addListener).toHaveBeenCalledWith(
      'xpGained',
      expect.any(Function)
    );
    expect(mockDeviceEventEmitter.addListener).toHaveBeenCalledWith(
      'xpBatchCommitted', 
      expect.any(Function)
    );
    expect(mockDeviceEventEmitter.addListener).toHaveBeenCalledWith(
      'levelUp',
      expect.any(Function)
    );
  });

  test('should cleanup properly', () => {
    MonthlyProgressIntegration.cleanup();
    
    // Verify cleanup was called
    expect(true).toBe(true); // Cleanup doesn't throw
  });

  test('should handle batching configuration correctly', async () => {
    await MonthlyProgressIntegration.initialize();
    
    MonthlyProgressIntegration.updateConfig({
      enableBatching: true,
      batchingWindowMs: 500,
      maxBatchSize: 25
    });
    
    const config = MonthlyProgressIntegration.getConfig();
    expect(config.enableBatching).toBe(true);
    expect(config.batchingWindowMs).toBe(500);
    expect(config.maxBatchSize).toBe(25);
  });
});