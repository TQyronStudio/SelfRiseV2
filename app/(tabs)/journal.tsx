import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopRow } from '@/src/components/ui/TopRow';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { getJournalStreakReward } from '@/src/utils/journalStreakMilestones';
import { streakMomentSize } from '@/src/services/moments/momentRules';
import { useMomentNotes } from '@/src/components/xp/XpDisplay';
import { useGratitude } from '@/src/contexts/GratitudeContext';
// useOptimizedGamification removed - components use GamificationService directly
import { GamificationService } from '@/src/services/gamificationService';
import { getLevelInfo } from '@/src/services/levelCalculation';
import { useModalQueue, ModalPriority } from '@/src/contexts/ModalQueueContext';
import { today } from '@/src/utils/date';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout } from '@/src/constants';
import { contentColumn } from '@/src/utils/layout';
import { IconSymbol } from '@/components/ui/IconSymbol';
import GratitudeInput from '@/src/components/gratitude/GratitudeInput';
import GratitudeList from '@/src/components/gratitude/GratitudeList';
import { DailyMotivationalQuote } from '@/src/components/gratitude/DailyMotivationalQuote';
import DailyGratitudeProgress from '@/src/components/gratitude/DailyGratitudeProgress';
// CelebrationModal removed - now rendered by ModalQueueContext
import { HelpTooltip } from '@/src/components/common';

export default function JournalScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, actions } = useGratitude();
  const { enqueue: enqueueModal } = useModalQueue();
  const { showPlainNote } = useMomentNotes();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<View>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState<'gratitude' | 'self-praise'>('gratitude');
  
  const todayDate = today();
  const [todaysGratitudes, setTodaysGratitudes] = useState(actions.getGratitudesByDate(todayDate));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Hide the ad banner while the user is writing a journal entry — the most
  // emotionally sensitive moment in the app shouldn't have an ad next to the
  // keyboard (and the banner would overlap the input on small screens).
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
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
    // Hide input after save - user must re-select gratitude or self-praise
    setShowInput(false);
    const newCount = currentCount + 1;

    // Show celebration on 3rd gratitude
    if (newCount === 3) {
      Keyboard.dismiss();
      enqueueModal({
        type: 'celebration_daily_complete',
        priority: ModalPriority.ACTIVITY_CELEBRATION,
        props: {},
      });

      // Check for streak milestones after completing daily requirement
      setTimeout(async () => {
        // The streak AFTER today's entry — not state.streakInfo, which this
        // callback captured before the save (the window came a day late)
        const fresh = await actions.refreshStats();
        const currentStreak = fresh?.currentStreak || 0;
        // E10 (R-40): a window for 7/30/100/365/1000 days, the other lengths a
        // quiet note at the level badge carrying only the length (its XP, if
        // any, is already paid by the app — getJournalStreakReward).
        const size = streakMomentSize(currentStreak);
        if (size === 'window') {
          enqueueModal({
            type: 'celebration_streak_milestone',
            priority: ModalPriority.ACTIVITY_CELEBRATION,
            props: { streakDays: currentStreak },
          });
        } else if (size === 'quiet') {
          showPlainNote({
            icon: 'flame',
            overline: t('journal.streakMoment.overline'),
            title: t('journal.streakMoment.days', { count: currentStreak }),
            xp: getJournalStreakReward(currentStreak),
          });
        }
      }, 1000);
    }

    // Track bonus milestones
    if (newCount >= 4) {
      const bonusCount = newCount - 3;

      if (bonusCount === 1 || bonusCount === 5 || bonusCount === 10) {
        const xpAmount = bonusCount === 1 ? 25 : bonusCount === 5 ? 50 : 100;

        Keyboard.dismiss();
        enqueueModal({
          type: 'celebration_bonus_milestone',
          priority: ModalPriority.ACTIVITY_CELEBRATION,
          props: { bonusCount, xpAmount },
        });

        // Process milestone counter increment
        setTimeout(async () => {
          await actions.incrementMilestoneCounter(bonusCount);
          await actions.refreshStats();
        }, 500);
      }
    }
  }, [currentCount, enqueueModal, actions, showPlainNote, t]);

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
      ...contentColumn,
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
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Top row (E3): the level badge (E7) and the screen's buttons come here. */}
      <TopRow />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // No offset since E3: the old 90 was the blue header above this view. The
        // parent now starts at the top of the screen and the top row sits inside
        // it, so the view's own position already accounts for it.
        keyboardVerticalOffset={0}
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

        {/* Daily Inspiration — permanent card (moved from Home 2026-10-04) */}
        <DailyMotivationalQuote />

        <GratitudeList
          gratitudes={todaysGratitudes}
        />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* AdMob Banner - Fixed at bottom, hidden while writing an entry */}
      {!isKeyboardVisible && (
        <View style={styles.bannerContainer}>
          <AdBanner />
        </View>
      )}

      {/* All celebration modals rendered by ModalQueueContext */}
    </SafeAreaView>
  );
}