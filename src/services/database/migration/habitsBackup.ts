/**
 * Habits Backup & Verification
 * Phase 1.2.1 - Create backup before SQLite migration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface HabitsBackupData {
  habits: any[];
  habitCompletions: any[];
  timestamp: string;
  counts: {
    habits: number;
    completions: number;
  };
}

/**
 * Create backup of habits data from AsyncStorage
 */
export async function createHabitsBackup(): Promise<{ success: boolean; message: string; data?: HabitsBackupData }> {
  try {
    console.log('📦 Starting Habits backup...');

    // Read habits data from AsyncStorage (using STORAGE_KEYS: 'habits', 'habit_completions')
    const habitsJson = await AsyncStorage.getItem('habits');
    const completionsJson = await AsyncStorage.getItem('habit_completions');

    if (!habitsJson) {
      return {
        success: false,
        message: 'No habits data found in AsyncStorage',
      };
    }

    const habits = JSON.parse(habitsJson);
    const completions = completionsJson ? JSON.parse(completionsJson) : [];

    // Create backup object
    const backup: HabitsBackupData = {
      habits,
      habitCompletions: completions,
      timestamp: new Date().toISOString(),
      counts: {
        habits: habits.length,
        completions: completions.length,
      },
    };

    // Save backup to file system
    const backupDir = `${FileSystem.documentDirectory}backups/`;
    const backupPath = `${backupDir}habits_backup_${Date.now()}.json`;

    // Ensure backup directory exists
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }

    // Write backup file
    await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(backup, null, 2));

    console.log(`✅ Habits backup created: ${backupPath}`);
    console.log(`   📊 Habits: ${backup.counts.habits}`);
    console.log(`   📊 Completions: ${backup.counts.completions}`);

    return {
      success: true,
      message: `Backup created: ${backup.counts.habits} habits, ${backup.counts.completions} completions`,
      data: backup,
    };

  } catch (error) {
    console.error('❌ Habits backup failed:', error);
    return {
      success: false,
      message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify habits data integrity
 */
export async function verifyHabitsData(): Promise<{ valid: boolean; message: string; counts: { habits: number; completions: number }; issues: string[] }> {
  try {
    console.log('🔍 Verifying Habits data...');

    // Read from AsyncStorage
    const habitsJson = await AsyncStorage.getItem('habits');
    const completionsJson = await AsyncStorage.getItem('habit_completions');

    if (!habitsJson) {
      return {
        valid: false,
        message: 'No habits data found in AsyncStorage',
        counts: { habits: 0, completions: 0 },
        issues: ['No habits data found'],
      };
    }

    const habits = JSON.parse(habitsJson);
    const completions = completionsJson ? JSON.parse(completionsJson) : [];

    const issues: string[] = [];

    // Check habits structure
    if (!Array.isArray(habits)) {
      issues.push('Habits is not an array');
    } else {
      habits.forEach((habit, index) => {
        if (!habit.id) issues.push(`Habit ${index} missing id`);
        if (!habit.name) issues.push(`Habit ${index} missing name`);
        if (!habit.createdAt) issues.push(`Habit ${index} missing createdAt`);
      });
    }

    // Check completions structure
    if (!Array.isArray(completions)) {
      issues.push('Habit completions is not an array');
    } else {
      completions.forEach((completion, index) => {
        if (!completion.id) issues.push(`Completion ${index} missing id`);
        if (!completion.habitId) issues.push(`Completion ${index} missing habitId`);
        if (!completion.date) issues.push(`Completion ${index} missing date`);
      });
    }

    console.log(`✅ Habits verification complete:`);
    console.log(`   📊 Habits: ${habits.length}`);
    console.log(`   📊 Completions: ${completions.length}`);
    console.log(`   ⚠️ Issues: ${issues.length}`);

    return {
      valid: issues.length === 0,
      message: issues.length === 0 ? 'Data is valid' : `Found ${issues.length} issues`,
      counts: {
        habits: habits.length,
        completions: completions.length,
      },
      issues,
    };

  } catch (error) {
    console.error('❌ Habits verification failed:', error);
    return {
      valid: false,
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      counts: { habits: 0, completions: 0 },
      issues: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
