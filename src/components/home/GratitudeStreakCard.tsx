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
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { useGratitude } from '../../contexts/GratitudeContext';
import { gratitudeStorage } from '../../services/storage/gratitudeStorage';
import { GratitudeStreak, DebtHistoryEntry } from '../../types/gratitude';
import { BaseStorage, STORAGE_KEYS } from '../../services/storage/base';
import { StreakSharingModal } from './StreakSharingModal';
import DebtRecoveryModal from '../gratitude/DebtRecoveryModal';
import {
  DebtSuccessModal,
  DebtErrorModal,
  DebtIssueModal,
  ForceResetModal,
} from '../gratitude/DebtModals';

interface JournalStreakCardProps {
  onPress?: () => void;
}

// 🚀 REF INTERFACE: For auto-opening debt modal from external triggers
export interface JournalStreakCardRef {
  triggerDebtModal: () => void;
}

export const JournalStreakCard = forwardRef<JournalStreakCardRef, JournalStreakCardProps>(({ onPress }, ref) => {
  const { t } = useI18n();
  const { actions } = useGratitude();
  const [streak, setStreak] = useState<GratitudeStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);
  const [totalAdsNeeded, setTotalAdsNeeded] = useState(0);
  const [issueRetryCount, setIssueRetryCount] = useState(0);
  
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
      title: '🎉 Streak Rescued!',
      message: 'Congratulations! Your streak has been successfully rescued. You can now write journal entries normally.',
      primaryText: 'Continue',
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
        preserveCurrentStreak: false,
        debtPayments: [],
        debtHistory: [],
        autoResetTimestamp: null,
        autoResetReason: null,
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

  const handleDebtPress = async (e: any) => {
    e.stopPropagation();
    
    // Reset modal state first
    setAdsWatched(0);
    
    // Calculate total ads needed (fresh calculation)
    const adsNeeded = await gratitudeStorage.requiresAdsToday();
    setTotalAdsNeeded(adsNeeded);
    
    // BUG #4 FIX: Use coordinated modal flow
    if (adsNeeded === 0) {
      showSuccessModal('No Debt', 'Your streak appears to be already rescued. Refreshing your streak data...');
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
      const paymentResult = await gratitudeStorage.applySingleAdPayment();
      console.log(`[DEBUG] handleWatchAd: Payment result`, paymentResult);
      
      // Update local state to reflect the payment
      setAdsWatched(prev => prev + 1);
      
      // If fully paid, update total needed (for UI consistency)
      if (paymentResult.isFullyPaid) {
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
      
      // Reload streak data to reflect changes
      await loadStreakData();
      console.log(`[DEBUG] loadStreakData completed`);
      
      // CRITICAL FIX: Also refresh GratitudeContext so My Journal screen updates immediately
      await actions.refreshStats();
      console.log(`[DEBUG] GratitudeContext refreshStats completed`);
      
      // Verify debt was actually cleared (should be 0 due to incremental payments)
      const remainingDebt = await gratitudeStorage.calculateDebt();
      console.log(`[DEBUG] remainingDebt after completion: ${remainingDebt}`);
      
      if (remainingDebt > 0) {
        // AUTOMATIC FIX: User watched all ads, automatically clear remaining debt
        console.log(`[DEBUG] Auto-fixing remaining debt: ${remainingDebt} days`);
        try {
          await executeForceResetDebt();
          showSuccessModal('Streak Rescued!', 'Your streak has been successfully rescued! There was a technical issue but we fixed it automatically.');
          return;
        } catch (autoFixError) {
          console.error('Auto-fix failed:', autoFixError);
          showErrorModal('Technical Issue', 'You watched all required ads but we encountered a technical issue. Your streak rescue is complete, please restart the app if needed.');
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
          'Technical Issue', 
          `We encountered a technical issue while completing your streak rescue (attempt ${issueRetryCount + 1}/2). Please try again.`
        );
      } else {
        // After 2 failures, automatically fix it with apology
        console.log(`[DEBUG] Auto-fixing after 2 failed attempts`);
        try {
          await executeForceResetDebt();
          showSuccessModal(
            'Issue Resolved', 
            'We apologize for the technical issue. Your streak has been successfully rescued and you can now continue writing entries normally.'
          );
        } catch (autoFixError) {
          console.error('Auto-fix failed after retries:', autoFixError);
          showErrorModal('Critical Error', 'We encountered a critical technical issue. Please restart the app. Your data is safe.');
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
      console.log(`[DEBUG] executeForceResetDebt: Starting clean force reset`);
      
      // ENHANCED: Clean debt reset without creating fake entries
      // Simply clear all debt tracking data and unfreeze streak
      const currentStreakInfo = await gratitudeStorage.getStreak();
      console.log(`[DEBUG] executeForceResetDebt: Current debt=${currentStreakInfo.debtDays}`);
      
      // Create history entry for force reset
      const historyEntry: DebtHistoryEntry = {
        action: 'force_reset',
        timestamp: new Date(),
        debtBefore: currentStreakInfo.debtDays,
        debtAfter: 0,
        details: 'Force reset - All debt cleared without ads',
        missedDates: [], // Will be populated with actual unpaid dates
        adsInvolved: 0,
      };

      // Clear all debt tracking data
      const resetStreakInfo: GratitudeStreak = {
        ...currentStreakInfo,
        debtDays: 0,               // Clear debt completely
        isFrozen: false,           // Unfreeze streak
        canRecoverWithAd: false,   // No longer need recovery
        debtPayments: [],          // Clear payment history
        debtHistory: [...currentStreakInfo.debtHistory, historyEntry], // Keep audit trail
        autoResetTimestamp: new Date(), // CRITICAL BUG #2 FIX: Mark force reset
        autoResetReason: 'Force reset by user action',
        preserveCurrentStreak: false, // Normal calculation from now
      };
      
      // Save updated streak info
      await BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, resetStreakInfo);
      console.log(`[DEBUG] executeForceResetDebt: Debt force reset completed`);
      
      // Recalculate streak to ensure consistency
      await gratitudeStorage.calculateAndUpdateStreak();
      console.log(`[DEBUG] executeForceResetDebt: Streak recalculated`);
      
      // Verify debt is now 0
      const verifyDebt = await gratitudeStorage.calculateDebt();
      console.log(`[DEBUG] executeForceResetDebt: Verification debt=${verifyDebt}`);
      
      // BUG #4 FIX: Clean up and show success using coordinated flow
      setAdsWatched(0);
      setTotalAdsNeeded(0);
      await loadStreakData();
      
      // Refresh context
      await actions.refreshStats();
      
      // Show success message with apology
      showSuccessModal('Issue Resolved', 'We apologize for the technical issue. Your streak has been successfully rescued and you can continue writing entries normally.');
      
    } catch (error) {
      console.error('Failed to reset debt:', error);
      // BUG #4 FIX: Use coordinated modal flow for errors
      showErrorModal('Reset Failed', 'Failed to reset debt. Please contact support.');
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
            {streakData.isFrozen ? 'frozen' : (streakData.currentStreak === 1 ? t('home.day') : t('home.days'))}
          </Text>
        </View>

        {/* Streak status */}
        <View style={styles.statusContainer}>
          {streakData.isFrozen ? (
            <View style={styles.statusFrozen}>
              <Ionicons name="snow" size={16} color="#4A90E2" />
              <Text style={styles.statusFrozenText}>Streak Frozen - Rescue Streak to Continue</Text>
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
            ⚠️ Debt: {streakData.debtDays} day{streakData.debtDays !== 1 ? 's' : ''} - Tap to rescue streak
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

      {/* BUG #4 FIX: Central Modal System - replaces all 6 separate modals above */}
      {currentModal.type === DebtModalType.SUCCESS && (
        <DebtSuccessModal
          visible={true}
          onClose={currentModal.onPrimaryAction || closeModal}
          title={currentModal.title || 'Success!'}
          message={currentModal.message || 'Operation completed successfully.'}
          buttonText={currentModal.primaryText || 'OK'}
        />
      )}

      {currentModal.type === DebtModalType.ERROR && (
        <DebtErrorModal
          visible={true}
          onClose={currentModal.onPrimaryAction || closeModal}
          title={currentModal.title || 'Error'}
          message={currentModal.message || 'Something went wrong. Please try again.'}
          buttonText={currentModal.primaryText || 'OK'}
        />
      )}

      {/* REMOVED: DebtIssueModal and ForceResetModal - replaced with progressive error handling */}

      {currentModal.type === DebtModalType.CONGRATULATIONS && (
        <DebtSuccessModal
          visible={true}
          onClose={currentModal.onPrimaryAction || closeModal}
          title={currentModal.title || '🎉 Congratulations!'}
          message={currentModal.message || 'Your debt has been cleared successfully!'}
          buttonText={currentModal.primaryText || 'Continue'}
        />
      )}
    </TouchableOpacity>
  );
});

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
  streakNumber: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    lineHeight: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  frozenStreakNumber: {
    color: '#E8F4FD', // Light ice blue for better visibility
    textShadowColor: 'rgba(74, 144, 226, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
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