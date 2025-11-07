// Star Rating Badge Component
// Compact star rating display for cards and lists

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AchievementCategory } from '../../types/gamification';
import { StarRatingService } from '../../services/starRatingService';

// ========================================
// INTERFACES
// ========================================

export interface StarRatingBadgeProps {
  category: AchievementCategory;
  starLevel: number;
  size?: 'tiny' | 'small' | 'medium';
  showMultiplier?: boolean;
  showCategory?: boolean;
  variant?: 'filled' | 'outlined' | 'minimal';
  onPress?: (() => void) | undefined;
  style?: object;
}

// ========================================
// MAIN COMPONENT
// ========================================

export const StarRatingBadge: React.FC<StarRatingBadgeProps> = ({
  category,
  starLevel,
  size = 'small',
  showMultiplier = false,
  showCategory = false,
  variant = 'filled',
  onPress,
  style,
}) => {
  const { colors } = useTheme();

  // Get star display info
  const starInfo = StarRatingService.getStarDisplayInfo(starLevel);
  const multipliers = StarRatingService.getStarMultipliers();
  const multiplier = multipliers[starLevel as 1 | 2 | 3 | 4 | 5];

  // Size configurations
  const sizeConfigs = {
    tiny: { 
      star: 10, 
      text: 8, 
      padding: { horizontal: 6, vertical: 2 }, 
      borderRadius: 6 
    },
    small: { 
      star: 12, 
      text: 10, 
      padding: { horizontal: 8, vertical: 3 }, 
      borderRadius: 8 
    },
    medium: { 
      star: 16, 
      text: 12, 
      padding: { horizontal: 10, vertical: 4 }, 
      borderRadius: 10 
    },
  };

  const sizeConfig = sizeConfigs[size];

  // Format category name (short form)
  const formatCategoryShort = (cat: AchievementCategory) => {
    const shortNames = {
      [AchievementCategory.HABITS]: 'H',
      [AchievementCategory.JOURNAL]: 'J',
      [AchievementCategory.GOALS]: 'G',
      [AchievementCategory.CONSISTENCY]: 'C',
      [AchievementCategory.MASTERY]: 'M',
      [AchievementCategory.SPECIAL]: 'S',
    };
    return shortNames[cat] || cat.charAt(0).toUpperCase();
  };

  // Get variant styles
  const getVariantStyles = () => {
    const baseColor = starInfo.color;
    
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: baseColor,
          borderColor: baseColor,
          borderWidth: 0,
          textColor: '#FFFFFF',
          shadowOpacity: 0.2,
        };
      
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: baseColor,
          borderWidth: 1,
          textColor: baseColor,
          shadowOpacity: 0,
        };
      
      case 'minimal':
        return {
          backgroundColor: `${baseColor}15`,
          borderColor: 'transparent',
          borderWidth: 0,
          textColor: baseColor,
          shadowOpacity: 0,
        };
      
      default:
        return {
          backgroundColor: baseColor,
          borderColor: baseColor,
          borderWidth: 0,
          textColor: '#FFFFFF',
          shadowOpacity: 0.2,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Render content
  const renderContent = () => {
    const elements = [];
    
    // Category (if shown)
    if (showCategory) {
      elements.push(
        <Text 
          key="category"
          style={[
            styles.text, 
            { 
              fontSize: sizeConfig.text - 1,
              color: variantStyles.textColor,
              opacity: 0.9
            }
          ]}
        >
          {formatCategoryShort(category)}
        </Text>
      );
    }

    // Stars
    elements.push(
      <Text 
        key="stars"
        style={[
          styles.starText,
          { 
            fontSize: sizeConfig.star,
            color: variantStyles.textColor
          }
        ]}
      >
        {starLevel}★
      </Text>
    );

    // Multiplier (if shown)
    if (showMultiplier && multiplier) {
      elements.push(
        <Text 
          key="multiplier"
          style={[
            styles.text,
            { 
              fontSize: sizeConfig.text - 1,
              color: variantStyles.textColor,
              opacity: 0.9
            }
          ]}
        >
          +{Math.round((multiplier - 1) * 100)}%
        </Text>
      );
    }

    return elements;
  };

  // Main container style
  const containerStyle = [
    styles.badge,
    {
      paddingHorizontal: sizeConfig.padding.horizontal,
      paddingVertical: sizeConfig.padding.vertical,
      borderRadius: sizeConfig.borderRadius,
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
      shadowOpacity: variantStyles.shadowOpacity,
    },
    style
  ];

  const Component = onPress ? TouchableOpacity : View;
  const touchableProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Component style={containerStyle} {...touchableProps}>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </Component>
  );
};

// ========================================
// BADGE VARIATIONS
// ========================================

// Specific badge types for common use cases
export const CompactStarBadge: React.FC<Omit<StarRatingBadgeProps, 'size' | 'variant'>> = (props) => (
  <StarRatingBadge {...props} size="tiny" variant="minimal" />
);

export const CategoryStarBadge: React.FC<Omit<StarRatingBadgeProps, 'showCategory' | 'variant'>> = (props) => (
  <StarRatingBadge {...props} showCategory={true} variant="outlined" />
);

export const MultiplierStarBadge: React.FC<Omit<StarRatingBadgeProps, 'showMultiplier' | 'variant'>> = (props) => (
  <StarRatingBadge {...props} showMultiplier={true} variant="filled" />
);

// ========================================
// STAR RATING GRID COMPONENT
// ========================================

interface StarRatingGridProps {
  ratings: Record<AchievementCategory, number>;
  onCategoryPress?: (category: AchievementCategory, starLevel: number) => void;
  style?: object;
}

export const StarRatingGrid: React.FC<StarRatingGridProps> = ({
  ratings,
  onCategoryPress,
  style,
}) => {
  const categories = [
    AchievementCategory.HABITS,
    AchievementCategory.JOURNAL,
    AchievementCategory.GOALS,
    AchievementCategory.CONSISTENCY,
  ];

  return (
    <View style={[styles.grid, style]}>
      {categories.map((category) => (
        <StarRatingBadge
          key={category}
          category={category}
          starLevel={ratings[category] || 1}
          showCategory={true}
          showMultiplier={true}
          variant="outlined"
          onPress={onCategoryPress ? () => onCategoryPress(category, ratings[category] || 1) : undefined}
          style={styles.gridItem}
        />
      ))}
    </View>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  starText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Grid styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
  },

  gridItem: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
  },
});

export default StarRatingBadge;