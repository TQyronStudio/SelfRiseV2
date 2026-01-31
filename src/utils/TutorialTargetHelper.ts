import { RefObject } from 'react';
import { View, findNodeHandle, UIManager, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface TargetElementInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
}

export interface TutorialTarget {
  id: string;
  ref: RefObject<View>;
  fallbackPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

class TutorialTargetManager {
  private targets: Map<string, TutorialTarget> = new Map();
  private isInitialized: boolean = false;

  /**
   * Register a target element for tutorial spotlight
   */
  registerTarget(id: string, ref: RefObject<View>, fallbackPosition?: { x: number; y: number; width: number; height: number }) {
    const target: TutorialTarget = { id, ref };
    if (fallbackPosition) {
      target.fallbackPosition = fallbackPosition;
    }
    this.targets.set(id, target);
  }

  /**
   * Unregister a target element
   */
  unregisterTarget(id: string) {
    this.targets.delete(id);
  }

  /**
   * Clear all registered targets
   */
  clearAllTargets() {
    this.targets.clear();
  }

  /**
   * Get target element position and dimensions
   */
  async getTargetInfo(targetId: string): Promise<TargetElementInfo | null> {
    const target = this.targets.get(targetId);

    if (!target) {
      console.warn(`Tutorial target '${targetId}' not found`);
      return this.getFallbackTarget(targetId);
    }

    try {
      const info = await this.measureElement(target.ref);
      if (info) {
        return info;
      }
    } catch (error) {
      console.warn(`Failed to measure target '${targetId}':`, error);
    }

    // Use fallback position if measurement fails
    if (target.fallbackPosition) {
      return {
        ...target.fallbackPosition,
        pageX: target.fallbackPosition.x,
        pageY: target.fallbackPosition.y,
      };
    }

    return this.getFallbackTarget(targetId);
  }

  /**
   * Measure element using native methods
   */
  private measureElement(ref: RefObject<View>): Promise<TargetElementInfo | null> {
    return new Promise((resolve) => {
      if (!ref.current) {
        resolve(null);
        return;
      }

      ref.current.measure((x, y, width, height, pageX, pageY) => {
        // Validate measurements
        if (width > 0 && height > 0 && pageX >= 0 && pageY >= 0) {
          resolve({
            x: pageX,
            y: pageY,
            width,
            height,
            pageX,
            pageY,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get fallback target positions for common elements
   */
  private getFallbackTarget(targetId: string): TargetElementInfo {
    const fallbackPositions: Record<string, TargetElementInfo> = {
      // Quick Actions Section (Home screen top)
      'quick-actions-section': {
        x: 16,
        y: 120,
        width: SCREEN_WIDTH - 32,
        height: 100,
        pageX: 16,
        pageY: 120,
      },

      // Add Habit Button (Quick actions)
      'add-habit-button': {
        x: 16,
        y: 160,
        width: (SCREEN_WIDTH - 48) / 2,
        height: 80,
        pageX: 16,
        pageY: 160,
      },

      // Add Goal Button (Quick actions)
      'add-goal-button': {
        x: SCREEN_WIDTH / 2 + 8,
        y: 160,
        width: (SCREEN_WIDTH - 48) / 2,
        height: 80,
        pageX: SCREEN_WIDTH / 2 + 8,
        pageY: 160,
      },

      // Bottom Tab Navigation
      'home-tab': {
        x: 0,
        y: SCREEN_HEIGHT - 83,
        width: SCREEN_WIDTH / 5,
        height: 83,
        pageX: 0,
        pageY: SCREEN_HEIGHT - 83,
      },

      'habits-tab': {
        x: SCREEN_WIDTH / 5,
        y: SCREEN_HEIGHT - 83,
        width: SCREEN_WIDTH / 5,
        height: 83,
        pageX: SCREEN_WIDTH / 5,
        pageY: SCREEN_HEIGHT - 83,
      },

      'journal-tab': {
        x: (SCREEN_WIDTH / 5) * 2,
        y: SCREEN_HEIGHT - 83,
        width: SCREEN_WIDTH / 5,
        height: 83,
        pageX: (SCREEN_WIDTH / 5) * 2,
        pageY: SCREEN_HEIGHT - 83,
      },

      'goals-tab': {
        x: (SCREEN_WIDTH / 5) * 3,
        y: SCREEN_HEIGHT - 83,
        width: SCREEN_WIDTH / 5,
        height: 83,
        pageX: (SCREEN_WIDTH / 5) * 3,
        pageY: SCREEN_HEIGHT - 83,
      },

      'settings-tab': {
        x: (SCREEN_WIDTH / 5) * 4,
        y: SCREEN_HEIGHT - 83,
        width: SCREEN_WIDTH / 5,
        height: 83,
        pageX: (SCREEN_WIDTH / 5) * 4,
        pageY: SCREEN_HEIGHT - 83,
      },

      // XP Progress Bar (matches tutorial target ID)
      'xp-progress-bar': {
        x: 16,
        y: 180,
        width: SCREEN_WIDTH - 32,
        height: 140,
        pageX: 16,
        pageY: 180,
      },

      // Trophy Button in header (matches tutorial target ID)
      'trophy-button': {
        x: 16,
        y: 44,
        width: 44,
        height: 44,
        pageX: 16,
        pageY: 44,
      },

      // Journal Actions
      'journal-actions': {
        x: 16,
        y: 180,
        width: SCREEN_WIDTH - 32,
        height: 120,
        pageX: 16,
        pageY: 180,
      },

      // Form Elements (Modal/Screen contexts)
      'habit-name-input': {
        x: 20,
        y: 200,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: 200,
      },

      'habit-color-picker': {
        x: 20,
        y: 280,
        width: SCREEN_WIDTH - 40,
        height: 80,
        pageX: 20,
        pageY: 280,
      },

      'habit-icon-picker': {
        x: 20,
        y: 380,
        width: SCREEN_WIDTH - 40,
        height: 80,
        pageX: 20,
        pageY: 380,
      },

      'habit-scheduled-days': {
        x: 20,
        y: 480,
        width: SCREEN_WIDTH - 40,
        height: 100,
        pageX: 20,
        pageY: 480,
      },

      'create-habit-button': {
        x: 20,
        y: SCREEN_HEIGHT - 120,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: SCREEN_HEIGHT - 120,
      },

      'goal-title-input': {
        x: 20,
        y: 200,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: 200,
      },

      'goal-target-date': {
        x: 20,
        y: 280,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: 280,
      },

      'goal-unit-input': {
        x: 20,
        y: 360,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: 360,
      },

      'goal-value-input': {
        x: 20,
        y: 440,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: 440,
      },

      'goal-category-picker': {
        x: 20,
        y: 520,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: 520,
      },

      'create-goal-button': {
        x: 20,
        y: SCREEN_HEIGHT - 120,
        width: SCREEN_WIDTH - 40,
        height: 56,
        pageX: 20,
        pageY: SCREEN_HEIGHT - 120,
      },

      // Default main screen target
      'main-screen': {
        x: SCREEN_WIDTH / 4,
        y: SCREEN_HEIGHT / 3,
        width: SCREEN_WIDTH / 2,
        height: SCREEN_HEIGHT / 3,
        pageX: SCREEN_WIDTH / 4,
        pageY: SCREEN_HEIGHT / 3,
      },
    };

    return fallbackPositions[targetId] ?? fallbackPositions['main-screen']!;
  }

  /**
   * Wait for element to be available and measurable
   */
  async waitForTarget(targetId: string, maxAttempts: number = 10, interval: number = 100): Promise<TargetElementInfo | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const info = await this.getTargetInfo(targetId);
      if (info && info.width > 0 && info.height > 0) {
        return info;
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    console.warn(`Target '${targetId}' not available after ${maxAttempts} attempts`);
    return this.getFallbackTarget(targetId);
  }

  /**
   * Get all registered target IDs
   */
  getRegisteredTargets(): string[] {
    return Array.from(this.targets.keys());
  }

  /**
   * Check if target is registered
   */
  isTargetRegistered(targetId: string): boolean {
    return this.targets.has(targetId);
  }

  /**
   * Update screen dimensions (call on orientation change)
   */
  updateScreenDimensions() {
    const { width, height } = Dimensions.get('window');
    // Update internal screen dimensions if needed
    // This would require updating fallback positions proportionally
  }
}

// Singleton instance
export const tutorialTargetManager = new TutorialTargetManager();

// React Hook for easier component integration
export const useTutorialTarget = (targetId: string, ref: RefObject<View | null>, fallbackPosition?: { x: number; y: number; width: number; height: number }) => {
  const registerTarget = () => {
    tutorialTargetManager.registerTarget(targetId, ref as RefObject<View>, fallbackPosition);
  };

  const unregisterTarget = () => {
    tutorialTargetManager.unregisterTarget(targetId);
  };

  return {
    registerTarget,
    unregisterTarget,
    getTargetInfo: () => tutorialTargetManager.getTargetInfo(targetId),
    waitForTarget: (maxAttempts?: number, interval?: number) =>
      tutorialTargetManager.waitForTarget(targetId, maxAttempts, interval),
  };
};