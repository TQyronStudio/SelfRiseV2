/**
 * ========================================
 * MIGRATION TEST SCREEN
 * ========================================
 *
 * Temporary screen for testing Phase 1.1.1 backup
 * DELETE THIS FILE after migration is complete
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { runBackupTest, checkBackup, createBackupOnly } from '../../src/services/database/migration/runBackupTest';
import { getDatabase, isDatabaseInitialized } from '../../src/services/database/init';
import { migrateJournalData, getMigrationStatus } from '../../src/services/database/migration/journalMigration';
import { diagnoseBackup } from '../../src/services/database/migration/diagnoseBackup';
import { sqliteGratitudeStorage } from '../../src/services/storage/SQLiteGratitudeStorage';
import { today } from '../../src/utils/date';
import { createHabitsBackup, verifyHabitsData } from '../../src/services/database/migration/habitsBackup';
import { migrateHabitsData, getHabitsMigrationStatus } from '../../src/services/database/migration/habitsMigration';
import { createGoalsBackup, verifyGoalsData } from '../../src/services/database/migration/goalsBackup';
import { migrateGoalsToSQLite } from '../../src/services/database/migration/goalsMigration';
import { createGamificationBackup, verifyGamificationBackup } from '../../src/services/database/migration/gamificationBackup';
import { migrateGamificationToSQLite } from '../../src/services/database/migration/gamificationMigration';
import { createChallengeBackup, verifyChallengeBackup } from '../../src/services/database/migration/challengesBackup';

export default function MigrationTestScreen() {
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setTestLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLog = () => {
    setTestLog([]);
  };

  const handleRunBackupTest = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🚀 Starting backup test...');

    try {
      const result = await runBackupTest();

      if (result.success) {
        addLog('✅ BACKUP TEST PASSED');
        addLog(result.message);
        Alert.alert('Success', 'Backup test passed! Ready for migration.', [{ text: 'OK' }]);
      } else {
        addLog('❌ BACKUP TEST FAILED');
        addLog(result.message);
        Alert.alert('Failed', `Backup test failed: ${result.message}`, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Test crashed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckBackup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔍 Checking backup status...');

    try {
      const result = await checkBackup();

      if (result.valid) {
        addLog('✅ Backup is valid');
        addLog(result.message);
      } else {
        addLog('❌ Backup is invalid or missing');
        addLog(result.message);
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateBackup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('📦 Creating backup...');

    try {
      const result = await createBackupOnly();

      if (result.success) {
        addLog('✅ Backup created successfully');
        addLog(`Entries backed up: ${result.entriesCount}`);
        Alert.alert('Success', `Backup created: ${result.entriesCount} entries`, [{ text: 'OK' }]);
      } else {
        addLog('❌ Backup creation failed');
        addLog(result.message);
        Alert.alert('Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Backup creation crashed', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestSQLite = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🗄️ Testing SQLite database...');

    try {
      // Check if initialized
      const initialized = isDatabaseInitialized();
      addLog(`Database initialized: ${initialized ? '✅ Yes' : '❌ No'}`);

      if (!initialized) {
        addLog('❌ Database not initialized! Check app logs.');
        Alert.alert('Error', 'SQLite database not initialized', [{ text: 'OK' }]);
        return;
      }

      // Try to get database
      const db = getDatabase();
      addLog('✅ Database instance retrieved');

      // Try a simple query
      const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM journal_entries');
      addLog(`✅ Query successful: ${result?.count ?? 0} entries in database`);

      // Check tables exist
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      addLog(`✅ Found ${tables.length} tables:`);
      tables.forEach(t => addLog(`   - ${t.name}`));

      Alert.alert('Success', `SQLite is working! ${result?.count ?? 0} entries found.`, [{ text: 'OK' }]);

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'SQLite test failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunMigration = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🚀 Starting journal data migration...');

    try {
      // First check migration status
      addLog('📋 Checking migration status...');
      const status = await getMigrationStatus();

      if (status.isMigrated) {
        addLog(`⚠️  Database already contains ${status.entryCount} entries`);
        addLog('Migration appears to have already been completed.');
        Alert.alert(
          'Already Migrated',
          `Database contains ${status.entryCount} entries. Migration may have already been completed.`,
          [{ text: 'OK' }]
        );
        return;
      }

      addLog('✅ Database is empty, ready to migrate');

      // Run migration
      addLog('📋 Starting migration transaction...');
      const result = await migrateJournalData();

      if (result.success) {
        addLog('✅ MIGRATION SUCCESSFUL!');
        addLog(`   - Entries migrated: ${result.entriesMigrated}`);
        addLog(`   - Streak migrated: ${result.streakMigrated ? 'Yes' : 'No'}`);
        addLog(`   - Payments migrated: ${result.paymentsMigrated}`);
        addLog(result.message);

        Alert.alert(
          'Migration Complete!',
          `Successfully migrated ${result.entriesMigrated} entries and streak data.`,
          [{ text: 'OK' }]
        );
      } else {
        addLog('❌ MIGRATION FAILED');
        addLog(result.message);
        result.errors.forEach(err => addLog(`   - ${err}`));

        Alert.alert(
          'Migration Failed',
          result.message,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      addLog(`❌ Migration crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Migration crashed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckMigrationStatus = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔍 Checking migration status...');

    try {
      const status = await getMigrationStatus();

      addLog(`Migration status:`);
      addLog(`   - Is migrated: ${status.isMigrated ? 'Yes ✅' : 'No ❌'}`);
      addLog(`   - Entry count: ${status.entryCount}`);
      addLog(`   - Has streak: ${status.hasStreak ? 'Yes ✅' : 'No ❌'}`);
      addLog(`   - Payment count: ${status.paymentCount}`);

      if (status.isMigrated) {
        Alert.alert(
          'Migration Status',
          `Database contains ${status.entryCount} entries. Migration completed.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Migration Status',
          'Database is empty. Migration not yet completed.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDiagnoseBackup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔬 Running backup diagnostic...');

    try {
      await diagnoseBackup();
      addLog('✅ Diagnostic complete - check Metro console for details');
      Alert.alert('Diagnostic Complete', 'Check Metro console for detailed analysis', [{ text: 'OK' }]);
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestSQLiteWrite = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('✍️ Testing SQLite WRITE operations...');

    try {
      const testId = `test_${Date.now()}`;
      const testDate = today();

      // Test 1: CREATE
      addLog('\n📋 Test 1: Create entry');
      const newEntry = await sqliteGratitudeStorage.create({
        id: testId,
        content: 'Test entry from SQLite WRITE test',
        type: 'gratitude',
        date: testDate,
        order: 99,
        isBonus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      addLog(`✅ Entry created: id=${newEntry.id}`);
      addLog(`   Content: "${newEntry.content}"`);

      // Test 2: READ back
      addLog('\n📋 Test 2: Read back created entry');
      const readBack = await sqliteGratitudeStorage.getById(testId);
      addLog(`✅ Entry found: ${readBack ? 'Yes' : 'No'}`);
      if (readBack) {
        addLog(`   Content matches: ${readBack.content === newEntry.content ? 'Yes' : 'No'}`);
      }

      // Test 3: UPDATE
      addLog('\n📋 Test 3: Update entry');
      const updated = await sqliteGratitudeStorage.update(testId, {
        content: 'UPDATED test content'
      });
      addLog(`✅ Entry updated`);
      addLog(`   New content: "${updated.content}"`);

      // Test 4: READ after update
      addLog('\n📋 Test 4: Read after update');
      const readAfterUpdate = await sqliteGratitudeStorage.getById(testId);
      addLog(`✅ Content updated correctly: ${readAfterUpdate?.content === 'UPDATED test content' ? 'Yes' : 'No'}`);

      // Test 5: UPDATE STREAK
      addLog('\n📋 Test 5: Update streak');
      const currentStreak = await sqliteGratitudeStorage.getStreak();
      addLog(`   Current streak before: ${currentStreak.currentStreak}`);

      await sqliteGratitudeStorage.updateStreak({
        starCount: currentStreak.starCount + 1
      });

      const updatedStreak = await sqliteGratitudeStorage.getStreak();
      addLog(`✅ Star count incremented: ${currentStreak.starCount} → ${updatedStreak.starCount}`);

      // Test 6: DELETE
      addLog('\n📋 Test 6: Delete entry');
      await sqliteGratitudeStorage.delete(testId);
      addLog(`✅ Entry deleted`);

      // Test 7: READ after delete
      addLog('\n📋 Test 7: Verify deletion');
      const readAfterDelete = await sqliteGratitudeStorage.getById(testId);
      addLog(`✅ Entry not found: ${readAfterDelete === null ? 'Yes (correct)' : 'No (error!)'}`);

      // Restore star count
      await sqliteGratitudeStorage.updateStreak({
        starCount: currentStreak.starCount
      });

      addLog('\n✅ ALL WRITE TESTS PASSED!');
      Alert.alert('Success', 'SQLite WRITE operations working!\nCreate, Update, Delete all successful', [{ text: 'OK' }]);

    } catch (error) {
      addLog(`\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'SQLite write test failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestSQLiteRead = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('📖 Testing SQLite READ operations...');

    try {
      // Test 1: Get today's entries
      addLog('\n📋 Test 1: Get today\'s entries');
      const todayDate = today();
      const todayEntries = await sqliteGratitudeStorage.getByDate(todayDate);
      addLog(`✅ Found ${todayEntries.length} entries for today (${todayDate})`);

      if (todayEntries.length > 0) {
        addLog(`   First entry: "${todayEntries[0].content.substring(0, 30)}..."`);
      }

      // Test 2: Count entries
      addLog('\n📋 Test 2: Count today\'s entries');
      const count = await sqliteGratitudeStorage.countByDate(todayDate);
      addLog(`✅ Count: ${count} entries`);

      // Test 3: Get all entries
      addLog('\n📋 Test 3: Get all entries');
      const allEntries = await sqliteGratitudeStorage.getAll();
      addLog(`✅ Total entries in database: ${allEntries.length}`);

      // Test 4: Get streak
      addLog('\n📋 Test 4: Get streak state');
      const streak = await sqliteGratitudeStorage.getStreak();
      addLog(`✅ Current streak: ${streak.currentStreak} days`);
      addLog(`   Longest streak: ${streak.longestStreak} days`);
      addLog(`   Last entry date: ${streak.lastEntryDate}`);
      addLog(`   Frozen days: ${streak.frozenDays}`);

      // Test 5: Get warm-up payments
      addLog('\n📋 Test 5: Get warm-up payments');
      const payments = await sqliteGratitudeStorage.getWarmUpPayments();
      addLog(`✅ Found ${payments.length} warm-up payments`);

      // Test 6: Get by ID (if we have entries)
      if (allEntries.length > 0) {
        addLog('\n📋 Test 6: Get by ID');
        const firstEntry = allEntries[0];
        const byId = await sqliteGratitudeStorage.getById(firstEntry.id);
        addLog(`✅ Retrieved entry by ID: ${byId ? 'Success' : 'Failed'}`);
        if (byId) {
          addLog(`   Content: "${byId.content.substring(0, 40)}..."`);
        }
      }

      addLog('\n✅ ALL READ TESTS PASSED!');
      Alert.alert('Success', `SQLite READ operations working!\n${allEntries.length} entries, ${streak.currentStreak} days streak`, [{ text: 'OK' }]);

    } catch (error) {
      addLog(`\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'SQLite read test failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckTodayData = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔍 Checking today\'s data in BOTH storages...');

    try {
      const todayDate = today();
      addLog(`\n📅 Today's date: ${todayDate}`);

      // Check SQLite
      addLog('\n📊 SQLite entries:');
      const sqliteEntries = await sqliteGratitudeStorage.getByDate(todayDate);
      addLog(`   Count: ${sqliteEntries.length}`);

      if (sqliteEntries.length > 0) {
        sqliteEntries.forEach((entry, i) => {
          addLog(`   ${i + 1}. [${entry.id.substring(0, 8)}...] "${entry.content.substring(0, 30)}..."`);
          addLog(`      Order: ${entry.order}, Created: ${new Date(entry.createdAt).toLocaleTimeString()}`);
        });
      }

      // Check AsyncStorage using old gratitudeStorage
      addLog('\n📊 AsyncStorage entries (using old system):');
      try {
        const { gratitudeStorage } = require('../../src/services/storage/gratitudeStorage');
        const asyncEntries = await gratitudeStorage.getByDate(todayDate);
        addLog(`   Count: ${asyncEntries.length}`);

        if (asyncEntries.length > 0) {
          asyncEntries.forEach((entry: any, i: number) => {
            addLog(`   ${i + 1}. [${entry.id.substring(0, 8)}...] "${entry.content.substring(0, 30)}..."`);
            addLog(`      Order: ${entry.order}, Created: ${new Date(entry.createdAt).toLocaleTimeString()}`);
          });
        }

        // Find missing entries
        const sqliteIds = new Set(sqliteEntries.map(e => e.id));
        const missingInSQLite = asyncEntries.filter((e: any) => !sqliteIds.has(e.id));

        addLog(`\n🔍 Analysis:`);
        addLog(`   AsyncStorage total: ${asyncEntries.length}`);
        addLog(`   SQLite total: ${sqliteEntries.length}`);
        addLog(`   Missing in SQLite: ${missingInSQLite.length}`);

        if (missingInSQLite.length > 0) {
          addLog('\n❌ Found entries in AsyncStorage NOT in SQLite:');
          missingInSQLite.forEach((entry: any, i: number) => {
            addLog(`   ${i + 1}. [${entry.id.substring(0, 8)}...] "${entry.content.substring(0, 30)}..."`);
          });
        }

      } catch (error) {
        addLog(`   ⚠️ Could not check AsyncStorage: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Check completion
      const count = await sqliteGratitudeStorage.countByDate(todayDate);
      addLog(`\n🔢 SQLite count for today: ${count}`);
      addLog(count >= 3 ? '✅ Today is completed (3+ entries)' : '❌ Today is NOT completed (< 3 entries)');

      // Show detailed alert with all info
      let alertMessage = `📊 SQLite: ${sqliteEntries.length} entries\n`;

      try {
        const { gratitudeStorage } = require('../../src/services/storage/gratitudeStorage');
        const asyncEntries = await gratitudeStorage.getByDate(todayDate);
        const sqliteIds = new Set(sqliteEntries.map(e => e.id));
        const missingInSQLite = asyncEntries.filter((e: any) => !sqliteIds.has(e.id));

        alertMessage += `📊 AsyncStorage: ${asyncEntries.length} entries\n`;
        alertMessage += `\n❌ Missing in SQLite: ${missingInSQLite.length}\n`;
        alertMessage += `\n✅ Completed: ${count >= 3 ? 'YES (3+)' : 'NO (< 3)'}\n`;

        if (missingInSQLite.length > 0) {
          alertMessage += `\n⚠️ Need to migrate ${missingInSQLite.length} entries!`;
        }
      } catch (err) {
        alertMessage += `AsyncStorage: Error reading\n`;
      }

      alertMessage += `\nTotal needed: 3 entries`;

      Alert.alert('Today\'s Data Check', alertMessage, [{ text: 'OK' }]);

    } catch (error) {
      addLog(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Check failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleMigrateMissingEntries = async () => {
    if (isRunning) return;

    Alert.alert(
      'Migrate Missing Entries',
      'This will copy missing entries from AsyncStorage to SQLite. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          onPress: async () => {
            setIsRunning(true);
            clearLog();
            addLog('🔄 Migrating missing entries from AsyncStorage to SQLite...');

            try {
              const todayDate = today();
              addLog(`\n📅 Date: ${todayDate}`);

              // Get entries from both storages
              const sqliteEntries = await sqliteGratitudeStorage.getByDate(todayDate);
              const { gratitudeStorage } = require('../../src/services/storage/gratitudeStorage');
              const asyncEntries = await gratitudeStorage.getByDate(todayDate);

              addLog(`\n📊 Found:`);
              addLog(`   SQLite: ${sqliteEntries.length} entries`);
              addLog(`   AsyncStorage: ${asyncEntries.length} entries`);

              // Find missing entries
              const sqliteIds = new Set(sqliteEntries.map(e => e.id));
              const missingEntries = asyncEntries.filter((e: any) => !sqliteIds.has(e.id));

              addLog(`\n🔍 Missing in SQLite: ${missingEntries.length} entries`);

              if (missingEntries.length === 0) {
                addLog('\n✅ No missing entries - all synced!');
                Alert.alert('Success', 'All entries already in SQLite!', [{ text: 'OK' }]);
                return;
              }

              // Migrate each missing entry
              addLog(`\n🚀 Migrating ${missingEntries.length} entries...`);
              let successCount = 0;

              for (const entry of missingEntries) {
                try {
                  await sqliteGratitudeStorage.create({
                    id: entry.id,
                    content: entry.content,
                    type: entry.type,
                    date: entry.date,
                    order: entry.order,
                    isBonus: entry.isBonus || entry.order > 3,
                    createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
                    updatedAt: entry.updatedAt instanceof Date ? entry.updatedAt.toISOString() : entry.updatedAt,
                  });
                  successCount++;
                  addLog(`   ✅ Migrated: [${entry.id.substring(0, 8)}...] order=${entry.order}`);
                } catch (err) {
                  addLog(`   ❌ Failed: [${entry.id.substring(0, 8)}...] ${err instanceof Error ? err.message : 'Unknown'}`);
                }
              }

              // Verify
              const newSqliteEntries = await sqliteGratitudeStorage.getByDate(todayDate);
              addLog(`\n📊 After migration:`);
              addLog(`   SQLite: ${newSqliteEntries.length} entries`);
              addLog(`   Success: ${successCount}/${missingEntries.length}`);

              const isComplete = newSqliteEntries.length >= 3;
              addLog(`\n${isComplete ? '✅' : '❌'} Today is ${isComplete ? 'COMPLETED' : 'NOT completed'} (${newSqliteEntries.length}/3)`);

              Alert.alert(
                'Migration Complete',
                `Migrated: ${successCount} entries\nTotal in SQLite: ${newSqliteEntries.length}\nCompleted: ${isComplete ? 'YES' : 'NO'}`,
                [{ text: 'OK' }]
              );

            } catch (error) {
              addLog(`\n❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              console.error('Migration error:', error);
              Alert.alert('Error', 'Migration failed - see logs', [{ text: 'OK' }]);
            } finally {
              setIsRunning(false);
            }
          }
        }
      ]
    );
  };

  const handleTestFullStreak = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🎯 Testing FULL STREAK calculation (complete: warm-up + frozen logic)...');

    try {
      // Get old streak for comparison
      addLog('\n📊 Step 1: Get current streak state');
      const oldStreak = await sqliteGratitudeStorage.getStreak();
      addLog(`   Current: ${oldStreak.currentStreak} days`);
      addLog(`   Longest: ${oldStreak.longestStreak} days`);
      addLog(`   Frozen: ${oldStreak.frozenDays} days`);
      addLog(`   Is frozen: ${oldStreak.isFrozen ? 'YES' : 'NO'}`);
      addLog(`   Can recover: ${oldStreak.canRecoverWithAd ? 'YES' : 'NO'}`);
      addLog(`   Just unfroze today: ${oldStreak.justUnfrozeToday ? 'YES' : 'NO'}`);

      // Run full streak calculation
      addLog('\n🔄 Step 2: Run FULL streak calculation');
      const newStreak = await sqliteGratitudeStorage.calculateAndUpdateStreak();
      addLog(`   ✅ Calculation complete!`);

      // Show results
      addLog('\n📈 Step 3: Results');
      addLog(`   Current streak: ${oldStreak.currentStreak} → ${newStreak.currentStreak}`);
      addLog(`   Longest streak: ${oldStreak.longestStreak} → ${newStreak.longestStreak}`);
      addLog(`   Frozen days: ${oldStreak.frozenDays} → ${newStreak.frozenDays}`);
      addLog(`   Is frozen: ${oldStreak.isFrozen ? 'YES' : 'NO'} → ${newStreak.isFrozen ? 'YES' : 'NO'}`);
      addLog(`   Can recover: ${oldStreak.canRecoverWithAd ? 'YES' : 'NO'} → ${newStreak.canRecoverWithAd ? 'YES' : 'NO'}`);
      addLog(`   Last entry: ${newStreak.lastEntryDate}`);
      addLog(`   Streak start: ${newStreak.streakStartDate}`);
      addLog(`   ⭐ Stars: ${newStreak.starCount}`);
      addLog(`   🔥 Flames: ${newStreak.flameCount}`);
      addLog(`   👑 Crowns: ${newStreak.crownCount}`);

      addLog('\n✅ FULL STREAK TEST PASSED!');
      Alert.alert(
        'Success',
        `Full streak calculation works!\nCurrent: ${newStreak.currentStreak} days\nLongest: ${newStreak.longestStreak} days\nFrozen: ${newStreak.frozenDays} days\nCan recover: ${newStreak.canRecoverWithAd ? 'YES' : 'NO'}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      addLog(`\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Full streak test error:', error);
      Alert.alert('Error', 'Full streak test failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestWarmUpStreak = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔥 Testing WARM-UP STREAK calculation (with warm-up payment logic)...');

    try {
      // Check today's date and entries
      addLog('\n📅 Step 0: Check today\'s entries');
      const todayDate = today();
      addLog(`   Today's date: ${todayDate}`);
      const todayEntries = await sqliteGratitudeStorage.getByDate(todayDate);
      addLog(`   Today's entries in SQLite: ${todayEntries.length}`);
      if (todayEntries.length > 0) {
        todayEntries.forEach((e, i) => {
          addLog(`   ${i + 1}. "${e.content.substring(0, 30)}..."`);
        });
      }

      // Get old streak for comparison
      addLog('\n📊 Step 1: Get current streak state');
      const oldStreak = await sqliteGratitudeStorage.getStreak();
      addLog(`   Current: ${oldStreak.currentStreak} days`);
      addLog(`   Longest: ${oldStreak.longestStreak} days`);
      addLog(`   Frozen: ${oldStreak.frozenDays} days`);
      addLog(`   Just unfroze today: ${oldStreak.justUnfrozeToday ? 'YES' : 'NO'}`);

      // Check warm-up payments
      addLog('\n💳 Step 2: Check warm-up payments');
      const payments = await sqliteGratitudeStorage.getWarmUpPayments();
      addLog(`   Found ${payments.length} warm-up payment(s)`);
      if (payments.length > 0) {
        payments.slice(-3).forEach(p => {
          addLog(`   - ${p.missedDate}: ${p.adsWatched} ad(s), complete: ${p.isComplete}`);
        });
      }

      // Run warm-up aware streak calculation
      addLog('\n🔄 Step 3: Run warm-up aware streak calculation');
      const newStreak = await sqliteGratitudeStorage.calculateAndUpdateStreakWithWarmUp();
      addLog(`   ✅ Calculation complete!`);

      // Show results
      addLog('\n📈 Step 4: Results');
      addLog(`   Current streak: ${oldStreak.currentStreak} → ${newStreak.currentStreak}`);
      addLog(`   Longest streak: ${oldStreak.longestStreak} → ${newStreak.longestStreak}`);
      addLog(`   Last entry: ${newStreak.lastEntryDate}`);
      addLog(`   Streak start: ${newStreak.streakStartDate}`);
      addLog(`   Just unfroze: ${newStreak.justUnfrozeToday ? 'YES' : 'NO'}`);
      addLog(`   ⭐ Stars: ${newStreak.starCount}`);
      addLog(`   🔥 Flames: ${newStreak.flameCount}`);
      addLog(`   👑 Crowns: ${newStreak.crownCount}`);

      addLog('\n✅ WARM-UP STREAK TEST PASSED!');
      Alert.alert(
        'Success',
        `Warm-up streak calculation works!\nCurrent: ${newStreak.currentStreak} days\nLongest: ${newStreak.longestStreak} days\nWarm-up payments respected!`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      addLog(`\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Warm-up streak test error:', error);
      Alert.alert('Error', 'Warm-up streak test failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestBasicStreak = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔄 Testing BASIC STREAK calculation (no warm-up, no frozen)...');

    try {
      // Get old streak for comparison
      addLog('\n📊 Step 1: Get current streak state');
      const oldStreak = await sqliteGratitudeStorage.getStreak();
      addLog(`   Current: ${oldStreak.currentStreak} days`);
      addLog(`   Longest: ${oldStreak.longestStreak} days`);
      addLog(`   Frozen: ${oldStreak.frozenDays} days`);

      // Run basic streak calculation
      addLog('\n🔄 Step 2: Run basic streak calculation');
      const newStreak = await sqliteGratitudeStorage.calculateAndUpdateStreakBasic();
      addLog(`   ✅ Calculation complete!`);

      // Show results
      addLog('\n📈 Step 3: Results');
      addLog(`   Current streak: ${oldStreak.currentStreak} → ${newStreak.currentStreak}`);
      addLog(`   Longest streak: ${oldStreak.longestStreak} → ${newStreak.longestStreak}`);
      addLog(`   Last entry: ${newStreak.lastEntryDate}`);
      addLog(`   Streak start: ${newStreak.streakStartDate}`);
      addLog(`   ⭐ Stars: ${newStreak.starCount}`);
      addLog(`   🔥 Flames: ${newStreak.flameCount}`);
      addLog(`   👑 Crowns: ${newStreak.crownCount}`);

      addLog('\n✅ BASIC STREAK TEST PASSED!');
      Alert.alert(
        'Success',
        `Basic streak calculation works!\nCurrent: ${newStreak.currentStreak} days\nLongest: ${newStreak.longestStreak} days`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      addLog(`\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Basic streak test error:', error);
      Alert.alert('Error', 'Basic streak test failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetDatabase = async () => {
    if (isRunning) return;

    Alert.alert(
      'Reset Database',
      'This will DELETE all SQLite data. Backup in AsyncStorage will remain safe. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsRunning(true);
            clearLog();
            addLog('🗑️ Resetting SQLite database...');

            try {
              const db = getDatabase();

              // Drop all tables
              await db.execAsync('DROP TABLE IF EXISTS journal_entries');
              await db.execAsync('DROP TABLE IF EXISTS streak_state');
              await db.execAsync('DROP TABLE IF EXISTS warm_up_payments');
              await db.execAsync('DROP TABLE IF EXISTS goal_progress');
              await db.execAsync('DROP TABLE IF EXISTS goal_milestones');
              await db.execAsync('DROP TABLE IF EXISTS goals');
              await db.execAsync('DROP VIEW IF EXISTS v_todays_entry_count');
              await db.execAsync('DROP VIEW IF EXISTS v_completed_dates');
              await db.execAsync('DROP VIEW IF EXISTS v_bonus_dates');

              addLog('✅ Tables dropped');
              addLog('🔄 Please close and reopen the app to reinitialize database');

              Alert.alert(
                'Database Reset',
                'SQLite tables dropped. Please CLOSE and REOPEN the app to complete reset.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              setIsRunning(false);
            }
          }
        }
      ]
    );
  };

  // ========== PHASE 1.2: HABITS BACKUP TESTS ==========

  const handleCreateHabitsBackup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('📦 Creating Habits backup...');

    try {
      const result = await createHabitsBackup();

      if (result.success) {
        addLog('✅ Habits backup created successfully');
        addLog(`   Habits: ${result.data?.counts.habits ?? 0}`);
        addLog(`   Completions: ${result.data?.counts.completions ?? 0}`);
        addLog(`   Timestamp: ${result.data?.timestamp ?? 'N/A'}`);
        Alert.alert('Success', `Habits backup created:\n${result.data?.counts.habits ?? 0} habits\n${result.data?.counts.completions ?? 0} completions`, [{ text: 'OK' }]);
      } else {
        addLog('❌ Habits backup creation failed');
        addLog(result.message);
        Alert.alert('Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Habits backup creation crashed', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleVerifyHabitsData = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔍 Verifying Habits data...');

    try {
      const result = await verifyHabitsData();

      if (result.valid) {
        addLog('✅ Habits data is valid');
        addLog(`   Habits: ${result.counts.habits}`);
        addLog(`   Completions: ${result.counts.completions}`);
        addLog(`   Issues: ${result.issues.length}`);

        if (result.issues.length > 0) {
          addLog('\n⚠️ Issues found:');
          result.issues.forEach(issue => addLog(`   - ${issue}`));
        }

        Alert.alert('Verification Complete', `Habits: ${result.counts.habits}\nCompletions: ${result.counts.completions}\nIssues: ${result.issues.length}`, [{ text: 'OK' }]);
      } else {
        addLog('❌ Habits data is invalid');
        addLog(result.message);
        Alert.alert('Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Habits verification crashed', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunHabitsMigration = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🚀 Starting Habits migration...');

    try {
      // Check status first
      const status = await getHabitsMigrationStatus();

      if (status.isMigrated) {
        addLog(`⚠️ Database already contains ${status.habitCount} habits`);
        Alert.alert(
          'Already Migrated',
          `Database contains ${status.habitCount} habits. Migration may have already been completed.`,
          [{ text: 'OK' }]
        );
        return;
      }

      addLog('✅ Database is empty, ready to migrate');

      // Run migration
      const result = await migrateHabitsData();

      if (result.success) {
        addLog('✅ MIGRATION SUCCESSFUL!');
        addLog(`   Habits: ${result.habitsMigrated}`);
        addLog(`   Completions: ${result.completionsMigrated}`);
        addLog(`   Schedule history: ${result.scheduleHistoryMigrated}`);

        if (result.errors.length > 0) {
          addLog(`\n⚠️ Warnings (${result.errors.length}):`);
          result.errors.slice(0, 5).forEach(err => addLog(`   - ${err}`));
        }

        Alert.alert(
          'Migration Complete!',
          `Habits: ${result.habitsMigrated}\nCompletions: ${result.completionsMigrated}\nSchedule history: ${result.scheduleHistoryMigrated}`,
          [{ text: 'OK' }]
        );
      } else {
        addLog('❌ MIGRATION FAILED');
        addLog(result.message);
        result.errors.forEach(err => addLog(`   - ${err}`));
        Alert.alert('Migration Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Migration crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Migration crashed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckHabitsMigrationStatus = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔍 Checking Habits migration status...');

    try {
      const status = await getHabitsMigrationStatus();

      addLog(`Migration status:`);
      addLog(`   Is migrated: ${status.isMigrated ? 'Yes ✅' : 'No ❌'}`);
      addLog(`   Habit count: ${status.habitCount}`);
      addLog(`   Completion count: ${status.completionCount}`);

      Alert.alert(
        'Habits Migration Status',
        `Is migrated: ${status.isMigrated ? 'YES' : 'NO'}\nHabits: ${status.habitCount}\nCompletions: ${status.completionCount}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  // ========== PHASE 1.3: GOALS MIGRATION ==========

  const handleCreateGoalsBackup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('📦 Creating Goals backup...');

    try {
      const result = await createGoalsBackup();

      if (result.success) {
        addLog('✅ Goals backup created successfully');
        addLog(`   Goals: ${result.data?.counts.goals ?? 0}`);
        addLog(`   Progress: ${result.data?.counts.progress ?? 0}`);
        Alert.alert('Success', `Goals backup created:\n${result.data?.counts.goals ?? 0} goals\n${result.data?.counts.progress ?? 0} progress records`, [{ text: 'OK' }]);
      } else {
        addLog('❌ Goals backup creation failed');
        addLog(result.message);
        Alert.alert('Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Goals backup creation crashed', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  // ========================================
  // PHASE 2: GAMIFICATION MIGRATION HANDLERS
  // ========================================

  const handleCreateGamificationBackup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔄 Creating gamification backup...');

    try {
      const { backup, checksums, backupPath } = await createGamificationBackup();

      addLog('✅ Backup created successfully!');
      addLog(`📁 Path: ${backupPath}`);
      addLog(`\n📊 Checksums:`);
      addLog(`   Total XP: ${checksums.totalXPSum}`);
      addLog(`   Transactions: ${checksums.transactionCount}`);
      addLog(`   Achievements: ${checksums.achievementUnlockCount}`);
      addLog(`   Level-ups: ${checksums.levelUpEventCount}`);
      addLog(`   Daily tracking days: ${checksums.dailyTrackingDays}`);

      const verification = await verifyGamificationBackup(backup, checksums);
      if (verification.valid) {
        addLog('✅ Backup verification passed');
        Alert.alert('Success', 'Gamification backup created and verified!', [{ text: 'OK' }]);
      } else {
        addLog('❌ Backup verification failed:');
        verification.errors.forEach(err => addLog(`   - ${err}`));
        Alert.alert('Warning', 'Backup created but verification failed', [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Backup creation failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunGamificationMigration = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🚀 Starting Gamification migration...');

    try {
      const result = await migrateGamificationToSQLite();

      if (result.success) {
        addLog('✅ MIGRATION SUCCESSFUL!');
        addLog(`\n📊 Migration Summary:`);
        addLog(`   XP Transactions: ${result.summary.xpTransactions}`);
        addLog(`   Total XP: ${result.summary.totalXP}`);
        addLog(`   Level-ups: ${result.summary.levelUpEvents}`);
        addLog(`   Achievements: ${result.summary.achievements}`);
        addLog(`   Unlocked: ${result.summary.unlockedAchievements}`);
        addLog(`   Unlock Events: ${result.summary.unlockEvents}`);

        if (result.errors.length > 0) {
          addLog(`\n⚠️ Warnings (${result.errors.length}):`);
          result.errors.slice(0, 5).forEach(err => addLog(`   - ${err}`));
        }

        Alert.alert(
          'Migration Complete!',
          `XP Transactions: ${result.summary.xpTransactions}\nTotal XP: ${result.summary.totalXP}\nAchievements: ${result.summary.achievements}`,
          [{ text: 'OK' }]
        );
      } else {
        addLog('❌ MIGRATION FAILED');
        result.errors.forEach(err => addLog(`   - ${err}`));
        Alert.alert('Migration Failed', result.errors.join('\n'), [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Migration crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Migration crashed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  // ========== PHASE 3: MONTHLY CHALLENGES HANDLERS ==========

  const handleCreateChallengesBackup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🔄 Creating monthly challenges backup...');

    try {
      const { backup, checksums, backupPath } = await createChallengeBackup();

      addLog('✅ Backup created successfully!');
      addLog(`📁 Path: ${backupPath}`);
      addLog(`\n📊 Checksums:`);
      addLog(`   Active challenges: ${checksums.activeChallengeCount}`);
      addLog(`   Requirements: ${checksums.totalRequirementCount}`);
      addLog(`   Daily snapshots: ${checksums.totalSnapshotCount}`);
      addLog(`   Weekly breakdowns: ${checksums.totalWeeklyBreakdownCount}`);
      addLog(`   History entries: ${checksums.historyEntryCount}`);
      addLog(`   Previews: ${checksums.previewCount}`);
      addLog(`   Ratings: ${checksums.totalRatingsCount}`);

      Alert.alert('Success', 'Challenges backup created!', [{ text: 'OK' }]);

    } catch (error) {
      addLog(`❌ Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Backup creation failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleVerifyChallengesBackup = async () => {
    try {
      if (isRunning) return;

      setIsRunning(true);
      clearLog();
      addLog('🔍 Verifying latest challenges backup...');

      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
      const backups = files
        .filter(f => f.startsWith('challenges_backup_') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        addLog('❌ No backups found');
        Alert.alert('Error', 'No backups found. Create one first.', [{ text: 'OK' }]);
        setIsRunning(false);
        return;
      }

      const latestBackup = backups[0];
      const backupPath = `${FileSystem.documentDirectory}${latestBackup}`;

      addLog(`📁 Verifying: ${latestBackup}`);

      const result = await verifyChallengeBackup(backupPath);

      if (result.valid) {
        addLog('✅ Backup verification PASSED');
        if (result.checksums) {
          addLog(`\n📊 Backup contains:`);
          addLog(`   ${result.checksums.activeChallengeCount} challenges`);
          addLog(`   ${result.checksums.totalRequirementCount} requirements`);
          addLog(`   ${result.checksums.totalSnapshotCount} snapshots`);
        }
        Alert.alert('Success', 'Backup is valid!', [{ text: 'OK' }]);
      } else {
        addLog('❌ Backup verification FAILED');
        addLog(`   Reason: ${result.message}`);
        Alert.alert('Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Verification failed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunGoalsMigration = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLog();
    addLog('🚀 Starting Goals migration...');

    try {
      const result = await migrateGoalsToSQLite();

      if (result.success) {
        addLog('✅ MIGRATION SUCCESSFUL!');
        addLog(`   Goals: ${result.counts.goals}`);
        addLog(`   Progress: ${result.counts.progress}`);
        addLog(`   Milestones: ${result.counts.milestones}`);

        if (result.errors.length > 0) {
          addLog(`\n⚠️ Warnings (${result.errors.length}):`);
          result.errors.slice(0, 5).forEach(err => addLog(`   - ${err}`));
        }

        Alert.alert(
          'Migration Complete!',
          `Goals: ${result.counts.goals}\nProgress: ${result.counts.progress}\nMilestones: ${result.counts.milestones}`,
          [{ text: 'OK' }]
        );
      } else {
        addLog('❌ MIGRATION FAILED');
        addLog(result.message);
        result.errors.forEach(err => addLog(`   - ${err}`));
        Alert.alert('Migration Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      addLog(`❌ Migration crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', 'Migration crashed - see logs', [{ text: 'OK' }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Migration Test - Phase 2.1</Text>
      <Text style={styles.subtitle}>Gamification & XP Migration</Text>

      <ScrollView style={styles.buttonContainer}>
        {/* ========== PHASE 2: GAMIFICATION MIGRATION BUTTONS ========== */}
        <Text style={styles.sectionTitle}>Phase 2.1: Gamification Migration</Text>

        <TouchableOpacity
          style={[styles.button, styles.resetButton, isRunning && styles.disabledButton]}
          onPress={async () => {
            if (isRunning) return;
            Alert.alert(
              'Drop XP Tables',
              'DELETE all gamification tables? Requires re-migration after reload.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'DROP TABLES',
                  style: 'destructive',
                  onPress: async () => {
                    setIsRunning(true);
                    clearLog();
                    addLog('🗑️ Dropping XP tables...');
                    try {
                      const db = getDatabase();
                      await db.execAsync(`
                        DROP TABLE IF EXISTS xp_transactions;
                        DROP TABLE IF EXISTS xp_daily_summary;
                        DROP TABLE IF EXISTS xp_state;
                        DROP TABLE IF EXISTS level_up_history;
                        DROP TABLE IF EXISTS achievement_progress;
                        DROP TABLE IF EXISTS achievement_unlock_events;
                        DROP TABLE IF EXISTS achievement_stats_cache;
                        DROP TABLE IF EXISTS xp_multipliers;
                        DROP TABLE IF EXISTS loyalty_state;
                        DROP TABLE IF EXISTS daily_activity_log;
                      `);
                      addLog('✅ All XP tables dropped');
                      addLog('⚠️ RELOAD APP to recreate tables');
                      Alert.alert('Success', 'Tables dropped. RELOAD APP now.', [{ text: 'OK' }]);
                    } catch (error) {
                      addLog(`❌ Drop failed: ${error instanceof Error ? error.message : 'Unknown'}`);
                      Alert.alert('Error', 'Failed to drop tables', [{ text: 'OK' }]);
                    } finally {
                      setIsRunning(false);
                    }
                  },
                },
              ]
            );
          }}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🗑️ DROP XP Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, isRunning && styles.disabledButton]}
          onPress={handleCreateGamificationBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📦 Create Gamification Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isRunning && styles.disabledButton]}
          onPress={handleRunGamificationMigration}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🚀 RUN Gamification Migration</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ========== PHASE 3: MONTHLY CHALLENGES MIGRATION BUTTONS ========== */}
        <Text style={styles.sectionTitle}>Phase 3: Monthly Challenges Migration</Text>

        <TouchableOpacity
          style={[styles.button, styles.challengesBackupButton, isRunning && styles.disabledButton]}
          onPress={handleCreateChallengesBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📦 Create Challenges Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.challengesVerifyButton, isRunning && styles.disabledButton]}
          onPress={handleVerifyChallengesBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔍 Verify Challenges Backup</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ========== PHASE 1.3: GOALS MIGRATION BUTTONS ========== */}
        <Text style={styles.sectionTitle}>Phase 1.3: Goals Migration</Text>
        <TouchableOpacity
          style={[styles.button, styles.resetButton, isRunning && styles.disabledButton]}
          onPress={async () => {
            if (isRunning) return;
            Alert.alert(
              'Drop Goals Tables',
              'DELETE goals tables? Requires re-migration after reload.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Drop',
                  style: 'destructive',
                  onPress: async () => {
                    setIsRunning(true);
                    clearLog();
                    addLog('🗑️ Dropping goals tables...');
                    try {
                      const db = getDatabase();
                      await db.execAsync('DROP TABLE IF EXISTS goal_progress');
                      await db.execAsync('DROP TABLE IF EXISTS goal_milestones');
                      await db.execAsync('DROP TABLE IF EXISTS goals');
                      addLog('✅ Tables dropped - RELOAD APP NOW');
                      Alert.alert('Done', 'Tables dropped. RELOAD APP (Cmd+R)', [{ text: 'OK' }]);
                    } catch (error) {
                      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
                    } finally {
                      setIsRunning(false);
                    }
                  }
                }
              ]
            );
          }}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🗑️ DROP Goals Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.goalsBackupButton, isRunning && styles.disabledButton]}
          onPress={handleCreateGoalsBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📦 Create Goals Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.goalsMigrateButton, isRunning && styles.disabledButton]}
          onPress={handleRunGoalsMigration}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🚀 RUN Goals Migration</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Phase 1.2: Habits Tests</Text>

        <TouchableOpacity
          style={[styles.button, styles.habitsBackupButton, isRunning && styles.disabledButton]}
          onPress={handleCreateHabitsBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📦 Create Habits Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.habitsVerifyButton, isRunning && styles.disabledButton]}
          onPress={handleVerifyHabitsData}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔍 Verify Habits Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.habitsMigrateButton, isRunning && styles.disabledButton]}
          onPress={handleRunHabitsMigration}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🚀 RUN Habits Migration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.habitsStatusButton, isRunning && styles.disabledButton]}
          onPress={handleCheckHabitsMigrationStatus}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📊 Check Habits Status</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Phase 1.1: Journal Tests</Text>
        <TouchableOpacity
          style={[styles.button, styles.testWriteButton, isRunning && styles.disabledButton]}
          onPress={handleTestSQLiteWrite}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>✍️ Test SQLite WRITE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testReadButton, isRunning && styles.disabledButton]}
          onPress={handleTestSQLiteRead}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📖 Test SQLite READ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.streakButton, isRunning && styles.disabledButton]}
          onPress={handleTestBasicStreak}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔄 Test BASIC Streak</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warmUpButton, isRunning && styles.disabledButton]}
          onPress={handleTestWarmUpStreak}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔥 Test WARM-UP Streak</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.fullStreakButton, isRunning && styles.disabledButton]}
          onPress={handleTestFullStreak}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🎯 Test FULL Streak</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.checkTodayButton, isRunning && styles.disabledButton]}
          onPress={handleCheckTodayData}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔍 Check Today's Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.migrateMissingButton, isRunning && styles.disabledButton]}
          onPress={handleMigrateMissingEntries}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔄 Migrate Missing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.diagnosticButton, isRunning && styles.disabledButton]}
          onPress={handleDiagnoseBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔬 Diagnose Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.migrationButton, isRunning && styles.disabledButton]}
          onPress={handleRunMigration}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🚀 RUN MIGRATION</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.statusButton, isRunning && styles.disabledButton]}
          onPress={handleCheckMigrationStatus}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📊 Check Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.sqliteButton, isRunning && styles.disabledButton]}
          onPress={handleTestSQLite}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🗄️ Test SQLite</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isRunning && styles.disabledButton]}
          onPress={handleRunBackupTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🧪 Run Full Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, isRunning && styles.disabledButton]}
          onPress={handleCreateBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📦 Create Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, isRunning && styles.disabledButton]}
          onPress={handleCheckBackup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔍 Check Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton, isRunning && styles.disabledButton]}
          onPress={handleResetDatabase}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🗑️ Reset Database</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLog}
        >
          <Text style={styles.buttonText}>🧹 Clear Log</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Test Log:</Text>
        <ScrollView style={styles.logScroll}>
          {testLog.length === 0 ? (
            <Text style={styles.logEmpty}>No logs yet. Run a test to see results.</Text>
          ) : (
            testLog.map((log, index) => (
              <Text key={index} style={styles.logEntry}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      <Text style={styles.warning}>⚠️ Delete this screen after migration is complete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  challengesBackupButton: {
    backgroundColor: '#9B59B6', // Purple for challenges backup
  },
  challengesVerifyButton: {
    backgroundColor: '#8E44AD', // Dark purple for verification
  },
  goalsBackupButton: {
    backgroundColor: '#16A085', // Teal for goals backup
  },
  goalsMigrateButton: {
    backgroundColor: '#D35400', // Orange for goals migration
  },
  habitsBackupButton: {
    backgroundColor: '#2980B9', // Blue for habits backup
  },
  habitsVerifyButton: {
    backgroundColor: '#8E44AD', // Purple for verification
  },
  habitsMigrateButton: {
    backgroundColor: '#E74C3C', // Red for migration (important action)
  },
  habitsStatusButton: {
    backgroundColor: '#3498DB', // Blue for status check
  },
  divider: {
    height: 2,
    backgroundColor: '#BDC3C7',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    marginTop: 8,
  },
  testWriteButton: {
    backgroundColor: '#27AE60',
  },
  testReadButton: {
    backgroundColor: '#16A085',
  },
  streakButton: {
    backgroundColor: '#9B59B6', // Purple for streak calculation
  },
  warmUpButton: {
    backgroundColor: '#E67E22', // Orange for warm-up streak
  },
  fullStreakButton: {
    backgroundColor: '#E74C3C', // Red for full streak (complete)
  },
  checkTodayButton: {
    backgroundColor: '#1ABC9C', // Teal for data check
  },
  migrateMissingButton: {
    backgroundColor: '#2ECC71', // Green for migration
  },
  diagnosticButton: {
    backgroundColor: '#F39C12',
  },
  migrationButton: {
    backgroundColor: '#E74C3C',
  },
  statusButton: {
    backgroundColor: '#3498DB',
  },
  sqliteButton: {
    backgroundColor: '#8E44AD',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
  },
  clearButton: {
    backgroundColor: '#95A5A6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  logScroll: {
    flex: 1,
  },
  logEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  logEntry: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
  warning: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '600',
  },
});
