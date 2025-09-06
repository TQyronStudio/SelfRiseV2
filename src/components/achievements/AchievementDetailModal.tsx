import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { Achievement, AchievementRarity, UserAchievements } from '@/src/types/gamification';
import { UserStats, ProgressHint, generateProgressHintAsync } from '@/src/utils/achievementPreviewUtils';
import { AchievementService } from '@/src/services/achievementService';
import { useAccessibility } from '@/src/hooks/useAccessibility';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ========================================
// INTERFACES
// ========================================

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  userAchievements: UserAchievements | null;
  onSharePress?: (achievement: Achievement) => void;
  batchUserStats?: any; // Pre-loaded user stats for performance
  realTimeProgress?: number | undefined; // Real-time progress from batch system
}

// ========================================
// HELPER FUNCTIONS
// ========================================

const getRarityColor = (rarity: AchievementRarity, isHighContrast: boolean): string => {
  if (isHighContrast) {
    switch (rarity) {
      case AchievementRarity.COMMON: return '#000000';
      case AchievementRarity.RARE: return '#000080';
      case AchievementRarity.EPIC: return '#800080';
      case AchievementRarity.LEGENDARY: return '#B8860B';
      default: return '#000000';
    }
  }
  
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return Colors.primary;
  }
};

const getRarityEmoji = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '🏆';
    case AchievementRarity.RARE: return '💎';
    case AchievementRarity.EPIC: return '🌟';
    case AchievementRarity.LEGENDARY: return '👑';
    default: return '🏆';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'habits': return '#4CAF50';
    case 'journal': return '#2196F3';
    case 'goals': return '#FF9800';
    case 'consistency': return '#F44336';
    case 'mastery': return '#9C27B0';
    case 'special': return '#FFD700';
    default: return Colors.primary;
  }
};

const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'habits': return 'fitness';
    case 'journal': return 'book';
    case 'goals': return 'flag';
    case 'consistency': return 'trending-up';
    case 'mastery': return 'trophy';
    case 'special': return 'star';
    default: return 'medal';
  }
};

const formatUnlockDate = (achievement: Achievement): string => {
  // For now, simulate unlock date - in real app this would come from user data
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  if (daysAgo === 1) return 'Unlocked yesterday';
  if (daysAgo <= 7) return `Unlocked ${daysAgo} days ago`;
  if (daysAgo <= 30) return `Unlocked ${Math.ceil(daysAgo / 7)} weeks ago`;
  return 'Unlocked recently';
};

// ========================================
// COMPONENT
// ========================================

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  visible,
  onClose,
  achievement,
  userAchievements,
  onSharePress,
  batchUserStats,
  realTimeProgress,
}) => {
  const { isHighContrastEnabled, isReduceMotionEnabled } = useAccessibility();
  const [progressHint, setProgressHint] = useState<ProgressHint | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Calculate values only if achievement exists
  const isUnlocked = achievement ? (userAchievements?.unlockedAchievements.includes(achievement.id) || false) : false;
  const rarityColor = achievement ? getRarityColor(achievement.rarity, isHighContrastEnabled) : Colors.primary;
  const rarityEmoji = achievement ? getRarityEmoji(achievement.rarity) : '🏆';
  const categoryColor = achievement ? getCategoryColor(achievement.category) : Colors.primary;
  const categoryIcon = achievement ? getCategoryIcon(achievement.category) : 'medal' as keyof typeof Ionicons.glyphMap;

  // Initialize batch user stats - component only renders when visible
  useEffect(() => {
    setUserStats(batchUserStats || null);
  }, [batchUserStats]);

  // Calculate progress using SAME PATTERN as AchievementCard
  const progress = realTimeProgress !== undefined 
    ? Number(realTimeProgress) || 0
    : achievement?.isProgressive 
      ? 0 
      : (isUnlocked ? 100 : 0);

  // Generate progress hint for locked achievements - component only renders when visible
  useEffect(() => {
    if (!isUnlocked) {
      setProgressHint({
        progressText: `${Math.round(progress)}% complete`,
        progressPercentage: progress,
        isCompleted: progress >= 100,
        requirementText: achievement?.description || 'Achievement requirement',
        actionHint: 'Keep working towards this goal!',
        estimatedDays: progress < 100 ? Math.ceil((100 - progress) / 10) : 0
      });
    }
  }, [isUnlocked, progress, achievement?.description]);

  // Accessibility announcement for screen readers
  useEffect(() => {
    const announcement = isUnlocked 
      ? `Achievement details: ${achievement?.name || 'Achievement'}. This ${achievement?.rarity || 'common'} achievement is unlocked.`
      : `Achievement details: ${achievement?.name || 'Achievement'}. This ${achievement?.rarity || 'common'} achievement is locked. Progress information available.`;
    
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [achievement?.name, achievement?.rarity, isUnlocked]);

  const handleSharePress = () => {
    if (onSharePress && achievement && isUnlocked) {
      onSharePress(achievement);
    }
  };

  // Return nothing if modal not visible - allows smooth slide animation
  if (!visible) {
    return null;
  }

  // Return empty modal if no achievement
  if (!achievement) {
    return (
      <Modal
        visible={false}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View />
      </Modal>
    );
  }


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header - přesun z ScrollView */}
        <View style={[styles.header, { borderBottomColor: rarityColor }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Close achievement details"
          >
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>
            {isUnlocked ? 'Achievement Unlocked' : 'Achievement Details'}
          </Text>
          
          {isUnlocked && onSharePress && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleSharePress}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Share achievement"
            >
              <Ionicons name="share-outline" size={24} color={rarityColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Main Content ScrollView */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
            {/* Achievement Card */}
            <View style={[styles.achievementCard, { borderLeftColor: rarityColor }]}>
              {/* Achievement Icon and Status */}
              <View style={styles.achievementHeader}>
                <View style={styles.iconContainer}>
                  <Text style={[
                    styles.achievementIcon,
                    !isUnlocked && styles.achievementIconLocked
                  ]}>
                    {String(achievement?.icon || '🏆')}
                  </Text>
                  {isUnlocked && (
                    <View style={[styles.statusBadge, { backgroundColor: rarityColor }]}>
                      <Text style={styles.statusEmoji}>{rarityEmoji}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementName,
                    !isUnlocked && styles.achievementNameLocked
                  ]}>
                    {String(achievement?.name || 'Achievement')}
                  </Text>
                  
                  <View style={styles.metaContainer}>
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                      <Text style={styles.rarityText}>
                        {achievement?.rarity?.toUpperCase() || 'COMMON'}
                      </Text>
                    </View>
                    
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                      <Ionicons name={categoryIcon} size={12} color={Colors.white} />
                      <Text style={styles.categoryText}>
                        {achievement?.category ? 
                          achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1) :
                          'Category'
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.xpReward}>+{achievement?.xpReward || 50} XP</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description}>
                {String(achievement?.description || 'Achievement description')}
              </Text>

              {/* Conditional Content */}
              {isUnlocked ? (
                /* Unlocked Achievement Content */
                <View style={styles.unlockedContent}>
                  <View style={styles.completionInfo}>
                    <Ionicons name="checkmark-circle" size={20} color={rarityColor} />
                    <Text style={styles.completionText}>
                      {achievement ? formatUnlockDate(achievement) : 'Recently unlocked'}
                    </Text>
                  </View>
                  
                  <View style={styles.separator} />
                  
                  <View style={styles.achievementDetails}>
                    <Text style={styles.detailTitle}>Achievement Details</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category:</Text>
                      <Text style={styles.detailValue}>
                        {achievement?.category ? 
                          achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1) :
                          'Category'
                        }
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rarity:</Text>
                      <Text style={[styles.detailValue, { color: rarityColor }]}>
                        {achievement?.rarity || 'common'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>XP Reward:</Text>
                      <Text style={styles.detailValue}>
                        {achievement?.xpReward || 50} points
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                /* Locked Achievement Content */
                <View style={styles.lockedContent}>
                  {progressHint ? (
                    <>
                      <View style={styles.progressSection}>
                        <Text style={styles.progressTitle}>Progress to Unlock</Text>
                        <Text style={styles.progressText}>
                          {progressHint?.progressText || 'Progress loading...'}
                        </Text>
                        
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressTrack}>
                            <View 
                              style={[
                                styles.progressFill,
                                { 
                                  width: `${Number(progressHint?.progressPercentage || 0)}%`,
                                  backgroundColor: rarityColor
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressPercentage}>
                            {Math.round(Number(progressHint?.progressPercentage || 0))}%
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.separator} />
                      
                      <View style={styles.guidanceSection}>
                        <Text style={styles.guidanceTitle}>How to Unlock</Text>
                        <Text style={styles.requirementText}>
                          {progressHint?.requirementText || 'Achievement requirement'}
                        </Text>
                        <Text style={styles.actionHint}>
                          💡 {progressHint?.actionHint || 'Keep working towards this goal!'}
                        </Text>
                        {progressHint?.estimatedDays && progressHint.estimatedDays > 0 && (
                          <Text style={styles.estimatedTime}>
                            📅 Estimated: {progressHint.estimatedDays} days remaining
                          </Text>
                        )}
                      </View>
                    </>
                  ) : (
                    <View style={styles.noProgressContainer}>
                      <Ionicons name="lock-closed" size={32} color={Colors.textSecondary} />
                      <Text style={styles.lockedMessage}>
                        This achievement is locked. Keep using the app to unlock it!
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

          </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  // Main container - full screen like HabitModal
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollView: {
    flex: 1, // Now it's OK because we're in SafeAreaView, not overlay
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Header - full screen style like HabitModal
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2, // Keep rarity color border
    backgroundColor: Colors.backgroundSecondary,
    minHeight: 60,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },

  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Achievement Card
  achievementCard: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderLeftWidth: 4,
  },

  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },

  achievementIcon: {
    fontSize: 48,
    textAlign: 'center',
  },

  achievementIconLocked: {
    opacity: 0.5,
  },

  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusEmoji: {
    fontSize: 12,
  },

  achievementInfo: {
    flex: 1,
  },

  achievementName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },

  achievementNameLocked: {
    color: Colors.textSecondary,
  },

  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },

  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },

  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 4,
  },

  xpReward: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },

  // Unlocked Content
  unlockedContent: {
    marginTop: 8,
  },

  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  completionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },

  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },

  achievementDetails: {
    marginTop: 8,
  },

  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },

  // Locked Content
  lockedContent: {
    marginTop: 8,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  progressSection: {
    marginBottom: 16,
  },

  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },

  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },

  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginRight: 12,
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 40,
  },

  guidanceSection: {
    marginTop: 8,
  },

  guidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },

  requirementText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },

  actionHint: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
    lineHeight: 20,
  },

  estimatedTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  noProgressContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  lockedMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },

  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },

  shareActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },

  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },

  closeActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },

  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});