import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, DeviceEventEmitter } from 'react-native';
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
import { XpProgressBar } from '@/src/components/gamification/XpProgressBar';
import { PremiumTrophyIcon } from '@/src/components/home/PremiumTrophyIcon';
import { XpMultiplierSection } from '@/src/components/home/XpMultiplierSection';
import { MultiplierCountdownTimer } from '@/src/components/gamification/MultiplierCountdownTimer';
import { ChallengeSection, ChallengeDetailModal, ChallengeCompletionModal } from '@/src/components/challenges';
import { useRouter } from 'expo-router';
import { useHabits } from '@/src/contexts/HabitsContext';
import { useGamification } from '@/src/contexts/GamificationContext';
import { useHomeCustomization } from '@/src/contexts/HomeCustomizationContext';
import { today } from '@/src/utils/date';
import { XPSourceType, WeeklyChallenge, ChallengeCompletionResult } from '@/src/types/gamification';
import { XP_REWARDS } from '@/src/constants/gamification';

export default function HomeScreen() {
  // const { t } = useI18n(); // Unused for now
  const router = useRouter();
  const { actions, state: habitsState } = useHabits();
  const { addXP, subtractXP } = useGamification();
  const { state: customizationState } = useHomeCustomization();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<WeeklyChallenge | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showChallengeCompletion, setShowChallengeCompletion] = useState(false);
  const [completionChallenge, setCompletionChallenge] = useState<WeeklyChallenge | null>(null);
  const [completionResult, setCompletionResult] = useState<ChallengeCompletionResult | null>(null);



  const handleStreakPress = () => {
    // Navigate to journal tab for now
    router.push('/(tabs)/journal');
  };

  const handleChallengePress = (challenge: WeeklyChallenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeDetail(true);
  };

  const handleViewAllChallenges = () => {
    // TODO: Navigate to dedicated challenges screen or achievements tab
    router.push('/(tabs)/achievements');
  };

  const handleCloseChallengeDetail = () => {
    setShowChallengeDetail(false);
    setSelectedChallenge(null);
  };

  const handleHabitToggle = async (habitId: string) => {
    try {
      const completion = await actions.toggleCompletion(habitId, today(), false);
      
      const habit = habitsState.habits.find(h => h.id === habitId);
      if (habit) {
        const isBonus = false; // From home screen, always scheduled completion
        const xpAmount = isBonus ? XP_REWARDS.HABIT.BONUS_COMPLETION : XP_REWARDS.HABIT.SCHEDULED_COMPLETION;
        const xpSource = isBonus ? XPSourceType.HABIT_BONUS : XPSourceType.HABIT_COMPLETION;
        
        if (completion) {
          // Habit was completed - award XP
          const description = isBonus ? 
            `Completed bonus habit: ${habit.name}` : 
            `Completed scheduled habit: ${habit.name}`;

          console.log(`🚀 Real-time XP: Awarding ${xpAmount} XP for ${xpSource}`);
          await addXP(xpAmount, { source: xpSource, description });
        } else {
          // Habit was uncompleted - deduct XP
          const description = isBonus ? 
            `Uncompleted bonus habit: ${habit.name}` : 
            `Uncompleted scheduled habit: ${habit.name}`;

          console.log(`🚀 Real-time XP: Deducting ${xpAmount} XP for ${xpSource}`);
          await subtractXP(xpAmount, { source: xpSource, description });
        }
      }
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

  // Listen for challenge completion events
  useEffect(() => {
    const challengeCompletedListener = DeviceEventEmitter.addListener(
      'challengeCompleted',
      ({ challenge, result }: { 
        challenge: WeeklyChallenge; 
        result: ChallengeCompletionResult; 
      }) => {
        console.log('🎉 Challenge completed event received:', challenge.title, result.xpEarned, 'XP');
        setCompletionChallenge(challenge);
        setCompletionResult(result);
        setShowChallengeCompletion(true);
      }
    );

    return () => {
      challengeCompletedListener.remove();
    };
  }, []);

  const handleCloseChallengeCompletion = () => {
    setShowChallengeCompletion(false);
    setCompletionChallenge(null);
    setCompletionResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        {/* Trophy Room Button */}
        <TouchableOpacity 
          style={styles.trophyButton}
          onPress={() => router.push('/(tabs)/achievements')}
        >
          <PremiumTrophyIcon size={32} />
        </TouchableOpacity>
        
        {/* XP Multiplier Timer */}
        <MultiplierCountdownTimer 
          size="small" 
          variant="light"
          style={styles.headerTimer}
        />
        
        {/* Customization Button */}
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
        {/* Conditionally rendered components based on user preferences */}
        {isComponentVisible('xpProgressBar') && (
          <XpProgressBar />
        )}
        
        {isComponentVisible('xpMultiplier') && (
          <XpMultiplierSection />
        )}
        
        {isComponentVisible('journalStreak') && (
          <JournalStreakCard onPress={handleStreakPress} />
        )}
        
        {isComponentVisible('quickActions') && (
          <QuickActionButtons onHabitToggle={handleHabitToggle} />
        )}

        {isComponentVisible('weeklyChallenges') && (
          <ChallengeSection 
            onChallengePress={handleChallengePress}
            onViewAllPress={handleViewAllChallenges}
          />
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

      {/* Challenge Detail Modal */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        progress={selectedChallenge ? { 
          challengeId: selectedChallenge.id,
          userId: 'local_user',
          progress: {},
          isCompleted: false,
          xpEarned: 0
        } : null}
        visible={showChallengeDetail}
        onClose={handleCloseChallengeDetail}
      />

      {/* Challenge Completion Celebration Modal */}
      <ChallengeCompletionModal
        visible={showChallengeCompletion}
        challenge={completionChallenge}
        completionResult={completionResult}
        onClose={handleCloseChallengeCompletion}
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
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.xs,
    paddingBottom: Layout.spacing.xs,
  },
  trophyButton: {
    padding: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  headerTimer: {
    marginHorizontal: Layout.spacing.xs,
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
