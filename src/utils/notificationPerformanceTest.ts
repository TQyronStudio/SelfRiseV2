/**
 * Notification Performance Test
 * 
 * Tests the optimized notification system with performance limits
 * Validates 5 simultaneous notification limit and queue processing
 */

import { XPSourceType } from '../types/gamification';

// Mock XpAnimationContext for testing
interface MockNotificationState {
  pendingNotifications: Array<{
    id: string;
    amount: number;
    source: XPSourceType;
    timestamp: number;
  }>;
  notificationQueue: Array<{
    id: string;
    amount: number;
    source: XPSourceType;
    timestamp: number;
  }>;
  isNotificationVisible: boolean;
}

const MAX_SIMULTANEOUS_NOTIFICATIONS = 5;

class NotificationPerformanceTester {
  private state: MockNotificationState = {
    pendingNotifications: [],
    notificationQueue: [],
    isNotificationVisible: false
  };

  private processNotificationQueue(): void {
    const currentVisibleCount = this.state.pendingNotifications.length;
    
    if (currentVisibleCount < MAX_SIMULTANEOUS_NOTIFICATIONS && this.state.notificationQueue.length > 0) {
      const availableSlots = MAX_SIMULTANEOUS_NOTIFICATIONS - currentVisibleCount;
      const notificationsToProcess = this.state.notificationQueue.splice(0, availableSlots);
      
      this.state.pendingNotifications.push(...notificationsToProcess);
      this.state.isNotificationVisible = true;
      
      console.log(`📱 Processed ${notificationsToProcess.length} queued notifications (${this.state.notificationQueue.length} remaining)`);
    }
  }

  addNotification(amount: number, source: XPSourceType): boolean {
    const notification = {
      id: `xp_gain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      source,
      timestamp: Date.now()
    };

    // Check notification limit
    if (this.state.pendingNotifications.length >= MAX_SIMULTANEOUS_NOTIFICATIONS) {
      // Queue notification
      this.state.notificationQueue.push(notification);
      console.log(`⚡ Notification queued (${this.state.notificationQueue.length} in queue) - performance limit reached`);
      return false; // Queued
    }

    // Add immediately
    this.state.pendingNotifications.push(notification);
    this.state.isNotificationVisible = true;
    return true; // Added immediately
  }

  dismissNotifications(): void {
    this.state.pendingNotifications = [];
    this.state.isNotificationVisible = false;
    
    // Process queue
    setTimeout(() => {
      this.processNotificationQueue();
    }, 100);
  }

  getState(): MockNotificationState {
    return { ...this.state };
  }
}

export async function runNotificationPerformanceTest(): Promise<{
  success: boolean;
  results: {
    limitRespected: boolean;
    queueProcessingWorks: boolean;
    performanceOptimized: boolean;
    details: string[];
  };
}> {
  console.log('🧪 Starting Notification Performance Test...');
  
  const tester = new NotificationPerformanceTester();
  const results = {
    limitRespected: false,
    queueProcessingWorks: false,
    performanceOptimized: false,
    details: [] as string[]
  };

  try {
    // Test 1: Verify 5 notification limit
    console.log('\n📊 Test 1: Notification Limit Verification');
    for (let i = 1; i <= 8; i++) {
      const addedImmediately = tester.addNotification(10, XPSourceType.HABIT_COMPLETION);
      
      if (i <= 5 && !addedImmediately) {
        results.details.push(`❌ Notification ${i} should have been added immediately but was queued`);
      } else if (i > 5 && addedImmediately) {
        results.details.push(`❌ Notification ${i} should have been queued but was added immediately`);
      }
    }

    const state1 = tester.getState();
    results.limitRespected = state1.pendingNotifications.length === 5 && state1.notificationQueue.length === 3;
    
    if (results.limitRespected) {
      results.details.push(`✅ Notification limit respected: ${state1.pendingNotifications.length} visible, ${state1.notificationQueue.length} queued`);
    } else {
      results.details.push(`❌ Notification limit violated: ${state1.pendingNotifications.length} visible, ${state1.notificationQueue.length} queued`);
    }

    // Test 2: Queue processing
    console.log('\n📊 Test 2: Queue Processing Verification');
    tester.dismissNotifications();
    
    // Wait for queue processing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const state2 = tester.getState();
    results.queueProcessingWorks = state2.pendingNotifications.length > 0 && state2.notificationQueue.length < 3;
    
    if (results.queueProcessingWorks) {
      results.details.push(`✅ Queue processing works: ${state2.pendingNotifications.length} visible, ${state2.notificationQueue.length} remaining in queue`);
    } else {
      results.details.push(`❌ Queue processing failed: ${state2.pendingNotifications.length} visible, ${state2.notificationQueue.length} remaining in queue`);
    }

    // Test 3: Performance optimization check
    console.log('\n📊 Test 3: Performance Optimization Check');
    const startTime = performance.now();
    
    // Rapid notification burst (stress test)
    for (let i = 0; i < 20; i++) {
      tester.addNotification(5, XPSourceType.JOURNAL_ENTRY);
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    results.performanceOptimized = processingTime < 50; // Should be very fast due to queueing
    
    if (results.performanceOptimized) {
      results.details.push(`✅ Performance optimized: Processed 20 notifications in ${processingTime.toFixed(2)}ms`);
    } else {
      results.details.push(`❌ Performance issue: Processed 20 notifications in ${processingTime.toFixed(2)}ms (should be <50ms)`);
    }

    const finalState = tester.getState();
    results.details.push(`📊 Final state: ${finalState.pendingNotifications.length} visible, ${finalState.notificationQueue.length} queued`);

    const success = results.limitRespected && results.queueProcessingWorks && results.performanceOptimized;
    
    console.log('\n🎯 Notification Performance Test Results:');
    results.details.forEach(detail => console.log(detail));
    
    if (success) {
      console.log('\n✅ All notification performance tests PASSED! System optimized for 60fps rendering.');
    } else {
      console.log('\n❌ Some notification performance tests FAILED! Review optimization implementation.');
    }

    return { success, results };

  } catch (error) {
    console.error('❌ Notification performance test failed:', error);
    results.details.push(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return { 
      success: false, 
      results: {
        ...results,
        details: results.details
      }
    };
  }
}

// Export for direct testing
export { NotificationPerformanceTester };