import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { useGratitude } from '../../contexts/GratitudeContext';
import { GratitudeStreak, WarmUpHistoryEntry } from '../../types/gratitude';
import { BaseStorage, STORAGE_KEYS } from '../../services/storage/base';
import { StreakSharingModal } from './StreakSharingModal';
import StreakWarmUpModal from '../gratitude/StreakWarmUpModal';
import {
  WarmUpSuccessModal,
  WarmUpErrorModal,
  WarmUpIssueModal,
  QuickWarmUpModal,
} from '../gratitude/WarmUpModals';

interface JournalStreakCardProps {
  onPress?: () => void;
}

// 🚀 REF INTERFACE: For auto-opening debt modal from external triggers
export interface JournalStreakCardRef {
  triggerDebtModal: () => void;
}

export const JournalStreakCard = forwardRef<JournalStreakCardRef, JournalStreakCardProps>(({ onPress }, ref) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { state, actions } = useGratitude();
  const [streak, setStreak] = useState<GratitudeStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);
  const [totalAdsNeeded, setTotalAdsNeeded] = useState(0);
  const [issueRetryCount, setIssueRetryCount] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false); // 🚨 CRITICAL FIX: Prevent multiple clicks
  
  // 🚀 IMPERATIVE HANDLE: Expose triggerDebtModal method to parent component
  useImperativeHandle(ref, () => ({
    triggerDebtModal: () => {
      console.log('[DEBUG] JournalStreakCard: triggerDebtModal called from external trigger');
      // Simulate debt press to open modal by calling the existing handler
      const mockEvent = { stopPropagation: () => {} };
      handleDebtPress(mockEvent);
    }
  }), []);

  // BUG #4 FIX: Central Modal State Management - replace 10 modal states with 1
  enum DebtModalType {
    NONE = 'none',
    DEBT_RECOVERY = 'debt_recovery',
    SUCCESS = 'success',
    ERROR = 'error', 
    CONGRATULATIONS = 'congratulations',
  }

  interface ModalConfig {
    type: DebtModalType;
    title?: string;
    message?: string;
    primaryText?: string;
    secondaryText?: string;
    onPrimaryAction?: () => void;
    onSecondaryAction?: () => void;
  }

  const [currentModal, setCurrentModal] = useState<ModalConfig>({ type: DebtModalType.NONE });
  
  // BUG #4 FIX: Modal helper functions for coordinated flow
  const showModal = (config: ModalConfig) => {
    console.log(`[DEBUG] Modal: Showing ${config.type}`);
    setCurrentModal(config);
  };

  const closeModal = () => {
    console.log(`[DEBUG] Modal: Closing ${currentModal.type}`);
    setCurrentModal({ type: DebtModalType.NONE });
  };

  const showSuccessModal = (title: string, message: string) => {
    showModal({
      type: DebtModalType.SUCCESS,
      title,
      message,
      primaryText: 'OK',
      onPrimaryAction: closeModal,
    });
  };

  const showErrorModal = (title: string, message: string) => {
    showModal({
      type: DebtModalType.ERROR,
      title,
      message,
      primaryText: 'OK',
      onPrimaryAction: closeModal,
    });
  };

  // REMOVED: showIssueModal - no longer needed with progressive error handling

  const showCongratulationsModal = () => {
    showModal({
      type: DebtModalType.CONGRATULATIONS,
      title: t('journal.rescue.congratulations.title'),
      message: t('journal.rescue.congratulations.message'),
      primaryText: t('journal.rescue.congratulations.continue'),
      onPrimaryAction: closeModal,
    });
  };

  

  useEffect(() => {
    loadStreakData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStreakData();
    }, [])
  );

  // Update local streak state when context state changes
  useEffect(() => {
    if (state.streakInfo) {
      setStreak(state.streakInfo);
      setIsLoading(false);
    }
  }, [state.streakInfo]);

  const loadStreakData = async () => {
    try {
      setIsLoading(true);
      // Force recalculation to trigger auto-reset if needed
      await actions.refreshStats();
    } catch (error) {
      console.error('Failed to load streak data:', error);
      
      // CRITICAL BUG FIX: Try to preserve existing streak data instead of resetting to 0
      try {
        // Fallback: Use existing streak data from context to preserve user's streak
        console.log('[DEBUG] Using fallback streak data from context to preserve user streak:', state.streakInfo?.currentStreak);
        setStreak(state.streakInfo);
      } catch (fallbackError) {
        console.error('Failed to load fallback streak data:', fallbackError);
        // Only as last resort, set minimal default data
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastEntryDate: null,
          streakStartDate: null,
          canRecoverWithAd: false,
          frozenDays: 0,
          isFrozen: false,
          justUnfrozeToday: false,
          preserveCurrentStreak: false,
          warmUpCompletedOn: null,
          warmUpPayments: [],
          warmUpHistory: [],
          autoResetTimestamp: null,
          autoResetReason: null,
          streakBeforeFreeze: null,
          starCount: 0,
          flameCount: 0,
          crownCount: 0,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 8,
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
      color: colors.text,
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
    streakNumber: {
      fontSize: 48,
      fontFamily: Fonts.bold,
      color: colors.primary,
      lineHeight: 56,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    frozenStreakNumber: {
      color: '#E8F4FD',
      textShadowColor: 'rgba(74, 144, 226, 0.8)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    streakLabel: {
      fontSize: 16,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    frozenStreakLabel: {
      color: '#B0E0E6',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textShadowColor: 'rgba(74, 144, 226, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    statusContainer: {
      marginTop: 4,
    },
    statusActive: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.successLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusInactive: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
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
      color: colors.text,
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
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badgesContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
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
      color: colors.text,
      marginTop: 2,
    },
    recoveryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.warningLight,
      borderRadius: 8,
    },
    recoveryText: {
      fontSize: 12,
      fontFamily: Fonts.medium,
      color: colors.warning,
      marginLeft: 6,
    },
    frozenContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.warningLight,
      borderRadius: 8,
    },
    frozenText: {
      fontSize: 12,
      fontFamily: Fonts.medium,
      color: colors.warning,
      marginLeft: 6,
      textAlign: 'center',
    },
  });

  if (isLoading || !streak) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const streakData = streak;

  const handleDebtPress = async (e: any) => {
    e.stopPropagation();
    
    // Reset modal state first
    setAdsWatched(0);
    
    // Calculate total ads needed (fresh calculation)
    const adsNeeded = await actions.adsNeededToWarmUp();
    setTotalAdsNeeded(adsNeeded);
    
    // BUG #4 FIX: Use coordinated modal flow
    if (adsNeeded === 0) {
      showSuccessModal(t('journal.rescue.noDebt.title'), t('journal.rescue.noDebt.message'));
      return;
    }
    
    setShowDebtModal(true);
  };

  const handleWatchAd = async (): Promise<boolean> => {
    // 🚨 DŮLEŽITÉ: TESTING MOCK - Replace with real AdMob integration before production
    // Simuluje úspěšné zhlédnutí reklamy pro testovací účely
    // V produkci nahradit skutečnou AdMob implementací
    
    try {
      // Simulace loading času reklamy
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ENHANCED: Apply single ad payment immediately after successful ad watch
      const paymentResult = await actions.applySingleWarmUpPayment();
      console.log(`[DEBUG] handleWatchAd: Payment result`, paymentResult);
      
      // Update local state to reflect the payment
      setAdsWatched(prev => prev + 1);
      
      // If fully paid, update total needed (for UI consistency)
      if (paymentResult.isFullyWarmed) {
        setTotalAdsNeeded(adsWatched + 1);
      }
      
      return true; // Successful ad watch and payment
    } catch (error) {
      console.error(`[DEBUG] handleWatchAd: Error applying ad payment:`, error);
      return false; // Failed to apply payment
    }
  };

  const handleDebtComplete = async () => {
    try {
      console.log(`[DEBUG] handleDebtComplete: Starting debt completion verification`);
      
      // ENHANCED: Debt payments are now applied incrementally in handleWatchAd()
      // This function just verifies completion and refreshes UI state
      
      // Close modal and reset state BEFORE reloading data
      setShowDebtModal(false);
      setAdsWatched(0);
      setTotalAdsNeeded(0);
      
      // CRITICAL FIX: Only refresh once to avoid duplicate calculateAndUpdateStreak() calls
      // applySingleWarmUpPayment() already updated streak internally, just refresh UI state
      await actions.refreshStats();
      
      // Verify debt was actually cleared (should be 0 due to incremental payments)
      const remainingDebt = await actions.calculateFrozenDays();
      console.log(`[DEBUG] remainingDebt after completion: ${remainingDebt}`);
      
      if (remainingDebt > 0) {
        // AUTOMATIC FIX: User watched all ads, automatically clear remaining debt
        console.log(`[DEBUG] Auto-fixing remaining debt: ${remainingDebt} days`);
        try {
          await executeForceResetDebt();
          showSuccessModal(t('journal.rescue.autoFixed.title'), t('journal.rescue.autoFixed.message'));
          return;
        } catch (autoFixError) {
          console.error('Auto-fix failed:', autoFixError);
          showErrorModal(t('journal.rescue.technicalIssue.title'), t('journal.rescue.technicalIssue.message'));
          return;
        }
      }
      
      // BUG #4 FIX: Show congratulations modal instead of generic success
      showCongratulationsModal();
    } catch (error) {
      console.error('Failed to complete debt verification:', error);
      
      // IMPROVED: Progressive error handling - try again first, force reset after 2 failures
      if (issueRetryCount < 2) {
        setIssueRetryCount(prev => prev + 1);
        showErrorModal(
          t('journal.rescue.technicalIssueRetry.title'),
          t('journal.rescue.technicalIssueRetry.message', { attempt: issueRetryCount + 1 })
        );
      } else {
        // After 2 failures, automatically fix it with apology
        console.log(`[DEBUG] Auto-fixing after 2 failed attempts`);
        try {
          await executeForceResetDebt();
          showSuccessModal(
            t('journal.rescue.issueResolved.title'),
            t('journal.rescue.issueResolved.message')
          );
        } catch (autoFixError) {
          console.error('Auto-fix failed after retries:', autoFixError);
          showErrorModal(t('journal.rescue.criticalError.title'), t('journal.rescue.criticalError.message'));
        }
        setIssueRetryCount(0); // Reset for future issues
      }
    }
  };
  
  const handleForceResetDebt = async () => {
    // IMPROVED: Direct execution with apology message - no user choice needed
    await executeForceResetDebt();
  };

  const executeForceResetDebt = async () => {
    try {
      
      // ENHANCED: Clean debt reset without creating fake entries
      // Simply clear all debt tracking data and unfreeze streak
      const currentStreakInfo = state.streakInfo;

      if (!currentStreakInfo) {
        console.error('[DEBUG] executeForceResetDebt: No streak info available');
        return;
      }

      // Create history entry for force reset
      const historyEntry: WarmUpHistoryEntry = {
        action: 'quick_warm_up',
        timestamp: new Date(),
        frozenDaysBefore: currentStreakInfo.frozenDays,
        frozenDaysAfter: 0,
        details: 'Force reset - All debt cleared without ads',
        missedDates: [], // Will be populated with actual unpaid dates
        adsInvolved: 0,
      };

      // Clear all debt tracking data
      const resetStreakInfo: GratitudeStreak = {
        ...currentStreakInfo,
        frozenDays: 0,               // Clear frozen days completely
        isFrozen: false,           // Unfreeze streak
        canRecoverWithAd: false,   // No longer need recovery
        warmUpPayments: [],          // Clear payment history
        warmUpHistory: [...currentStreakInfo.warmUpHistory, historyEntry], // Keep audit trail
        autoResetTimestamp: new Date(), // CRITICAL BUG #2 FIX: Mark force reset
        autoResetReason: 'Force reset by user action',
        preserveCurrentStreak: false, // Normal calculation from now
      };
      
      // Save updated streak info
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, resetStreakInfo);
      
      // Recalculate streak to ensure consistency
      await actions.refreshStats();

      // Verify debt is now 0
      const verifyDebt = await actions.calculateFrozenDays();
      
      // BUG #4 FIX: Clean up and show success using coordinated flow
      setAdsWatched(0);
      setTotalAdsNeeded(0);
      await loadStreakData();
      
      // Refresh context
      await actions.refreshStats();
      
      // Show success message with apology
      showSuccessModal(t('journal.rescue.issueResolved.title'), t('journal.rescue.issueResolved.message'));
      
    } catch (error) {
      console.error('Failed to reset debt:', error);
      // BUG #4 FIX: Use coordinated modal flow for errors
      showErrorModal(t('journal.rescue.resetFailed.title'), t('journal.rescue.resetFailed.message'));
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
          <Ionicons name="heart" size={24} color={colors.primary} />
          <Text style={styles.title}>{t('home.journalStreak')}</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Share button */}
          <TouchableOpacity
            onPress={handleSharePress}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </View>

      {/* Main streak display */}
      <View style={styles.streakSection}>
        <View style={styles.currentStreakContainer}>
          <Text style={[
            styles.streakNumber,
            streakData.isFrozen && styles.frozenStreakNumber
          ]}>
            {streakData.currentStreak}
          </Text>
          <Text style={[
            styles.streakLabel,
            streakData.isFrozen && styles.frozenStreakLabel
          ]}>
            {streakData.isFrozen ? t('home.frozen') : (streakData.currentStreak === 1 ? t('home.day') : t('home.days'))}
          </Text>
        </View>

        {/* Streak status */}
        <View style={styles.statusContainer}>
          {streakData.isFrozen ? (
            <View style={styles.statusFrozen}>
              <Ionicons name="snow" size={16} color="#4A90E2" />
              <Text style={styles.statusFrozenText}>{t('home.streakFrozen')}</Text>
            </View>
          ) : streakData.currentStreak > 0 ? (
            <View style={styles.statusActive}>
              <Ionicons name="flame" size={16} color={colors.success} />
              <Text style={styles.statusText}>{t('home.streakActive')}</Text>
            </View>
          ) : (
            <View style={styles.statusInactive}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
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
      {streakData.frozenDays > 0 ? (
        <TouchableOpacity style={styles.frozenContainer} onPress={handleDebtPress}>
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={styles.frozenText}>
            {t('home.streakFrozenTap', { count: streakData.frozenDays })}
          </Text>
        </TouchableOpacity>
      ) : streakData.canRecoverWithAd ? (
        <View style={styles.recoveryContainer}>
          <Ionicons name="refresh" size={16} color={colors.warning} />
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
      <StreakWarmUpModal
        visible={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        frozenDays={streakData.frozenDays}
        adsWatched={adsWatched}
        totalAdsNeeded={totalAdsNeeded}
        onWatchAd={handleWatchAd}
        onComplete={handleDebtComplete}
        onResetStreak={async () => {
          try {
            await actions.resetStreak();
            await loadStreakData();
          } catch (error) {
            console.error('Failed to reset streak:', error);
          }
        }}
      />

      {/* BUG #4 FIX: Central Modal System - replaces all 6 separate modals above */}
      {currentModal.type === DebtModalType.SUCCESS && (
        <WarmUpSuccessModal
          visible={true}
          onClose={currentModal.onPrimaryAction || closeModal}
          title={currentModal.title || t('journal.fallback.success')}
          message={currentModal.message || t('journal.fallback.operationComplete')}
          buttonText={currentModal.primaryText || t('common.ok')}
        />
      )}

      {currentModal.type === DebtModalType.ERROR && (
        <WarmUpErrorModal
          visible={true}
          onClose={currentModal.onPrimaryAction || closeModal}
          title={currentModal.title || t('journal.fallback.error')}
          message={currentModal.message || t('journal.fallback.errorMessage')}
          buttonText={currentModal.primaryText || t('common.ok')}
        />
      )}

      {/* REMOVED: DebtIssueModal and ForceResetModal - replaced with progressive error handling */}

      {currentModal.type === DebtModalType.CONGRATULATIONS && (
        <WarmUpSuccessModal
          visible={true}
          onClose={currentModal.onPrimaryAction || closeModal}
          title={currentModal.title || t('journal.fallback.congratulations')}
          message={currentModal.message || t('journal.fallback.debtCleared')}
          buttonText={currentModal.primaryText || t('common.continue')}
        />
      )}
    </TouchableOpacity>
  );
});