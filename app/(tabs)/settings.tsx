import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { Colors, Fonts, Layout } from '@/src/constants';

export default function SettingsScreen() {
  const { t } = useI18n();
  const { actions: { resetTutorial, clearCrashData } } = useTutorial();
  const [isResetting, setIsResetting] = useState(false);

  const handleViewHabitStats = () => {
    router.push('/habit-stats' as any);
  };

  const handleResetTutorial = () => {
    Alert.alert(
      t('settings.tutorialResetConfirmTitle'),
      t('settings.tutorialResetConfirmMessage'),
      [
        {
          text: t('settings.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);
              await resetTutorial();
              await clearCrashData();

              Alert.alert(
                '✅ Success',
                t('settings.tutorialResetSuccess'),
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Failed to reset tutorial:', error);
              Alert.alert(
                'Error',
                'Failed to reset tutorial. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Habit Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Analytics</Text>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleViewHabitStats}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bar-chart" size={24} color={Colors.primary} />
              <Text style={styles.menuItemText}>Individual Habit Stats</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language" size={24} color={Colors.textSecondary} />
              <Text style={[styles.menuItemText, styles.comingSoon]}>
                Language Settings - Coming Soon
              </Text>
            </View>
          </View>
        </View>

        {/* Tutorial & Onboarding */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutorial & Onboarding</Text>
          <TouchableOpacity
            style={[styles.menuItem, isResetting && styles.menuItemDisabled]}
            onPress={handleResetTutorial}
            disabled={isResetting}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="refresh-circle"
                size={24}
                color={isResetting ? Colors.textSecondary : Colors.warning}
              />
              <View style={styles.menuItemTextContainer}>
                <Text style={[styles.menuItemText, isResetting && styles.textDisabled]}>
                  {t('settings.tutorialReset')}
                </Text>
                <Text style={[styles.menuItemDescription, isResetting && styles.textDisabled]}>
                  {t('settings.tutorialResetDescription')}
                </Text>
              </View>
            </View>
            {!isResetting && (
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            )}
            {isResetting && (
              <Text style={styles.loadingText}>Resetting...</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginLeft: 12,
  },
  comingSoon: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  menuItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  textDisabled: {
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});