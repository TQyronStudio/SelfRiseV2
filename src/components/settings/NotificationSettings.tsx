/**
 * Notification Settings Component
 *
 * UI for managing notification preferences:
 * - Permission status and system settings link
 * - Afternoon reminder toggle and time picker
 * - Evening reminder toggle and time picker
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts, Layout } from '../../constants';
import {
  notificationService,
  notificationScheduler,
  progressAnalyzer,
} from '../../services/notifications';
import { NotificationPermissionStatus, NotificationSettings as NotificationSettingsType } from '../../types/notification';

export const NotificationSettings: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(null);
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [showAfternoonPicker, setShowAfternoonPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();

    // Refresh permission status when app becomes active (user returns from system settings)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshPermissionStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Initialize notification service
      await notificationService.initialize();

      // Get permission status and settings
      const [permissions, currentSettings] = await Promise.all([
        notificationService.getPermissionStatus(),
        notificationScheduler.getSettings(),
      ]);

      setPermissionStatus(permissions);
      setSettings(currentSettings);
    } catch (error) {
      console.error('[NotificationSettings] Failed to load data:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // PERMISSION HANDLERS
  // ========================================

  const refreshPermissionStatus = async () => {
    try {
      const permissions = await notificationService.getPermissionStatus();
      setPermissionStatus(permissions);
      console.log('[NotificationSettings] Permission status refreshed:', permissions);
    } catch (error) {
      console.error('[NotificationSettings] Failed to refresh permission status:', error);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const permissions = await notificationService.requestPermissions();
      setPermissionStatus(permissions);

      if (!permissions.granted) {
        Alert.alert(
          'Permissions Required',
          'Notification permissions are needed to send you reminders. You can enable them in system settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: handleOpenSystemSettings },
          ]
        );
      }
    } catch (error) {
      console.error('[NotificationSettings] Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const handleOpenSystemSettings = async () => {
    try {
      await notificationService.openSystemSettings();
    } catch (error) {
      console.error('[NotificationSettings] Failed to open system settings:', error);
      Alert.alert('Error', 'Failed to open system settings');
    }
  };

  // ========================================
  // TOGGLE HANDLERS
  // ========================================

  const handleAfternoonToggle = async (enabled: boolean) => {
    if (!settings) return;

    try {
      // If enabling, check permissions first
      if (enabled && !permissionStatus?.granted) {
        await handleRequestPermissions();
        return;
      }

      // Update settings
      const updatedSettings = await notificationScheduler.updateSettings({
        afternoonReminderEnabled: enabled,
      });

      setSettings(updatedSettings);

      // Reschedule notifications
      await notificationScheduler.scheduleAfternoonReminder(
        enabled,
        updatedSettings.afternoonReminderTime
      );
    } catch (error) {
      console.error('[NotificationSettings] Failed to toggle afternoon reminder:', error);
      Alert.alert('Error', 'Failed to update afternoon reminder');
    }
  };

  const handleEveningToggle = async (enabled: boolean) => {
    if (!settings) return;

    try {
      // If enabling, check permissions first
      if (enabled && !permissionStatus?.granted) {
        await handleRequestPermissions();
        return;
      }

      // Update settings
      const updatedSettings = await notificationScheduler.updateSettings({
        eveningReminderEnabled: enabled,
      });

      setSettings(updatedSettings);

      // Analyze progress and reschedule
      const progress = await progressAnalyzer.analyzeDailyProgress();
      await notificationScheduler.scheduleEveningReminder(
        enabled,
        updatedSettings.eveningReminderTime,
        progress
      );
    } catch (error) {
      console.error('[NotificationSettings] Failed to toggle evening reminder:', error);
      Alert.alert('Error', 'Failed to update evening reminder');
    }
  };

  // ========================================
  // TIME PICKER HANDLERS
  // ========================================

  const handleAfternoonTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowAfternoonPicker(false);
    }

    if (!selectedDate || !settings) return;

    try {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const timeString = notificationService.formatTime(hours, minutes);

      // Update settings
      const updatedSettings = await notificationScheduler.updateSettings({
        afternoonReminderTime: timeString,
      });

      setSettings(updatedSettings);

      // Reschedule if enabled
      if (updatedSettings.afternoonReminderEnabled) {
        await notificationScheduler.scheduleAfternoonReminder(true, timeString);
      }
    } catch (error) {
      console.error('[NotificationSettings] Failed to update afternoon time:', error);
      Alert.alert('Error', 'Failed to update afternoon reminder time');
    }
  };

  const handleEveningTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEveningPicker(false);
    }

    if (!selectedDate || !settings) return;

    try {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const timeString = notificationService.formatTime(hours, minutes);

      // Update settings
      const updatedSettings = await notificationScheduler.updateSettings({
        eveningReminderTime: timeString,
      });

      setSettings(updatedSettings);

      // Reschedule if enabled
      if (updatedSettings.eveningReminderEnabled) {
        const progress = await progressAnalyzer.analyzeDailyProgress();
        await notificationScheduler.scheduleEveningReminder(true, timeString, progress);
      }
    } catch (error) {
      console.error('[NotificationSettings] Failed to update evening time:', error);
      Alert.alert('Error', 'Failed to update evening reminder time');
    }
  };

  // ========================================
  // TIME PICKER HELPERS
  // ========================================

  const parseTimeToDate = (timeString: string): Date => {
    const { hour, minute } = notificationService.parseTime(timeString);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date;
  };

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Permission Status */}
      {permissionStatus && !permissionStatus.granted && (
        <TouchableOpacity
          style={styles.permissionWarning}
          onPress={permissionStatus.canAskAgain ? handleRequestPermissions : handleOpenSystemSettings}
        >
          <Ionicons name="alert-circle" size={24} color={Colors.warning} />
          <View style={styles.permissionWarningContent}>
            <Text style={styles.permissionWarningTitle}>Notifications Disabled</Text>
            <Text style={styles.permissionWarningText}>
              {permissionStatus.canAskAgain
                ? 'Tap to enable notifications'
                : 'Tap to open system settings'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Afternoon Reminder */}
      <View style={styles.settingItem}>
        <View style={styles.settingHeader}>
          <View style={styles.settingHeaderLeft}>
            <Ionicons name="sunny" size={24} color={Colors.primary} />
            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>Afternoon Reminder</Text>
              <Text style={styles.settingDescription}>Motivational check-in</Text>
            </View>
          </View>
          <Switch
            value={settings.afternoonReminderEnabled}
            onValueChange={handleAfternoonToggle}
            trackColor={{ false: Colors.textSecondary, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {settings.afternoonReminderEnabled && (
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setShowAfternoonPicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.timeText}>{settings.afternoonReminderTime}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Evening Reminder */}
      <View style={styles.settingItem}>
        <View style={styles.settingHeader}>
          <View style={styles.settingHeaderLeft}>
            <Ionicons name="moon" size={24} color={Colors.primary} />
            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>Evening Reminder</Text>
              <Text style={styles.settingDescription}>Smart task reminder</Text>
            </View>
          </View>
          <Switch
            value={settings.eveningReminderEnabled}
            onValueChange={handleEveningToggle}
            trackColor={{ false: Colors.textSecondary, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {settings.eveningReminderEnabled && (
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setShowEveningPicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.timeText}>{settings.eveningReminderTime}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Time Pickers */}
      {showAfternoonPicker && (
        <DateTimePicker
          value={parseTimeToDate(settings.afternoonReminderTime)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleAfternoonTimeChange}
        />
      )}

      {showEveningPicker && (
        <DateTimePicker
          value={parseTimeToDate(settings.eveningReminderTime)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEveningTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  permissionWarningContent: {
    flex: 1,
    marginLeft: 12,
  },
  permissionWarningTitle: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.warning,
    marginBottom: 2,
  },
  permissionWarningText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  settingItem: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginLeft: 8,
  },
});
