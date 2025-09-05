// Monthly Progress Integration Adapter
// Seamless integration between XP event system and monthly progress tracking
// with performance optimization and error resilience

import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { MonthlyProgressTracker } from './monthlyProgressTracker';
import { XPSourceType } from '../types/gamification';

// ========================================
// INTERFACES & TYPES
// ========================================

/**
 * XP event data structure from GamificationService
 */
interface XPGainedEvent {
  amount: number;
  source: XPSourceType;
  sourceId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

/**
 * Batched XP event for performance optimization (matches GamificationService format)
 */
interface BatchedXPEvent {
  totalAmount: number;
  sources: Array<{
    source: XPSourceType;
    amount: number;
    count: number;
  }>;
  leveledUp: boolean;
  newLevel: number;
  timestamp: number;
}

/**
 * Integration configuration
 */
interface IntegrationConfig {
  enableMonthlyTracking: boolean;
  enableBatching: boolean;
  batchingWindowMs: number;
  maxBatchSize: number;
  enableDebugLogging: boolean;
}

// ========================================
// MONTHLY PROGRESS INTEGRATION SERVICE
// ========================================

export class MonthlyProgressIntegration {
  // Event subscriptions
  private static xpGainedSubscription: EmitterSubscription | null = null;
  private static batchCommittedSubscription: EmitterSubscription | null = null;
  private static levelUpSubscription: EmitterSubscription | null = null;

  // Performance optimization
  private static batchingTimer: number | null = null;
  private static pendingEvents: XPGainedEvent[] = [];
  
  // Configuration
  private static config: IntegrationConfig = {
    enableMonthlyTracking: true,
    enableBatching: true,
    batchingWindowMs: 250, // 250ms batching window for performance
    maxBatchSize: 50,      // Max 50 events per batch
    enableDebugLogging: true // ENABLE DEBUG LOGGING for troubleshooting
  };

  // Integration state
  private static isInitialized = false;
  private static isEnabled = true;

  // ========================================
  // INITIALIZATION & LIFECYCLE
  // ========================================

  /**
   * Initialize the monthly progress integration system
   */
  public static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.warn('MonthlyProgressIntegration already initialized');
        return;
      }

      console.log('🔗 Initializing Monthly Progress Integration...');

      // Subscribe to XP events from GamificationService
      this.setupEventListeners();

      // Mark as initialized
      this.isInitialized = true;

      console.log('✅ Monthly Progress Integration initialized successfully');
    } catch (error) {
      console.error('MonthlyProgressIntegration.initialize error:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for XP tracking
   */
  private static setupEventListeners(): void {
    try {
      // Listen for individual XP gains
      this.xpGainedSubscription = DeviceEventEmitter.addListener(
        'xpGained',
        (event: XPGainedEvent) => this.handleXPGainedEvent(event)
      );

      // Listen for batched XP commits (for performance optimization)
      this.batchCommittedSubscription = DeviceEventEmitter.addListener(
        'xpBatchCommitted',
        (event: BatchedXPEvent) => this.handleBatchedXPEvent(event)
      );

      // Listen for level ups (for bonus tracking and celebrations)
      this.levelUpSubscription = DeviceEventEmitter.addListener(
        'levelUp',
        (event: any) => this.handleLevelUpEvent(event)
      );

      this.debugLog('Event listeners setup successfully');
    } catch (error) {
      console.error('MonthlyProgressIntegration.setupEventListeners error:', error);
      throw error;
    }
  }

  /**
   * Cleanup and stop the integration system
   */
  public static cleanup(): void {
    try {
      // Remove event subscriptions
      if (this.xpGainedSubscription) {
        this.xpGainedSubscription.remove();
        this.xpGainedSubscription = null;
      }

      if (this.batchCommittedSubscription) {
        this.batchCommittedSubscription.remove();
        this.batchCommittedSubscription = null;
      }

      if (this.levelUpSubscription) {
        this.levelUpSubscription.remove();
        this.levelUpSubscription = null;
      }

      // Clear any pending batches
      if (this.batchingTimer) {
        clearTimeout(this.batchingTimer);
        this.batchingTimer = null;
      }

      // Process any remaining pending events
      if (this.pendingEvents.length > 0) {
        this.processPendingEvents();
      }

      this.isInitialized = false;
      console.log('🛑 Monthly Progress Integration cleanup completed');
    } catch (error) {
      console.error('MonthlyProgressIntegration.cleanup error:', error);
    }
  }

  // ========================================
  // EVENT HANDLING
  // ========================================

  /**
   * Handle individual XP gained events
   */
  private static async handleXPGainedEvent(event: XPGainedEvent): Promise<void> {
    try {
      if (!this.isEnabled || !this.isInitialized) {
        return;
      }

      this.debugLog(`📥 Received XP event: +${event.amount} from ${event.source}`);

      // Add to pending events for batching (if enabled)
      if (this.config.enableBatching) {
        this.addToPendingBatch(event);
      } else {
        // Process immediately if batching is disabled
        await this.processXPEvent(event);
      }

    } catch (error) {
      console.error('MonthlyProgressIntegration.handleXPGainedEvent error:', error);
      // Don't throw - integration should not break main flow
    }
  }

  /**
   * Handle batched XP events (from GamificationService batching)
   */
  private static async handleBatchedXPEvent(event: BatchedXPEvent): Promise<void> {
    try {
      if (!this.isEnabled || !this.isInitialized) {
        return;
      }

      this.debugLog(`📦 Received batched XP event: ${event.totalAmount} XP from ${event.sources.length} sources`);

      // Process each source in the batch
      for (const sourceInfo of event.sources) {
        const individualEvent: XPGainedEvent = {
          amount: sourceInfo.amount,
          source: sourceInfo.source,
          timestamp: event.timestamp,
          metadata: { fromBatch: true, originalBatchSize: event.sources.length }
        };

        await this.processXPEvent(individualEvent);
      }

    } catch (error) {
      console.error('MonthlyProgressIntegration.handleBatchedXPEvent error:', error);
    }
  }

  /**
   * Handle level up events for bonus tracking
   */
  private static async handleLevelUpEvent(event: any): Promise<void> {
    try {
      if (!this.isEnabled || !this.isInitialized) {
        return;
      }

      this.debugLog(`🎉 Level up event received: Level ${event.newLevel}`);

      // Level ups can trigger bonus progress or special milestones
      // This is a placeholder for future level-based milestone integration
      
    } catch (error) {
      console.error('MonthlyProgressIntegration.handleLevelUpEvent error:', error);
    }
  }

  // ========================================
  // BATCHING & PERFORMANCE OPTIMIZATION
  // ========================================

  /**
   * Add event to pending batch for performance optimization
   */
  private static addToPendingBatch(event: XPGainedEvent): void {
    try {
      this.pendingEvents.push(event);

      // Check if batch is full
      if (this.pendingEvents.length >= this.config.maxBatchSize) {
        this.processPendingEvents();
        return;
      }

      // Set/reset batching timer
      if (this.batchingTimer) {
        clearTimeout(this.batchingTimer);
      }

      this.batchingTimer = setTimeout(() => {
        this.processPendingEvents();
      }, this.config.batchingWindowMs);

    } catch (error) {
      console.error('MonthlyProgressIntegration.addToPendingBatch error:', error);
    }
  }

  /**
   * Process all pending events in batch
   */
  private static async processPendingEvents(): Promise<void> {
    try {
      if (this.pendingEvents.length === 0) {
        return;
      }

      const eventsToProcess = [...this.pendingEvents];
      this.pendingEvents = [];

      // Clear timer
      if (this.batchingTimer) {
        clearTimeout(this.batchingTimer);
        this.batchingTimer = null;
      }

      this.debugLog(`⚡ Processing batch of ${eventsToProcess.length} XP events`);

      // Process all events
      const processingPromises = eventsToProcess.map(event => this.processXPEvent(event));
      await Promise.all(processingPromises);

      this.debugLog(`✅ Batch processing completed (${eventsToProcess.length} events)`);

    } catch (error) {
      console.error('MonthlyProgressIntegration.processPendingEvents error:', error);
    }
  }

  // ========================================
  // CORE PROCESSING LOGIC
  // ========================================

  /**
   * Process individual XP event and update progress trackers
   */
  private static async processXPEvent(event: XPGainedEvent): Promise<void> {
    try {
      const { amount, source, sourceId, metadata } = event;

      // Update monthly progress tracking (if enabled)
      if (this.config.enableMonthlyTracking) {
        await MonthlyProgressTracker.updateMonthlyProgress(
          source,
          amount,
          sourceId,
          metadata
        );
      }


      this.debugLog(`✅ Processed XP event: +${amount} from ${source}`);

    } catch (error) {
      console.error('MonthlyProgressIntegration.processXPEvent error:', error);
      // Continue processing - don't let individual failures stop the system
    }
  }

  // ========================================
  // CONFIGURATION & MANAGEMENT
  // ========================================

  /**
   * Update integration configuration
   */
  public static updateConfig(newConfig: Partial<IntegrationConfig>): void {
    try {
      this.config = { ...this.config, ...newConfig };
      this.debugLog('Configuration updated:', this.config);
    } catch (error) {
      console.error('MonthlyProgressIntegration.updateConfig error:', error);
    }
  }

  /**
   * Get current integration configuration
   */
  public static getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable integration system
   */
  public static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.debugLog(`Integration ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if integration is enabled and initialized
   */
  public static isActive(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  /**
   * Get integration status and statistics
   */
  public static getStatus(): {
    isInitialized: boolean;
    isEnabled: boolean;
    isActive: boolean;
    pendingEvents: number;
    config: IntegrationConfig;
  } {
    return {
      isInitialized: this.isInitialized,
      isEnabled: this.isEnabled,
      isActive: this.isActive(),
      pendingEvents: this.pendingEvents.length,
      config: this.getConfig()
    };
  }

  // ========================================
  // UTILITY & DEBUGGING
  // ========================================

  /**
   * Debug logging (only if enabled)
   */
  private static debugLog(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[MonthlyProgressIntegration] ${message}`, ...args);
    }
  }

  /**
   * Force process all pending events (for testing/debugging)
   */
  public static async flushPendingEvents(): Promise<void> {
    await this.processPendingEvents();
  }

  /**
   * Get detailed statistics for monitoring and debugging
   */
  public static getStatistics(): {
    totalEventsProcessed: number;
    averageProcessingTime: number;
    errorRate: number;
    lastEventTimestamp: number | null;
  } {
    // TODO: Implement statistics tracking
    return {
      totalEventsProcessed: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      lastEventTimestamp: null
    };
  }
}

// ========================================
// AUTO-INITIALIZATION (OPTIONAL)
// ========================================

/**
 * Auto-initialize when module is imported (DISABLED - using explicit init)
 */
const AUTO_INIT = false;

if (AUTO_INIT) {
  // Initialize after a small delay to ensure all services are ready
  setTimeout(() => {
    MonthlyProgressIntegration.initialize().catch(error => {
      console.error('Auto-initialization failed:', error);
    });
  }, 100);
}