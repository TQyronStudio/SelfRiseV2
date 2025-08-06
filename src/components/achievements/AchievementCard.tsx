import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { 
  Achievement, 
  AchievementRarity,
} from '@/src/types/gamification';

interface AchievementCardProps {
  achievement: Achievement;
  userProgress?: number;
  isUnlocked: boolean;
  onPress?: () => void;
}

const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';     // Silver/Gray
    case AchievementRarity.RARE: return '#2196F3';       // Blue
    case AchievementRarity.EPIC: return '#9C27B0';       // Purple
    case AchievementRarity.LEGENDARY: return '#FFD700';  // Gold
    default: return Colors.primary;
  }
};

const getRarityGlow = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return 'rgba(158, 158, 158, 0.2)';
    case AchievementRarity.RARE: return 'rgba(33, 150, 243, 0.2)';
    case AchievementRarity.EPIC: return 'rgba(156, 39, 176, 0.2)';
    case AchievementRarity.LEGENDARY: return 'rgba(255, 215, 0, 0.3)';
    default: return 'rgba(0, 122, 255, 0.2)';
  }
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  userProgress = 0,
  isUnlocked,
  onPress,
}) => {
  const rarityColor = getRarityColor(achievement.rarity);
  const rarityGlow = getRarityGlow(achievement.rarity);
  const progress = achievement.isProgressive ? userProgress : (isUnlocked ? 100 : 0);
  
  // Animation states for micro-interactions
  const [scaleAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const dynamicGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', rarityGlow],
  });
  
  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        { 
          shadowColor: rarityColor,
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [isUnlocked ? 0.1 : 0, isUnlocked ? 0.3 : 0.1],
          }),
          shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 8],
          }),
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          !isUnlocked && styles.cardLocked,
          { 
            borderColor: isUnlocked ? rarityColor : Colors.border,
            backgroundColor: isUnlocked ? rarityGlow : Colors.white,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isUnlocked && !achievement.isProgressive}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${achievement.name}. ${isUnlocked ? 'Unlocked' : 'Locked'} ${achievement.rarity} achievement. ${achievement.xpReward} XP reward.`}
        accessibilityHint={isUnlocked ? "Tap to view details" : "Complete requirements to unlock"}
      >
      {/* Rarity indicator */}
      <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
      
      {/* Achievement icon */}
      <View style={styles.iconContainer}>
        <Text 
          style={[
            styles.icon,
            !isUnlocked && styles.iconLocked
          ]}
        >
          {achievement.icon}
        </Text>
      </View>
      
      {/* Achievement info */}
      <View style={styles.infoContainer}>
        <Text 
          style={[
            styles.name,
            !isUnlocked && styles.textLocked
          ]} 
          numberOfLines={2}
        >
          {achievement.name}
        </Text>
        
        <View style={styles.bottomRow}>
          <Text 
            style={[
              styles.xpReward,
              !isUnlocked && styles.textLocked,
              { color: isUnlocked ? rarityColor : Colors.textSecondary }
            ]}
          >
            {achievement.xpReward} XP
          </Text>
          
          {/* Rarity badge */}
          <View style={[styles.rarityBadge, { backgroundColor: isUnlocked ? rarityColor : Colors.gray }]}>
            <Text style={styles.rarityText}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Progress bar for progressive achievements */}
      {achievement.isProgressive && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: isUnlocked ? rarityColor : Colors.gray
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, !isUnlocked && styles.textLocked]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
      
      {/* Locked overlay */}
      {!isUnlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedIcon}>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 8,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardLocked: {
    opacity: 0.7,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  iconLocked: {
    opacity: 0.5,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  textLocked: {
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  xpReward: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rarityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 1.5,
    marginRight: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 8,
    fontWeight: '500',
    color: Colors.textSecondary,
    minWidth: 20,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
});