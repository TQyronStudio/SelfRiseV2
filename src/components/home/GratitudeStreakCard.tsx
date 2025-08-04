import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { gratitudeStorage } from '../../services/storage/gratitudeStorage';
import { GratitudeStreak } from '../../types/gratitude';
import { StreakSharingModal } from './StreakSharingModal';
import DebtRecoveryModal from '../gratitude/DebtRecoveryModal';
import {
  DebtSuccessModal,
  DebtErrorModal,
  DebtIssueModal,
  ForceResetModal,
} from '../gratitude/DebtModals';
import { AnimatedStreakNumber } from '../animations/AnimatedStreakNumber';
import { StreakTransition } from '../animations/StreakTransition';

interface JournalStreakCardProps {
  onPress?: () => void;
}

export function JournalStreakCard({ onPress }: JournalStreakCardProps) {
  const { t } = useI18n();
  const [streak, setStreak] = useState<GratitudeStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);
  const [totalAdsNeeded, setTotalAdsNeeded] = useState(0);

  // Modal states for debt recovery system
  const [showNoDebtModal, setShowNoDebtModal] = useState(false);
  const [showNotEnoughAdsModal, setShowNotEnoughAdsModal] = useState(false);
  const [showDebtIssueModal, setShowDebtIssueModal] = useState(false);
  const [showDebtPaidModal, setShowDebtPaidModal] = useState(false);
  const [showDebtErrorModal, setShowDebtErrorModal] = useState(false);
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [currentErrorMessage, setCurrentErrorMessage] = useState('');
  
  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<'freeze-to-fire' | 'fire-to-freeze'>('freeze-to-fire');
  const [previousFrozenState, setPreviousFrozenState] = useState<boolean | null>(null);

  useEffect(() => {
    loadStreakData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStreakData();
    }, [])
  );

  const loadStreakData = async () => {
    try {
      setIsLoading(true);
      // Force recalculation to trigger auto-reset if needed
      const streakData = await gratitudeStorage.calculateAndUpdateStreak();
      
      setStreak(streakData);
    } catch (error) {
      console.error('Failed to load streak data:', error);
      // Set default streak data on error
      setStreak({
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
        streakStartDate: null,
        canRecoverWithAd: false,
        debtDays: 0,
        isFrozen: false,
        starCount: 0,
        flameCount: 0,
        crownCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const streakData = streak!;

  // Detect frozen state changes and trigger transitions
  useEffect(() => {
    if (previousFrozenState !== null && previousFrozenState !== streakData.isFrozen) {
      // State changed, trigger transition
      const newTransitionType = previousFrozenState ? 'freeze-to-fire' : 'fire-to-freeze';
      setTransitionType(newTransitionType);
      setIsTransitioning(true);
    }
    setPreviousFrozenState(streakData.isFrozen);
  }, [streakData.isFrozen, previousFrozenState]);

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  const handleDebtPress = async (e: any) => {
    e.stopPropagation();
    
    // Reset modal state first
    setAdsWatched(0);
    
    // Calculate total ads needed (fresh calculation)
    const adsNeeded = await gratitudeStorage.requiresAdsToday();
    setTotalAdsNeeded(adsNeeded);
    
    // If no ads needed, debt might already be paid
    if (adsNeeded === 0) {
      setShowNoDebtModal(true);
      return;
    }
    
    setShowDebtModal(true);
  };

  const handleWatchAd = async (): Promise<boolean> => {
    // 🚨 DŮLEŽITÉ: TESTING MOCK - Replace with real AdMob integration before production
    // Simuluje úspěšné zhlédnutí reklamy pro testovací účely
    // V produkci nahradit skutečnou AdMob implementací
    
    // Simulace loading času reklamy
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Automaticky úspěšné zhlédnutí reklamy pro testing
    setAdsWatched(prev => prev + 1);
    return true; // Vždy úspěšné pro testování
  };

  const handleDebtComplete = async () => {
    try {
      console.log(`[DEBUG] handleDebtComplete: adsWatched=${adsWatched}, totalAdsNeeded=${totalAdsNeeded}`);
      
      // CRITICAL FIX: Use totalAdsNeeded instead of adsWatched due to React state timing
      // When this function is called, all ads should be watched (verified by DebtRecoveryModal)
      const actualAdsWatched = totalAdsNeeded;
      console.log(`[DEBUG] handleDebtComplete: Using actualAdsWatched=${actualAdsWatched}`);
      
      // Pay debt with correct number of ads
      await gratitudeStorage.payDebtWithAds(actualAdsWatched);
      console.log(`[DEBUG] payDebtWithAds completed successfully`);
      
      // Close modal and reset state BEFORE reloading data
      setShowDebtModal(false);
      setAdsWatched(0);
      setTotalAdsNeeded(0);
      
      // Reload streak data to reflect changes
      await loadStreakData();
      console.log(`[DEBUG] loadStreakData completed`);
      
      // Double-check if debt was actually cleared
      const remainingDebt = await gratitudeStorage.calculateDebt();
      console.log(`[DEBUG] remainingDebt after payment: ${remainingDebt}`);
      
      if (remainingDebt > 0) {
        setCurrentErrorMessage(`There seems to be an issue with debt payment. Remaining debt: ${remainingDebt} days. Would you like to force reset your debt?`);
        setShowDebtIssueModal(true);
        return;
      }
      
      // Show success message
      setShowDebtPaidModal(true);
    } catch (error) {
      console.error('Failed to complete debt payment:', error);
      setCurrentErrorMessage(`Failed to pay debt: ${error instanceof Error ? error.message : 'Unknown error'}. Would you like to force reset your debt?`);
      setShowDebtErrorModal(true);
    }
  };
  
  const handleForceResetDebt = async () => {
    setShowForceResetModal(true);
  };

  const executeForceResetDebt = async () => {
    try {
      console.log(`[DEBUG] executeForceResetDebt: Starting force reset`);
      
      // CRITICAL FIX: Create actual entries to clear debt
      // calculateDebt() analyzes real entries, not just streak object
      const currentDebt = await gratitudeStorage.calculateDebt();
      console.log(`[DEBUG] executeForceResetDebt: Current debt=${currentDebt}`);
      
      if (currentDebt > 0) {
        // Force create entries for debt days to make calculateDebt() return 0
        const { today, subtractDays } = await import('@/src/utils/date');
        const currentDate = today();
        
        for (let i = 1; i <= currentDebt; i++) {
          const debtDate = subtractDays(currentDate, i);
          console.log(`[DEBUG] executeForceResetDebt: Creating force entries for ${debtDate}`);
          
          // Create 3 force reset entries for each debt day
          for (let j = 1; j <= 3; j++) {
            await gratitudeStorage.create({
              content: `Force reset - Recovery ${i}.${j}`,
              date: debtDate,
              type: 'gratitude',
            });
          }
        }
      }
      
      // Recalculate streak after force reset
      await gratitudeStorage.calculateAndUpdateStreak();
      console.log(`[DEBUG] executeForceResetDebt: Recalculated streak`);
      
      // Verify debt is now 0
      const verifyDebt = await gratitudeStorage.calculateDebt();
      console.log(`[DEBUG] executeForceResetDebt: Verification debt=${verifyDebt}`);
      
      // Close modal and reload data
      setShowForceResetModal(false);
      setAdsWatched(0);
      setTotalAdsNeeded(0);
      await loadStreakData();
      
      // Show success message
      setCurrentErrorMessage('Your debt has been reset. You can now write entries normally.');
      setShowDebtPaidModal(true);
      
    } catch (error) {
      console.error('Failed to reset debt:', error);
      setCurrentErrorMessage('Failed to reset debt. Please contact support.');
      setShowDebtErrorModal(true);
    }
  };

  const handleSharePress = (e: any) => {
    e.stopPropagation(); // Prevent triggering card onPress
    setShowSharingModal(true);
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="heart" size={24} color={Colors.primary} />
          <Text style={styles.title}>{t('home.journalStreak')}</Text>
        </View>
        
        <View style={styles.headerActions}>
          {/* Share button */}
          <TouchableOpacity 
            onPress={handleSharePress}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </View>
      </View>

      {/* Main streak display */}
      <View style={styles.streakSection}>
        <View style={styles.currentStreakContainer}>
          {/* Animated Streak Number */}
          <AnimatedStreakNumber
            number={streakData.currentStreak}
            isFrozen={streakData.isFrozen}
            isTransitioning={isTransitioning}
            onTransitionComplete={handleTransitionComplete}
            fontSize={48}
            style={styles.animatedNumber}
          />
          
          {/* Transition Overlay */}
          <StreakTransition
            isVisible={isTransitioning}
            transitionType={transitionType}
            onComplete={handleTransitionComplete}
            containerSize={{ width: 120, height: 100 }}
          />
          
          <Text style={[
            styles.streakLabel,
            streakData.isFrozen && styles.frozenStreakLabel
          ]}>
            {streakData.isFrozen ? 'frozen' : (streakData.currentStreak === 1 ? t('home.day') : t('home.days'))}
          </Text>
        </View>

        {/* Streak status */}
        <View style={styles.statusContainer}>
          {streakData.isFrozen ? (
            <View style={styles.statusFrozen}>
              <Ionicons name="snow" size={16} color="#4A90E2" />
              <Text style={styles.statusFrozenText}>Streak Frozen - Pay Debt to Continue</Text>
            </View>
          ) : streakData.currentStreak > 0 ? (
            <View style={styles.statusActive}>
              <Ionicons name="flame" size={16} color={Colors.success} />
              <Text style={styles.statusText}>{t('home.streakActive')}</Text>
            </View>
          ) : (
            <View style={styles.statusInactive}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.statusText}>{t('home.startToday')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {/* Longest streak */}
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{streakData.longestStreak}</Text>
          <Text style={styles.statLabel}>{t('home.bestStreak')}</Text>
        </View>

        {/* Milestone badges */}
        <View style={styles.badgesContainer}>
          {streakData.starCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>⭐</Text>
              <Text style={styles.badgeCount}>{streakData.starCount}</Text>
            </View>
          )}
          {streakData.flameCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🔥</Text>
              <Text style={styles.badgeCount}>{streakData.flameCount}</Text>
            </View>
          )}
          {streakData.crownCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>👑</Text>
              <Text style={styles.badgeCount}>{streakData.crownCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Debt warning or recovery option */}
      {streakData.debtDays > 0 ? (
        <TouchableOpacity style={styles.debtContainer} onPress={handleDebtPress}>
          <Ionicons name="warning" size={16} color={Colors.warning} />
          <Text style={styles.debtText}>
            ⚠️ Debt: {streakData.debtDays} day{streakData.debtDays !== 1 ? 's' : ''} - Tap to recover
          </Text>
        </TouchableOpacity>
      ) : streakData.canRecoverWithAd ? (
        <View style={styles.recoveryContainer}>
          <Ionicons name="refresh" size={16} color={Colors.warning} />
          <Text style={styles.recoveryText}>{t('home.canRecover')}</Text>
        </View>
      ) : null}
      
      {/* Sharing Modal */}
      <StreakSharingModal 
        visible={showSharingModal}
        onClose={() => setShowSharingModal(false)}
        streak={streakData}
      />
      
      {/* Debt Recovery Modal */}
      <DebtRecoveryModal
        visible={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        debtDays={streakData.debtDays}
        adsWatched={adsWatched}
        totalAdsNeeded={totalAdsNeeded}
        onWatchAd={handleWatchAd}
        onComplete={handleDebtComplete}
        onResetStreak={async () => {
          try {
            await gratitudeStorage.resetStreak();
            await loadStreakData();
          } catch (error) {
            console.error('Failed to reset streak:', error);
          }
        }}
      />

      {/* No Debt Modal */}
      <DebtSuccessModal
        visible={showNoDebtModal}
        onClose={() => {
          setShowNoDebtModal(false);
          loadStreakData();
        }}
        title="No Debt"
        message="Your debt appears to be already paid. Refreshing your streak data..."
        buttonText="OK"
      />


      {/* Not Enough Ads Modal */}
      <DebtErrorModal
        visible={showNotEnoughAdsModal}
        onClose={() => setShowNotEnoughAdsModal(false)}
        title="Not Enough Ads"
        message={`You need to watch ${totalAdsNeeded - adsWatched} more ad${totalAdsNeeded - adsWatched > 1 ? 's' : ''} to pay your debt.`}
        buttonText="OK"
      />

      {/* Debt Payment Issue Modal */}
      <DebtIssueModal
        visible={showDebtIssueModal}
        onClose={() => setShowDebtIssueModal(false)}
        onPrimaryAction={() => {
          setShowDebtIssueModal(false);
          setShowDebtModal(true);
        }}
        onSecondaryAction={() => {
          setShowDebtIssueModal(false);
          handleForceResetDebt();
        }}
        title="Debt Payment Issue"
        message={currentErrorMessage}
        primaryActionText="Try Again"
        secondaryActionText="Force Reset Debt"
      />

      {/* Debt Paid Success Modal */}
      <DebtSuccessModal
        visible={showDebtPaidModal}
        onClose={() => setShowDebtPaidModal(false)}
        title="Debt Paid!"
        message={currentErrorMessage || 'Your debt has been cleared. You can now write journal entries normally and your streak will continue.'}
        buttonText="OK"
      />

      {/* Debt Payment Error Modal */}
      <DebtIssueModal
        visible={showDebtErrorModal}
        onClose={() => setShowDebtErrorModal(false)}
        onPrimaryAction={() => {
          setShowDebtErrorModal(false);
          setShowDebtModal(true);
        }}
        onSecondaryAction={() => {
          setShowDebtErrorModal(false);
          handleForceResetDebt();
        }}
        title="Debt Payment Error"
        message={currentErrorMessage}
        primaryActionText="Try Again"
        secondaryActionText="Force Reset Debt"
      />

      {/* Force Reset Debt Confirmation Modal */}
      <ForceResetModal
        visible={showForceResetModal}
        onClose={() => setShowForceResetModal(false)}
        onConfirm={() => {
          setShowForceResetModal(false);
          executeForceResetDebt();
        }}
        title="Force Reset Debt"
        message="This will clear your debt without watching ads. Your streak will continue normally. Continue?"
        confirmText="Reset Debt"
        cancelText="Cancel"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 180,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginLeft: 8,
  },
  streakSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentStreakContainer: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    minHeight: 80,
    justifyContent: 'center',
  },
  animatedNumber: {
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    lineHeight: 56,
  },
  frozenStreakNumber: {
    color: '#4A90E2', // Ice blue color
    textShadowColor: 'rgba(74, 144, 226, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  frozenStreakLabel: {
    color: '#4A90E2',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusContainer: {
    marginTop: 4,
  },
  statusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusFrozen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  statusText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginLeft: 4,
  },
  statusFrozenText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#4A90E2',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeCount: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginTop: 2,
  },
  recoveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
  },
  recoveryText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.warning,
    marginLeft: 6,
  },
  debtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
  },
  debtText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.warning,
    marginLeft: 6,
    textAlign: 'center',
  },
});