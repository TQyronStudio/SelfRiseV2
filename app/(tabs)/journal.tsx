import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
// useOptimizedGamification removed - components use GamificationService directly
import { GamificationService } from '@/src/services/gamificationService';
import { getLevelInfo } from '@/src/services/levelCalculation';
// GHOST SYSTEM REMOVED: useLevelUpCelebrations hook eliminado - XpAnimationContext handles level-ups centrally
import { useXpAnimation } from '@/src/contexts/XpAnimationContext';
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
        // Show bonus milestone modal
        const bonusCount = nextModal.data.bonusCount;
        const xpAmount = nextModal.data.xpAmount;
        setBonusMilestone(bonusCount);
        setBonusXpAmount(xpAmount);
        setCelebrationType('bonus_milestone');
        
        // COORDINATION: Notify activity modal started (Tier 1 priority)
        notifyActivityModalStarted('journal');
        setShowCelebration(true);
        
        console.log(`🎉 Showing Journal bonus milestone modal for position ${bonusCount} (${nextModal.data.emoji})`);
        
        // Process milestone counter increment
        setTimeout(async () => {
          await actions.incrementMilestoneCounter(bonusCount);
          await actions.refreshStats();
        }, 100);
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

  // Smart scroll to position input in upper third of screen
  const scrollToInputInUpperThird = useCallback(() => {
    setTimeout(() => {
      if (inputRef.current && scrollViewRef.current) {
        inputRef.current.measureInWindow((x, y, width, height) => {
          const screenHeight = Dimensions.get('window').height;
          const upperThirdPosition = screenHeight / 3;
          
          // Calculate scroll offset to position input in upper third
          const targetScrollY = Math.max(0, y - upperThirdPosition);
          
          scrollViewRef.current?.scrollTo({
            y: targetScrollY,
            animated: true
          });
        });
      }
    }, 200); // Delay to ensure input is rendered and measured
  }, []);


  // Handle quick actions from home screen
  useEffect(() => {
    if (params.quickAction === 'addGratitude') {
      setInputType('gratitude');
      setShowInput(true);
      // Smart scroll to position input in upper third
      scrollToInputInUpperThird();
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/journal');
      }, 100);
    } else if (params.quickAction === 'addSelfPraise') {
      setInputType('self-praise');
      setShowInput(true);
      // Smart scroll to position input in upper third
      scrollToInputInUpperThird();
      // Clear the quick action parameter after a brief delay to prevent re-triggering
      setTimeout(() => {
        router.replace('/(tabs)/journal');
      }, 100);
    }
  }, [params.quickAction, scrollToInputInUpperThird]);

  const handleInputSuccess = useCallback(async () => {
    setShowInput(false);
    const newCount = currentCount + 1;
    
    // Show celebration on 3rd gratitude
    if (newCount === 3) {
      setCelebrationType('daily_complete');
      
      // COORDINATION: Notify activity modal started (Tier 1 priority)
      notifyActivityModalStarted('journal');
      setShowCelebration(true);
      
      // Check for streak milestones after completing daily requirement
      setTimeout(async () => {
        await actions.refreshStats();
        const currentStreak = state.streakInfo?.currentStreak || 0;
        
        // Show celebration for special milestones (21, 100, 365, 1000) or generic for others
        if ([7, 14, 21, 30, 50, 60, 75, 90, 100, 150, 180, 200, 250, 365, 500, 750, 1000].includes(currentStreak)) {
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
                  // Smart scroll to position input in upper third
                  scrollToInputInUpperThird();
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
                  // Smart scroll to position input in upper third
                  scrollToInputInUpperThird();
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