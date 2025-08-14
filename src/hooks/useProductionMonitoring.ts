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
  }, [config.enableRealTimeUpdates]);\n  
  /**\n   * Refresh monitoring data\n   */\n  const refreshData = useCallback(async (): Promise<void> => {\n    try {\n      const now = Date.now();\n      \n      // Prevent too frequent updates (debouncing)\n      if (now - lastUpdateRef.current < 1000) {\n        return;\n      }\n      lastUpdateRef.current = now;\n      \n      console.log('📊 Refreshing production monitoring data...');\n      \n      // Get health metrics\n      const healthMetrics = await ProductionMonitoringService.performHealthCheck();\n      \n      // Get monitoring status\n      const monitoringStatus = ProductionMonitoringService.getMonitoringStatus();\n      \n      // Get atomic storage metrics\n      const storageMetrics = AtomicStorage.getPerformanceMetrics();\n      \n      // Determine health status\n      const healthStatus: ProductionDashboardData['healthStatus'] = \n        healthMetrics.overallHealthScore >= 90 ? 'HEALTHY' :\n        healthMetrics.overallHealthScore >= 70 ? 'WARNING' :\n        healthMetrics.overallHealthScore > 0 ? 'CRITICAL' : 'UNKNOWN';\n      \n      // Build dashboard data\n      const dashboardData: ProductionDashboardData = {\n        overallHealthScore: healthMetrics.overallHealthScore,\n        healthStatus,\n        \n        metrics: {\n          operationsPerSecond: healthMetrics.systemPerformance.operationsPerSecond,\n          averageResponseTime: healthMetrics.systemPerformance.averageResponseTime,\n          successRate: healthMetrics.atomicStorage.successRate,\n          activeOperations: healthMetrics.atomicStorage.activeLocksCount,\n          memoryUsage: healthMetrics.systemPerformance.memoryUsage,\n        },\n        \n        raceConditions: {\n          total: healthMetrics.gamificationService.totalXPOperations,\n          prevented: healthMetrics.gamificationService.raceConditionsPrevented,\n          active: healthMetrics.gamificationService.concurrentOperationsActive,\n          lastDetected: undefined, // TODO: Track last race condition\n        },\n        \n        performance: {\n          fastOperations: healthMetrics.systemPerformance.criticalOperationsUnder50ms,\n          slowOperations: healthMetrics.systemPerformance.slowOperationsOver100ms,\n          failedOperations: healthMetrics.gamificationService.failedOperations,\n          averageDuration: healthMetrics.gamificationService.averageOperationTime,\n        },\n        \n        criticalIssues: healthMetrics.criticalIssues,\n        warnings: healthMetrics.warnings,\n        activeAlerts: monitoringStatus.activeAlerts,\n        \n        system: {\n          uptime: monitoringStatus.uptime,\n          isMonitoring: monitoringStatus.isMonitoring,\n          lastHealthCheck: healthMetrics.timestamp,\n          monitoringEnabled: monitoringStatus.isInitialized,\n        },\n      };\n      \n      setData(dashboardData);\n      setError(null);\n      \n      console.log(`📊 Dashboard data updated - Health: ${healthStatus} (${dashboardData.overallHealthScore}/100)`);\n      \n    } catch (refreshError) {\n      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Failed to refresh monitoring data';\n      console.error('❌ Failed to refresh monitoring data:', refreshError);\n      setError(errorMessage);\n    }\n  }, []);\n  \n  /**\n   * Start real-time monitoring updates\n   */\n  const startRealTimeUpdates = useCallback((): void => {\n    if (!config.enableRealTimeUpdates || updateTimerRef.current) {\n      return;\n    }\n    \n    console.log(`🔄 Starting real-time monitoring updates (${config.updateInterval}ms interval)`);\n    \n    updateTimerRef.current = setInterval(async () => {\n      if (isInitializedRef.current) {\n        await refreshData();\n      }\n    }, config.updateInterval);\n  }, [config.enableRealTimeUpdates, config.updateInterval, refreshData]);\n  \n  /**\n   * Stop real-time monitoring updates\n   */\n  const stopRealTimeUpdates = useCallback((): void => {\n    if (updateTimerRef.current) {\n      clearInterval(updateTimerRef.current);\n      updateTimerRef.current = null;\n      console.log('⏹️ Real-time monitoring updates stopped');\n    }\n  }, []);\n  \n  // Action handlers\n  const actions: MonitoringActions = {\n    startMonitoring: useCallback(async (): Promise<void> => {\n      await initializeMonitoring();\n      startRealTimeUpdates();\n    }, [initializeMonitoring, startRealTimeUpdates]),\n    \n    stopMonitoring: useCallback(async (): Promise<void> => {\n      stopRealTimeUpdates();\n      await ProductionMonitoringService.stopMonitoring();\n    }, [stopRealTimeUpdates]),\n    \n    performHealthCheck: useCallback(async (): Promise<void> => {\n      setLoading(true);\n      await refreshData();\n      setLoading(false);\n    }, [refreshData]),\n    \n    generateReport: useCallback(async (): Promise<string> => {\n      console.log('📋 Generating production health report...');\n      return await ProductionMonitoringService.generateProductionHealthReport();\n    }, []),\n    \n    clearAlerts: useCallback(async (): Promise<void> => {\n      // TODO: Implement alert clearing in monitoring service\n      console.log('🧹 Clearing alerts...');\n      await refreshData();\n    }, [refreshData]),\n    \n    refreshData: refreshData,\n  };\n  \n  // Initialize on mount\n  useEffect(() => {\n    if (config.autoStartMonitoring) {\n      actions.startMonitoring();\n    }\n    \n    // Cleanup on unmount\n    return () => {\n      stopRealTimeUpdates();\n    };\n  }, []);\n  \n  // Auto-refresh when configuration changes\n  useEffect(() => {\n    if (isInitializedRef.current) {\n      stopRealTimeUpdates();\n      if (config.enableRealTimeUpdates) {\n        startRealTimeUpdates();\n      }\n    }\n  }, [config.enableRealTimeUpdates, config.updateInterval]);\n  \n  return {\n    data,\n    loading,\n    error,\n    actions,\n  };\n}\n\n/**\n * Simplified hook for basic monitoring status\n */\nexport function useMonitoringStatus(): {\n  healthScore: number;\n  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';\n  isMonitoring: boolean;\n  criticalIssues: number;\n} {\n  const { data } = useProductionMonitoring({\n    enableRealTimeUpdates: true,\n    updateInterval: 10000, // 10 seconds for status-only view\n    autoStartMonitoring: true,\n  });\n  \n  return {\n    healthScore: data?.overallHealthScore || 0,\n    healthStatus: data?.healthStatus || 'UNKNOWN',\n    isMonitoring: data?.system.isMonitoring || false,\n    criticalIssues: data?.criticalIssues.length || 0,\n  };\n}\n\n/**\n * Hook for performance-specific monitoring\n */\nexport function usePerformanceMonitoring(): {\n  averageResponseTime: number;\n  operationsPerSecond: number;\n  successRate: number;\n  slowOperations: number;\n  raceConditionsPrevented: number;\n} {\n  const { data } = useProductionMonitoring({\n    enableRealTimeUpdates: true,\n    updateInterval: 3000, // 3 seconds for performance monitoring\n    enablePerformanceTracking: true,\n    autoStartMonitoring: true,\n  });\n  \n  return {\n    averageResponseTime: data?.metrics.averageResponseTime || 0,\n    operationsPerSecond: data?.metrics.operationsPerSecond || 0,\n    successRate: data?.metrics.successRate || 0,\n    slowOperations: data?.performance.slowOperations || 0,\n    raceConditionsPrevented: data?.raceConditions.prevented || 0,\n  };\n}"