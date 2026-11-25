import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
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
import StreakWarmUpModal from '../gratitude/StreakWarmUpModal';
import { WarmUpSuccessModal, WarmUpErrorModal } from '../gratitude/WarmUpModals';
import { useStreakWarmUp } from '../../hooks/useStreakWarmUp';

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
  
  // Ref to always hold the latest handleDebtPress — avoids stale closure in useImperativeHandle
  // (handleDebtPress is defined after the early return, so it can't be captured directly)
  const handleDebtPressRef = useRef<((e: any) => void) | undefined>(undefined);

  // 🚀 IMPERATIVE HANDLE: Expose triggerDebtModal method to parent component
  useImperativeHandle(ref, () => ({
    triggerDebtModal: () => {
      console.log('[DEBUG] JournalStreakCard: triggerDebtModal called from external trigger');
      const mockEvent = { stopPropagation: () => {} };
      handleDebtPressRef.current?.(mockEvent);
    }
  }), []);

  // E11a: the warm-up logic lives in one shared hook (Home and, from E12, the Journal).
  const warmUp = useStreakWarmUp();

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
    await warmUp.openWarmUp();
  };
  // Keep ref updated so useImperativeHandle's closure always calls the latest version
  handleDebtPressRef.current = handleDebtPress;

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
      
      {/* Debt Recovery Modal */}
      <StreakWarmUpModal
        visible={warmUp.sheetOpen}
        onClose={warmUp.closeSheet}
        frozenDays={streakData.frozenDays}
        adsWatched={warmUp.adsWatched}
        totalAdsNeeded={warmUp.totalAdsNeeded}
        onWatchAd={warmUp.watchAd}
        onComplete={warmUp.completeWarmUp}
        onResetStreak={warmUp.startFresh}
      />

      {warmUp.notice && warmUp.notice.kind !== 'error' && (
        <WarmUpSuccessModal
          visible={true}
          onClose={warmUp.clearNotice}
          title={warmUp.notice.title}
          message={warmUp.notice.message}
          buttonText={warmUp.notice.kind === 'congratulations' ? t('journal.rescue.congratulations.continue') : t('common.ok')}
        />
      )}

      {warmUp.notice?.kind === 'error' && (
        <WarmUpErrorModal
          visible={true}
          onClose={warmUp.clearNotice}
          title={warmUp.notice.title}
          message={warmUp.notice.message}
          buttonText={t('common.ok')}
        />
      )}
    </TouchableOpacity>
  );
});