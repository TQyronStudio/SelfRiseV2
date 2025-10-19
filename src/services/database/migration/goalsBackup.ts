/**
 * Goals Backup & Verification
 * Phase 1.3.1 - Create backup before SQLite migration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface GoalsBackupData {
  goals: any[];
  goalProgress: any[];
  dailyXpTracking: any;
  timestamp: string;
  counts: {
    goals: number;
    progress: number;
  };
}

/**
 * Create backup of goals data from AsyncStorage
 */
export async function createGoalsBackup(): Promise<{ success: boolean; message: string; data?: GoalsBackupData }> {
  try {
    console.log('📦 Starting Goals backup...');

    // Read goals data from AsyncStorage
    const goalsJson = await AsyncStorage.getItem('goals');
    const progressJson = await AsyncStorage.getItem('goal_progress');
    const dailyXpJson = await AsyncStorage.getItem('goal_daily_xp_tracking');

    if (!goalsJson) {
      return {
        success: false,
        message: 'No goals data found in AsyncStorage',
      };
    }

    const goals = JSON.parse(goalsJson);
    const progress = progressJson ? JSON.parse(progressJson) : [];
    const dailyXp = dailyXpJson ? JSON.parse(dailyXpJson) : {};

    // Create backup object
    const backup: GoalsBackupData = {
      goals,
      goalProgress: progress,
      dailyXpTracking: dailyXp,
      timestamp: new Date().toISOString(),
      counts: {
        goals: goals.length,
        progress: progress.length,
      },
    };

    // Save backup to file system
    const backupDir = `${FileSystem.documentDirectory}backups/`;
    const backupPath = `${backupDir}goals_backup_${Date.now()}.json`;

    // Ensure backup directory exists
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }

    // Write backup file
    await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(backup, null, 2));

    console.log(`✅ Goals backup created: ${backupPath}`);
    console.log(`   📊 Goals: ${backup.counts.goals}`);
    console.log(`   📊 Progress: ${backup.counts.progress}`);

    return {
      success: true,
      message: `Backup created: ${backup.counts.goals} goals, ${backup.counts.progress} progress records`,
      data: backup,
    };

  } catch (error) {
    console.error('❌ Goals backup failed:', error);
    return {
      success: false,
      message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify goals data integrity
 */
export async function verifyGoalsData(): Promise<{ valid: boolean; message: string; counts: { goals: number; progress: number }; issues: string[] }> {
  try {
    console.log('🔍 Verifying Goals data...');

    // Read from AsyncStorage
    const goalsJson = await AsyncStorage.getItem('goals');
    const progressJson = await AsyncStorage.getItem('goal_progress');

    if (!goalsJson) {
      return {
        valid: false,
        message: 'No goals data found in AsyncStorage',
        counts: { goals: 0, progress: 0 },
        issues: ['No goals data found'],
      };
    }

    const goals = JSON.parse(goalsJson);
    const progress = progressJson ? JSON.parse(progressJson) : [];

    const issues: string[] = [];

    // Check goals structure
    if (!Array.isArray(goals)) {
      issues.push('Goals is not an array');
    } else {
      goals.forEach((goal, index) => {
        if (!goal.id) issues.push(`Goal ${index} missing id`);
        if (!goal.title) issues.push(`Goal ${index} missing title`);
        if (!goal.unit) issues.push(`Goal ${index} missing unit`);
        if (goal.targetValue === undefined) issues.push(`Goal ${index} missing targetValue`);
        if (!goal.category) issues.push(`Goal ${index} missing category`);
        if (!goal.status) issues.push(`Goal ${index} missing status`);
      });
    }

    // Check progress structure
    if (!Array.isArray(progress)) {
      issues.push('Goal progress is not an array');
    } else {
      progress.forEach((prog, index) => {
        if (!prog.id) issues.push(`Progress ${index} missing id`);
        if (!prog.goalId) issues.push(`Progress ${index} missing goalId`);
        if (prog.value === undefined) issues.push(`Progress ${index} missing value`);
        if (!prog.date) issues.push(`Progress ${index} missing date`);
      });
    }

    console.log(`✅ Goals verification complete:`);
    console.log(`   📊 Goals: ${goals.length}`);
    console.log(`   📊 Progress: ${progress.length}`);
    console.log(`   ⚠️ Issues: ${issues.length}`);

    return {
      valid: issues.length === 0,
      message: issues.length === 0 ? 'Data is valid' : `Found ${issues.length} issues`,
      counts: {
        goals: goals.length,
        progress: progress.length,
      },
      issues,
    };

  } catch (error) {
    console.error('❌ Goals verification failed:', error);
    return {
      valid: false,
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      counts: { goals: 0, progress: 0 },
      issues: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
