import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout } from '@/src/constants';
import { JournalStreakCard } from '@/src/components/home/GratitudeStreakCard';
import { StreakHistoryGraph } from '@/src/components/home/StreakHistoryGraph';
import { HabitStatsDashboard } from '@/src/components/home/HabitStatsDashboard';
import { HabitPerformanceIndicators } from '@/src/components/home/HabitPerformanceIndicators';
import { HabitTrendAnalysis } from '@/src/components/home/HabitTrendAnalysis';
import { QuickActionButtons } from '@/src/components/home/QuickActionButtons';
import { DailyMotivationalQuote } from '@/src/components/home/DailyMotivationalQuote';
import { PersonalizedRecommendations } from '@/src/components/home/PersonalizedRecommendations';
import { HomeCustomizationModal } from '@/src/components/home/HomeCustomizationModal';
import { useRouter } from 'expo-router';
import { useHabits } from '@/src/contexts/HabitsContext';
import { useHomeCustomization } from '@/src/contexts/HomeCustomizationContext';
import { today } from '@/src/utils/date';

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { actions } = useHabits();
  const { state: customizationState } = useHomeCustomization();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  const handleStreakPress = () => {
    // Navigate to journal tab for now
    router.push('/(tabs)/journal');
  };

  const handleHabitToggle = async (habitId: string) => {
    try {
      await actions.toggleCompletion(habitId, today(), false);
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  // Get visible components ordered by user preference
  const getVisibleComponents = () => {
    if (customizationState.isLoading) {
      return []; // Show nothing while loading
    }
    
    return customizationState.preferences.components
      .filter(component => component.visible)
      .sort((a, b) => a.order - b.order);
  };

  const visibleComponents = getVisibleComponents();
  const isComponentVisible = (componentId: string) => 
    visibleComponents.some(c => c.id === componentId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Customization Button */}
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.customizeButton}
          onPress={() => setShowCustomizationModal(true)}
        >
          <Ionicons name="options" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main streak display card - Always visible */}
        <JournalStreakCard onPress={handleStreakPress} />
        
        {/* Conditionally rendered components based on user preferences */}
        {isComponentVisible('quickActions') && (
          <QuickActionButtons onHabitToggle={handleHabitToggle} />
        )}
        
        {isComponentVisible('dailyQuote') && (
          <DailyMotivationalQuote />
        )}
        
        {isComponentVisible('recommendations') && (
          <PersonalizedRecommendations />
        )}
        
        {isComponentVisible('streakHistory') && (
          <StreakHistoryGraph />
        )}
        
        {isComponentVisible('habitStats') && (
          <HabitStatsDashboard />
        )}
        
        {isComponentVisible('habitPerformance') && (
          <HabitPerformanceIndicators />
        )}
        
        {isComponentVisible('habitTrends') && (
          <HabitTrendAnalysis />
        )}
      </ScrollView>

      {/* Customization Modal */}
      <HomeCustomizationModal
        visible={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.xs,
    paddingBottom: Layout.spacing.xs,
  },
  customizeButton: {
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
  },
});
