import React, { useCallback, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useDesign } from '@/src/contexts/ThemeContext';
import {
  MonthlyChallengeSection,
  MonthlyChallengeDetailModal
} from '@/src/components/challenges';
import { MonthlyProgressTracker } from '@/src/services/monthlyProgressTracker';
import { MonthlyProgressIntegration } from '@/src/services/monthlyProgressIntegration';
import { useRouter } from 'expo-router';
import { useHabits } from '@/src/contexts/HabitsContext';
// useOptimizedGamification removed - components use GamificationService directly
import { GamificationService } from '@/src/services/gamificationService';
import { useHomeCustomization } from '@/src/contexts/HomeCustomizationContext';
import { today } from '@/src/utils/date';
import {
  XPSourceType,
  MonthlyChallenge,
  MonthlyChallengeProgress
} from '@/src/types/gamification';
import { XP_REWARDS } from '@/src/constants/gamification';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { RoundButton } from '@/src/components/ui/TopRow';
import { HomePage } from '@/src/components/home/HomePage';

/** Room kept at the bottom for the ad banner (as on the Habits tab). */
const BANNER_ROOM = 60;

export default function HomeScreen() {
  const { t } = useI18n();
  const { c } = useDesign();
  const router = useRouter();
  const { actions, state: habitsState } = useHabits();
  const { state: customizationState, actions: customizationActions } = useHomeCustomization();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<MonthlyChallenge | null>(null);
  const [selectedChallengeProgress, setSelectedChallengeProgress] = useState<MonthlyChallengeProgress | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);

  // The customize button of the top row (migration E3; was the tab header)
  useEffect(() => {
    const customizeListener = DeviceEventEmitter.addListener(
      'openHomeCustomization',
      () => {
        setShowCustomizationModal(true);
      }
    );

    return () => {
      customizeListener.remove();
    };
  }, []);
  
  // 🚀 CRITICAL: Initialize Monthly Progress Integration immediately on app start
  useEffect(() => {
    const initializeMonthlyProgress = async () => {
      try {
        // Check if already initialized to prevent warning logs
        const status = MonthlyProgressIntegration.getStatus();
        if (status.isInitialized) {
          console.log('ℹ️ [HOME] MonthlyProgressIntegration already initialized, skipping...');
          console.log('📊 [HOME] Integration status:', status);
          return;
        }

        console.log('🔧 [HOME] Explicitly initializing MonthlyProgressIntegration...');
        await MonthlyProgressIntegration.initialize();
        console.log('✅ [HOME] MonthlyProgressIntegration initialized successfully!');

        // Log integration status for debugging
        const newStatus = MonthlyProgressIntegration.getStatus();
        console.log('📊 [HOME] Integration status:', newStatus);
      } catch (error) {
        console.error('❌ [HOME] Failed to initialize MonthlyProgressIntegration:', error);
      }
    };

    initializeMonthlyProgress();
  }, []); // Run once on mount



  // Load progress for selected challenge and setup real-time updates
  useEffect(() => {
    let progressListener: EmitterSubscription | null = null;

    const loadChallengeProgress = async () => {
      if (selectedChallenge) {
        try {
          console.log(`🔄 [HOME] Loading progress for selected challenge: ${selectedChallenge.id}`);
          const progress = await MonthlyProgressTracker.getChallengeProgress(selectedChallenge.id);
          if (progress) {
            console.log(`✅ [HOME] Selected challenge progress loaded:`, {
              completionPercentage: progress.completionPercentage,
              daysActive: progress.daysActive
            });
            setSelectedChallengeProgress(progress);
          }
        } catch (error) {
          console.error('[HOME] Failed to load selected challenge progress:', error);
        }
      }
    };

    // Setup real-time listener for selected challenge
    if (selectedChallenge) {
      progressListener = DeviceEventEmitter.addListener(
        'monthly_progress_updated',
        async (eventData: any) => {
          if (eventData.challengeId === selectedChallenge.id) {
            try {
              console.log(`📈 [HOME] Real-time update for selected challenge modal:`, eventData);
              const updatedProgress = await MonthlyProgressTracker.getChallengeProgress(selectedChallenge.id);
              if (updatedProgress) {
                console.log(`✅ [HOME] Modal progress updated: ${updatedProgress.daysActive} active days`);
                setSelectedChallengeProgress(updatedProgress);
              }
            } catch (error) {
              console.error('[HOME] Failed to update selected challenge progress:', error);
            }
          }
        }
      );
    }

    // Load progress initially
    loadChallengeProgress();

    return () => {
      if (progressListener) {
        console.log(`🛑 [HOME] Cleaning up selected challenge progress listener`);
        progressListener.remove();
      }
    };
  }, [selectedChallenge?.id]);

  const handleStreakPress = () => {
    // Navigate to journal tab for now
    router.push('/(tabs)/journal');
  };

  const handleChallengePress = (challenge: MonthlyChallenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeDetail(true);
  };

  const handleViewAllChallenges = () => {
    // Navigate to achievements screen via stack navigation
    router.push('/achievements');
  };

  const handleCloseChallengeDetail = () => {
    setShowChallengeDetail(false);
    setSelectedChallenge(null);
    setSelectedChallengeProgress(null);
  };

  // One check at a time per habit: the storage toggle reads, then writes — two
  // at once could store twice or give the XP twice (the Habits tab has the same
  // guard). XP is handled entirely by the storage layer.
  // Stable (actions change with every habits state): the habit rows are
  // memoized, so one check re-renders only its own row.
  const inFlight = useRef(new Set<string>());
  const latestActions = useRef(actions);
  latestActions.current = actions;
  const handleHabitToggle = useCallback(async (habitId: string) => {
    if (inFlight.current.has(habitId)) return;
    inFlight.current.add(habitId);
    try {
      await latestActions.current.toggleCompletion(habitId, today(), false);
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    } finally {
      inFlight.current.delete(habitId);
    }
  }, []);

  // Visible sections in the user's order (E11e: the seven sections of the new
  // Home; stored layouts of the old ten are translated by mergeHomeComponents).
  const sectionIds = customizationState.isLoading
    ? []
    : customizationState.preferences.components
        .filter(component => component.visible)
        .sort((a, b) => a.order - b.order)
        .map(component => component.id);

  // Component rendering map for dynamic ordering
  const renderComponent = (componentId: string) => {
    switch (componentId) {
      case 'monthlyChallenges':
        return (
          <MonthlyChallengeSection 
            key={componentId}
            onChallengePress={handleChallengePress}
            onViewAllPress={handleViewAllChallenges}
          />
        );
      default:
        return null;
    }
  };

  // NOTE (audit N8, July 2026): a dead 'challengeCompleted' listener used to
  // live here — nothing ever emitted that event (the real one is
  // 'monthly_challenge_completed', handled by MonthlyChallengeSection via the
  // ModalQueue). Removed together with its duplicate completion modal.
  // New events must be declared in src/utils/appEvents.ts (typed event bus).

  return (
    <View style={[styles.container, { backgroundColor: c.canvas }]}>
      <HomePage
        actions={
          <>
            <RoundButton
              signature="trophy"
              tone="reward"
              label={t('achievements.title')}
              onPress={() => router.push('/achievements')}
            />
            <RoundButton
              icon="options-outline"
              label={t('home.customization.title')}
              onPress={() => DeviceEventEmitter.emit('openHomeCustomization')}
            />
          </>
        }
        sections={sectionIds}
        renderSection={renderComponent}
        bottomInset={BANNER_ROOM}
        onToggleHabit={handleHabitToggle}
        onOpenJournal={handleStreakPress}
        onWriteEntry={() =>
          router.push('/(tabs)/journal?quickAction=addGratitude')
        }
        customizing={showCustomizationModal}
        onCustomizeClosed={() => setShowCustomizationModal(false)}
      />

      {/* AdMob Banner - Fixed at bottom */}
      <View style={[styles.bannerContainer, { backgroundColor: c.canvas }]}>
        <AdBanner />
      </View>


      {/* Monthly Challenge Detail Modal */}
      <MonthlyChallengeDetailModal
        challenge={selectedChallenge}
        progress={selectedChallengeProgress}
        visible={showChallengeDetail}
        onClose={handleCloseChallengeDetail}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
