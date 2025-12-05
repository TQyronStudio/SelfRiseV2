// Star Rating Display Component
// Shows star levels with rarity colors and visual feedback

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { AchievementCategory } from '../../types/gamification';
import { StarRatingService } from '../../services/starRatingService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

// ========================================
// INTERFACES
// ========================================

export interface StarRatingDisplayProps {
  category: AchievementCategory;
  starLevel: number;
  showLabel?: boolean;
  showMultiplier?: boolean;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onPress?: (category: AchievementCategory, starLevel: number) => void;
  style?: object;
  animateChanges?: boolean;
}

interface StarIconProps {
  filled: boolean;
  color: string;
  size: number;
  animationValue?: Animated.Value | undefined;
}

// ========================================
// STAR ICON COMPONENT
// ========================================

const StarIcon: React.FC<StarIconProps> = ({ filled, color, size, animationValue }) => {
  const baseStyle = {
    fontSize: size,
    color: filled ? color : '#E0E0E0',
    textShadowColor: filled ? `${color}40` : 'transparent',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  };

  if (animationValue) {
    const animatedStyle = {
      transform: [
        {
          scale: animationValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.2, 1],
          }),
        },
      ],
    };

    return (
      <Animated.Text style={[baseStyle, animatedStyle]}>
        {filled ? '★' : '☆'}
      </Animated.Text>
    );
  }

  return (
    <Text style={baseStyle}>
      {filled ? '★' : '☆'}
    </Text>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  category,
  starLevel,
  showLabel = true,
  showMultiplier = false,
  size = 'medium',
  interactive = false,
  onPress,
  style,
  animateChanges = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Animation value for star changes
  const animationValue = React.useRef(new Animated.Value(0)).current;
  const [previousStarLevel, setPreviousStarLevel] = React.useState(starLevel);

  // Get star display info
  const starInfo = StarRatingService.getStarDisplayInfo(starLevel);
  const multipliers = StarRatingService.getStarMultipliers();
  const multiplier = multipliers[starLevel as 1 | 2 | 3 | 4 | 5];

  // Size configurations
  const sizeConfigs = {
    small: { star: 16, text: 12, spacing: 2 },
    medium: { star: 20, text: 14, spacing: 4 },
    large: { star: 28, text: 16, spacing: 6 },
  };

  const sizeConfig = sizeConfigs[size];

  // Trigger animation when star level changes
  React.useEffect(() => {
    if (animateChanges && starLevel !== previousStarLevel) {
      // Reset and start animation
      animationValue.setValue(0);
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setPreviousStarLevel(starLevel);
    }
  }, [starLevel, previousStarLevel, animateChanges, animationValue]);

  // Translate category name
  const translateCategory = (cat: AchievementCategory) => {
    return t(`monthlyChallenge.categories.${cat}`);
  };

  // Translate star level name
  const translateStarLevel = (levelName: string) => {
    const levelKey = levelName.toLowerCase();
    return t(`monthlyChallenge.starLevels.${levelKey}`);
  };

  // Handle press
  const handlePress = () => {
    if (interactive && onPress) {
      onPress(category, starLevel);
    }
  };

  // Render stars
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= starLevel;
      stars.push(
        <StarIcon
          key={i}
          filled={filled}
          color={starInfo.color}
          size={sizeConfig.star}
          animationValue={animateChanges && filled ? animationValue : undefined}
        />
      );
    }
    return stars;
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.cardBackgroundElevated,
      position: 'relative',
    },
    multiplierBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: colors.cardBackgroundElevated,
    },
  });

  return (
    <TouchableOpacity
      style={[dynamicStyles.container, style]}
      onPress={handlePress}
      activeOpacity={interactive ? 0.7 : 1}
      disabled={!interactive}
    >
      {/* Stars Display */}
      <View style={[styles.starsContainer, { gap: sizeConfig.spacing }]}>
        {renderStars()}
      </View>

      {/* Category Label */}
      {showLabel && (
        <Text style={[
          styles.categoryLabel,
          {
            fontSize: sizeConfig.text,
            color: starInfo.color,
            fontWeight: '600'
          }
        ]}>
          {translateCategory(category)} {translateStarLevel(starInfo.name)}
        </Text>
      )}

      {/* Multiplier Badge */}
      {showMultiplier && multiplier && (
        <View style={[
          dynamicStyles.multiplierBadge,
          {
            backgroundColor: `${starInfo.color}20`,
            borderColor: starInfo.color
          }
        ]}>
          <Text style={[
            styles.multiplierText,
            { 
              fontSize: sizeConfig.text - 1,
              color: starInfo.color
            }
          ]}>
            +{Math.round((multiplier - 1) * 100)}%
          </Text>
        </View>
      )}

      {/* Interactive indicator */}
      {interactive && (
        <View style={[
          styles.interactiveIndicator,
          { backgroundColor: starInfo.color }
        ]} />
      )}
    </TouchableOpacity>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  categoryLabel: {
    textAlign: 'center',
    marginTop: 2,
  },

  multiplierText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  interactiveIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    width: 20,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
    transform: [{ translateX: -10 }],
  },
});

export default StarRatingDisplay;