import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout } from '@/src/constants';
import { JournalStreakCard } from '@/src/components/home/GratitudeStreakCard';
import { StreakHistoryGraph } from '@/src/components/home/StreakHistoryGraph';
import { HabitStatsDashboard } from '@/src/components/home/HabitStatsDashboard';
import { HabitPerformanceIndicators } from '@/src/components/home/HabitPerformanceIndicators';
import { HabitTrendAnalysis } from '@/src/components/home/HabitTrendAnalysis';
import { QuickActionButtons } from '@/src/components/home/QuickActionButtons';
import { DailyMotivationalQuote } from '@/src/components/home/DailyMotivationalQuote';
import { PersonalizedRecommendations } from '@/src/components/home/PersonalizedRecommendations';
import { HomeCustomizationModal } from '@/src/components/home/HomeCustomizationModal';
import { OptimizedXpProgressBar } from '@/src/components/gamification/OptimizedXpProgressBar';
import { PremiumTrophyIcon } from '@/src/components/home/PremiumTrophyIcon';
import { XpMultiplierSection } from '@/src/components/home/XpMultiplierSection';
import { MultiplierCountdownTimer } from '@/src/components/gamification/MultiplierCountdownTimer';
import { 
  MonthlyChallengeSection,
  MonthlyChallengeDetailModal, 
  MonthlyChallengeCompletionModal 
} from '@/src/components/challenges';
import { MonthlyProgressTracker } from '@/src/services/monthlyProgressTracker';
import { MonthlyProgressIntegration } from '@/src/services/monthlyProgressIntegration';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHabits } from '@/src/contexts/HabitsContext';
// useOptimizedGamification removed - components use GamificationService directly
import { GamificationService } from '@/src/services/gamificationService';
import { useHomeCustomization } from '@/src/contexts/HomeCustomizationContext';
import { today } from '@/src/utils/date';
import { 
  XPSourceType, 
  MonthlyChallenge, 
  MonthlyChallengeProgress,
  MonthlyChallengeCompletionResult 
} from '@/src/types/gamification';
import { XP_REWARDS } from '@/src/constants/gamification';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';
import { AdBanner } from '@/src/components/ads/AdBanner';

export default function HomeScreen() {
  // const { t } = useI18n(); // Unused for now
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { actions, state: habitsState } = useHabits();
  const { state: customizationState, actions: customizationActions } = useHomeCustomization();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<MonthlyChallenge | null>(null);
  const [selectedChallengeProgress, setSelectedChallengeProgress] = useState<MonthlyChallengeProgress | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showChallengeCompletion, setShowChallengeCompletion] = useState(false);
  const [completionChallenge, setCompletionChallenge] = useState<MonthlyChallenge | null>(null);
  const [completionResult, setCompletionResult] = useState<MonthlyChallengeCompletionResult | null>(null);
  
  // 🚀 DEBT RECOVERY AUTO-MODAL: Reference to JournalStreakCard for auto-opening debt modal
  const journalStreakCardRef = useRef<any>(null);

  // Tutorial scroll reference
  const mainScrollRef = useRef<ScrollView>(null);

  // Tutorial target registration for main scroll area
  const { registerTarget: registerMainContent, unregisterTarget: unregisterMainContent } = useTutorialTarget(
    'main-content',
    mainScrollRef as any
  );

  useEffect(() => {
    registerMainContent();
    return () => {
      unregisterMainContent();
    };
  }, [registerMainContent, unregisterMainContent]);

  // Tutorial auto-scroll listener
  useEffect(() => {
    const scrollListener = DeviceEventEmitter.addListener(
      'tutorial_scroll_to',
      ({ y, animated = true }) => {
        console.log(`📜 [HOME] Tutorial auto-scroll to Y: ${y}`);
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTo({ y, animated });

          // After scroll completes, signal tutorial to refresh target positions
          const scrollDuration = animated ? 500 : 0;
          setTimeout(() => {
            console.log(`🔄 [HOME] Signaling position refresh after scroll`);
            DeviceEventEmitter.emit('tutorial_scroll_completed');
          }, scrollDuration);
        }
      }
    );

    return () => {
      scrollListener.remove();
    };
  }, []);

  // Listen for customize button press from header
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

  // 🚀 SPECIFICATION COMPLIANCE: Auto-open debt recovery modal on redirect from My Journal
  useEffect(() => {
    if (params.openDebtModal === 'true' && journalStreakCardRef.current) {
      console.log('[DEBUG] HomeScreen: Auto-opening debt recovery modal from My Journal redirect');
      // Trigger debt modal opening on JournalStreakCard component
      setTimeout(() => {
        if (journalStreakCardRef.current?.triggerDebtModal) {
          journalStreakCardRef.current.triggerDebtModal();
        }
      }, 100); // Small delay to ensure component is mounted
    }
  }, [params.openDebtModal]);

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

  const handleHabitToggle = async (habitId: string) => {
    try {
      const completion = await actions.toggleCompletion(habitId, today(), false);
      
      // XP is now handled entirely by HabitStorage - no duplicate logic needed
      console.log(`✅ Habit completion toggled successfully - XP handled by storage layer`);
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

  // Component rendering map for dynamic ordering
  const renderComponent = (componentId: string) => {
    switch (componentId) {
      case 'xpProgressBar':
        return <OptimizedXpProgressBar key={componentId} />;
      case 'xpMultiplier':
        return <XpMultiplierSection key={componentId} />;
      case 'quickActions':
        return <QuickActionButtons key={componentId} onHabitToggle={handleHabitToggle} />;
      case 'journalStreak':
        return (
          <JournalStreakCard 
            key={componentId}
            ref={journalStreakCardRef}
            onPress={handleStreakPress} 
          />
        );
      case 'streakHistory':
        return <StreakHistoryGraph key={componentId} />;
      case 'monthlyChallenges':
        return (
          <MonthlyChallengeSection 
            key={componentId}
            onChallengePress={handleChallengePress}
            onViewAllPress={handleViewAllChallenges}
          />
        );
      case 'dailyQuote':
        return <DailyMotivationalQuote key={componentId} />;
      case 'habitStats':
        return <HabitStatsDashboard key={componentId} />;
      case 'recommendations':
        return <PersonalizedRecommendations key={componentId} />;
      case 'habitPerformance':
        return <HabitPerformanceIndicators key={componentId} />;
      case 'habitTrends':
        return <HabitTrendAnalysis key={componentId} />;
      default:
        return null;
    }
  };

  // Listen for challenge completion events
  useEffect(() => {
    const challengeCompletedListener = DeviceEventEmitter.addListener(
      'challengeCompleted',
      ({ challenge, result }: { 
        challenge: MonthlyChallenge; 
        result: MonthlyChallengeCompletionResult; 
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

  // Styles using theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingVertical: Layout.spacing.md,
      paddingBottom: 80, // Extra padding for banner (50px banner + 30px spacing)
    },
    bannerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        ref={mainScrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nativeID="main-content"
      >
        {/* Dynamic component rendering based on user order preferences */}
        {visibleComponents.map(component => renderComponent(component.id))}
      </ScrollView>

      {/* AdMob Banner - Fixed at bottom */}
      <View style={styles.bannerContainer}>
        <AdBanner />
      </View>

      {/* Customization Modal */}
      <HomeCustomizationModal
        visible={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
      />

      {/* Monthly Challenge Detail Modal */}
      <MonthlyChallengeDetailModal
        challenge={selectedChallenge}
        progress={selectedChallengeProgress}
        visible={showChallengeDetail}
        onClose={handleCloseChallengeDetail}
      />

      {/* Monthly Challenge Completion Celebration Modal */}
      <MonthlyChallengeCompletionModal
        visible={showChallengeCompletion}
        challenge={completionChallenge}
        completionResult={completionResult}
        onClose={handleCloseChallengeCompletion}
      />
    </SafeAreaView>
  );
}
