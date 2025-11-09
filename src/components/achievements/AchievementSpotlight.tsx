import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Achievement, AchievementRarity, UserAchievements } from '@/src/types/gamification';
import { useTheme } from '@/src/contexts/ThemeContext';

interface AchievementSpotlightProps {
  userAchievements: UserAchievements;
  allAchievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
}

const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return colors.primary;
  }
};

const getAchievementStory = (achievement: Achievement): string => {
  // Generate inspiring stories based on achievement type
  const stories: Record<AchievementRarity, string[]> = {
    [AchievementRarity.COMMON]: [
      "Every great journey begins with a single step. This achievement marks the start of your transformation.",
      "Small victories lead to great triumphs. You've taken an important first step.",
      "The foundation of success is built one achievement at a time. Well done!",
    ],
    [AchievementRarity.RARE]: [
      "Dedication and consistency have brought you here. This achievement reflects your growing commitment.",
      "You're developing the habits of a champion. This rare achievement proves your determination.",
      "Excellence is not an act, but a habit. This achievement shows you're building that habit.",
    ],
    [AchievementRarity.EPIC]: [
      "Extraordinary achievements require extraordinary effort. You've proven you have what it takes.",
      "This epic achievement places you among the dedicated few who push beyond their limits.",
      "Greatness is not given, it's earned. This achievement is proof of your exceptional commitment.",
    ],
    [AchievementRarity.LEGENDARY]: [
      "Legends are not born, they are forged through relentless pursuit of excellence. You are legendary.",
      "This achievement represents the pinnacle of dedication. You've joined the ranks of the extraordinary.",
      "History will remember those who dared to be great. This legendary achievement is your mark on eternity.",
    ],
  };

  const rarityStories = stories[achievement.rarity] || stories[AchievementRarity.COMMON];
  return rarityStories[Math.floor(Math.random() * rarityStories.length)] || "This achievement represents your dedication to growth and improvement.";
};

export const AchievementSpotlight: React.FC<AchievementSpotlightProps> = ({
  userAchievements,
  allAchievements,
  onAchievementPress,
}) => {
  const { colors } = useTheme();
  const [spotlightAchievement, setSpotlightAchievement] = useState<Achievement | null>(null);
  const [story, setStory] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Get unlocked achievements
  const unlockedAchievements = userAchievements.unlockedAchievements
    .map(id => allAchievements.find(a => a.id === id))
    .filter(Boolean) as Achievement[];

  // Select random achievement for spotlight
  useEffect(() => {
    if (unlockedAchievements.length === 0) return;

    const selectRandomAchievement = () => {
      // Weighted selection - higher rarity achievements more likely to be featured
      const weightedAchievements: Achievement[] = [];
      
      unlockedAchievements.forEach(achievement => {
        let weight = 1;
        switch (achievement.rarity) {
          case AchievementRarity.LEGENDARY: weight = 8; break;
          case AchievementRarity.EPIC: weight = 4; break;
          case AchievementRarity.RARE: weight = 2; break;
          case AchievementRarity.COMMON: weight = 1; break;
        }
        
        for (let i = 0; i < weight; i++) {
          weightedAchievements.push(achievement);
        }
      });

      const randomAchievement = weightedAchievements[
        Math.floor(Math.random() * weightedAchievements.length)
      ];

      if (randomAchievement) {
        setSpotlightAchievement(randomAchievement);
        setStory(getAchievementStory(randomAchievement));
      }

      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    };

    // Add delay to ensure component is fully mounted before starting animations
    const initTimeout = setTimeout(() => {
      selectRandomAchievement();
    }, 150);

    // Rotate spotlight every 30 seconds
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        selectRandomAchievement();
      });
    }, 30000);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(interval);
    };
  }, [unlockedAchievements, fadeAnim]);

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 16,
    },

    headerContainer: {
      alignItems: 'center',
      marginBottom: 12,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },

    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    spotlightContainer: {
      position: 'relative',
    },

    spotlightCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
    },

    rarityStrip: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },

    achievementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 4,
    },

    achievementIcon: {
      fontSize: 32,
      marginRight: 12,
    },

    achievementInfo: {
      flex: 1,
    },

    achievementName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 6,
    },

    achievementMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    rarityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginRight: 8,
    },

    rarityText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.white,
    },

    xpReward: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },

    achievementDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },

    storyContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      position: 'relative',
    },

    storyQuote: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      opacity: 0.3,
      position: 'absolute',
    },

    storyText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      fontStyle: 'italic',
      paddingHorizontal: 16,
      textAlign: 'center',
    },

    spotlightFooter: {
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },

    spotlightText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },

    rotationText: {
      fontSize: 10,
      color: colors.textSecondary,
    },

    glowEffect: {
      position: 'absolute',
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      borderRadius: 20,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 0,
    },

    // Empty state
    emptyContainer: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
    },

    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
      opacity: 0.5,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },

    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  if (!spotlightAchievement) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🌟</Text>
        <Text style={styles.emptyTitle}>Achievement Spotlight</Text>
        <Text style={styles.emptySubtitle}>
          Unlock achievements to see them featured here with inspiring stories!
        </Text>
      </View>
    );
  }

  const rarityColor = getRarityColor(spotlightAchievement.rarity);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>🌟 Achievement Spotlight</Text>
        <Text style={styles.headerSubtitle}>Celebrating Your Success</Text>
      </View>

      <Animated.View style={[styles.spotlightContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.spotlightCard, { borderColor: rarityColor }]}
          onPress={() => onAchievementPress?.(spotlightAchievement)}
          activeOpacity={0.9}
        >
          {/* Rarity indicator */}
          <View style={[styles.rarityStrip, { backgroundColor: rarityColor }]} />
          
          {/* Achievement header */}
          <View style={styles.achievementHeader}>
            <Text style={styles.achievementIcon}>{spotlightAchievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{spotlightAchievement.name}</Text>
              <View style={styles.achievementMeta}>
                <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                  <Text style={styles.rarityText}>
                    {spotlightAchievement.rarity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.xpReward}>+{spotlightAchievement.xpReward} XP</Text>
              </View>
            </View>
          </View>

          {/* Achievement description */}
          <Text style={styles.achievementDescription}>
            {spotlightAchievement.description}
          </Text>

          {/* Inspirational story */}
          <View style={styles.storyContainer}>
            <Text style={styles.storyQuote}>"</Text>
            <Text style={styles.storyText}>{story}</Text>
            <Text style={styles.storyQuote}>"</Text>
          </View>

          {/* Spotlight footer */}
          <View style={styles.spotlightFooter}>
            <Text style={styles.spotlightText}>✨ Featured Achievement ✨</Text>
            <Text style={styles.rotationText}>Rotates every 30 seconds</Text>
          </View>
        </TouchableOpacity>

        {/* Glow effect for legendary achievements */}
        {spotlightAchievement.rarity === AchievementRarity.LEGENDARY && (
          <View style={[styles.glowEffect, { shadowColor: rarityColor }]} />
        )}
      </Animated.View>
    </View>
  );
};