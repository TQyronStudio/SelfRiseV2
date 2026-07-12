// Level-Up Event Store (extracted from GamificationService — N28, July 2026)
//
// Cohesive module owning the level-up event history: storing events (with
// 3-second duplicate suppression), reading history, tracking which level-ups
// were already shown to the user, and the in-memory fallback for AsyncStorage
// write failures.
//
// ⚠️ KNOWN INCONSISTENCY (documented, intentionally NOT changed during the
// extraction — faithful port): `storeLevelUpEvent` writes to SQLite when
// USE_SQLITE_GAMIFICATION is on, but `getLevelUpHistory` reads AsyncStorage
// ALWAYS. Today this is harmless — no production consumer reads the history
// (the level-up modal is driven by the 'levelUp' event, not this store) and
// only debug utilities use the read path. If a real consumer is ever added,
// unify the read path to SQLite first (same split-brain class as the July
// 2026 multiplier bug). Candidate for the N27 legacy cleanup.
//
// RULES OF THE MODULE:
// - No imports from gamificationService (require cycle).
// - Keep the public behavior identical to the pre-extraction implementation.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { XPSourceType } from '../../types/gamification';
import { DateString } from '../../types/common';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import { getDatabase } from '../database/init';
import { isLevelMilestone } from '../levelCalculation';
import { today } from '../../utils/date';

// Same storage key the GamificationService always used (legacy store)
const LEVEL_UP_HISTORY_KEY = 'gamification_level_up_history';

export interface LevelUpEvent {
  id: string;
  timestamp: Date;
  date: DateString;
  previousLevel: number;
  newLevel: number;
  totalXPAtLevelUp: number;
  triggerSource: XPSourceType;
  isMilestone: boolean;
  shown?: boolean; // Track if level up modal has been displayed
}

export class LevelUpEventStore {
  /**
   * In-memory tracking for level-ups that failed to be marked as shown —
   * fallback mechanism when AsyncStorage fails.
   */
  private static failedLevelUpIds: Set<string> = new Set();

  /**
   * Store level-up event for analytics and history.
   * Suppresses duplicates within a 3-second window.
   */
  static async storeLevelUpEvent(
    newLevel: number,
    previousLevel: number,
    totalXP: number,
    triggerSource: XPSourceType
  ): Promise<void> {
    try {
      const now = Date.now();

      if (FEATURE_FLAGS.USE_SQLITE_GAMIFICATION) {
        // SQLite implementation - INSERT into level_up_history
        const db = getDatabase();

        // Check for recent duplicate (within last 3 seconds)
        const recentDuplicate = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM level_up_history
           WHERE level = ?
           AND timestamp > ?
           LIMIT 1`,
          [newLevel, now - 3000]
        );

        if (recentDuplicate) {
          console.log(`⚡ Preventing duplicate level-up storage: ${previousLevel} → ${newLevel} (duplicate detected within 3s)`);
          return;
        }

        const levelUpId = `levelup_${now}_${Math.random().toString(36).substr(2, 9)}`;

        await db.runAsync(
          `INSERT INTO level_up_history (
            id, level, timestamp, total_xp_at_levelup, is_milestone
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            levelUpId,
            newLevel,
            now,
            totalXP,
            isLevelMilestone(newLevel) ? 1 : 0,
          ]
        );

        console.log(`🎉 Level-up stored in SQLite: ${previousLevel} → ${newLevel} (${triggerSource})`);
      } else {
        // Legacy AsyncStorage implementation
        const levelUpHistory = await this.getLevelUpHistory();

        // Check for recent duplicate level-up (within last 3 seconds for same level transition)
        const recentDuplicate = levelUpHistory.find(event => {
          const timeDiff = now - event.timestamp.getTime();
          return timeDiff < 3000 &&
                 event.previousLevel === previousLevel &&
                 event.newLevel === newLevel &&
                 event.triggerSource === triggerSource;
        });

        if (recentDuplicate) {
          console.log(`⚡ Preventing duplicate level-up storage: ${previousLevel} → ${newLevel} (duplicate detected within 3s)`);
          return;
        }

        const levelUpEvent: LevelUpEvent = {
          id: `levelup_${now}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          date: today(),
          previousLevel,
          newLevel,
          totalXPAtLevelUp: totalXP,
          triggerSource,
          isMilestone: isLevelMilestone(newLevel),
          shown: false,
        };

        levelUpHistory.push(levelUpEvent);

        // Keep only last 100 level-up events for performance
        const trimmedHistory = levelUpHistory.slice(-100);

        await AsyncStorage.setItem(LEVEL_UP_HISTORY_KEY, JSON.stringify(trimmedHistory));

        console.log(`🎉 Level-up stored: ${previousLevel} → ${newLevel} (${triggerSource})`);
      }
    } catch (error) {
      console.error('LevelUpEventStore.storeLevelUpEvent error:', error);
    }
  }

  /**
   * Get level-up history with legacy data migration.
   * (Reads the AsyncStorage store — see KNOWN INCONSISTENCY above.)
   */
  static async getLevelUpHistory(): Promise<LevelUpEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(LEVEL_UP_HISTORY_KEY);
      if (!stored) return [];

      const events = JSON.parse(stored);
      let migrationNeeded = false;

      // Convert date strings back to Date objects and migrate legacy data
      const migratedEvents = events.map((event: any) => {
        // Check if event is missing the 'shown' property (legacy data)
        if (event.shown === undefined) {
          migrationNeeded = true;
          // Mark legacy level ups as already shown to prevent spam
          console.log(`🔄 Migrating legacy level up: Level ${event.newLevel} → shown: true`);
          return {
            ...event,
            timestamp: new Date(event.timestamp),
            shown: true, // Legacy events should be considered already shown
          };
        }

        return {
          ...event,
          timestamp: new Date(event.timestamp),
        };
      });

      // Save migrated data back to storage if migration was needed
      if (migrationNeeded) {
        await AsyncStorage.setItem(LEVEL_UP_HISTORY_KEY, JSON.stringify(migratedEvents));
        console.log('✅ Legacy level up data migrated successfully');
      }

      return migratedEvents;
    } catch (error) {
      console.error('LevelUpEventStore.getLevelUpHistory error:', error);
      return [];
    }
  }

  /**
   * Get recent level-ups (last N events) that haven't been shown yet.
   * Includes fallback in-memory tracking for AsyncStorage failures.
   */
  static async getRecentLevelUps(count: number = 5): Promise<LevelUpEvent[]> {
    try {
      const history = await this.getLevelUpHistory();

      // Filter unshown level ups with fallback mechanism
      const unshownLevelUps = history.filter(event => {
        // Check both storage-based 'shown' flag and in-memory failed tracking
        const isShownInStorage = event.shown === true;
        const isTrackedAsFailed = this.isLevelUpTrackedAsFailed(event.id);

        // If it's shown in storage OR tracked as failed in memory, don't show it
        return !isShownInStorage && !isTrackedAsFailed;
      });

      const result = unshownLevelUps.slice(-count).reverse(); // Most recent first

      console.log(`📊 getRecentLevelUps: ${result.length} unshown level ups found`);
      return result;
    } catch (error) {
      console.error('LevelUpEventStore.getRecentLevelUps error:', error);
      return [];
    }
  }

  /**
   * Mark a level-up event as shown to prevent repeated modal displays.
   * Includes robust error handling and retry mechanism (exponential backoff).
   */
  static async markLevelUpAsShown(levelUpId: string): Promise<boolean> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const history = await this.getLevelUpHistory();
        const eventIndex = history.findIndex(event => event.id === levelUpId);

        if (eventIndex === -1 || !history[eventIndex]) {
          console.warn(`⚠️ Level-up event not found: ${levelUpId}`);
          return false;
        }

        // Mark as shown
        history[eventIndex]!.shown = true;

        // Attempt to save with error handling
        await AsyncStorage.setItem(LEVEL_UP_HISTORY_KEY, JSON.stringify(history));
        console.log(`✅ Level-up marked as shown: ${levelUpId} (attempt ${attempt + 1})`);
        return true;

      } catch (error) {
        attempt++;
        console.error(`❌ markLevelUpAsShown attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt === maxRetries) {
          console.error(`🚨 CRITICAL: Failed to mark level-up as shown after ${maxRetries} attempts: ${levelUpId}`);
          // Create fallback mechanism - store failed IDs for in-memory tracking
          this.addToFailedLevelUpTracking(levelUpId);
          return false;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    return false;
  }

  private static addToFailedLevelUpTracking(levelUpId: string): void {
    this.failedLevelUpIds.add(levelUpId);
    console.log(`📝 Added to in-memory failed tracking: ${levelUpId}`);
  }

  private static isLevelUpTrackedAsFailed(levelUpId: string): boolean {
    return this.failedLevelUpIds.has(levelUpId);
  }

  /**
   * Debug utility: Clear all failed level up tracking.
   */
  static clearFailedLevelUpTracking(): void {
    const count = this.failedLevelUpIds.size;
    this.failedLevelUpIds.clear();
    console.log(`🧹 Cleared ${count} failed level up tracking entries`);
  }

  /**
   * Debug utility: Get current level up status for troubleshooting.
   */
  static async debugLevelUpStatus(): Promise<{
    totalHistory: number;
    unshownCount: number;
    failedTrackingCount: number;
    recentLevelUps: Array<{
      id: string;
      level: number;
      shown: boolean;
      failedTracked: boolean;
    }>;
  }> {
    try {
      const history = await this.getLevelUpHistory();
      const unshownLevelUps = history.filter(event => {
        const isShownInStorage = event.shown === true;
        const isTrackedAsFailed = this.isLevelUpTrackedAsFailed(event.id);
        return !isShownInStorage && !isTrackedAsFailed;
      });

      return {
        totalHistory: history.length,
        unshownCount: unshownLevelUps.length,
        failedTrackingCount: this.failedLevelUpIds.size,
        recentLevelUps: history.slice(-10).map(event => ({
          id: event.id.slice(-6),
          level: event.newLevel,
          shown: event.shown ?? false,
          failedTracked: this.isLevelUpTrackedAsFailed(event.id)
        }))
      };
    } catch (error) {
      console.error('debugLevelUpStatus error:', error);
      return {
        totalHistory: 0,
        unshownCount: 0,
        failedTrackingCount: this.failedLevelUpIds.size,
        recentLevelUps: []
      };
    }
  }
}
