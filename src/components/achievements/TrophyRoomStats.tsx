import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AchievementStats, AchievementRarity, AchievementCategory } from '@/src/types/gamification';
import { LoyaltyProgressCard } from './LoyaltyProgressCard';

interface TrophyRoomStatsProps {
  stats: AchievementStats;
  totalAchievements: number;
  unlockedCount: number;
  userLevel?: number;
  userAchievements?: { totalXPFromAchievements?: number };
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: string;
  progress?: number;
}

export const TrophyRoomStats: React.FC<TrophyRoomStatsProps> = ({
  stats,
  totalAchievements,
  unlockedCount,
  userLevel = 1,
  userAchievements,
}) => {
  const { colors } = useTheme();
  const completionRate = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;

  // Calculate rarity distribution
  const rarityStats = Object.entries(stats.rarityBreakdown).map(([rarity, data]) => ({
    rarity: rarity as AchievementRarity,
    ...data,
  }));

  // Styles - moved inside component to access colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    headerContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.cardBackgroundElevated,
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    primaryStatsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    statTextContainer: {
      flex: 1,
    },
    statTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    statSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginRight: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 28,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      marginHorizontal: 16,
    },
    qualityStatsContainer: {
      marginBottom: 16,
    },
    qualityStatsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
    },
    qualityStatCard: {
      flex: 1,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    qualityIndicator: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginBottom: 6,
    },
    qualityCount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    qualityLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 6,
    },
    qualityProgressContainer: {
      width: '100%',
    },
    qualityProgressTrack: {
      height: 2,
      backgroundColor: colors.border,
      borderRadius: 1,
    },
    qualityProgressFill: {
      height: '100%',
      borderRadius: 1,
    },
  });

  // StatCard component - moved inside to access styles
  const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    color,
    icon,
    progress
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View style={styles.statTextContainer}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: color }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Main Trophy Room Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>🏆 Trophy Room</Text>
        <Text style={styles.headerSubtitle}>Your Personal Hall of Fame</Text>
      </View>

      {/* Loyalty Progress Card - Sub-checkpoint 4.5.10.C */}
      <LoyaltyProgressCard />

      {/* Primary Stats Row */}
      <View style={styles.primaryStatsRow}>
        <StatCard
          title="Total Trophies"
          value={`${unlockedCount}/${totalAchievements}`}
          subtitle="Collected"
          color={colors.primary}
          icon="🏆"
          progress={completionRate}
        />
        
        <StatCard
          title="Completion Rate"
          value={`${Math.round(completionRate)}%`}
          subtitle="Overall Progress"
          color={completionRate >= 75 ? '#4CAF50' : completionRate >= 50 ? '#FF9800' : '#F44336'}
          icon="📊"
        />
      </View>

      {/* Achievement Quality Stats */}
      <View style={styles.qualityStatsContainer}>
        <Text style={styles.sectionTitle}>Trophy Quality</Text>
        <View style={styles.qualityStatsRow}>
          {rarityStats.map((rarity) => {
            const color = getRarityColor(rarity.rarity);
            const rarityProgress = rarity.total > 0 ? (rarity.unlocked / rarity.total) * 100 : 0;
            
            return (
              <View key={rarity.rarity} style={styles.qualityStatCard}>
                <View style={[styles.qualityIndicator, { backgroundColor: color }]} />
                <Text style={styles.qualityCount}>{rarity.unlocked}</Text>
                <Text style={styles.qualityLabel}>
                  {rarity.rarity.charAt(0).toUpperCase() + rarity.rarity.slice(1)}
                </Text>
                <View style={styles.qualityProgressContainer}>
                  <View style={styles.qualityProgressTrack}>
                    <View 
                      style={[
                        styles.qualityProgressFill,
                        { width: `${rarityProgress}%`, backgroundColor: color }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>


    </View>
  );
};

// Helper functions
const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return '#007AFF';
  }
};

const getCategoryColor = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return '#4CAF50';
    case AchievementCategory.JOURNAL: return '#2196F3';
    case AchievementCategory.GOALS: return '#FF9800';
    case AchievementCategory.CONSISTENCY: return '#F44336';
    default: return '#007AFF';
  }
};

const getCategoryIcon = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return '🏃‍♂️';
    case AchievementCategory.JOURNAL: return '📝';
    case AchievementCategory.GOALS: return '🎯';
    case AchievementCategory.CONSISTENCY: return '⚔️';
    default: return '🏆';
  }
};

const getCategoryName = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return 'Habits';
    case AchievementCategory.JOURNAL: return 'Journal';
    case AchievementCategory.GOALS: return 'Goals';
    case AchievementCategory.CONSISTENCY: return 'Consistency';
    default: return 'Achievement';
  }
};