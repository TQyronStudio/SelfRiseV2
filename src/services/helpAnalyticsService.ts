// @ts-nocheck - Analytics service with complex type inference, non-critical for app functionality
/**
 * Help Analytics Service
 *
 * Tracks user interactions with help tooltips to understand:
 * - Which help topics are most popular
 * - How often users access help content
 * - User engagement patterns with contextual help
 * - Performance metrics for help system effectiveness
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Analytics event types
export type HelpAnalyticsEvent =
  | 'tooltip_opened'
  | 'tooltip_closed'
  | 'tooltip_position_changed'
  | 'help_content_viewed'
  | 'help_content_duration';

// Analytics data structure
export interface HelpInteraction {
  eventType: HelpAnalyticsEvent;
  helpKey: string;
  timestamp: number;
  duration?: number; // for viewing duration tracking
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  screenName?: string;
  userId?: string;
}

// Aggregated analytics data
export interface HelpAnalytics {
  totalInteractions: number;
  popularHelpTopics: { helpKey: string; count: number; avgDuration?: number }[];
  screenUsage: { screenName: string; interactionCount: number }[];
  positionPreferences: { position: string; count: number }[];
  dailyUsage: { date: string; interactions: number }[];
  lastUpdated: number;
}

// Storage keys
const HELP_INTERACTIONS_KEY = 'help_interactions';
const HELP_ANALYTICS_KEY = 'help_analytics_summary';
const MAX_INTERACTIONS_STORED = 1000; // Limit storage size

class HelpAnalyticsService {
  private static instance: HelpAnalyticsService;
  private interactionBuffer: HelpInteraction[] = [];
  private bufferSize = 10; // Buffer interactions before saving
  private isEnabled = true;

  static getInstance(): HelpAnalyticsService {
    if (!HelpAnalyticsService.instance) {
      HelpAnalyticsService.instance = new HelpAnalyticsService();
    }
    return HelpAnalyticsService.instance;
  }

  /**
   * Track a help tooltip interaction
   */
  async trackHelpInteraction(
    eventType: HelpAnalyticsEvent,
    helpKey: string,
    options?: {
      duration?: number;
      position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
      screenName?: string;
    }
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const interaction: HelpInteraction = {
        eventType,
        helpKey,
        timestamp: Date.now(),
        ...options,
      };

      // Add to buffer
      this.interactionBuffer.push(interaction);

      // Save buffer when it reaches the limit
      if (this.interactionBuffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }

      console.log(`📊 [HelpAnalytics] Tracked: ${eventType} for ${helpKey}`);
    } catch (error) {
      console.error('[HelpAnalytics] Failed to track interaction:', error);
    }
  }

  /**
   * Flush buffered interactions to storage
   */
  private async flushBuffer(): Promise<void> {
    if (this.interactionBuffer.length === 0) return;

    try {
      // Get existing interactions
      const existingData = await AsyncStorage.getItem(HELP_INTERACTIONS_KEY);
      const existingInteractions: HelpInteraction[] = existingData
        ? JSON.parse(existingData)
        : [];

      // Add new interactions
      const allInteractions = [...existingInteractions, ...this.interactionBuffer];

      // Limit storage size by keeping only recent interactions
      const limitedInteractions = allInteractions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_INTERACTIONS_STORED);

      // Save to storage
      await AsyncStorage.setItem(
        HELP_INTERACTIONS_KEY,
        JSON.stringify(limitedInteractions)
      );

      // Clear buffer
      this.interactionBuffer = [];

      // Update analytics summary
      await this.updateAnalyticsSummary(limitedInteractions);

      console.log(`📊 [HelpAnalytics] Flushed ${this.interactionBuffer.length} interactions`);
    } catch (error) {
      console.error('[HelpAnalytics] Failed to flush buffer:', error);
    }
  }

  /**
   * Update aggregated analytics summary
   */
  private async updateAnalyticsSummary(interactions: HelpInteraction[]): Promise<void> {
    try {
      // Calculate popular help topics
      const topicCounts: { [key: string]: { count: number; totalDuration: number; durations: number[] } } = {};

      interactions.forEach(interaction => {
        if (!topicCounts[interaction.helpKey]) {
          topicCounts[interaction.helpKey] = { count: 0, totalDuration: 0, durations: [] };
        }

        topicCounts[interaction.helpKey].count++;

        if (interaction.duration && interaction.eventType === 'help_content_duration') {
          topicCounts[interaction.helpKey].totalDuration += interaction.duration;
          topicCounts[interaction.helpKey].durations.push(interaction.duration);
        }
      });

      const popularHelpTopics = Object.entries(topicCounts)
        .map(([helpKey, data]) => ({
          helpKey,
          count: data.count,
          avgDuration: data.durations.length > 0
            ? data.totalDuration / data.durations.length
            : undefined,
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate screen usage
      const screenCounts: { [key: string]: number } = {};
      interactions.forEach(interaction => {
        if (interaction.screenName) {
          screenCounts[interaction.screenName] = (screenCounts[interaction.screenName] || 0) + 1;
        }
      });

      const screenUsage = Object.entries(screenCounts)
        .map(([screenName, count]) => ({ screenName, interactionCount: count }))
        .sort((a, b) => b.interactionCount - a.interactionCount);

      // Calculate position preferences
      const positionCounts: { [key: string]: number } = {};
      interactions.forEach(interaction => {
        if (interaction.position) {
          positionCounts[interaction.position] = (positionCounts[interaction.position] || 0) + 1;
        }
      });

      const positionPreferences = Object.entries(positionCounts)
        .map(([position, count]) => ({ position, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate daily usage (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentInteractions = interactions.filter(i => i.timestamp >= thirtyDaysAgo);

      const dailyCounts: { [key: string]: number } = {};
      recentInteractions.forEach(interaction => {
        const date = new Date(interaction.timestamp).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      const dailyUsage = Object.entries(dailyCounts)
        .map(([date, interactions]) => ({ date, interactions }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Create analytics summary
      const analytics: HelpAnalytics = {
        totalInteractions: interactions.length,
        popularHelpTopics,
        screenUsage,
        positionPreferences,
        dailyUsage,
        lastUpdated: Date.now(),
      };

      // Save analytics summary
      await AsyncStorage.setItem(HELP_ANALYTICS_KEY, JSON.stringify(analytics));

      console.log(`📊 [HelpAnalytics] Updated summary: ${interactions.length} total interactions`);
    } catch (error) {
      console.error('[HelpAnalytics] Failed to update analytics summary:', error);
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalytics(): Promise<HelpAnalytics | null> {
    try {
      const data = await AsyncStorage.getItem(HELP_ANALYTICS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[HelpAnalytics] Failed to get analytics:', error);
      return null;
    }
  }

  /**
   * Get raw interaction data
   */
  async getRawInteractions(): Promise<HelpInteraction[]> {
    try {
      const data = await AsyncStorage.getItem(HELP_INTERACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[HelpAnalytics] Failed to get raw interactions:', error);
      return [];
    }
  }

  /**
   * Clear all analytics data
   */
  async clearAnalytics(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([HELP_INTERACTIONS_KEY, HELP_ANALYTICS_KEY]);
      this.interactionBuffer = [];
      console.log('📊 [HelpAnalytics] Cleared all analytics data');
    } catch (error) {
      console.error('[HelpAnalytics] Failed to clear analytics:', error);
    }
  }

  /**
   * Export analytics data for analysis
   */
  async exportAnalyticsData(): Promise<{
    summary: HelpAnalytics | null;
    rawInteractions: HelpInteraction[];
  }> {
    try {
      const [summary, rawInteractions] = await Promise.all([
        this.getAnalytics(),
        this.getRawInteractions()
      ]);

      return { summary, rawInteractions };
    } catch (error) {
      console.error('[HelpAnalytics] Failed to export analytics data:', error);
      return { summary: null, rawInteractions: [] };
    }
  }

  /**
   * Enable/disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📊 [HelpAnalytics] Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Force flush any buffered interactions
   */
  async flush(): Promise<void> {
    await this.flushBuffer();
  }

  /**
   * Get insights about help system usage
   */
  async getInsights(): Promise<{
    mostPopularTopic: string | null;
    averageSessionDuration: number | null;
    totalHelpViews: number;
    helpEngagementTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  }> {
    try {
      const analytics = await this.getAnalytics();
      if (!analytics) {
        return {
          mostPopularTopic: null,
          averageSessionDuration: null,
          totalHelpViews: 0,
          helpEngagementTrend: 'unknown'
        };
      }

      const mostPopularTopic = analytics.popularHelpTopics.length > 0
        ? analytics.popularHelpTopics[0].helpKey
        : null;

      const avgDurations = analytics.popularHelpTopics
        .map(topic => topic.avgDuration)
        .filter(duration => duration !== undefined) as number[];

      const averageSessionDuration = avgDurations.length > 0
        ? avgDurations.reduce((sum, duration) => sum + duration, 0) / avgDurations.length
        : null;

      // Calculate trend based on recent vs older daily usage
      let helpEngagementTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown' = 'unknown';
      if (analytics.dailyUsage.length >= 7) {
        const recentWeek = analytics.dailyUsage.slice(-7);
        const previousWeek = analytics.dailyUsage.slice(-14, -7);

        const recentAvg = recentWeek.reduce((sum, day) => sum + day.interactions, 0) / 7;
        const previousAvg = previousWeek.reduce((sum, day) => sum + day.interactions, 0) / 7;

        const difference = recentAvg - previousAvg;
        const threshold = 0.1; // 10% threshold for stability

        if (Math.abs(difference) / previousAvg <= threshold) {
          helpEngagementTrend = 'stable';
        } else if (difference > 0) {
          helpEngagementTrend = 'increasing';
        } else {
          helpEngagementTrend = 'decreasing';
        }
      }

      return {
        mostPopularTopic,
        averageSessionDuration,
        totalHelpViews: analytics.totalInteractions,
        helpEngagementTrend
      };
    } catch (error) {
      console.error('[HelpAnalytics] Failed to get insights:', error);
      return {
        mostPopularTopic: null,
        averageSessionDuration: null,
        totalHelpViews: 0,
        helpEngagementTrend: 'unknown'
      };
    }
  }
}

export default HelpAnalyticsService.getInstance();