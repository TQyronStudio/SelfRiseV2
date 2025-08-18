/**
 * Production Monitoring Service for Race Condition Detection
 * 
 * ✅ UPDATED: Now uses unified GamificationService (Phase 4.5.11.REDUX)
 * XP System Unification Phase 4.5.11.REDUX - Production monitoring utilities
 * 
 * CRITICAL: Real-time monitoring for production environment
 * Think Hard methodology - comprehensive production observability
 * 
 * Features:
 * - Race condition detection and alerting
 * - Performance metrics aggregation  
 * - Health status monitoring
 * - Automatic issue detection
 * - Production dashboards
 * - Critical error alerting
 */

import { AtomicStorage } from './atomicStorage';
import { GamificationService } from './gamificationService';
import { PerformanceProfiler } from '../utils/performanceProfiler';

// Production monitoring data types
interface RaceConditionAlert {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'CONCURRENT_ACCESS' | 'DATA_INCONSISTENCY' | 'LOCK_TIMEOUT' | 'OPERATION_FAILURE';
  details: {
    operation: string;
    conflictingOperations: number;
    affectedKeys: string[];
    duration: number;
    metadata: Record<string, any>;
  };
  resolved: boolean;
  resolvedAt?: Date;
}

interface ProductionHealthMetrics {
  timestamp: Date;
  
  // Atomic Storage Health
  atomicStorage: {
    totalOperations: number;
    successRate: number;
    averageDuration: number;
    activeLocksCount: number;
    queuedOperations: number;
    errorRate: number;
  };
  
  // Gamification Service Health
  gamificationService: {
    totalXPOperations: number;
    raceConditionsPrevented: number;
    concurrentOperationsActive: number;
    averageOperationTime: number;
    failedOperations: number;
  };
  
  // System Performance
  systemPerformance: {
    memoryUsage: number;
    operationsPerSecond: number;
    averageResponseTime: number;
    criticalOperationsUnder50ms: number;
    slowOperationsOver100ms: number;
  };
  
  // Health Score (0-100)
  overallHealthScore: number;
  criticalIssues: string[];
  warnings: string[];
}

interface MonitoringConfig {
  enableRealTimeMonitoring: boolean;
  raceConditionDetectionSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  performanceThresholds: {
    maxOperationTime: number;
    maxConcurrentLocks: number;
    maxFailureRate: number;
    minSuccessRate: number;
  };
  alerting: {
    enableCriticalAlerts: boolean;
    alertChannels: ('CONSOLE' | 'STORAGE' | 'REMOTE')[];
    maxAlertsPerMinute: number;
  };
}

/**
 * Production Monitoring Service
 * 
 * Monitors gamification system for race conditions and performance issues
 * Provides real-time health status and alerting
 */
export class ProductionMonitoringService {
  
  private static instance: ProductionMonitoringService;
  private static config: MonitoringConfig;
  private static isInitialized = false;
  private static monitoringTimer: ReturnType<typeof setInterval> | null = null;
  
  // Alert tracking
  private static activeAlerts = new Map<string, RaceConditionAlert>();
  private static alertHistory: RaceConditionAlert[] = [];
  private static lastAlertTime = 0;
  
  // Metrics storage
  private static healthMetricsHistory: ProductionHealthMetrics[] = [];
  private static readonly MAX_METRICS_RETENTION = 1000; // Keep last 1000 health checks
  
  // Real-time monitoring state
  private static isMonitoring = false;
  private static monitoringStartTime = 0;
  
  /**
   * Initialize production monitoring system
   */
  static async initialize(config?: Partial<MonitoringConfig>): Promise<void> {
    if (this.isInitialized) {
      console.log('⚡ Production monitoring already initialized');
      return;
    }
    
    // Set default configuration
    this.config = {
      enableRealTimeMonitoring: true,
      raceConditionDetectionSensitivity: 'MEDIUM',
      performanceThresholds: {
        maxOperationTime: 50, // 50ms
        maxConcurrentLocks: 10,
        maxFailureRate: 0.05, // 5%
        minSuccessRate: 0.95, // 95%
      },
      alerting: {
        enableCriticalAlerts: true,
        alertChannels: ['CONSOLE', 'STORAGE'],
        maxAlertsPerMinute: 10,
      },
      ...config
    };
    
    try {
      // Initialize monitoring storage
      await this.initializeMonitoringStorage();
      
      // Start real-time monitoring if enabled
      if (this.config.enableRealTimeMonitoring) {
        await this.startRealTimeMonitoring();
      }
      
      this.isInitialized = true;
      this.monitoringStartTime = Date.now();
      
      console.log('⚡ Production monitoring initialized successfully');
      console.log(`📊 Monitoring config:`, {
        realTimeMonitoring: this.config.enableRealTimeMonitoring,
        sensitivity: this.config.raceConditionDetectionSensitivity,
        thresholds: this.config.performanceThresholds
      });
      
    } catch (error) {
      console.error('❌ Production monitoring initialization failed:', error);
      throw new Error('Failed to initialize production monitoring');
    }
  }
  
  /**
   * Start real-time monitoring loop
   */
  private static async startRealTimeMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    console.log('🔄 Starting real-time production monitoring...');
    
    // Monitor every 5 seconds for production environment
    const monitoringInterval = 5000;
    
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
        await this.detectRaceConditions();
        await this.checkPerformanceThresholds();
      } catch (error) {
        console.error('⚠️ Real-time monitoring cycle failed:', error);
      }
    }, monitoringInterval);
    
    console.log(`📡 Real-time monitoring active (${monitoringInterval}ms interval)`);
  }
  
  /**
   * Stop real-time monitoring
   */
  static async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    console.log('⏹️ Production monitoring stopped');
  }
  
  /**
   * Perform comprehensive health check
   */
  static async performHealthCheck(): Promise<ProductionHealthMetrics> {
    const startTime = performance.now();
    
    try {
      // Get atomic storage health
      const atomicMetrics = AtomicStorage.getPerformanceMetrics();
      
      // Get gamification service health  
      const raceConditionStats = await GamificationService.getRaceConditionStats();
      
      // Calculate system performance metrics
      const systemMetrics = await this.getSystemPerformanceMetrics();
      
      // Calculate overall health score
      const healthScore = this.calculateHealthScore(atomicMetrics, raceConditionStats, systemMetrics);
      
      const healthMetrics: ProductionHealthMetrics = {
        timestamp: new Date(),
        
        atomicStorage: {
          totalOperations: atomicMetrics.totalOperations,
          successRate: atomicMetrics.successRate,
          averageDuration: atomicMetrics.averageDuration,
          activeLocksCount: atomicMetrics.activeLocksCount,
          queuedOperations: 0, // TODO: Implement queue tracking
          errorRate: 1 - atomicMetrics.successRate,
        },
        
        gamificationService: {
          totalXPOperations: raceConditionStats.totalOperations,
          raceConditionsPrevented: raceConditionStats.raceConditionsPrevented,
          concurrentOperationsActive: raceConditionStats.concurrentOperationDetected ? 1 : 0,
          averageOperationTime: atomicMetrics.averageDuration,
          failedOperations: atomicMetrics.errorOperations.length,
        },
        
        systemPerformance: systemMetrics,
        
        overallHealthScore: healthScore.score,
        criticalIssues: healthScore.criticalIssues,
        warnings: healthScore.warnings,
      };
      
      // Store metrics
      this.healthMetricsHistory.push(healthMetrics);
      
      // Trim history if needed
      if (this.healthMetricsHistory.length > this.MAX_METRICS_RETENTION) {
        this.healthMetricsHistory = this.healthMetricsHistory.slice(-this.MAX_METRICS_RETENTION);
      }
      
      // Check for critical issues and alert
      if (healthScore.score < 80 || healthScore.criticalIssues.length > 0) {
        await this.triggerCriticalAlert('HEALTH_DEGRADATION', {
          healthScore: healthScore.score,
          criticalIssues: healthScore.criticalIssues,
          warnings: healthScore.warnings,
        });
      }
      
      const duration = performance.now() - startTime;
      console.log(`📊 Health check completed in ${duration.toFixed(2)}ms (Score: ${healthScore.score}/100)`);
      
      return healthMetrics;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      // Return emergency health metrics
      const emergencyMetrics: ProductionHealthMetrics = {
        timestamp: new Date(),
        atomicStorage: {
          totalOperations: 0,
          successRate: 0,
          averageDuration: 0,
          activeLocksCount: 0,
          queuedOperations: 0,
          errorRate: 1,
        },
        gamificationService: {
          totalXPOperations: 0,
          raceConditionsPrevented: 0,
          concurrentOperationsActive: 0,
          averageOperationTime: 0,
          failedOperations: 0,
        },
        systemPerformance: {
          memoryUsage: 0,
          operationsPerSecond: 0,
          averageResponseTime: 0,
          criticalOperationsUnder50ms: 0,
          slowOperationsOver100ms: 0,
        },
        overallHealthScore: 0,
        criticalIssues: ['MONITORING_SYSTEM_FAILURE'],
        warnings: ['Health check system is not functioning properly'],
      };
      
      await this.triggerCriticalAlert('MONITORING_FAILURE', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      
      return emergencyMetrics;
    }
  }
  
  /**
   * Detect race conditions in real-time
   */
  private static async detectRaceConditions(): Promise<void> {
    try {
      const raceConditionCheck = AtomicStorage.detectPotentialRaceConditions();
      
      // Check for suspicious patterns
      if (raceConditionCheck.suspiciousPatterns.length > 0) {
        const severity = this.determineRaceConditionSeverity(raceConditionCheck.suspiciousPatterns);
        
        const alert: RaceConditionAlert = {
          id: `race_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          timestamp: new Date(),
          severity,
          type: 'CONCURRENT_ACCESS',
          details: {
            operation: 'ATOMIC_STORAGE_ACCESS',
            conflictingOperations: raceConditionCheck.suspiciousPatterns.length,
            affectedKeys: [], // TODO: Extract from patterns
            duration: 0,
            metadata: {
              patterns: raceConditionCheck.suspiciousPatterns,
              recommendations: raceConditionCheck.recommendations,
            },
          },
          resolved: false,
        };
        
        await this.processRaceConditionAlert(alert);
      }
      
    } catch (error) {
      console.error('⚠️ Race condition detection failed:', error);
    }
  }
  
  /**
   * Check performance thresholds and trigger alerts
   */
  private static async checkPerformanceThresholds(): Promise<void> {
    try {
      const metrics = AtomicStorage.getPerformanceMetrics();
      const thresholds = this.config.performanceThresholds;
      
      // Check average operation time
      if (metrics.averageDuration > thresholds.maxOperationTime) {
        await this.triggerCriticalAlert('PERFORMANCE_DEGRADATION', {
          metric: 'averageOperationTime',
          value: metrics.averageDuration,
          threshold: thresholds.maxOperationTime,
          severity: 'HIGH',
        });
      }
      
      // Check concurrent locks
      if (metrics.activeLocksCount > thresholds.maxConcurrentLocks) {
        await this.triggerCriticalAlert('HIGH_CONCURRENCY', {
          metric: 'activeLocks',
          value: metrics.activeLocksCount,
          threshold: thresholds.maxConcurrentLocks,
          severity: 'MEDIUM',
        });
      }
      
      // Check success rate
      if (metrics.successRate < thresholds.minSuccessRate) {
        await this.triggerCriticalAlert('LOW_SUCCESS_RATE', {
          metric: 'successRate',
          value: metrics.successRate,
          threshold: thresholds.minSuccessRate,
          severity: 'CRITICAL',
        });
      }
      
    } catch (error) {
      console.error('⚠️ Performance threshold check failed:', error);
    }
  }
  
  /**
   * Get system performance metrics
   */
  private static async getSystemPerformanceMetrics(): Promise<ProductionHealthMetrics['systemPerformance']> {
    const performanceReport = PerformanceProfiler.generateReport();
    
    return {
      memoryUsage: this.getMemoryUsage(),
      operationsPerSecond: this.calculateOperationsPerSecond(),
      averageResponseTime: performanceReport.summary.averageTime,
      criticalOperationsUnder50ms: performanceReport.summary.passedOperations,
      slowOperationsOver100ms: performanceReport.detailed.filter(op => op.duration > 100).length,
    };
  }
  
  /**
   * Calculate overall health score (0-100)
   */
  private static calculateHealthScore(
    atomicMetrics: any,
    raceConditionStats: any,
    systemMetrics: any
  ): { score: number; criticalIssues: string[]; warnings: string[] } {
    let score = 100;
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    
    // Atomic storage health (40% weight)
    const successRateScore = atomicMetrics.successRate * 40;
    score = Math.min(score, successRateScore + 60);
    
    if (atomicMetrics.successRate < 0.90) {
      criticalIssues.push(`Low storage success rate: ${(atomicMetrics.successRate * 100).toFixed(1)}%`);
    } else if (atomicMetrics.successRate < 0.95) {
      warnings.push(`Suboptimal storage success rate: ${(atomicMetrics.successRate * 100).toFixed(1)}%`);
    }
    
    // Performance score (30% weight)
    const performanceDeduction = Math.max(0, (atomicMetrics.averageDuration - 50) / 50 * 30);
    score -= performanceDeduction;
    
    if (atomicMetrics.averageDuration > 100) {
      criticalIssues.push(`Slow operations: ${atomicMetrics.averageDuration.toFixed(1)}ms average`);
    } else if (atomicMetrics.averageDuration > 50) {
      warnings.push(`Operations exceeding 50ms target: ${atomicMetrics.averageDuration.toFixed(1)}ms average`);
    }
    
    // Concurrency health (20% weight)
    const lockDeduction = Math.min(20, atomicMetrics.activeLocksCount * 2);
    score -= lockDeduction;
    
    if (atomicMetrics.activeLocksCount > 10) {
      criticalIssues.push(`High lock contention: ${atomicMetrics.activeLocksCount} active locks`);
    } else if (atomicMetrics.activeLocksCount > 5) {
      warnings.push(`Moderate lock contention: ${atomicMetrics.activeLocksCount} active locks`);
    }
    
    // Race condition prevention (10% weight)
    if (raceConditionStats.raceConditionsPrevented > 0) {
      score += 5; // Bonus for preventing race conditions
    }
    
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      criticalIssues,
      warnings,
    };
  }
  
  /**
   * Generate comprehensive production health report
   */
  static async generateProductionHealthReport(): Promise<string> {
    const latestHealth = await this.performHealthCheck();
    const atomicHealthReport = AtomicStorage.generateHealthReport();
    const gamificationHealthReport = await GamificationService.generateProductionHealthReport();
    
    const uptime = this.isInitialized ? Date.now() - this.monitoringStartTime : 0;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(1);
    
    return [
      '⚡ PRODUCTION HEALTH REPORT - SelfRise Gamification System',
      '================================================================',
      `📊 Generated: ${new Date().toISOString()}`,
      `⏱️ Monitoring Uptime: ${uptimeHours} hours`,
      `🎯 Overall Health Score: ${latestHealth.overallHealthScore}/100`,
      '',
      '🔥 CRITICAL ISSUES:',
      ...latestHealth.criticalIssues.map(issue => `   ❌ ${issue}`),
      latestHealth.criticalIssues.length === 0 ? '   ✅ No critical issues detected' : '',
      '',
      '⚠️ WARNINGS:',
      ...latestHealth.warnings.map(warning => `   ⚠️ ${warning}`),
      latestHealth.warnings.length === 0 ? '   ✅ No warnings' : '',
      '',
      '📈 PERFORMANCE METRICS:',
      `   Operations/sec: ${latestHealth.systemPerformance.operationsPerSecond}`,
      `   Average Response: ${latestHealth.systemPerformance.averageResponseTime.toFixed(2)}ms`,
      `   Memory Usage: ${(latestHealth.systemPerformance.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      '',
      '🏃‍♂️ CONCURRENCY STATUS:',
      `   Active Operations: ${latestHealth.gamificationService.concurrentOperationsActive}`,
      `   Race Conditions Prevented: ${latestHealth.gamificationService.raceConditionsPrevented}`,
      `   Active Storage Locks: ${latestHealth.atomicStorage.activeLocksCount}`,
      '',
      '📊 DETAILED ATOMIC STORAGE HEALTH:',
      atomicHealthReport,
      '',
      '🎮 GAMIFICATION SERVICE HEALTH:',
      gamificationHealthReport,
      '',
      '🚨 ACTIVE ALERTS:',
      `   Active: ${this.activeAlerts.size}`,
      `   Total History: ${this.alertHistory.length}`,
      '',
      `📋 Report completed at ${new Date().toISOString()}`,
      '================================================================',
    ].join('\\n');
  }
  
  /**
   * Initialize monitoring storage
   */
  private static async initializeMonitoringStorage(): Promise<void> {
    try {
      await AtomicStorage.atomicWrite('production_monitoring_initialized', {
        timestamp: new Date(),
        version: '1.0.0',
        config: this.config,
      });
      
      console.log('💾 Production monitoring storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring storage:', error);
      throw error;
    }
  }
  
  /**
   * Process race condition alert
   */
  private static async processRaceConditionAlert(alert: RaceConditionAlert): Promise<void> {
    try {
      // Check rate limiting
      const now = Date.now();
      const timeSinceLastAlert = now - this.lastAlertTime;
      const maxAlertsPerMinute = this.config.alerting.maxAlertsPerMinute;
      
      if (timeSinceLastAlert < (60000 / maxAlertsPerMinute)) {
        console.log('⏸️ Rate limiting alert to prevent spam');
        return;
      }
      
      // Store alert
      this.activeAlerts.set(alert.id, alert);
      this.alertHistory.push(alert);
      this.lastAlertTime = now;
      
      // Trigger alerting channels
      if (this.config.alerting.enableCriticalAlerts) {
        await this.sendAlert(alert);
      }
      
      console.log(`🚨 Race condition alert: ${alert.severity} - ${alert.type}`);
      
    } catch (error) {
      console.error('❌ Failed to process race condition alert:', error);
    }
  }
  
  /**
   * Trigger critical alert
   */
  private static async triggerCriticalAlert(type: string, details: any): Promise<void> {
    const alert: RaceConditionAlert = {
      id: `critical_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      severity: 'CRITICAL',
      type: 'OPERATION_FAILURE',
      details: {
        operation: type,
        conflictingOperations: 0,
        affectedKeys: [],
        duration: 0,
        metadata: details,
      },
      resolved: false,
    };
    
    await this.processRaceConditionAlert(alert);
  }
  
  /**
   * Send alert through configured channels
   */
  private static async sendAlert(alert: RaceConditionAlert): Promise<void> {
    const channels = this.config.alerting.alertChannels;
    
    // Console alerting
    if (channels.includes('CONSOLE')) {
      console.error(`🚨 CRITICAL ALERT [${alert.severity}]: ${alert.type}`, alert.details);
    }
    
    // Storage alerting
    if (channels.includes('STORAGE')) {
      try {
        await AtomicStorage.atomicArrayAppend('production_alerts', alert, 100);
      } catch (error) {
        console.error('❌ Failed to store alert:', error);
      }
    }
    
    // Remote alerting (placeholder for future implementation)
    if (channels.includes('REMOTE')) {
      console.log('📡 Remote alerting not yet implemented');
    }
  }
  
  /**
   * Utility methods
   */
  private static determineRaceConditionSeverity(patterns: string[]): RaceConditionAlert['severity'] {
    const criticalPatterns = patterns.filter(p => 
      p.includes('High failure rate') || p.includes('Long-running lock')
    );
    
    if (criticalPatterns.length > 0) return 'CRITICAL';
    if (patterns.length > 3) return 'HIGH';
    if (patterns.length > 1) return 'MEDIUM';
    return 'LOW';
  }
  
  private static getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
  
  private static calculateOperationsPerSecond(): number {
    if (this.healthMetricsHistory.length < 2) return 0;
    
    const recent = this.healthMetricsHistory.slice(-2);
    const timeDiff = recent[1]!.timestamp.getTime() - recent[0]!.timestamp.getTime();
    const opsDiff = recent[1]!.atomicStorage.totalOperations - recent[0]!.atomicStorage.totalOperations;
    
    return timeDiff > 0 ? (opsDiff / timeDiff) * 1000 : 0;
  }
  
  /**
   * Get current monitoring status
   */
  static getMonitoringStatus(): {
    isInitialized: boolean;
    isMonitoring: boolean;
    uptime: number;
    activeAlerts: number;
    healthScore: number;
  } {
    const latestHealth = this.healthMetricsHistory[this.healthMetricsHistory.length - 1];
    
    return {
      isInitialized: this.isInitialized,
      isMonitoring: this.isMonitoring,
      uptime: this.isInitialized ? Date.now() - this.monitoringStartTime : 0,
      activeAlerts: this.activeAlerts.size,
      healthScore: latestHealth?.overallHealthScore || 0,
    };
  }
  
  /**
   * Shutdown monitoring service
   */
  static async shutdown(): Promise<void> {
    await this.stopMonitoring();
    
    this.isInitialized = false;
    this.activeAlerts.clear();
    this.healthMetricsHistory = [];
    
    console.log('⚡ Production monitoring service shutdown complete');
  }
}