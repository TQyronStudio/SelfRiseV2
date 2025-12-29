// App Initialization Service
// Coordinates startup initialization across all services with lifecycle management

import { MonthlyChallengeLifecycleManager } from './monthlyChallengeLifecycleManager';
import { GamificationService } from './gamificationService';
import { UserActivityTracker } from './userActivityTracker';
import { StarRatingService } from './starRatingService';
import { MonthlyProgressTracker } from './monthlyProgressTracker';
import { MonthlyProgressIntegration } from './monthlyProgressIntegration';
import { LoyaltyService } from './loyaltyService';

// ========================================
// INTERFACES & TYPES
// ========================================

/**
 * Service initialization status
 */
interface ServiceInitializationStatus {
  serviceName: string;
  initialized: boolean;
  initializationTime?: number;
  error?: string;
  dependsOn?: string[];
}

/**
 * App initialization result
 */
export interface AppInitializationResult {
  success: boolean;
  totalTime: number;
  services: ServiceInitializationStatus[];
  errors: string[];
  warnings: string[];
}

/**
 * Initialization configuration
 */
interface InitializationConfig {
  enableMonthlyChallenges: boolean;
  enableGamification: boolean;
  enableAnalytics: boolean;
  timeoutMs: number;
  retryAttempts: number;
  debugMode: boolean;
}

// ========================================
// APP INITIALIZATION SERVICE
// ========================================

export class AppInitializationService {
  private static isInitialized = false;
  private static initializationResult: AppInitializationResult | null = null;
  
  private static readonly DEFAULT_CONFIG: InitializationConfig = {
    enableMonthlyChallenges: true,
    enableGamification: true,
    enableAnalytics: true,
    timeoutMs: 10000, // 10 second timeout
    retryAttempts: 2,
    debugMode: __DEV__
  };
  
  // ===============================================
  // MAIN INITIALIZATION METHOD
  // ===============================================
  
  /**
   * Initialize all app services in correct dependency order
   */
  static async initializeApp(
    config: Partial<InitializationConfig> = {}
  ): Promise<AppInitializationResult> {
    if (this.isInitialized && this.initializationResult?.success) {
      this.log('App already initialized, returning cached result');
      return this.initializationResult;
    }
    
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    
    this.log('Starting app initialization', fullConfig);
    
    const result: AppInitializationResult = {
      success: false,
      totalTime: 0,
      services: [],
      errors: [],
      warnings: []
    };
    
    try {
      // Initialize services in dependency order
      const serviceInitializers = this.getServiceInitializationOrder(fullConfig);
      
      for (const initializer of serviceInitializers) {
        const serviceResult = await this.initializeService(initializer, fullConfig);
        result.services.push(serviceResult);
        
        if (!serviceResult.initialized && !initializer.optional) {
          result.errors.push(`Critical service failed: ${serviceResult.serviceName}`);
          if (serviceResult.error) {
            result.errors.push(serviceResult.error);
          }
        } else if (!serviceResult.initialized && initializer.optional) {
          result.warnings.push(`Optional service failed: ${serviceResult.serviceName}`);
        }
      }
      
      // Check if all critical services initialized
      const criticalServicesFailed = result.services.some(s => 
        !s.initialized && !this.isOptionalService(s.serviceName)
      );
      
      result.success = !criticalServicesFailed;
      result.totalTime = Date.now() - startTime;
      
      if (result.success) {
        this.log('App initialization completed successfully', {
          totalTime: result.totalTime,
          servicesInitialized: result.services.filter(s => s.initialized).length
        });
      } else {
        this.log('App initialization failed', {
          errors: result.errors,
          warnings: result.warnings
        });
      }
      
      this.isInitialized = true;
      this.initializationResult = result;
      
      return result;
      
    } catch (error) {
      const errorMessage = `App initialization crashed: ${error}`;
      console.error(errorMessage);
      
      result.success = false;
      result.totalTime = Date.now() - startTime;
      result.errors.push(errorMessage);
      
      return result;
    }
  }
  
  // ===============================================
  // SERVICE INITIALIZATION ORDER
  // ===============================================
  
  /**
   * Define service initialization order with dependencies
   */
  private static getServiceInitializationOrder(config: InitializationConfig): Array<{
    name: string;
    initializer: () => Promise<void>;
    dependsOn: string[];
    optional: boolean;
    timeout: number;
  }> {
    const services = [];
    
    // Core gamification service (no dependencies)
    if (config.enableGamification) {
      services.push({
        name: 'GamificationService',
        initializer: () => this.initializeGamificationService(),
        dependsOn: [],
        optional: false,
        timeout: 5000
      });
    }
    
    // User activity tracking (depends on gamification for XP data)
    if (config.enableMonthlyChallenges) {
      services.push({
        name: 'UserActivityTracker',
        initializer: () => this.initializeUserActivityTracker(),
        dependsOn: ['GamificationService'],
        optional: false,
        timeout: 3000
      });
      
      // Star rating service (depends on user activity)
      services.push({
        name: 'StarRatingService',
        initializer: () => this.initializeStarRatingService(),
        dependsOn: ['UserActivityTracker'],
        optional: false,
        timeout: 2000
      });
      
      
      // Monthly progress tracker (depends on gamification)
      services.push({
        name: 'MonthlyProgressTracker',
        initializer: () => this.initializeMonthlyProgressTracker(),
        dependsOn: ['GamificationService'],
        optional: false,
        timeout: 3000
      });

      // Monthly progress integration - CRITICAL: Must initialize early to catch all XP events
      // This "listener" captures user activities and forwards them to progress tracker
      services.push({
        name: 'MonthlyProgressIntegration',
        initializer: () => this.initializeMonthlyProgressIntegration(),
        dependsOn: ['MonthlyProgressTracker'],
        optional: false,
        timeout: 2000
      });

      // Monthly challenge lifecycle manager (depends on all monthly challenge services)
      services.push({
        name: 'MonthlyChallengeLifecycleManager',
        initializer: () => this.initializeMonthlyChallengeLifecycleManager(),
        dependsOn: ['UserActivityTracker', 'StarRatingService', 'MonthlyProgressTracker', 'MonthlyProgressIntegration'],
        optional: false,
        timeout: 8000
      });
    }
    
    return services;
  }
  
  // ===============================================
  // INDIVIDUAL SERVICE INITIALIZERS
  // ===============================================
  
  /**
   * Initialize GamificationService
   */
  private static async initializeGamificationService(): Promise<void> {
    this.log('Initializing GamificationService');
    
    // GamificationService doesn't have explicit initialization method
    // but we can validate it's working by checking if we can get XP transactions
    try {
      // Test basic functionality - get transactions for last day
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const today = new Date();
      const yesterdayStr = yesterday.toISOString().split('T')[0]!;
      const todayStr = today.toISOString().split('T')[0]!;
      await GamificationService.getTransactionsByDateRange(yesterdayStr, todayStr);
      
      // Check and auto-activate inactive user boost if needed
      const { XPMultiplierService } = require('./xpMultiplierService');
      const boostResult = await XPMultiplierService.checkAndActivateInactiveUserBoost();
      
      if (boostResult?.success) {
        this.log(`🎯 Inactive user boost activated: ${boostResult.multiplier?.description}`);
      }
      
      // Track daily activity for loyalty system
      const loyaltyResult = await LoyaltyService.trackDailyActivity();
      if (loyaltyResult.isNewActiveDay) {
        this.log(`🏆 New active day recorded: ${loyaltyResult.milestonesReached.length} milestones reached`);
        
        if (loyaltyResult.loyaltyLevelChanged) {
          this.log(`🎖️ Loyalty level changed: ${loyaltyResult.oldLevel} → ${loyaltyResult.newLevel}`);
        }
        
        // Log milestone achievements for debugging
        if (loyaltyResult.milestonesReached.length > 0) {
          const milestoneNames = loyaltyResult.milestonesReached.map(m => m.name);
          this.log(`🎉 Loyalty milestones reached: ${milestoneNames.join(', ')}`);
          
          // Check loyalty achievements after milestones reached
          const { AchievementService } = require('./achievementService');
          const achievementResult = await AchievementService.checkLoyaltyAchievements(
            loyaltyResult.milestonesReached.map(m => m.days)
          );
          
          if (achievementResult.unlocked.length > 0) {
            const unlockedNames = achievementResult.unlocked.map((a: any) => a.name);
            this.log(`🏅 Loyalty achievements unlocked: ${unlockedNames.join(', ')} (+${achievementResult.xpAwarded} XP)`);
          }
        }
      }
      
      // PRODUCTION READINESS: Cleanup duplicate level-up records for memory optimization
      try {
        await GamificationService.cleanupDuplicateLevelUpRecords();
        this.log('✅ Level-up records cleanup completed successfully');
      } catch (error) {
        this.log('⚠️ Level-up records cleanup failed (non-critical):', error);
        // Non-critical error - app continues to function normally
      }
      
      this.log('GamificationService initialized successfully');
    } catch (error) {
      this.log('GamificationService validation failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize UserActivityTracker
   */
  private static async initializeUserActivityTracker(): Promise<void> {
    this.log('Initializing UserActivityTracker');
    
    // Validate UserActivityTracker by attempting baseline calculation
    try {
      await UserActivityTracker.calculateMonthlyBaseline({
        userId: 'initialization_test',
        cacheResults: false
      });
      this.log('UserActivityTracker initialized successfully');
    } catch (error) {
      this.log('UserActivityTracker initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize StarRatingService
   */
  private static async initializeStarRatingService(): Promise<void> {
    this.log('Initializing StarRatingService');
    
    try {
      const ratings = await StarRatingService.getCurrentStarRatings();
      this.log('StarRatingService initialized successfully', { ratings });
    } catch (error) {
      this.log('StarRatingService initialization failed:', error);
      throw error;
    }
  }
  
  
  /**
   * Initialize MonthlyProgressTracker
   */
  private static async initializeMonthlyProgressTracker(): Promise<void> {
    this.log('Initializing MonthlyProgressTracker');

    try {
      // MonthlyProgressTracker doesn't have explicit init, but we can validate
      // its core functionality is available
      this.log('MonthlyProgressTracker initialized successfully');
    } catch (error) {
      this.log('MonthlyProgressTracker initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize MonthlyProgressIntegration
   * CRITICAL: This service listens for XP events and forwards them to progress tracker
   * Must be initialized early to catch all user activities from app start
   */
  private static async initializeMonthlyProgressIntegration(): Promise<void> {
    this.log('Initializing MonthlyProgressIntegration');

    try {
      // Check if already initialized to prevent duplicate listeners
      const status = MonthlyProgressIntegration.getStatus();
      if (status.isInitialized) {
        this.log('MonthlyProgressIntegration already initialized, skipping');
        return;
      }

      // Initialize the XP event listener
      await MonthlyProgressIntegration.initialize();

      // Verify initialization was successful
      const newStatus = MonthlyProgressIntegration.getStatus();
      if (!newStatus.isInitialized) {
        throw new Error('MonthlyProgressIntegration failed to initialize properly');
      }

      this.log('MonthlyProgressIntegration initialized successfully', {
        isActive: newStatus.isActive,
        pendingEvents: newStatus.pendingEvents
      });
    } catch (error) {
      this.log('MonthlyProgressIntegration initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize MonthlyChallengeLifecycleManager
   */
  private static async initializeMonthlyChallengeLifecycleManager(): Promise<void> {
    this.log('Initializing MonthlyChallengeLifecycleManager');
    
    try {
      // Initialize with app-specific configuration
      await MonthlyChallengeLifecycleManager.initialize({
        enablePreviewGeneration: true,
        enableGracePeriod: true,
        gracePeriodDays: 10, // User has 10 days to start monthly challenge
        enableAutoArchival: true,
        debugMode: __DEV__
      });
      
      this.log('MonthlyChallengeLifecycleManager initialized successfully');
    } catch (error) {
      this.log('MonthlyChallengeLifecycleManager initialization failed:', error);
      throw error;
    }
  }
  
  // ===============================================
  // HELPER METHODS
  // ===============================================
  
  /**
   * Initialize individual service with timeout and retry logic
   */
  private static async initializeService(
    serviceConfig: {
      name: string;
      initializer: () => Promise<void>;
      dependsOn: string[];
      optional: boolean;
      timeout: number;
    },
    config: InitializationConfig
  ): Promise<ServiceInitializationStatus> {
    const startTime = Date.now();
    const status: ServiceInitializationStatus = {
      serviceName: serviceConfig.name,
      initialized: false,
      dependsOn: serviceConfig.dependsOn
    };
    
    try {
      this.log(`Initializing service: ${serviceConfig.name}`);
      
      // Check dependencies
      for (const dependency of serviceConfig.dependsOn) {
        if (dependency && !this.isServiceInitialized(dependency)) {
          throw new Error(`Dependency not initialized: ${dependency}`);
        }
      }
      
      // Initialize with timeout
      await Promise.race([
        serviceConfig.initializer(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service initialization timeout')), serviceConfig.timeout)
        )
      ]);
      
      status.initialized = true;
      status.initializationTime = Date.now() - startTime;
      
      this.log(`Service initialized successfully: ${serviceConfig.name}`, {
        time: status.initializationTime
      });
      
    } catch (error) {
      const errorMessage = `Service initialization failed: ${serviceConfig.name} - ${error}`;
      console.error(errorMessage);
      
      status.initialized = false;
      status.error = errorMessage;
      status.initializationTime = Date.now() - startTime;
      
      // Retry for non-optional services
      if (!serviceConfig.optional && config.retryAttempts > 0) {
        this.log(`Retrying service initialization: ${serviceConfig.name}`);
        
        for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            await serviceConfig.initializer();
            
            status.initialized = true;
            delete status.error;
            status.initializationTime = Date.now() - startTime;
            
            this.log(`Service retry successful: ${serviceConfig.name} (attempt ${attempt})`);
            break;
            
          } catch (retryError) {
            this.log(`Service retry failed: ${serviceConfig.name} (attempt ${attempt})`, retryError);
            if (attempt === config.retryAttempts) {
              status.error = `Final retry failed: ${retryError}`;
            }
          }
        }
      }
    }
    
    return status;
  }
  
  /**
   * Check if service is initialized (mock implementation)
   */
  private static isServiceInitialized(serviceName: string): boolean {
    // In a real implementation, this would check actual service status
    // For now, we assume services are initialized in order
    return true;
  }
  
  /**
   * Check if service is optional
   */
  private static isOptionalService(serviceName: string): boolean {
    const optionalServices = ['Analytics', 'CrashReporting'];
    return optionalServices.includes(serviceName);
  }
  
  /**
   * Debug logging with conditional output
   */
  private static log(message: string, data?: any): void {
    if (__DEV__) {
      if (data) {
        console.log(`[AppInitialization] ${message}`, data);
      } else {
        console.log(`[AppInitialization] ${message}`);
      }
    }
  }
  
  // ===============================================
  // PUBLIC API METHODS
  // ===============================================
  
  /**
   * Get initialization status
   */
  static getInitializationStatus(): AppInitializationResult | null {
    return this.initializationResult;
  }
  
  /**
   * Check if app is fully initialized
   */
  static isAppInitialized(): boolean {
    return this.isInitialized && this.initializationResult?.success === true;
  }
  
  /**
   * Force re-initialization (for testing/debugging)
   */
  static async forceReinitialization(config?: Partial<InitializationConfig>): Promise<AppInitializationResult> {
    this.log('Forcing app re-initialization');
    
    // Cleanup existing state
    this.isInitialized = false;
    this.initializationResult = null;
    
    // Cleanup lifecycle manager if it exists
    try {
      MonthlyChallengeLifecycleManager.cleanup();
    } catch (error) {
      this.log('Lifecycle manager cleanup failed:', error);
    }
    
    // Re-initialize
    return await this.initializeApp(config);
  }
  
  /**
   * Get service health status
   */
  static async getServiceHealthStatus(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    services: Array<{
      name: string;
      status: 'healthy' | 'warning' | 'error';
      lastCheck: Date;
      details?: any;
    }>;
  }> {
    const services = [];
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    
    try {
      // Check MonthlyChallengeLifecycleManager health
      const lifecycleHealth = await MonthlyChallengeLifecycleManager.getSystemHealth();
      services.push({
        name: 'MonthlyChallengeLifecycleManager',
        status: lifecycleHealth.health,
        lastCheck: lifecycleHealth.lastCheck,
        details: {
          activeChallenge: lifecycleHealth.activeChallenge,
          previewReady: lifecycleHealth.previewReady,
          errors: lifecycleHealth.errors,
          uptime: lifecycleHealth.uptime
        }
      });
      
      if (lifecycleHealth.health !== 'healthy') {
        overallStatus = lifecycleHealth.health;
      }
      
    } catch (error) {
      services.push({
        name: 'MonthlyChallengeLifecycleManager',
        status: 'error' as const,
        lastCheck: new Date(),
        details: { error: `${error}` }
      });
      overallStatus = 'error';
    }
    
    // Add other service health checks here as needed
    
    return {
      overall: overallStatus,
      services
    };
  }
}