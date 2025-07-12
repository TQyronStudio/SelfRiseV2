import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { today } from '@/src/utils/date';
import { Colors, Layout } from '@/src/constants';
import GratitudeInput from '@/src/components/gratitude/GratitudeInput';
import GratitudeList from '@/src/components/gratitude/GratitudeList';
import DailyGratitudeProgress from '@/src/components/gratitude/DailyGratitudeProgress';
import CelebrationModal from '@/src/components/gratitude/CelebrationModal';

export default function GratitudeScreen() {
  const { t } = useI18n();
  const { state, actions } = useGratitude();
  const [showInput, setShowInput] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'daily_complete' | 'streak_milestone'>('daily_complete');
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  
  const todayDate = today();
  const todaysGratitudes = actions.getGratitudesByDate(todayDate);
  const currentCount = todaysGratitudes.length;
  const isComplete = currentCount >= 3;
  const hasBonus = currentCount >= 4;

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
        
        if ([7, 14, 21, 30, 50, 60, 75, 90, 100, 150, 180, 200, 250, 365, 500, 750, 1000].includes(currentStreak)) {
          setMilestoneStreak(currentStreak);
          setCelebrationType('streak_milestone');
          setShowCelebration(true);
        }
      }, 1000); // Delay to let daily celebration show first
    }

    // Track bonus milestones silently (no celebrations)
    if (newCount >= 4) {
      const bonusCount = newCount - 3;
      
      // Check if this is a new milestone (1st, 5th, 10th bonus of the day)
      if (bonusCount === 1 || bonusCount === 5 || bonusCount === 10) {
        // Immediately increment the appropriate milestone counter
        setTimeout(async () => {
          await actions.incrementMilestoneCounter(bonusCount);
          await actions.refreshStats(); // Refresh to show updated counts
        }, 100); // Small delay to ensure gratitude is saved first
      }
    }
  }, [currentCount, t]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
        
        {showInput && (
          <GratitudeInput 
            onSubmitSuccess={handleInputSuccess} 
            isBonus={isComplete}
          />
        )}
        
        {!showInput && (
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowInput(true)}
            >
              <Text style={styles.addButtonText}>
                + {t('gratitude.addGratitude')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <GratitudeList
          gratitudes={todaysGratitudes}
        />
      </ScrollView>
      
      <CelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        type={celebrationType}
        streakDays={milestoneStreak}
        title={milestoneStreak ? t(`gratitude.streak${milestoneStreak}_title`) || 'Another Milestone! 🎯' : undefined}
        message={milestoneStreak ? t(`gratitude.streak${milestoneStreak}_text`) || `Congratulations on reaching ${milestoneStreak} days in a row!` : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: Layout.spacing.md,
  },
  addButtonContainer: {
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  addButton: {
    backgroundColor: Colors.primary,
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
});