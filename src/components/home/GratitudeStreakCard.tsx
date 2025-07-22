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

interface JournalStreakCardProps {
  onPress?: () => void;
}

export function JournalStreakCard({ onPress }: JournalStreakCardProps) {
  const { t } = useI18n();
  const [streak, setStreak] = useState<GratitudeStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSharingModal, setShowSharingModal] = useState(false);

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
      const streakData = await gratitudeStorage.getStreakInfo();
      
      
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
          <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
          <Text style={styles.streakLabel}>
            {streakData.currentStreak === 1 ? t('home.day') : t('home.days')}
          </Text>
        </View>

        {/* Streak status */}
        <View style={styles.statusContainer}>
          {streakData.currentStreak > 0 ? (
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

      {/* Recovery option */}
      {streakData.canRecoverWithAd && (
        <View style={styles.recoveryContainer}>
          <Ionicons name="refresh" size={16} color={Colors.warning} />
          <Text style={styles.recoveryText}>{t('home.canRecover')}</Text>
        </View>
      )}
      
      {/* Sharing Modal */}
      <StreakSharingModal 
        visible={showSharingModal}
        onClose={() => setShowSharingModal(false)}
        streak={streakData}
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
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    lineHeight: 56,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
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
  statusText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginLeft: 4,
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
});