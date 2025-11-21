// Loyalty Progress Card Component - Sub-checkpoint 4.5.10.C
// Displays loyalty progress in Trophy Room with level, milestones, and motivation

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';
import {
  LoyaltyTracking,
  LoyaltyLevel,
  LoyaltyProgress,
  LoyaltyLevelDisplay,
  LoyaltyMilestone
} from '@/src/types/gamification';
import { LoyaltyService } from '@/src/services/loyaltyService';

interface LoyaltyProgressCardProps {
  onPress?: () => void;
  expanded?: boolean;
}

export const LoyaltyProgressCard: React.FC<LoyaltyProgressCardProps> = ({
  onPress,
  expanded = false
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyTracking | null>(null);
  const [loyaltyProgress, setLoyaltyProgress] = useState<LoyaltyProgress | null>(null);
  const [levelDisplay, setLevelDisplay] = useState<LoyaltyLevelDisplay | null>(null);
  const [nextMilestone, setNextMilestone] = useState<LoyaltyMilestone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      
      // Load loyalty data
      const loyalty = await LoyaltyService.getLoyaltyData();
      setLoyaltyData(loyalty);

      // Calculate progress
      const progress = LoyaltyService.calculateLoyaltyProgress(loyalty.totalActiveDays);
      setLoyaltyProgress(progress);

      // Get level display info
      const display = LoyaltyService.getLoyaltyLevelDisplay(loyalty.loyaltyLevel);
      setLevelDisplay(display);

      // Get next milestone
      const next = await LoyaltyService.getNextMilestone();
      setNextMilestone(next);

    } catch (error) {
      console.error('LoyaltyProgressCard.loadLoyaltyData error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMotivationMessage = () => {
    if (!loyaltyProgress || !nextMilestone) return t('social.loyalty_progress.keepGrowing');
    return LoyaltyService.getLoyaltyMotivationMessage(
      loyaltyProgress.daysRemaining,
      nextMilestone.name
    );
  };

  // Create styles inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
    },

    // Loading and Error States
    loadingContainer: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 24,
      marginHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },

    errorContainer: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 24,
      marginHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    errorText: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Header Section
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    levelIcon: {
      fontSize: 28,
      marginRight: 12,
    },

    headerText: {
      flex: 1,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },

    levelName: {
      fontSize: 14,
      fontWeight: '500',
    },

    headerRight: {
      alignItems: 'center',
    },

    activeDaysValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 2,
    },

    activeDaysLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Progress Section
    progressSection: {
      marginBottom: 12,
    },

    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    progressText: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
      fontWeight: '500',
    },

    progressPercentage: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },

    progressTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginBottom: 6,
    },

    progressFill: {
      height: '100%',
      borderRadius: 3,
    },

    daysRemaining: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Complete Section
    completeSection: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 12,
    },

    completeIcon: {
      fontSize: 32,
      marginBottom: 8,
    },

    completeText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },

    completeSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Expanded Section
    expandedSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      marginBottom: 12,
    },

    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },

    statItem: {
      alignItems: 'center',
    },

    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },

    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Motivation Section
    motivationSection: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },

    motivationText: {
      fontSize: 13,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 18,
      fontStyle: 'italic',
    },

    // Description Section
    descriptionSection: {
      alignItems: 'center',
    },

    descriptionText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading loyalty data...</Text>
      </View>
    );
  }

  if (!loyaltyData || !loyaltyProgress || !levelDisplay) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ Loyalty data unavailable</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: levelDisplay.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.levelIcon, { color: levelDisplay.color }]}>
            {levelDisplay.icon}
          </Text>
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>🏆 Loyalty Journey</Text>
            <Text style={[styles.levelName, { color: levelDisplay.color }]}>
              {levelDisplay.name}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.activeDaysValue}>{loyaltyData.totalActiveDays}</Text>
          <Text style={styles.activeDaysLabel}>Active Days</Text>
        </View>
      </View>

      {/* Progress Section */}
      {!loyaltyProgress.isComplete && nextMilestone && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Next: {nextMilestone.name} ({loyaltyProgress.nextTarget} days)
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(loyaltyProgress.progress)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${loyaltyProgress.progress}%`,
                  backgroundColor: levelDisplay.color
                }
              ]}
            />
          </View>

          <Text style={styles.daysRemaining}>
            {loyaltyProgress.daysRemaining} days remaining
          </Text>
        </View>
      )}

      {/* Complete State */}
      {loyaltyProgress.isComplete && (
        <View style={styles.completeSection}>
          <Text style={styles.completeIcon}>🎉</Text>
          <Text style={styles.completeText}>
            You've reached maximum loyalty!
          </Text>
          <Text style={styles.completeSubtext}>
            {loyaltyData.totalActiveDays} days of dedication
          </Text>
        </View>
      )}

      {/* Expanded Information */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loyaltyData.currentActiveStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loyaltyData.longestActiveStreak}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: levelDisplay.color }]}>
                {levelDisplay.name}
              </Text>
              <Text style={styles.statLabel}>{t('social.loyalty_progress.level')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Motivation Message */}
      <View style={styles.motivationSection}>
        <Text style={styles.motivationText}>
          {getMotivationMessage()}
        </Text>
      </View>

      {/* Level Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.descriptionText}>
          {levelDisplay.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};