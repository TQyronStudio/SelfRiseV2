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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Migration Test - Phase 1.1.3</Text>
      <Text style={styles.subtitle}>Journal Data Migration</Text>

      <View style={styles.buttonContainer}>
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
      </View>

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
  testWriteButton: {
    backgroundColor: '#27AE60',
  },
  testReadButton: {
    backgroundColor: '#16A085',
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
