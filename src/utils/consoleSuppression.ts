/**
 * Console Warning Suppression Utility
 * 
 * Handles suppression of known benign warnings in development environment
 * specifically for Expo SDK 53 + new React Native architecture issues.
 */

interface SuppressionConfig {
  enabled: boolean;
  patterns: string[];
}

const DEFAULT_SUPPRESSION_PATTERNS = [
  'ExpoLinearGradient', 
  'NativeViewManagerAdapter',
  'Unable to get the view config for .* from module .* default view ExpoLinearGradient',
  'The native view manager for module\\(ExpoLinearGradient\\).*from NativeViewManagerAdapter.*isn\'t exported by expo-modules-core',
  'NativeViewManagerAdapter for ExpoLinearGradient isn\'t exported by expo-modules-core'
];

class ConsoleSuppression {
  private originalWarn: typeof console.warn;
  private originalLog: typeof console.log;
  private isActive: boolean = false;
  private config: SuppressionConfig;

  constructor(config: Partial<SuppressionConfig> = {}) {
    this.originalWarn = console.warn;
    this.originalLog = console.log;
    this.config = {
      enabled: config.enabled ?? __DEV__, // Only in development by default
      patterns: config.patterns ?? DEFAULT_SUPPRESSION_PATTERNS
    };
  }

  /**
   * Activate console suppression for specified patterns
   */
  activate(): void {
    if (!this.config.enabled || this.isActive) return;

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (this.shouldSuppress(message)) {
        return; // Suppress this warning
      }
      this.originalWarn.apply(console, args);
    };

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (this.shouldSuppress(message)) {
        return; // Suppress this log
      }
      this.originalLog.apply(console, args);
    };

    this.isActive = true;
  }

  /**
   * Deactivate console suppression and restore original console methods
   */
  deactivate(): void {
    if (!this.isActive) return;

    console.warn = this.originalWarn;
    console.log = this.originalLog;
    this.isActive = false;
  }

  /**
   * Check if a message should be suppressed based on configured patterns
   */
  private shouldSuppress(message: string): boolean {
    return this.config.patterns.some(pattern => {
      // First try simple string matching
      if (message.includes(pattern)) {
        return true;
      }
      
      // Then try regex matching with error handling
      try {
        return message.match(new RegExp(pattern, 'i')) !== null;
      } catch (error) {
        // If regex is invalid, fall back to string matching only
        console.warn(`Invalid regex pattern in console suppression: ${pattern}`);
        return false;
      }
    });
  }

  /**
   * Update suppression patterns
   */
  updatePatterns(patterns: string[]): void {
    this.config.patterns = patterns;
  }

  /**
   * Add a new suppression pattern
   */
  addPattern(pattern: string): void {
    if (!this.config.patterns.includes(pattern)) {
      this.config.patterns.push(pattern);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SuppressionConfig {
    return { ...this.config };
  }

  /**
   * Check if suppression is currently active
   */
  isActivated(): boolean {
    return this.isActive;
  }
}

// Global singleton instance
export const consoleSuppression = new ConsoleSuppression();

// Convenience functions
export const suppressExpoLinearGradientWarnings = () => {
  consoleSuppression.activate();
};

export const restoreConsoleOutput = () => {
  consoleSuppression.deactivate();
};

// Auto-activation for ExpoLinearGradient warnings in development
if (__DEV__) {
  consoleSuppression.activate();
}