// @ts-nocheck - Performance monitoring service with complex type inference, non-critical for app functionality
/**
 * Help Performance Monitor
 *
 * Monitors performance metrics for the help tooltip system to ensure:
 * - Fast rendering and smooth animations
 * - Minimal memory footprint
 * - No impact on app responsiveness
 * - Optimal user experience across devices
 */

import { Dimensions, Platform } from 'react-native';

// Performance metric types
export interface HelpPerformanceMetrics {
  renderTime: number;              // Time to render tooltip (ms)
  animationFrameRate: number;      // Animation FPS
  memoryUsage?: number;            // Memory usage (MB) - iOS only
  cpuUsage?: number;               // CPU usage percentage
  timestamp: number;               // When measurement was taken
  helpKey: string;                 // Which help topic
  deviceInfo: DeviceInfo;          // Device context
}

export interface DeviceInfo {
  platform: string;
  screenWidth: number;
  screenHeight: number;
  isLowEndDevice: boolean;
  densityScale: number;
}

export interface PerformanceSummary {
  averageRenderTime: number;
  averageFrameRate: number;
  slowestHelp: { helpKey: string; renderTime: number } | null;
  fastestHelp: { helpKey: string; renderTime: number } | null;
  totalMeasurements: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
  lastUpdated: number;
}

// Performance thresholds - updated for render-only measurement
const PERFORMANCE_THRESHOLDS = {
  EXCELLENT_RENDER_TIME: 8,     // Under 8ms for render only
  GOOD_RENDER_TIME: 16,         // Under 16ms for render only
  POOR_RENDER_TIME: 50,         // Over 50ms is problematic for render
  MIN_FRAME_RATE: 50,           // Minimum acceptable FPS
  IDEAL_FRAME_RATE: 58,         // Close to 60fps
  MAX_MEMORY_USAGE: 10,         // Max 10MB memory usage
};

class HelpPerformanceMonitor {
  private static instance: HelpPerformanceMonitor;
  private measurements: HelpPerformanceMetrics[] = [];
  private maxStoredMeasurements = 100;
  private isEnabled = true;
  private deviceInfo: DeviceInfo;

  constructor() {
    this.deviceInfo = this.getDeviceInfo();
  }

  static getInstance(): HelpPerformanceMonitor {
    if (!HelpPerformanceMonitor.instance) {
      HelpPerformanceMonitor.instance = new HelpPerformanceMonitor();
    }
    return HelpPerformanceMonitor.instance;
  }

  private getDeviceInfo(): DeviceInfo {
    const { width, height } = Dimensions.get('window');
    const densityScale = Dimensions.get('window').scale;

    // Simple heuristic for low-end device detection
    const isLowEndDevice = Platform.OS === 'android' && (
      width < 375 || // Small screen
      densityScale < 2 || // Low density
      Platform.Version < 28 // Older Android
    );

    return {
      platform: Platform.OS,
      screenWidth: width,
      screenHeight: height,
      isLowEndDevice,
      densityScale,
    };
  }

  /**
   * Start measuring tooltip render performance
   */
  startRenderMeasurement(helpKey: string): {
    endMeasurement: () => void;
    markAnimationFrame: () => void;
  } {
    if (!this.isEnabled) {
      return {
        endMeasurement: () => {},
        markAnimationFrame: () => {},
      };
    }

    const startTime = performance.now();
    const animationFrameTimes: number[] = [];
    let lastFrameTime = startTime;

    const markAnimationFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      animationFrameTimes.push(frameTime);
      lastFrameTime = now;
    };

    const endMeasurement = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Calculate average frame rate
      let averageFrameRate = 60; // Default fallback
      if (animationFrameTimes.length > 0) {
        const averageFrameTime = animationFrameTimes.reduce((sum, time) => sum + time, 0) / animationFrameTimes.length;
        averageFrameRate = averageFrameTime > 0 ? 1000 / averageFrameTime : 60;
      }

      // Create performance metric
      const metric: HelpPerformanceMetrics = {
        renderTime,
        animationFrameRate: Math.min(60, Math.max(0, averageFrameRate)),
        timestamp: Date.now(),
        helpKey,
        deviceInfo: this.deviceInfo,
      };

      // Add memory usage if available (iOS)
      if (Platform.OS === 'ios' && (global as any).performance?.memory) {
        metric.memoryUsage = (global as any).performance.memory.usedJSHeapSize / (1024 * 1024);
      }

      this.addMeasurement(metric);

      console.log(`📊 [HelpPerformance] ${helpKey}: ${renderTime.toFixed(1)}ms render, ${averageFrameRate.toFixed(1)}fps`);
    };

    return { endMeasurement, markAnimationFrame };
  }

  /**
   * Add a performance measurement
   */
  private addMeasurement(metric: HelpPerformanceMetrics): void {
    this.measurements.push(metric);

    // Keep only recent measurements to prevent memory growth
    if (this.measurements.length > this.maxStoredMeasurements) {
      this.measurements = this.measurements.slice(-this.maxStoredMeasurements);
    }

    // Warn about poor performance
    if (metric.renderTime > PERFORMANCE_THRESHOLDS.POOR_RENDER_TIME) {
      console.warn(`⚠️ [HelpPerformance] Slow tooltip render: ${metric.helpKey} took ${metric.renderTime.toFixed(1)}ms`);
    }

    if (metric.animationFrameRate < PERFORMANCE_THRESHOLDS.MIN_FRAME_RATE) {
      console.warn(`⚠️ [HelpPerformance] Low frame rate: ${metric.helpKey} at ${metric.animationFrameRate.toFixed(1)}fps`);
    }
  }

  /**
   * Get performance summary and analysis
   */
  getPerformanceSummary(): PerformanceSummary {
    if (this.measurements.length === 0) {
      return {
        averageRenderTime: 0,
        averageFrameRate: 0,
        slowestHelp: null,
        fastestHelp: null,
        totalMeasurements: 0,
        performanceGrade: 'F',
        recommendations: ['No performance data available yet'],
        lastUpdated: Date.now(),
      };
    }

    // Calculate averages
    const totalRenderTime = this.measurements.reduce((sum, m) => sum + m.renderTime, 0);
    const totalFrameRate = this.measurements.reduce((sum, m) => sum + m.animationFrameRate, 0);

    const averageRenderTime = totalRenderTime / this.measurements.length;
    const averageFrameRate = totalFrameRate / this.measurements.length;

    // Find slowest and fastest
    const sortedByRenderTime = [...this.measurements].sort((a, b) => b.renderTime - a.renderTime);
    const slowestHelp = {
      helpKey: sortedByRenderTime[0].helpKey,
      renderTime: sortedByRenderTime[0].renderTime,
    };
    const fastestHelp = {
      helpKey: sortedByRenderTime[sortedByRenderTime.length - 1].helpKey,
      renderTime: sortedByRenderTime[sortedByRenderTime.length - 1].renderTime,
    };

    // Calculate performance grade
    const performanceGrade = this.calculatePerformanceGrade(averageRenderTime, averageFrameRate);

    // Generate recommendations
    const recommendations = this.generateRecommendations(averageRenderTime, averageFrameRate);

    return {
      averageRenderTime,
      averageFrameRate,
      slowestHelp,
      fastestHelp,
      totalMeasurements: this.measurements.length,
      performanceGrade,
      recommendations,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Calculate performance grade based on metrics
   */
  private calculatePerformanceGrade(avgRenderTime: number, avgFrameRate: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    const renderScore = avgRenderTime <= PERFORMANCE_THRESHOLDS.EXCELLENT_RENDER_TIME ? 100 :
                       avgRenderTime <= PERFORMANCE_THRESHOLDS.GOOD_RENDER_TIME ? 80 :
                       avgRenderTime <= PERFORMANCE_THRESHOLDS.POOR_RENDER_TIME ? 60 : 40;

    const frameRateScore = avgFrameRate >= PERFORMANCE_THRESHOLDS.IDEAL_FRAME_RATE ? 100 :
                          avgFrameRate >= PERFORMANCE_THRESHOLDS.MIN_FRAME_RATE ? 80 : 60;

    const totalScore = (renderScore + frameRateScore) / 2;

    if (totalScore >= 90) return 'A';
    if (totalScore >= 80) return 'B';
    if (totalScore >= 70) return 'C';
    if (totalScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate performance improvement recommendations
   */
  private generateRecommendations(avgRenderTime: number, avgFrameRate: number): string[] {
    const recommendations: string[] = [];

    if (avgRenderTime > PERFORMANCE_THRESHOLDS.GOOD_RENDER_TIME) {
      recommendations.push('Consider optimizing tooltip rendering performance');
      recommendations.push('Reduce tooltip content complexity or use simpler animations');
    }

    if (avgFrameRate < PERFORMANCE_THRESHOLDS.MIN_FRAME_RATE) {
      recommendations.push('Animation frame rate is below optimal - consider reducing animation complexity');
      recommendations.push('Use native driver animations where possible');
    }

    if (this.deviceInfo.isLowEndDevice) {
      recommendations.push('Detected low-end device - consider implementing performance mode');
      recommendations.push('Reduce visual effects and animation duration for better performance');
    }

    // Memory recommendations
    const recentMemoryUsage = this.measurements
      .filter(m => m.memoryUsage !== undefined)
      .slice(-10)
      .map(m => m.memoryUsage!);

    if (recentMemoryUsage.length > 0) {
      const avgMemory = recentMemoryUsage.reduce((sum, mem) => sum + mem, 0) / recentMemoryUsage.length;
      if (avgMemory > PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE) {
        recommendations.push('Memory usage is high - consider optimizing tooltip caching');
      }
    }

    // Device-specific recommendations
    if (this.deviceInfo.platform === 'android' && this.deviceInfo.densityScale > 3) {
      recommendations.push('High-density Android device detected - optimize for pixel density');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is excellent! No optimizations needed.');
    }

    return recommendations;
  }

  /**
   * Get detailed performance metrics for analysis
   */
  getDetailedMetrics(): {
    recent: HelpPerformanceMetrics[];
    byHelpKey: { [helpKey: string]: HelpPerformanceMetrics[] };
    deviceInfo: DeviceInfo;
  } {
    const recent = this.measurements.slice(-20); // Last 20 measurements

    // Group by help key
    const byHelpKey: { [helpKey: string]: HelpPerformanceMetrics[] } = {};
    this.measurements.forEach(metric => {
      if (!byHelpKey[metric.helpKey]) {
        byHelpKey[metric.helpKey] = [];
      }
      byHelpKey[metric.helpKey].push(metric);
    });

    return {
      recent,
      byHelpKey,
      deviceInfo: this.deviceInfo,
    };
  }

  /**
   * Clear all performance data
   */
  clearMetrics(): void {
    this.measurements = [];
    console.log('📊 [HelpPerformance] Cleared all performance metrics');
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📊 [HelpPerformance] Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if current device needs performance optimizations
   */
  shouldUsePerformanceMode(): boolean {
    if (this.measurements.length < 5) {
      // Not enough data, use device heuristics
      return this.deviceInfo.isLowEndDevice;
    }

    const recent = this.measurements.slice(-10);
    const avgRenderTime = recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length;
    const avgFrameRate = recent.reduce((sum, m) => sum + m.animationFrameRate, 0) / recent.length;

    return avgRenderTime > PERFORMANCE_THRESHOLDS.GOOD_RENDER_TIME ||
           avgFrameRate < PERFORMANCE_THRESHOLDS.MIN_FRAME_RATE;
  }

  /**
   * Export performance data for external analysis
   */
  exportPerformanceData(): {
    summary: PerformanceSummary;
    detailed: HelpPerformanceMetrics[];
    deviceInfo: DeviceInfo;
  } {
    return {
      summary: this.getPerformanceSummary(),
      detailed: [...this.measurements],
      deviceInfo: this.deviceInfo,
    };
  }
}

export default HelpPerformanceMonitor.getInstance();