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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Migration Test - Phase 1.1.1</Text>
      <Text style={styles.subtitle}>Journal Backup & Verification</Text>

      <View style={styles.buttonContainer}>
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
          style={[styles.button, styles.clearButton]}
          onPress={clearLog}
        >
          <Text style={styles.buttonText}>🗑️ Clear Log</Text>
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
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
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
