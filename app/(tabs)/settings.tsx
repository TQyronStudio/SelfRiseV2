import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Fonts, Layout } from '@/src/constants';

export default function SettingsScreen() {
  const { t } = useI18n();

  const handleViewHabitStats = () => {
    router.push('/habit-stats' as any);
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

        {/* Placeholder for other settings */}
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
});