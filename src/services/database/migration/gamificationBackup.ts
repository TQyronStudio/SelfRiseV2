/**
 * ========================================
 * PHASE 2.1.1: Gamification Data Backup
 * ========================================
 *
 * Pre-migration backup system for XP, achievements, multipliers, and loyalty data
 * Creates comprehensive backup with verification checksums
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { XPTransaction, XPSourceType } from '../../../types/gamification';

// Backup data structure
export interface GamificationBackup {
  timestamp: number;
  version: string;

  // XP & State
  totalXP: string | null;
  xpTransactions: string | null;
  dailyXPTracking: string | null;
  levelUpHistory: string | null;
  xpBySource: string | null;
  lastActivity: string | null;

  // Achievements
  userAchievements: string | null;
  achievementProgress: string | null;
  unlockEvents: string | null;
  statisticsCache: string | null;

  // Multipliers & Loyalty
  xpMultiplier: string | null;
  loyaltyState: string | null;

  // Pending data
  pendingNotifications: string | null;
}

// Verification checksums
export interface GamificationChecksums {
  totalXPSum: number;              // Sum of all XP transactions
  achievementUnlockCount: number;  // Total achievements unlocked
  totalXPAwarded: number;          // Total XP from achievements
  levelUpEventCount: number;       // Total level-up events
  transactionCount: number;        // Total XP transactions
  dailyTrackingDays: number;       // Number of days tracked
}

/**
 * Create comprehensive backup of all gamification data
 */
export async function createGamificationBackup(): Promise<{
  backup: GamificationBackup;
  checksums: GamificationChecksums;
  backupPath: string;
}> {
  console.log('🔄 Creating gamification data backup...');

  const backup: GamificationBackup = {
    timestamp: Date.now(),
    version: '1.0.0',

    // XP & State
    totalXP: await AsyncStorage.getItem('gamification_total_xp'),
    xpTransactions: await AsyncStorage.getItem('gamification_xp_transactions'),
    dailyXPTracking: await AsyncStorage.getItem('gamification_daily_xp'),
    levelUpHistory: await AsyncStorage.getItem('gamification_level_up_history'),
    xpBySource: await AsyncStorage.getItem('gamification_xp_by_source'),
    lastActivity: await AsyncStorage.getItem('gamification_last_activity'),

    // Achievements
    userAchievements: await AsyncStorage.getItem('achievements_user_data'),
    achievementProgress: await AsyncStorage.getItem('achievements_progress_history'),
    unlockEvents: await AsyncStorage.getItem('achievements_unlock_events'),
    statisticsCache: await AsyncStorage.getItem('achievements_statistics_cache'),

    // Multipliers & Loyalty
    xpMultiplier: await AsyncStorage.getItem('gamification_xp_multiplier'),
    loyaltyState: await AsyncStorage.getItem('loyalty_tracking_state'),

    // Pending data
    pendingNotifications: await AsyncStorage.getItem('gamification_pending_notifications'),
  };

  // Calculate checksums for verification
  const checksums = await calculateGamificationChecksums(backup);

  // Save backup to file system
  const backupPath = `${FileSystem.documentDirectory}gamification_backup_${backup.timestamp}.json`;
  await FileSystem.writeAsStringAsync(
    backupPath,
    JSON.stringify({ backup, checksums }, null, 2)
  );

  console.log(`✅ Gamification backup created: ${backupPath}`);
  console.log(`📊 Checksums:`, checksums);

  return { backup, checksums, backupPath };
}

/**
 * Calculate verification checksums from backup data
 */
async function calculateGamificationChecksums(
  backup: GamificationBackup
): Promise<GamificationChecksums> {
  // Parse XP transactions
  const transactions: XPTransaction[] = backup.xpTransactions
    ? JSON.parse(backup.xpTransactions)
    : [];

  // Calculate total XP sum from transactions
  const totalXPSum = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Parse user achievements
  const userAchievements = backup.userAchievements
    ? JSON.parse(backup.userAchievements)
    : { unlockedAchievements: [], totalXPFromAchievements: 0 };

  // Parse unlock events
  const unlockEvents = backup.unlockEvents
    ? JSON.parse(backup.unlockEvents)
    : [];

  // Parse level-up history
  const levelUpHistory = backup.levelUpHistory
    ? JSON.parse(backup.levelUpHistory)
    : [];

  // Parse daily XP tracking
  const dailyTracking = backup.dailyXPTracking
    ? JSON.parse(backup.dailyXPTracking)
    : {};

  return {
    totalXPSum,
    achievementUnlockCount: userAchievements.unlockedAchievements?.length || 0,
    totalXPAwarded: userAchievements.totalXPFromAchievements || 0,
    levelUpEventCount: levelUpHistory.length,
    transactionCount: transactions.length,
    dailyTrackingDays: Object.keys(dailyTracking).length,
  };
}

/**
 * Verify backup integrity
 */
export async function verifyGamificationBackup(
  backup: GamificationBackup,
  checksums: GamificationChecksums
): Promise<{ valid: boolean; errors: string[] }> {
  console.log('🔍 Verifying gamification backup...');

  const errors: string[] = [];

  // Verify XP data exists
  if (!backup.totalXP && checksums.transactionCount > 0) {
    errors.push('Missing totalXP but transactions exist');
  }

  // Verify transactions
  if (!backup.xpTransactions && checksums.transactionCount > 0) {
    errors.push('Missing xpTransactions data');
  }

  // Verify XP sum consistency
  const totalXP = backup.totalXP ? parseInt(backup.totalXP, 10) : 0;
  if (Math.abs(totalXP - checksums.totalXPSum) > 1) { // Allow 1 XP tolerance for rounding
    errors.push(
      `XP sum mismatch: stored=${totalXP}, calculated=${checksums.totalXPSum}`
    );
  }

  // Verify achievement data
  if (!backup.userAchievements && checksums.achievementUnlockCount > 0) {
    errors.push('Missing userAchievements but unlocks exist');
  }

  // Verify level-up history
  if (!backup.levelUpHistory && checksums.levelUpEventCount > 0) {
    errors.push('Missing levelUpHistory data');
  }

  if (errors.length === 0) {
    console.log('✅ Backup verification passed');
    return { valid: true, errors: [] };
  } else {
    console.error('❌ Backup verification failed:', errors);
    return { valid: false, errors };
  }
}

/**
 * List all available gamification backups
 */
export async function listGamificationBackups(): Promise<string[]> {
  try {
    const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
    return files
      .filter(f => f.startsWith('gamification_backup_'))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
}

/**
 * Load backup from file
 */
export async function loadGamificationBackup(
  filename: string
): Promise<{ backup: GamificationBackup; checksums: GamificationChecksums } | null> {
  try {
    const backupPath = `${FileSystem.documentDirectory}${filename}`;
    const content = await FileSystem.readAsStringAsync(backupPath);
    const data = JSON.parse(content);

    return {
      backup: data.backup,
      checksums: data.checksums,
    };
  } catch (error) {
    console.error('Error loading backup:', error);
    return null;
  }
}

/**
 * Delete old backups (keep only last 3)
 */
export async function cleanupOldBackups(): Promise<void> {
  const backups = await listGamificationBackups();

  // Keep only last 3 backups
  const toDelete = backups.slice(3);

  for (const filename of toDelete) {
    try {
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.deleteAsync(path, { idempotent: true });
      console.log(`🗑️  Deleted old backup: ${filename}`);
    } catch (error) {
      console.error(`Failed to delete ${filename}:`, error);
    }
  }

  if (toDelete.length > 0) {
    console.log(`✅ Cleaned up ${toDelete.length} old backups`);
  }
}
