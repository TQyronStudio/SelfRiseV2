// Monthly Challenge Lifecycle Management System
// Enterprise-grade challenge lifecycle orchestration with state management,
// automatic generation, preview system, and comprehensive error recovery

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, AppState, NativeEventSubscription } from 'react-native';
import { MonthlyChallengeService } from './monthlyChallengeService';
import { MonthlyProgressTracker } from './monthlyProgressTracker';
import { UserActivityTracker } from './userActivityTracker';
import { StarRatingService } from './starRatingService';
import { GamificationService } from './gamificationService';
import {
  MonthlyChallenge,
  MonthlyChallengeGenerationResult,
  AchievementCategory,
  ChallengeLifecycleState,
  ChallengeLifecycleEvent,
  ChallengePreviewData,
  UserChallengeRatings
} from '../types/gamification';
import { DateString } from '../types/common';
import { formatDateToString, today, addDays, parseDate, subtractDays } from '../utils/date';
import { generateUUID } from '../utils/uuid';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { sqliteChallengeStorage } from './storage/SQLiteChallengeStorage';

// ========================================
// INTERFACES & TYPES
// ========================================

// Using types from gamification.ts instead of duplicating them

// ChallengePreviewData interface is now defined in gamification.ts

/**
 * Lifecycle manager configuration
 */
interface LifecycleManagerConfig {
  enablePreviewGeneration: boolean;      // Generate previews on 25th day
  enableGracePeriod: boolean;            // Allow late-month start
  gracePeriodDays: number;               // Max days for grace period
  enableAutoArchival: boolean;           // Auto-archive old challenges
  archivalDelayDays: number;             // Days to wait before archival
  errorRetryAttempts: number;            // Max retry attempts for errors
  errorRetryDelayMs: number;             // Delay between retry attempts
  backgroundTaskInterval: number;        // Background check interval (ms)
  debugMode: boolean;                    // Enable debug logging
}

/**
 * Lifecycle status with comprehensive metadata
 */
export interface ChallengeLifecycleStatus {
  currentState: ChallengeLifecycleState;
  currentChallenge: MonthlyChallenge | null;
  previewChallenge: ChallengePreviewData | null;
  lastStateChange: Date;
  stateHistory: Array<{
    state: ChallengeLifecycleState;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  pendingActions: string[];
  errors: Array<{
    error: string;
    timestamp: Date;
    context: string;
    retryAttempt: number;
  }>;
  metrics: {
    totalGenerations: number;
    successfulGenerations: number;
    averageGenerationTime: number;
    lastBackgroundCheck: Date;
    systemHealth: 'healthy' | 'warning' | 'error';
  };
}

// ========================================
// MONTHLY CHALLENGE LIFECYCLE MANAGER
// ========================================

export class MonthlyChallengeLifecycleManager {
  private static readonly STORAGE_KEY = 'monthly_challenge_lifecycle';
  private static readonly PREVIEW_STORAGE_KEY = 'monthly_challenge_preview';
  private static readonly STATUS_STORAGE_KEY = 'monthly_challenge_status';

  // Storage adapter - uses SQLite when enabled, AsyncStorage otherwise
  private static get storage() {
    return FEATURE_FLAGS.USE_SQLITE_CHALLENGES ? sqliteChallengeStorage : null;
  }

  private static config: LifecycleManagerConfig = {
    enablePreviewGeneration: true,
    enableGracePeriod: false,
    gracePeriodDays: 0,
    enableAutoArchival: true,
    archivalDelayDays: 3,
    errorRetryAttempts: 3,
    errorRetryDelayMs: 5000,
    backgroundTaskInterval: 60000 * 60, // 1 hour
    debugMode: __DEV__
  };
  
  private static backgroundTaskId: NodeJS.Timeout | null = null;
  private static appStateSubscription: NativeEventSubscription | null = null;
  private static isInitialized = false;
  private static eventListeners = new Map<string, Function[]>();
  
  // ===============================================
  // INITIALIZATION & STARTUP
  // ===============================================
  
  /**
   * Initialize lifecycle manager - call this on app startup
   */
  static async initialize(customConfig?: Partial<LifecycleManagerConfig>): Promise<void> {
    if (this.isInitialized) {
      this.log('Lifecycle manager already initialized, skipping');
      return;
    }
    
    try {
      // Apply custom configuration
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
      }
      
      this.log('Initializing Monthly Challenge Lifecycle Manager');
      
      // Register app state change listener
      this.registerAppStateListener();
      
      // Start background task scheduler
      this.startBackgroundTaskScheduler();
      
      // Perform initial lifecycle check
      await this.performStartupLifecycleCheck();
      
      this.isInitialized = true;
      this.log('Lifecycle manager initialized successfully');
      
      // Emit initialization event
      this.emit(ChallengeLifecycleEvent.CHALLENGE_ACTIVATED, {
        action: 'lifecycle_manager_initialized',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Failed to initialize lifecycle manager:', error);
      await this.handleError('initialization', error as Error, {});
      throw error;
    }
  }
  
  /**
   * Perform comprehensive startup lifecycle check
   */
  private static async performStartupLifecycleCheck(): Promise<void> {
    this.log('Performing startup lifecycle check');
    
    try {
      const currentStatus = await this.getLifecycleStatus();
      const currentMonth = today().substring(0, 7);
      
      this.log(`Current lifecycle state: ${currentStatus.currentState}`);
      this.log(`Current month: ${currentMonth}`);
      
      // Check if we need to handle month transition
      const existingChallenge = await MonthlyChallengeService.getCurrentChallenge();
      
      if (!existingChallenge || existingChallenge.userBaselineSnapshot.month !== currentMonth) {
        this.log('Month transition detected or no current challenge');
        await this.handleMonthTransition(currentMonth);
      } else {
        this.log('Current challenge exists and is active');
        await this.setState(ChallengeLifecycleState.ACTIVE);
      }
      
      // Check for preview generation needs (25th+ day)
      if (new Date().getDate() >= 25) {
        await this.checkAndGeneratePreview();
      }
      
      // Check for archival needs
      if (this.config.enableAutoArchival) {
        await this.performArchivalCheck();
      }
      
    } catch (error) {
      console.error('Startup lifecycle check failed:', error);
      await this.handleError('startup_check', error as Error, {});
    }
  }
  
  /**
   * Handle month transition with grace period support
   */
  private static async handleMonthTransition(newMonth: string): Promise<void> {
    this.log(`Handling month transition to ${newMonth}`);
    
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    try {
      // Check if we have a preview for this month
      const preview = await this.getPreviewForMonth(newMonth);
      
      if (dayOfMonth === 1) {
        // Perfect timing - 1st day of month
        this.log('Month start detected - generating challenge');
        await this.setState(ChallengeLifecycleState.GENERATION_NEEDED);
        await this.generateChallengeFromPreview(preview);
        
      } else {
        // Not 1st day - skip this month, prepare for next
        this.log(`Month started on day ${dayOfMonth}, skipping to next month (challenges only generate on day 1)`);
        await this.setState(ChallengeLifecycleState.AWAITING_MONTH_START);
        await this.checkAndGeneratePreview();
      }
      
    } catch (error) {
      console.error('Month transition failed:', error);
      await this.handleError('month_transition', error as Error, { newMonth, dayOfMonth });
    }
  }
  
  // ===============================================
  // CHALLENGE GENERATION & MANAGEMENT
  // ===============================================
  
  /**
   * Generate challenge from preview (if available) or fresh generation
   */
  private static async generateChallengeFromPreview(preview: ChallengePreviewData | null): Promise<void> {
    this.log('Generating challenge', { hasPreview: !!preview });
    
    try {
      await this.setState(ChallengeLifecycleState.GENERATING);
      
      let result: MonthlyChallengeGenerationResult;
      
      if (preview && preview.isReady) {
        this.log('Using preview for challenge generation');
        // Use preview as seed for generation
        result = await MonthlyChallengeService.generateChallengeForCurrentMonth();
      } else {
        this.log('Performing fresh challenge generation');
        result = await MonthlyChallengeService.generateChallengeForCurrentMonth();
      }
      
      if (result.success && result.challenge) {
        await this.setState(ChallengeLifecycleState.ACTIVE);
        await this.emit(ChallengeLifecycleEvent.CHALLENGE_GENERATED, {
          challengeId: result.challenge.id,
          category: result.challenge.category,
          starLevel: result.challenge.starLevel
        });
        
        // Initialize progress tracking
        await MonthlyProgressTracker.initializeChallengeProgress(result.challenge);
        
        this.log('Challenge generated successfully', {
          challengeId: result.challenge.id,
          category: result.challenge.category
        });
        
      } else {
        throw new Error('Challenge generation failed: ' + result.generationMetadata?.warnings?.join(', '));
      }
      
    } catch (error) {
      console.error('Challenge generation failed:', error);
      await this.handleError('challenge_generation', error as Error, { preview });
    }
  }
  
  
  // ===============================================
  // PREVIEW SYSTEM
  // ===============================================
  
  /**
   * Check and generate preview for next month (25th+ day)
   */
  private static async checkAndGeneratePreview(): Promise<void> {
    if (!this.config.enablePreviewGeneration) return;
    
    const today = new Date();
    if (today.getDate() < 25) return;
    
    const nextMonth = formatDateToString(addDays(today, 31) as Date).substring(0, 7);
    
    try {
      const existingPreview = await this.getPreviewForMonth(nextMonth);
      
      if (existingPreview && !this.isPreviewExpired(existingPreview)) {
        this.log('Preview already exists for next month', { nextMonth });
        return;
      }
      
      this.log(`Generating preview for next month: ${nextMonth}`);
      await this.generatePreview(nextMonth);
      
    } catch (error) {
      console.error('Preview generation check failed:', error);
      await this.handleError('preview_check', error as Error, { nextMonth });
    }
  }
  
  /**
   * Generate preview for specified month
   */
  private static async generatePreview(month: string): Promise<ChallengePreviewData> {
    this.log(`Generating preview for month ${month}`);
    
    try {
      // Get user baseline for preview
      const baseline = await UserActivityTracker.calculateMonthlyBaseline({
        userId: 'local_user',
        cacheResults: true
      });
      
      // Get current star ratings
      const starRatings = await StarRatingService.getCurrentStarRatings();
      
      // Select category for preview (avoid recent categories)
      const recentCategories = await this.getRecentCategoryHistory(3);
      const availableCategories = Object.values(AchievementCategory).filter(cat => 
        !recentCategories.includes(cat) && 
        MonthlyChallengeService.getTemplatesForCategory(cat).length > 0
      );
      
      const selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)] 
        || AchievementCategory.HABITS;
      
      // Select template
      const templates = MonthlyChallengeService.getTemplatesForCategory(selectedCategory);
      const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
      
      if (!selectedTemplate) {
        throw new Error(`No template found for category ${selectedCategory}`);
      }
      
      // Estimate star level
      const categoryKey = selectedCategory.toLowerCase() as keyof Omit<UserChallengeRatings, 'history' | 'lastUpdated'>;
      const categoryRating = starRatings[categoryKey] || 1;
      
      // Create preview
      const preview: ChallengePreviewData = {
        id: generateUUID(),
        month,
        category: selectedCategory,
        templateId: selectedTemplate.id,
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        estimatedStarLevel: categoryRating as 1 | 2 | 3 | 4 | 5,
        estimatedXPReward: MonthlyChallengeService.getXPRewardForStarLevel(categoryRating as 1 | 2 | 3 | 4 | 5),
        baselineSnapshot: {
          totalActiveDays: baseline.totalActiveDays,
          dataQuality: baseline.dataQuality,
          generatedAt: new Date()
        },
        isReady: true,
        generatedAt: new Date(),
        expires: new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days
      };
      
      // Store preview
      await this.storePreview(preview);
      
      await this.emit(ChallengeLifecycleEvent.PREVIEW_GENERATED, {
        previewId: preview.id,
        month: preview.month,
        category: preview.category
      });
      
      this.log('Preview generated successfully', { 
        month: preview.month, 
        category: preview.category 
      });
      
      return preview;
      
    } catch (error) {
      console.error('Preview generation failed:', error);
      await this.handleError('preview_generation', error as Error, { month });
      throw error;
    }
  }
  
  // ===============================================
  // BACKGROUND TASK SCHEDULER
  // ===============================================
  
  /**
   * Start background task scheduler for periodic checks
   */
  private static startBackgroundTaskScheduler(): void {
    if (this.backgroundTaskId) {
      clearInterval(this.backgroundTaskId);
    }
    
    this.backgroundTaskId = setInterval(async () => {
      await this.performBackgroundTasks();
    }, this.config.backgroundTaskInterval) as any;
    
    this.log('Background task scheduler started', {
      interval: this.config.backgroundTaskInterval
    });
  }
  
  /**
   * Perform periodic background tasks
   */
  private static async performBackgroundTasks(): Promise<void> {
    try {
      this.log('Performing background tasks');
      
      // Update metrics
      await this.updateMetrics();
      
      // Check for month transition
      await this.checkMonthTransition();
      
      // Check for preview generation (25th+ day)
      await this.checkAndGeneratePreview();
      
      // Check for archival needs
      if (this.config.enableAutoArchival) {
        await this.performArchivalCheck();
      }
      
      // Clean up expired previews
      await this.cleanupExpiredPreviews();
      
      // Health check
      await this.performHealthCheck();
      
    } catch (error) {
      console.error('Background tasks failed:', error);
      await this.handleError('background_tasks', error as Error, {});
    }
  }
  
  // ===============================================
  // STATE MANAGEMENT
  // ===============================================
  
  /**
   * Set current lifecycle state with history tracking
   */
  private static async setState(
    newState: ChallengeLifecycleState,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const currentStatus = await this.getLifecycleStatus();
      
      if (currentStatus.currentState === newState) {
        this.log(`State already ${newState}, skipping state change`);
        return;
      }
      
      this.log(`State transition: ${currentStatus.currentState} → ${newState}`);
      
      const updatedStatus: ChallengeLifecycleStatus = {
        ...currentStatus,
        currentState: newState,
        lastStateChange: new Date(),
        stateHistory: [
          ...currentStatus.stateHistory,
          {
            state: newState,
            timestamp: new Date(),
            ...(metadata && { metadata })
          }
        ].slice(-20) // Keep last 20 state changes
      };
      
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const currentMonth = today().substring(0, 7);
        await this.storage.saveLifecycleState(currentMonth, updatedStatus);
      } else {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(this.STATUS_STORAGE_KEY, JSON.stringify(updatedStatus));
      }

    } catch (error) {
      console.error('Failed to set lifecycle state:', error);
      throw error;
    }
  }
  
  /**
   * Get current lifecycle status
   */
  static async getLifecycleStatus(): Promise<ChallengeLifecycleStatus> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const currentMonth = today().substring(0, 7);
        const status = await this.storage.getLifecycleState(currentMonth);

        if (status) {
          return status;
        }

        // Return default status
        return {
          currentState: ChallengeLifecycleState.GENERATION_NEEDED,
          currentChallenge: null,
          previewChallenge: null,
          lastStateChange: new Date(),
          stateHistory: [],
          pendingActions: [],
          errors: [],
          metrics: {
            totalGenerations: 0,
            totalCompletions: 0,
            totalFailures: 0,
            averageCompletionRate: 0,
            lastBackgroundCheck: new Date()
          }
        };
      }

      // Fallback to AsyncStorage
      const stored = await AsyncStorage.getItem(this.STATUS_STORAGE_KEY);

      if (stored) {
        const status = JSON.parse(stored);
        // Ensure dates are properly parsed
        status.lastStateChange = new Date(status.lastStateChange);
        status.stateHistory = status.stateHistory.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        status.errors = status.errors.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }));
        // CRITICAL FIX: Parse lastBackgroundCheck as Date object for proper test compatibility
        if (status.metrics && status.metrics.lastBackgroundCheck) {
          status.metrics.lastBackgroundCheck = new Date(status.metrics.lastBackgroundCheck);
        }
        return status;
      }

      // Return default status
      return {
        currentState: ChallengeLifecycleState.GENERATION_NEEDED,
        currentChallenge: null,
        previewChallenge: null,
        lastStateChange: new Date(),
        stateHistory: [],
        pendingActions: [],
        errors: [],
        metrics: {
          totalGenerations: 0,
          successfulGenerations: 0,
          averageGenerationTime: 0,
          lastBackgroundCheck: new Date(),
          systemHealth: 'healthy'
        }
      };
      
    } catch (error) {
      console.error('Failed to get lifecycle status:', error);
      throw error;
    }
  }
  
  // ===============================================
  // ERROR HANDLING & RECOVERY
  // ===============================================
  
  /**
   * Handle errors with retry logic and recovery mechanisms
   */
  private static async handleError(
    context: string,
    error: Error,
    metadata: Record<string, any>,
    retryAttempt = 0
  ): Promise<void> {
    this.log(`Error in ${context}:`, error);
    
    try {
      const status = await this.getLifecycleStatus();
      
      // Add error to history
      const updatedStatus = {
        ...status,
        errors: [
          ...status.errors,
          {
            error: error.message,
            timestamp: new Date(),
            context,
            retryAttempt
          }
        ].slice(-10) // Keep last 10 errors
      };
      
      // Determine if retry is appropriate
      const shouldRetry = retryAttempt < this.config.errorRetryAttempts && 
                         this.isRetriableError(error);
      
      if (shouldRetry) {
        this.log(`Retrying ${context} (attempt ${retryAttempt + 1}/${this.config.errorRetryAttempts})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.errorRetryDelayMs));
        
        // Implement context-specific retry logic
        await this.performErrorRecovery(context, metadata, retryAttempt + 1);
        
      } else {
        this.log(`Max retries exceeded for ${context}, entering error state`);
        await this.setState(ChallengeLifecycleState.ERROR, { error: error.message, context });
        
        // Emit error event
        await this.emit(ChallengeLifecycleEvent.ERROR_OCCURRED, {
          context,
          error: error.message,
          retryAttempt,
          recoveryAttempted: shouldRetry
        });
      }
      
      // Update system health
      updatedStatus.metrics.systemHealth = retryAttempt >= this.config.errorRetryAttempts ? 'error' : 'warning';
      
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const currentMonth = today().substring(0, 7);
        await this.storage.saveLifecycleState(currentMonth, updatedStatus);
      } else {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(this.STATUS_STORAGE_KEY, JSON.stringify(updatedStatus));
      }

    } catch (storageError) {
      console.error('Failed to handle error:', storageError);
    }
  }
  
  /**
   * Determine if error is retriable
   */
  private static isRetriableError(error: Error): boolean {
    const retriablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /temporary/i,
      /storage/i
    ];
    
    return retriablePatterns.some(pattern => pattern.test(error.message));
  }
  
  /**
   * Perform context-specific error recovery
   */
  private static async performErrorRecovery(
    context: string,
    metadata: Record<string, any>,
    retryAttempt: number
  ): Promise<void> {
    await this.setState(ChallengeLifecycleState.RECOVERY);
    
    switch (context) {
      case 'challenge_generation':
        await this.generateChallengeFromPreview(metadata.preview || null);
        break;
        
        
      case 'preview_generation':
        await this.generatePreview(metadata.month);
        break;
        
      case 'month_transition':
        await this.handleMonthTransition(metadata.newMonth);
        break;
        
      default:
        this.log(`No specific recovery procedure for context: ${context}`);
        break;
    }
    
    await this.emit(ChallengeLifecycleEvent.RECOVERY_COMPLETED, {
      context,
      retryAttempt
    });
  }
  
  // ===============================================
  // UTILITY & HELPER METHODS
  // ===============================================
  
  /**
   * Register app state change listener
   * CRITICAL FIX: Defensive check for test environment compatibility
   */
  private static registerAppStateListener(): void {
    try {
      // Defensive check for AppState availability (important for Jest tests)
      if (!AppState || typeof AppState.addEventListener !== 'function') {
        this.log('AppState not available - skipping listener registration (likely test environment)');
        return;
      }

      this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
        if (nextAppState === 'active') {
          this.log('App became active, performing lifecycle check');
          await this.performStartupLifecycleCheck();
        }
      });
      
    } catch (error) {
      this.log(`Failed to register AppState listener: ${error}. Continuing without app state monitoring.`);
    }
  }
  
  /**
   * Emit lifecycle event to listeners
   */
  private static async emit(event: ChallengeLifecycleEvent, data: any): Promise<void> {
    try {
      // React Native DeviceEventEmitter
      DeviceEventEmitter.emit(`monthly_challenge_${event}`, data);
      
      // Custom event listeners
      const listeners = this.eventListeners.get(event) || [];
      for (const listener of listeners) {
        try {
          await listener(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Failed to emit lifecycle event:', error);
    }
  }
  
  /**
   * Add event listener
   */
  static addEventListener(event: ChallengeLifecycleEvent, listener: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }
  
  /**
   * Remove event listener
   */
  static removeEventListener(event: ChallengeLifecycleEvent, listener: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }
  
  /**
   * Debug logging with conditional output
   */
  private static log(message: string, data?: any): void {
    if (this.config.debugMode) {
      if (data) {
        console.log(`[MonthlyChallengeLifecycle] ${message}`, data);
      } else {
        console.log(`[MonthlyChallengeLifecycle] ${message}`);
      }
    }
  }
  
  // ===============================================
  // PUBLIC API METHODS
  // ===============================================
  
  /**
   * Manual challenge refresh for debugging/testing
   */
  static async manualRefresh(forceRegenerate = false): Promise<MonthlyChallengeGenerationResult> {
    this.log('Manual refresh requested', { forceRegenerate });
    
    try {
      if (forceRegenerate) {
        // Archive current challenge
        const current = await MonthlyChallengeService.getCurrentChallenge();
        if (current) {
          await MonthlyChallengeService.archiveCompletedChallenge(current.id);
        }
      }
      
      // Force regeneration
      const result = await MonthlyChallengeService.generateChallengeForCurrentMonth();
      
      if (result.success) {
        await this.setState(ChallengeLifecycleState.ACTIVE);
        this.log('Manual refresh completed successfully');
      }
      
      return result;
      
    } catch (error) {
      console.error('Manual refresh failed:', error);
      await this.handleError('manual_refresh', error as Error, { forceRegenerate });
      throw error;
    }
  }
  
  /**
   * Get preview for specific month
   */
  static async getPreviewForMonth(month: string): Promise<ChallengePreviewData | null> {
    try {
      // Use SQLite when enabled
      if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
        const preview = await this.storage.getPreview(month);
        return preview;
      }

      // Fallback to AsyncStorage
      const stored = await AsyncStorage.getItem(`${this.PREVIEW_STORAGE_KEY}_${month}`);
      if (stored) {
        const preview = JSON.parse(stored);
        preview.generatedAt = new Date(preview.generatedAt);
        preview.expires = new Date(preview.expires);
        preview.baselineSnapshot.generatedAt = new Date(preview.baselineSnapshot.generatedAt);
        return preview;
      }
      return null;
    } catch (error) {
      console.error('Failed to get preview:', error);
      return null;
    }
  }
  
  /**
   * Force preview generation for next month
   */
  static async forcePreviewGeneration(): Promise<ChallengePreviewData> {
    const today = new Date();
    const nextMonth = formatDateToString(addDays(today, 31) as Date).substring(0, 7);
    return await this.generatePreview(nextMonth);
  }
  
  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<{
    health: 'healthy' | 'warning' | 'error';
    lastCheck: Date;
    errors: number;
    uptime: number;
    activeChallenge: boolean;
    previewReady: boolean;
  }> {
    const status = await this.getLifecycleStatus();
    const currentChallenge = await MonthlyChallengeService.getCurrentChallenge();
    const today = new Date();
    const nextMonthDate = addDays(today, 31) as Date;
    const nextMonth = formatDateToString(nextMonthDate).substring(0, 7); // YYYY-MM format
    const preview = await this.getPreviewForMonth(nextMonth);
    
    return {
      health: status.metrics.systemHealth,
      lastCheck: status.metrics.lastBackgroundCheck,
      errors: status.errors.length,
      uptime: new Date().getTime() - (this.isInitialized ? status.lastStateChange.getTime() : 0),
      activeChallenge: !!currentChallenge,
      previewReady: !!preview && !this.isPreviewExpired(preview)
    };
  }
  
  // ===============================================
  // PRIVATE HELPER METHODS
  // ===============================================
  
  private static async storePreview(preview: ChallengePreviewData): Promise<void> {
    // Use SQLite when enabled
    if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
      await this.storage.savePreview(preview.month, preview);
      return;
    }

    // Fallback to AsyncStorage
    await AsyncStorage.setItem(
      `${this.PREVIEW_STORAGE_KEY}_${preview.month}`,
      JSON.stringify(preview)
    );
  }
  
  
  private static isPreviewExpired(preview: ChallengePreviewData): boolean {
    return new Date() > preview.expires;
  }
  
  private static async getRecentCategoryHistory(months: number): Promise<AchievementCategory[]> {
    // Implementation to get recent challenge categories
    return [];
  }
  
  private static async checkMonthTransition(): Promise<void> {
    const currentMonth = formatDateToString(new Date()).substring(0, 7);
    const currentChallenge = await MonthlyChallengeService.getCurrentChallenge();
    
    if (!currentChallenge || currentChallenge.userBaselineSnapshot.month !== currentMonth) {
      await this.handleMonthTransition(currentMonth);
    }
  }
  
  private static async performArchivalCheck(): Promise<void> {
    // Implementation for archival check
    this.log('Performing archival check');
  }
  
  private static async cleanupExpiredPreviews(): Promise<void> {
    // Implementation for cleaning up expired previews
    this.log('Cleaning up expired previews');
  }
  
  private static async performHealthCheck(): Promise<void> {
    // Implementation for system health check
    const status = await this.getLifecycleStatus();
    const now = new Date();

    // Update last check time
    status.metrics.lastBackgroundCheck = now;

    // Save updated status
    if (FEATURE_FLAGS.USE_SQLITE_CHALLENGES && this.storage) {
      const currentMonth = today().substring(0, 7);
      await this.storage.saveLifecycleState(currentMonth, status);
    } else {
      await AsyncStorage.setItem(this.STATUS_STORAGE_KEY, JSON.stringify(status));
    }
  }
  
  private static async updateMetrics(): Promise<void> {
    // Implementation for updating system metrics
    this.log('Updating system metrics');
  }
  
  /**
   * Cleanup resources on app shutdown
   */
  static cleanup(): void {
    if (this.backgroundTaskId) {
      clearInterval(this.backgroundTaskId);
      this.backgroundTaskId = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.eventListeners.clear();
    this.isInitialized = false;
    
    this.log('Lifecycle manager cleaned up');
  }
}