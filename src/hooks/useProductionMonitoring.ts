/**
 * Production Monitoring Hook for Real-time Dashboard
 * 
 * CRITICAL: React Native hook for production monitoring UI
 * Think Hard methodology - comprehensive real-time observability
 * 
 * Features:
 * - Real-time health metrics
 * - Race condition alerts
 * - Performance monitoring
 * - Production dashboard data
 * - Critical issue notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionMonitoringService } from '../services/productionMonitoring';
import { AtomicStorage } from '../services/atomicStorage';

// Dashboard data types
export interface ProductionDashboardData {
  // Health overview
  overallHealthScore: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  
  // Real-time metrics
  metrics: {
    operationsPerSecond: number;
    averageResponseTime: number;
    successRate: number;
    activeOperations: number;
    memoryUsage: number;
  };
  
  // Race condition monitoring
  raceConditions: {
    total: number;
    prevented: number;
    active: number;
    lastDetected?: Date;
  };
  
  // Performance status
  performance: {
    fastOperations: number; // <50ms
    slowOperations: number; // >100ms
    failedOperations: number;
    averageDuration: number;
  };
  
  // Active issues
  criticalIssues: string[];
  warnings: string[];
  activeAlerts: number;
  
  // System status
  system: {
    uptime: number;
    isMonitoring: boolean;
    lastHealthCheck: Date;
    monitoringEnabled: boolean;
  };
}

export interface MonitoringHookOptions {
  enableRealTimeUpdates: boolean;
  updateInterval: number; // milliseconds
  enablePerformanceTracking: boolean;
  autoStartMonitoring: boolean;
}

export interface MonitoringActions {
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  performHealthCheck: () => Promise<void>;
  generateReport: () => Promise<string>;
  clearAlerts: () => Promise<void>;
  refreshData: () => Promise<void>;
}

/**
 * Production Monitoring Hook
 * 
 * Provides real-time production monitoring data for dashboard UI
 */
export function useProductionMonitoring(options: Partial<MonitoringHookOptions> = {}): {
  data: ProductionDashboardData | null;
  loading: boolean;
  error: string | null;
  actions: MonitoringActions;
} {
  
  // Configuration
  const config: MonitoringHookOptions = {
    enableRealTimeUpdates: true,
    updateInterval: 5000, // 5 seconds
    enablePerformanceTracking: true,
    autoStartMonitoring: true,
    ...options
  };
  
  // State management
  const [data, setData] = useState<ProductionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for managing timers and state
  const updateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);
  const lastUpdateRef = useRef(0);
  
  /**
   * Initialize monitoring system
   */
  const initializeMonitoring = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Initializing production monitoring hook...');
      
      // Initialize monitoring service if not already done
      await ProductionMonitoringService.initialize({
        enableRealTimeMonitoring: config.enableRealTimeUpdates,
        performanceThresholds: {
          maxOperationTime: 50,
          maxConcurrentLocks: 10,
          maxFailureRate: 0.05,
          minSuccessRate: 0.95,
        },
        alerting: {
          enableCriticalAlerts: true,
          alertChannels: ['CONSOLE', 'STORAGE'],
          maxAlertsPerMinute: 5,
        },
      });
      
      // Perform initial health check
      await refreshData();
      
      isInitializedRef.current = true;
      console.log('✅ Production monitoring hook initialized');
      
    } catch (initError) {
      const errorMessage = initError instanceof Error ? initError.message : 'Failed to initialize monitoring';
      console.error('❌ Monitoring initialization failed:', initError);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [config.enableRealTimeUpdates]);
  
  /**
   * Refresh monitoring data
   */
  const refreshData = useCallback(async (): Promise<void> => {
    try {
      const now = Date.now();
      
      // Prevent too frequent updates (debouncing)
      if (now - lastUpdateRef.current < 1000) {
        return;
      }
      lastUpdateRef.current = now;
      
      console.log('📊 Refreshing production monitoring data...');
      
      // Get health metrics
      const healthMetrics = await ProductionMonitoringService.performHealthCheck();
      
      // Get monitoring status
      const monitoringStatus = ProductionMonitoringService.getMonitoringStatus();
      
      // Get atomic storage metrics
      const storageMetrics = AtomicStorage.getPerformanceMetrics();
      
      // Determine health status
      const healthStatus: ProductionDashboardData['healthStatus'] = 
        healthMetrics.overallHealthScore >= 90 ? 'HEALTHY' :
        healthMetrics.overallHealthScore >= 70 ? 'WARNING' :
        healthMetrics.overallHealthScore > 0 ? 'CRITICAL' : 'UNKNOWN';
      
      // Build dashboard data
      const dashboardData: ProductionDashboardData = {
        overallHealthScore: healthMetrics.overallHealthScore,
        healthStatus,
        
        metrics: {
          operationsPerSecond: healthMetrics.systemPerformance.operationsPerSecond,
          averageResponseTime: healthMetrics.systemPerformance.averageResponseTime,
          successRate: healthMetrics.atomicStorage.successRate,
          activeOperations: healthMetrics.atomicStorage.activeLocksCount,
          memoryUsage: healthMetrics.systemPerformance.memoryUsage,
        },
        
        raceConditions: {
          total: healthMetrics.gamificationService.totalXPOperations,
          prevented: healthMetrics.gamificationService.raceConditionsPrevented,
          active: healthMetrics.gamificationService.concurrentOperationsActive,
        },
        
        performance: {
          fastOperations: healthMetrics.systemPerformance.criticalOperationsUnder50ms,
          slowOperations: healthMetrics.systemPerformance.slowOperationsOver100ms,
          failedOperations: healthMetrics.gamificationService.failedOperations,
          averageDuration: healthMetrics.gamificationService.averageOperationTime,
        },
        
        criticalIssues: healthMetrics.criticalIssues,
        warnings: healthMetrics.warnings,
        activeAlerts: monitoringStatus.activeAlerts,
        
        system: {
          uptime: monitoringStatus.uptime,
          isMonitoring: monitoringStatus.isMonitoring,
          lastHealthCheck: healthMetrics.timestamp,
          monitoringEnabled: monitoringStatus.isInitialized,
        },
      };
      
      setData(dashboardData);
      setError(null);
      
      console.log(`📊 Dashboard data updated - Health: ${healthStatus} (${dashboardData.overallHealthScore}/100)`);
      
    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Failed to refresh monitoring data';
      console.error('❌ Failed to refresh monitoring data:', refreshError);
      setError(errorMessage);
    }
  }, []);
  
  /**
   * Start real-time monitoring updates
   */
  const startRealTimeUpdates = useCallback((): void => {
    if (!config.enableRealTimeUpdates || updateTimerRef.current) {
      return;
    }
    
    console.log(`🔄 Starting real-time monitoring updates (${config.updateInterval}ms interval)`);
    
    updateTimerRef.current = setInterval(async () => {
      if (isInitializedRef.current) {
        await refreshData();
      }
    }, config.updateInterval);
  }, [config.enableRealTimeUpdates, config.updateInterval, refreshData]);
  
  /**
   * Stop real-time monitoring updates
   */
  const stopRealTimeUpdates = useCallback((): void => {
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
      console.log('⏹️ Real-time monitoring updates stopped');
    }
  }, []);
  
  // Action handlers
  const actions: MonitoringActions = {
    startMonitoring: useCallback(async (): Promise<void> => {
      await initializeMonitoring();
      startRealTimeUpdates();
    }, [initializeMonitoring, startRealTimeUpdates]),
    
    stopMonitoring: useCallback(async (): Promise<void> => {
      stopRealTimeUpdates();
      await ProductionMonitoringService.stopMonitoring();
    }, [stopRealTimeUpdates]),
    
    performHealthCheck: useCallback(async (): Promise<void> => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    }, [refreshData]),
    
    generateReport: useCallback(async (): Promise<string> => {
      console.log('📋 Generating production health report...');
      return await ProductionMonitoringService.generateProductionHealthReport();
    }, []),
    
    clearAlerts: useCallback(async (): Promise<void> => {
      // TODO: Implement alert clearing in monitoring service
      console.log('🧹 Clearing alerts...');
      await refreshData();
    }, [refreshData]),
    
    refreshData: refreshData,
  };
  
  // Initialize on mount
  useEffect(() => {
    if (config.autoStartMonitoring) {
      actions.startMonitoring();
    }
    
    // Cleanup on unmount
    return () => {
      stopRealTimeUpdates();
    };
  }, []);
  
  // Auto-refresh when configuration changes
  useEffect(() => {
    if (isInitializedRef.current) {
      stopRealTimeUpdates();
      if (config.enableRealTimeUpdates) {
        startRealTimeUpdates();
      }
    }
  }, [config.enableRealTimeUpdates, config.updateInterval]);
  
  return {
    data,
    loading,
    error,
    actions,
  };
}

/**
 * Simplified hook for basic monitoring status
 */
export function useMonitoringStatus(): {
  healthScore: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  isMonitoring: boolean;
  criticalIssues: number;
} {
  const { data } = useProductionMonitoring({
    enableRealTimeUpdates: true,
    updateInterval: 10000, // 10 seconds for status-only view
    autoStartMonitoring: true,
  });
  
  return {
    healthScore: data?.overallHealthScore || 0,
    healthStatus: data?.healthStatus || 'UNKNOWN',
    isMonitoring: data?.system.isMonitoring || false,
    criticalIssues: data?.criticalIssues.length || 0,
  };
}

/**
 * Hook for performance-specific monitoring
 */
export function usePerformanceMonitoring(): {
  averageResponseTime: number;
  operationsPerSecond: number;
  successRate: number;
  slowOperations: number;
  raceConditionsPrevented: number;
} {
  const { data } = useProductionMonitoring({
    enableRealTimeUpdates: true,
    updateInterval: 3000, // 3 seconds for performance monitoring
    enablePerformanceTracking: true,
    autoStartMonitoring: true,
  });
  
  return {
    averageResponseTime: data?.metrics.averageResponseTime || 0,
    operationsPerSecond: data?.metrics.operationsPerSecond || 0,
    successRate: data?.metrics.successRate || 0,
    slowOperations: data?.performance.slowOperations || 0,
    raceConditionsPrevented: data?.raceConditions.prevented || 0,
  };
}