import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, KeyboardAvoidingView, Platform, DeviceEventEmitter, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
// useOptimizedGamification removed - components use GamificationService directly
import { GamificationService } from '@/src/services/gamificationService';
import { getLevelInfo } from '@/src/services/levelCalculation';
// GHOST SYSTEM REMOVED: useLevelUpCelebrations hook eliminado - XpAnimationContext handles level-ups centrally
import { useXpAnimation } from '@/src/contexts/XpAnimationContext';
import { today } from '@/src/utils/date';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';
import GratitudeInput from '@/src/components/gratitude/GratitudeInput';
import GratitudeList from '@/src/components/gratitude/GratitudeList';
import DailyGratitudeProgress from '@/src/components/gratitude/DailyGratitudeProgress';
import CelebrationModal from '@/src/components/gratitude/CelebrationModal';
import { HelpTooltip } from '@/src/components/common';

export default function JournalScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, actions } = useGratitude();
  // GHOST SYSTEM REMOVED: Local level-up celebration system eliminado - XpAnimationContext handles this
  const { notifyActivityModalStarted, notifyActivityModalEnded } = useXpAnimation();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<View>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState<'gratitude' | 'self-praise'>('gratitude');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'daily_complete' | 'streak_milestone' | 'bonus_milestone' | 'level_up'>('daily_complete');
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  const [bonusMilestone, setBonusMilestone] = useState<number | null>(null);
  const [bonusXpAmount, setBonusXpAmount] = useState<number | null>(null);
  
  // Modal queue system for Journal-specific celebrations (bonus milestones, streaks)
  const [modalQueue, setModalQueue] = useState<Array<{
    type: 'bonus_milestone';
    data: any;
  }>>([]);
  const [isProcessingModalQueue, setIsProcessingModalQueue] = useState(false);
  
  // Process modal queue for Journal-specific celebrations (NOT level-ups)
  const processModalQueue = useCallback(async () => {
    if (isProcessingModalQueue || modalQueue.length === 0) return;
    if (showCelebration) return; // Don't process if modal is showing
    
    setIsProcessingModalQueue(true);
    
    const nextModal = modalQueue[0];
    if (nextModal) {
      console.log(`🎭 Processing Journal modal queue: ${nextModal.type}`, nextModal.data);
      
      // Remove processed modal from queue
      setModalQueue(prev => prev.slice(1));
      
      if (nextModal.type === 'bonus_milestone') {
        Keyboard.dismiss();
        const bonusCount = nextModal.data.bonusCount;
        const xpAmount = nextModal.data.xpAmount;
        setBonusMilestone(bonusCount);
        setBonusXpAmount(xpAmount);
        setCelebrationType('bonus_milestone');

        // COORDINATION: Notify activity modal started (Tier 1 priority)
        // This also re-queues any visible level-up modal
        notifyActivityModalStarted('journal');

        // Delay showing bonus modal to let level-up modal fully dismiss first
        // iOS native Modal transitions conflict when two modals change visibility simultaneously
        setTimeout(() => {
          setShowCelebration(true);
          console.log(`🎉 Showing Journal bonus milestone modal for position ${bonusCount} (${nextModal.data.emoji})`);
        }, 400);

        // Process milestone counter increment
        setTimeout(async () => {
          await actions.incrementMilestoneCounter(bonusCount);
          await actions.refreshStats();
        }, 500);
      }
    }
    
    setIsProcessingModalQueue(false);
  }, [modalQueue, isProcessingModalQueue, showCelebration, actions]);
  
  // Process Journal modal queue when conditions are right
  useEffect(() => {
    processModalQueue();
  }, [processModalQueue]);
  
  // Debug: Monitor Journal modal queue changes
  useEffect(() => {
    if (modalQueue.length > 0) {
      console.log(`📋 Journal modal queue updated: ${modalQueue.length} items - [${modalQueue.map(m => m.type).join(', ')}]`);
    }
  }, [modalQueue]);
  
  const todayDate = today();
  const [todaysGratitudes, setTodaysGratitudes] = useState(actions.getGratitudesByDate(todayDate));
  const currentCount = todaysGratitudes.length;
  const isComplete = currentCount >= 3;
  const hasBonus = currentCount >= 4;

  // Update today's gratitudes when state changes
  useEffect(() => {
    setTodaysGratitudes(actions.getGratitudesByDate(todayDate));
  }, [state.gratitudes, todayDate, actions]);

  // Simple scroll to top - input is now right after progress bar
  const scrollToTop = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  }, []);


  // Handle quick actions from home screen
  useEffect(() => {
    if (params.quickAction === 'addGratitude') {
      setInputType('gratitude');
      setShowInput(true);
      scrollToTop();
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/journal');
      }, 100);
    } else if (params.quickAction === 'addSelfPraise') {
      setInputType('self-praise');
      setShowInput(true);
      scrollToTop();
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/journal');
      }, 100);
    }
  }, [params.quickAction, scrollToTop]);

  const handleInputSuccess = useCallback(async () => {
    // Keep input open after save - no hide/show cycle = no screen jumping
    // User can close input manually via the × button when done
    const newCount = currentCount + 1;

    // Show celebration on 3rd gratitude
    if (newCount === 3) {
      Keyboard.dismiss(); // Hide keyboard so modal close button is reachable
      setCelebrationType('daily_complete');

      // COORDINATION: Notify activity modal started (Tier 1 priority)
      notifyActivityModalStarted('journal');
      setShowCelebration(true);

      // Check for streak milestones after completing daily requirement
      setTimeout(async () => {
        // 🎯 FIX: Get NEW streak after completion, then check if it's exactly a milestone
        // When user completes 3rd entry, streak updates (e.g., 6 → 7)
        // We celebrate when NEW streak is exactly 7, 14, 21, etc.
        // NOT when it becomes 8 (which is 7+1, past the milestone)
        await actions.refreshStats();
        const currentStreak = state.streakInfo?.currentStreak || 0;

        // Milestone list: these are the EXACT values to celebrate
        const milestones = [7, 14, 21, 30, 50, 60, 75, 90, 100, 150, 180, 200, 250, 365, 500, 750, 1000];

        // Only celebrate if current streak is EXACTLY a milestone value
        // Example: 6→7 (celebrate!), 7→8 (no celebration, 8 is not a milestone)
        if (milestones.includes(currentStreak)) {
          setMilestoneStreak(currentStreak);
          setCelebrationType('streak_milestone');

          // COORDINATION: Notify activity modal started (Tier 1 priority)
          notifyActivityModalStarted('journal');
          setShowCelebration(true);
        }
      }, 1000); // Delay to let daily celebration show first
    }

    // Track bonus milestones with celebrations for specific milestones (Journal-specific)
    if (newCount >= 4) {
      const bonusCount = newCount - 3;
      
      // Check if this is a new milestone (1st, 5th, 10th bonus of the day)
      if (bonusCount === 1 || bonusCount === 5 || bonusCount === 10) {
        // Calculate XP amount based on bonus milestone
        const xpAmount = bonusCount === 1 ? 25 : bonusCount === 5 ? 50 : 100; // From XP_REWARDS constants
        const milestone = bonusCount === 1 ? '⭐' : bonusCount === 5 ? '🔥' : '👑';
        
        console.log(`🎯 Journal bonus milestone ${bonusCount} reached (+${xpAmount} XP) - adding to Journal modal queue`);
        
        // Add bonus modal to Journal queue (NOT level-up queue)
        setModalQueue(prev => [...prev, {
          type: 'bonus_milestone',
          data: { 
            bonusCount, 
            xpAmount,
            emoji: milestone 
          }
        }]);
      }
    }

    // GHOST SYSTEM REMOVED: Level-up detection eliminado - XpAnimationContext handles this centrally
  }, [currentCount, t, showCelebration]); // Cleaned up dependencies


  // GHOST SYSTEM REMOVED: Cleanup timeout useEffect eliminado - no longer needed

  // Styles inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingTop: Layout.spacing.md,
      paddingBottom: 60, // Extra padding for banner
    },
    contentWithInput: {
      paddingBottom: 100, // Extra padding when input is shown to ensure scrollability
    },
    bannerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundSecondary,
    },
    addButtonContainer: {
      paddingHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Layout.spacing.sm,
    },
    addButton: {
      flex: 1,
      borderRadius: 12,
      padding: Layout.spacing.md,
      alignItems: 'center',
    },
    gratitudeButton: {
      backgroundColor: colors.primary,
    },
    selfPraiseButton: {
      backgroundColor: colors.success,
    },
    addButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    badgeContainer: {
      marginVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.md,
    },
    badgeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    badge: {
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.sm,
      marginHorizontal: Layout.spacing.xs,
    },
    badgeIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    badgeCount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    actionButtonsContainer: {
      paddingHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      gap: Layout.spacing.sm,
      marginBottom: Layout.spacing.sm,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.content,
            showInput && styles.contentWithInput
          ]}
          keyboardShouldPersistTaps="handled"
        >
        <DailyGratitudeProgress
          currentCount={currentCount}
          isComplete={isComplete}
          hasBonus={hasBonus}
        />

        {/* Input moved to top - always visible above keyboard */}
        {showInput && (
          <View ref={inputRef}>
            <GratitudeInput
              onSubmitSuccess={handleInputSuccess}
              onCancel={() => setShowInput(false)}
              isBonus={isComplete}
              inputType={inputType}
              router={router}
            />
          </View>
        )}

        {!showInput && (
          <View style={styles.addButtonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.addButton, styles.gratitudeButton]}
                onPress={() => {
                  setInputType('gratitude');
                  setShowInput(true);
                  scrollToTop();
                }}
              >
                <Text style={styles.addButtonText}>
                  {t('journal.addGratitudeButton')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, styles.selfPraiseButton]}
                onPress={() => {
                  setInputType('self-praise');
                  setShowInput(true);
                  scrollToTop();
                }}
              >
                <Text style={styles.addButtonText}>
                  {t('journal.addSelfPraiseButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Badge Counters with Help */}
        {state.streakInfo && (
          <View style={styles.badgeContainer}>
            <View style={styles.badgeHeaderRow}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>⭐</Text>
                  <Text style={styles.badgeCount}>{state.streakInfo.starCount || 0}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>🔥</Text>
                  <Text style={styles.badgeCount}>{state.streakInfo.flameCount || 0}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>👑</Text>
                  <Text style={styles.badgeCount}>{state.streakInfo.crownCount || 0}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/journal-history')}
          >
            <IconSymbol name="clock" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>{t('journal.history')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/journal-stats')}
          >
            <IconSymbol name="chart.bar" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>{t('journal.statistics')}</Text>
          </TouchableOpacity>
        </View>

        <GratitudeList
          gratitudes={todaysGratitudes}
        />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* AdMob Banner - Fixed at bottom */}
      <View style={styles.bannerContainer}>
        <AdBanner />
      </View>

      <CelebrationModal
        visible={showCelebration}
        onClose={() => {
          console.log('🎭 Journal modal closed - processing next in queue');

          // COORDINATION: Notify activity modal ended (Tier 1 priority)
          notifyActivityModalEnded();

          setShowCelebration(false);
          setBonusMilestone(null);
          setBonusXpAmount(null);

          // Process next Journal modal in queue after a short delay
          setTimeout(() => {
            processModalQueue();
          }, 500);
        }}
        type={celebrationType}
        streakDays={milestoneStreak || undefined}
        bonusCount={bonusMilestone || undefined}
        xpAmount={bonusXpAmount || undefined}
        title={milestoneStreak ? t(`journal.streakMilestone${milestoneStreak}_title`) || t('journal.streakMilestone_generic_title') : undefined}
        message={milestoneStreak ? t(`journal.streakMilestone${milestoneStreak}_text`) || t('journal.streakMilestone_generic_text').replace('{days}', String(milestoneStreak)) : undefined}
      />

      {/* GHOST SYSTEM REMOVED: Level-up celebration modal eliminado - XpAnimationContext handles level-up modals centrally */}
    </SafeAreaView>
  );
}