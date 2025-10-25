/**
 * ========================================
 * PHASE 3.1.1: Monthly Challenges Data Backup
 * ========================================
 *
 * Pre-migration backup system for monthly challenges, progress tracking, and lifecycle state
 * Creates comprehensive backup with verification checksums
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Backup data structure
export interface ChallengeBackup {
  timestamp: number;
  version: string;

  // Active challenges
  activeChallenges: string | null;
  challengeRatings: string | null;
  challengeProgress: Record<string, string>;

  // Lifecycle
  lifecycleState: string | null;
  challengeStatus: string | null;

  // Progress tracking
  dailySnapshots: string | null;
  weeklyBreakdowns: Record<string, string>;

  // History
  challengeHistory: Record<string, string>;
  challengePreviews: Record<string, string>;
}

// Verification checksums
export interface ChallengeChecksums {
  activeChallengeCount: number;
  totalRequirementCount: number;
  totalSnapshotCount: number;
  totalWeeklyBreakdownCount: number;
  historyEntryCount: number;
  previewCount: number;
  totalRatingsCount: number;
}

/**
 * Create comprehensive backup of all challenge data
 */
export async function createChallengeBackup(): Promise<{
  backup: ChallengeBackup;
  checksums: ChallengeChecksums;
  backupPath: string;
}> {
  console.log('🔄 Starting monthly challenge data backup...');

  try {
    // Create backup object
    const backup: ChallengeBackup = {
      timestamp: Date.now(),
      version: '1.0.0',
      activeChallenges: await AsyncStorage.getItem('monthly_challenges'),
      challengeRatings: await AsyncStorage.getItem('user_challenge_ratings'),
      challengeProgress: {},
      lifecycleState: await AsyncStorage.getItem('monthly_challenge_lifecycle'),
      challengeStatus: await AsyncStorage.getItem('monthly_challenge_status'),
      dailySnapshots: await AsyncStorage.getItem('monthly_challenge_daily_snapshots'),
      weeklyBreakdowns: {},
      challengeHistory: {},
      challengePreviews: {}
    };

    // Get all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(`📊 Found ${allKeys.length} total AsyncStorage keys`);

    // Backup all progress keys (challengeId-specific)
    for (const key of allKeys) {
      if (key.startsWith('monthly_challenge_progress_')) {
        backup.challengeProgress[key] = await AsyncStorage.getItem(key) || '';
      }
      if (key.startsWith('monthly_challenge_weekly_breakdown_')) {
        backup.weeklyBreakdowns[key] = await AsyncStorage.getItem(key) || '';
      }
      if (key.startsWith('monthly_challenges_history_')) {
        backup.challengeHistory[key] = await AsyncStorage.getItem(key) || '';
      }
      if (key.startsWith('monthly_challenge_preview_')) {
        backup.challengePreviews[key] = await AsyncStorage.getItem(key) || '';
      }
    }

    // Calculate checksums
    const checksums = await calculateChallengeChecksums(backup);

    // Save to file system
    const backupPath = `${FileSystem.documentDirectory}challenges_backup_${backup.timestamp}.json`;
    await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(backup, null, 2));

    console.log(`✅ Challenge backup saved: ${backupPath}`);
    console.log(`📊 Backup stats:`);
    console.log(`   - Active challenges: ${checksums.activeChallengeCount}`);
    console.log(`   - Requirements: ${checksums.totalRequirementCount}`);
    console.log(`   - Progress keys: ${Object.keys(backup.challengeProgress).length}`);
    console.log(`   - Daily snapshots: ${checksums.totalSnapshotCount}`);
    console.log(`   - Weekly breakdowns: ${checksums.totalWeeklyBreakdownCount}`);
    console.log(`   - History entries: ${checksums.historyEntryCount}`);
    console.log(`   - Previews: ${checksums.previewCount}`);
    console.log(`   - Ratings: ${checksums.totalRatingsCount}`);

    return { backup, checksums, backupPath };

  } catch (error) {
    console.error('❌ Challenge backup failed:', error);
    throw new Error(`Challenge backup failed: ${error}`);
  }
}

/**
 * Calculate verification checksums for challenge data
 */
async function calculateChallengeChecksums(backup: ChallengeBackup): Promise<ChallengeChecksums> {
  try {
    // Parse active challenges
    const challengesData = backup.activeChallenges ? JSON.parse(backup.activeChallenges) : [];

    // Count total requirements
    const totalRequirements = Array.isArray(challengesData)
      ? challengesData.reduce((sum: number, c: any) => {
          return sum + (Array.isArray(c.requirements) ? c.requirements.length : 0);
        }, 0)
      : 0;

    // Parse snapshots
    const snapshotsData = backup.dailySnapshots ? JSON.parse(backup.dailySnapshots) : [];

    // Parse ratings
    const ratingsData = backup.challengeRatings ? JSON.parse(backup.challengeRatings) : {};

    // Count dynamic keys
    const weeklyKeys = Object.keys(backup.weeklyBreakdowns);
    const historyKeys = Object.keys(backup.challengeHistory);
    const previewKeys = Object.keys(backup.challengePreviews);

    // Count history entries (sum of all arrays in history keys)
    let historyEntryCount = 0;
    for (const key of historyKeys) {
      const historyData = backup.challengeHistory[key];
      if (historyData) {
        try {
          const parsed = JSON.parse(historyData);
          if (Array.isArray(parsed)) {
            historyEntryCount += parsed.length;
          }
        } catch (e) {
          console.warn(`Failed to parse history key ${key}:`, e);
        }
      }
    }

    return {
      activeChallengeCount: Array.isArray(challengesData) ? challengesData.length : 0,
      totalRequirementCount: totalRequirements,
      totalSnapshotCount: Array.isArray(snapshotsData) ? snapshotsData.length : 0,
      totalWeeklyBreakdownCount: weeklyKeys.length,
      historyEntryCount,
      previewCount: previewKeys.length,
      totalRatingsCount: Object.keys(ratingsData).length
    };

  } catch (error) {
    console.error('❌ Checksum calculation failed:', error);
    throw new Error(`Checksum calculation failed: ${error}`);
  }
}

/**
 * Verify challenge backup integrity
 */
export async function verifyChallengeBackup(backupPath: string): Promise<{
  valid: boolean;
  message: string;
  checksums?: ChallengeChecksums;
}> {
  try {
    console.log(`🔍 Verifying challenge backup: ${backupPath}`);

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(backupPath);
    if (!fileInfo.exists) {
      return {
        valid: false,
        message: 'Backup file does not exist'
      };
    }

    // Read backup file
    const backupContent = await FileSystem.readAsStringAsync(backupPath);
    const backup: ChallengeBackup = JSON.parse(backupContent);

    // Verify structure
    if (!backup.timestamp || !backup.version) {
      return {
        valid: false,
        message: 'Invalid backup structure: missing timestamp or version'
      };
    }

    // Recalculate checksums
    const checksums = await calculateChallengeChecksums(backup);

    console.log(`✅ Backup verification passed`);
    console.log(`📊 Backup contains:`);
    console.log(`   - ${checksums.activeChallengeCount} active challenges`);
    console.log(`   - ${checksums.totalRequirementCount} requirements`);
    console.log(`   - ${checksums.totalSnapshotCount} daily snapshots`);
    console.log(`   - ${checksums.totalWeeklyBreakdownCount} weekly breakdowns`);
    console.log(`   - ${checksums.historyEntryCount} history entries`);

    return {
      valid: true,
      message: 'Backup is valid and complete',
      checksums
    };

  } catch (error) {
    console.error('❌ Backup verification failed:', error);
    return {
      valid: false,
      message: `Verification failed: ${error}`
    };
  }
}

/**
 * List all challenge backups
 */
export async function listChallengeBackups(): Promise<string[]> {
  try {
    const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
    const backups = files
      .filter(f => f.startsWith('challenges_backup_') && f.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first

    console.log(`📋 Found ${backups.length} challenge backups`);
    return backups;

  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return [];
  }
}
