import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useGamification } from '@/src/contexts/GamificationContext';
import { useLevelUpCelebrations } from '@/src/hooks/useLevelUpCelebrations';
import { today } from '@/src/utils/date';
import { Colors, Layout } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';
import GratitudeInput from '@/src/components/gratitude/GratitudeInput';
import GratitudeList from '@/src/components/gratitude/GratitudeList';
import DailyGratitudeProgress from '@/src/components/gratitude/DailyGratitudeProgress';
import CelebrationModal from '@/src/components/gratitude/CelebrationModal';

export default function JournalScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, actions } = useGratitude();
  const { checkForRecentLevelUps, getLevelInfo } = useGamification();
  const { celebrationState, checkAndTriggerLevelUpCelebration, hideCelebration } = useLevelUpCelebrations();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState<'gratitude' | 'self-praise'>('gratitude');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'daily_complete' | 'streak_milestone' | 'bonus_milestone' | 'level_up'>('daily_complete');
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  const [bonusMilestone, setBonusMilestone] = useState<number | null>(null);
  
  const todayDate = today();
  const [todaysGratitudes, setTodaysGratitudes] = useState(actions.getGratitudesByDate(todayDate));
  const currentCount = todaysGratitudes.length;
  const isComplete = currentCount >= 3;
  const hasBonus = currentCount >= 4;

  // Update today's gratitudes when state changes
  useEffect(() => {
    setTodaysGratitudes(actions.getGratitudesByDate(todayDate));
  }, [state.gratitudes, todayDate, actions]);

  // Handle quick actions from home screen
  useEffect(() => {
    if (params.quickAction === 'addGratitude') {
      setInputType('gratitude');
      setShowInput(true);
      // Scroll to input area after a brief delay to ensure it's rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/journal');
      }, 100);
    } else if (params.quickAction === 'addSelfPraise') {
      setInputType('self-praise');
      setShowInput(true);
      // Scroll to input area after a brief delay to ensure it's rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/journal');
      }, 100);
    }
  }, [params.quickAction]);

  const handleInputSuccess = useCallback(async () => {
    setShowInput(false);
    const newCount = currentCount + 1;
    
    // Show celebration on 3rd gratitude
    if (newCount === 3) {
      setCelebrationType('daily_complete');
      setShowCelebration(true);
      
      // Check for streak milestones after completing daily requirement
      setTimeout(async () => {
        await actions.refreshStats();
        const currentStreak = state.streakInfo?.currentStreak || 0;
        
        // Show celebration for special milestones (21, 100, 365, 1000) or generic for others
        if ([7, 14, 21, 30, 50, 60, 75, 90, 100, 150, 180, 200, 250, 365, 500, 750, 1000].includes(currentStreak)) {
          setMilestoneStreak(currentStreak);
          setCelebrationType('streak_milestone');
          setShowCelebration(true);
        }
      }, 1000); // Delay to let daily celebration show first
    }

    // Track bonus milestones with celebrations for specific milestones
    if (newCount >= 4) {
      const bonusCount = newCount - 3;
      
      // Check if this is a new milestone (1st, 5th, 10th bonus of the day)
      if (bonusCount === 1 || bonusCount === 5 || bonusCount === 10) {
        // Show beautiful celebration modal for specific milestones
        setBonusMilestone(bonusCount);
        setCelebrationType('bonus_milestone');
        setShowCelebration(true);
        
        // Immediately increment the appropriate milestone counter
        setTimeout(async () => {
          await actions.incrementMilestoneCounter(bonusCount);
          await actions.refreshStats(); // Refresh to show updated counts
        }, 100); // Small delay to ensure gratitude is saved first
      }
    }

    // Check for level-ups after all other celebrations
    setTimeout(async () => {
      try {
        const recentLevelUps = await checkForRecentLevelUps();
        if (recentLevelUps.length > 0) {
          // Get the most recent level-up
          const latestLevelUp = recentLevelUps[0];
          const levelInfo = getLevelInfo(latestLevelUp.newLevel);
          
          // Create level-up celebration data
          const levelUpResult = {
            success: true,
            xpGained: 0, // Not needed for celebration
            totalXP: latestLevelUp.totalXPAtLevelUp,
            previousLevel: latestLevelUp.previousLevel,
            newLevel: latestLevelUp.newLevel,
            leveledUp: true,
            milestoneReached: latestLevelUp.isMilestone,
            levelUpInfo: {
              newLevelTitle: levelInfo.title,
              newLevelDescription: levelInfo.description || '',
              ...(levelInfo.rewards && { rewards: levelInfo.rewards }),
              isMilestone: latestLevelUp.isMilestone,
            },
          };
          
          // Trigger level-up celebration
          checkAndTriggerLevelUpCelebration(levelUpResult);
        }
      } catch (error) {
        console.error('Failed to check for level-ups:', error);
      }
    }, 2000); // Check after other celebrations have had time to show
  }, [currentCount, t, checkForRecentLevelUps, getLevelInfo, checkAndTriggerLevelUpCelebration]);

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
        
        {/* Mysterious Badge Counters */}
        {state.streakInfo && (
          <View style={styles.badgeContainer}>
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
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/journal-history')}
          >
            <IconSymbol name="clock" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/journal-stats')}
          >
            <IconSymbol name="chart.bar" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Statistics</Text>
          </TouchableOpacity>
        </View>
        
        {showInput && (
          <GratitudeInput 
            onSubmitSuccess={handleInputSuccess}
            onCancel={() => setShowInput(false)}
            isBonus={isComplete}
            inputType={inputType}
          />
        )}
        
        {!showInput && (
          <View style={styles.addButtonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.addButton, styles.gratitudeButton]}
                onPress={() => {
                  setInputType('gratitude');
                  setShowInput(true);
                  // Auto-scroll to input area after a brief delay
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              >
                <Text style={styles.addButtonText}>
                  + Add Gratitude
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.addButton, styles.selfPraiseButton]}
                onPress={() => {
                  setInputType('self-praise');
                  setShowInput(true);
                  // Auto-scroll to input area after a brief delay
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              >
                <Text style={styles.addButtonText}>
                  + Add Self-Praise
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <GratitudeList
          gratitudes={todaysGratitudes}
        />
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CelebrationModal
        visible={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setBonusMilestone(null);
        }}
        type={celebrationType}
        streakDays={milestoneStreak || undefined}
        bonusCount={bonusMilestone || undefined}
        title={milestoneStreak ? t(`journal.streakMilestone${milestoneStreak}_title`) || t('journal.streakMilestone_generic_title') : undefined}
        message={milestoneStreak ? t(`journal.streakMilestone${milestoneStreak}_text`) || t('journal.streakMilestone_generic_text').replace('{days}', String(milestoneStreak)) : undefined}
      />
      
      {/* Level-up celebration modal */}
      <CelebrationModal
        visible={celebrationState.visible}
        onClose={hideCelebration}
        type="level_up"
        levelUpData={celebrationState.levelUpData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  },
  contentWithInput: {
    paddingBottom: 100, // Extra padding when input is shown to ensure scrollability
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
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gratitudeButton: {
    backgroundColor: Colors.primary,
  },
  selfPraiseButton: {
    backgroundColor: Colors.success,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeContainer: {
    marginVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: Colors.text,
  },
  actionButtonsContainer: {
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: Layout.spacing.sm,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});