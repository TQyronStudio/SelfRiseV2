import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
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

export const TrophyRoomStats: React.FC<TrophyRoomStatsProps> = ({
  stats,
  totalAchievements,
  unlockedCount,
  userLevel = 1,
  userAchievements,
}) => {
  const completionRate = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;
  
  // Calculate rarity distribution
  const rarityStats = Object.entries(stats.rarityBreakdown).map(([rarity, data]) => ({
    rarity: rarity as AchievementRarity,
    ...data,
  }));

  // Calculate category performance
  const categoryStats = Object.entries(stats.categoryBreakdown).map(([category, data]) => ({
    category: category as AchievementCategory,
    ...data,
  }));

  // Find best performing category
  const bestCategory = categoryStats.reduce((best, current) => {
    const currentRate = current.total > 0 ? (current.unlocked / current.total) * 100 : 0;
    const bestRate = best.total > 0 ? (best.unlocked / best.total) * 100 : 0;
    return currentRate > bestRate ? current : best;
  });

  // Calculate streak information (if available)
  const totalXP = userAchievements?.totalXPFromAchievements || 0;
  const averageXPPerAchievement = unlockedCount > 0 ? Math.round(totalXP / unlockedCount) : 0;

  // Legendary achievement progress
  const legendaryStats = rarityStats.find(r => r.rarity === AchievementRarity.LEGENDARY);
  const hasLegendary = legendaryStats && legendaryStats.unlocked > 0;

  // Trophy Room Expansion System
  const getRoomExpansions = () => {
    const expansions = [
      {
        name: 'Novice Hall',
        description: 'Your first trophy display area',
        unlockLevel: 1,
        icon: '🏛️',
        capacity: 5,
        isUnlocked: true,
      },
      {
        name: 'Achievement Gallery',
        description: 'Extended space for growing collection',
        unlockLevel: 10,
        icon: '🎨',
        capacity: 15,
        isUnlocked: userLevel >= 10,
      },
      {
        name: 'Master\'s Sanctuary',
        description: 'Elite space for rare achievements',
        unlockLevel: 25,
        icon: '⛩️',
        capacity: 30,
        isUnlocked: userLevel >= 25,
      },
      {
        name: 'Legendary Vault',
        description: 'Ultimate trophy room for legends',
        unlockLevel: 50,
        icon: '🏰',
        capacity: 50,
        isUnlocked: userLevel >= 50,
      },
    ];
    
    return expansions;
  };

  const roomExpansions = getRoomExpansions();
  const unlockedRooms = roomExpansions.filter(room => room.isUnlocked);
  const nextRoom = roomExpansions.find(room => !room.isUnlocked);

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
          color={Colors.primary}
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

      {/* Category Performance */}
      <View style={styles.performanceContainer}>
        <Text style={styles.sectionTitle}>Best Performance</Text>
        <StatCard
          title={`${getCategoryName(bestCategory.category)} Master`}
          value={`${bestCategory.unlocked}/${bestCategory.total}`}
          subtitle={`${Math.round((bestCategory.unlocked / bestCategory.total) * 100)}% complete`}
          color={getCategoryColor(bestCategory.category)}
          icon={getCategoryIcon(bestCategory.category)}
          progress={(bestCategory.unlocked / bestCategory.total) * 100}
        />
      </View>

      {/* Special Achievements */}
      <View style={styles.specialContainer}>
        <Text style={styles.sectionTitle}>Special Honors</Text>
        <View style={styles.specialStatsRow}>
          <View style={styles.specialStatItem}>
            <Text style={styles.specialIcon}>💎</Text>
            <Text style={styles.specialValue}>{averageXPPerAchievement}</Text>
            <Text style={styles.specialLabel}>Avg XP/Trophy</Text>
          </View>
          
          <View style={styles.specialStatItem}>
            <Text style={styles.specialIcon}>⭐</Text>
            <Text style={styles.specialValue}>{totalXP.toLocaleString()}</Text>
            <Text style={styles.specialLabel}>Total XP</Text>
          </View>
          
          <View style={styles.specialStatItem}>
            <Text style={styles.specialIcon}>👑</Text>
            <Text style={[
              styles.specialValue, 
              { color: hasLegendary ? '#FFD700' : Colors.textSecondary }
            ]}>
              {hasLegendary ? 'LEGEND' : 'ASPIRING'}
            </Text>
            <Text style={styles.specialLabel}>Status</Text>
          </View>
        </View>
      </View>

      {/* Trophy Room Expansion */}
      <View style={styles.expansionContainer}>
        <Text style={styles.sectionTitle}>Room Expansions</Text>
        
        {/* Current Rooms */}
        <View style={styles.roomsContainer}>
          {unlockedRooms.map((room, index) => (
            <View key={room.name} style={styles.roomCard}>
              <Text style={styles.roomIcon}>{room.icon}</Text>
              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomDescription}>{room.description}</Text>
                <Text style={styles.roomCapacity}>Capacity: {room.capacity} trophies</Text>
              </View>
              <View style={styles.roomStatus}>
                <Text style={styles.roomUnlocked}>✓</Text>
              </View>
            </View>
          ))}
          
          {/* Next Room to Unlock */}
          {nextRoom && (
            <View style={[styles.roomCard, styles.roomCardLocked]}>
              <Text style={[styles.roomIcon, styles.roomIconLocked]}>{nextRoom.icon}</Text>
              <View style={styles.roomInfo}>
                <Text style={[styles.roomName, styles.roomNameLocked]}>{nextRoom.name}</Text>
                <Text style={styles.roomDescription}>{nextRoom.description}</Text>
                <Text style={styles.roomUnlockRequirement}>
                  Unlock at Level {nextRoom.unlockLevel}
                </Text>
              </View>
              <View style={styles.roomStatus}>
                <Text style={styles.roomLocked}>🔒</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Expansion Progress */}
        <View style={styles.expansionProgress}>
          <Text style={styles.expansionProgressText}>
            {unlockedRooms.length}/{roomExpansions.length} rooms unlocked
          </Text>
          <View style={styles.expansionProgressBar}>
            <View 
              style={[
                styles.expansionProgressFill,
                { width: `${(unlockedRooms.length / roomExpansions.length) * 100}%` }
              ]} 
            />
          </View>
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
    default: return Colors.primary;
  }
};

const getCategoryColor = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return '#4CAF50';
    case AchievementCategory.JOURNAL: return '#2196F3';
    case AchievementCategory.GOALS: return '#FF9800';
    case AchievementCategory.CONSISTENCY: return '#F44336';
    case AchievementCategory.MASTERY: return '#9C27B0';
    case AchievementCategory.SPECIAL: return '#FFD700';
    case AchievementCategory.SOCIAL: return '#00BCD4';
    default: return Colors.primary;
  }
};

const getCategoryIcon = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return '🏃‍♂️';
    case AchievementCategory.JOURNAL: return '📝';
    case AchievementCategory.GOALS: return '🎯';
    case AchievementCategory.CONSISTENCY: return '⚔️';
    case AchievementCategory.MASTERY: return '👑';
    case AchievementCategory.SPECIAL: return '✨';
    case AchievementCategory.SOCIAL: return '👥';
    default: return '🏆';
  }
};

const getCategoryName = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return 'Habits';
    case AchievementCategory.JOURNAL: return 'Journal';
    case AchievementCategory.GOALS: return 'Goals';
    case AchievementCategory.CONSISTENCY: return 'Consistency';
    case AchievementCategory.MASTERY: return 'Mastery';
    case AchievementCategory.SPECIAL: return 'Special';
    case AchievementCategory.SOCIAL: return 'Social';
    default: return 'Achievement';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  
  // Primary Stats
  primaryStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  
  // Stat Cards
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  
  statSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
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
    color: Colors.textSecondary,
    minWidth: 28,
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  
  // Quality Stats
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
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    color: Colors.text,
    marginBottom: 2,
  },
  
  qualityLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  
  qualityProgressContainer: {
    width: '100%',
  },
  
  qualityProgressTrack: {
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  
  qualityProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
  
  // Performance
  performanceContainer: {
    marginBottom: 16,
  },
  
  // Special Stats
  specialContainer: {
    marginBottom: 16,
  },
  
  specialStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  
  specialStatItem: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  specialIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  
  specialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  
  specialLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Room Expansion Styles
  expansionContainer: {
    marginBottom: 16,
  },
  
  roomsContainer: {
    paddingHorizontal: 16,
  },
  
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  roomCardLocked: {
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.7,
  },
  
  roomIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  
  roomIconLocked: {
    opacity: 0.5,
  },
  
  roomInfo: {
    flex: 1,
  },
  
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  
  roomNameLocked: {
    color: Colors.textSecondary,
  },
  
  roomDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  
  roomCapacity: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  roomUnlockRequirement: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
  },
  
  roomStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  roomUnlocked: {
    fontSize: 16,
    color: '#4CAF50',
  },
  
  roomLocked: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  
  expansionProgress: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  
  expansionProgressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  
  expansionProgressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  
  expansionProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});