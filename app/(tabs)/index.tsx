import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout } from '@/src/constants';
import { JournalStreakCard } from '@/src/components/home/GratitudeStreakCard';
import { StreakHistoryGraph } from '@/src/components/home/StreakHistoryGraph';
import { HabitStatsDashboard } from '@/src/components/home/HabitStatsDashboard';
import { HabitPerformanceIndicators } from '@/src/components/home/HabitPerformanceIndicators';
import { HabitTrendAnalysis } from '@/src/components/home/HabitTrendAnalysis';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const handleStreakPress = () => {
    // Navigate to journal tab for now
    router.push('/(tabs)/journal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main streak display card */}
        <JournalStreakCard onPress={handleStreakPress} />
        
        {/* Journal history graph */}
        <StreakHistoryGraph />
        
        {/* Habit Statistics Dashboard */}
        <HabitStatsDashboard />
        
        {/* Performance Indicators */}
        <HabitPerformanceIndicators />
        
        {/* Trend Analysis */}
        <HabitTrendAnalysis />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
  },
});
