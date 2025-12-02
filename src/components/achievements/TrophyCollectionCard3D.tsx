import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { AchievementRarity } from '@/src/types/gamification';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
// Simple device capability replacement
const getDeviceCapability = () => ({
  tier: 'medium' as const,
  canHandleComplexAnimations: true,
  canHandleParticles: true,
  maxAnimations: 10,
});

interface TrophyCollection {
  id: string;
  nameKey: string;
  description: string;
  icon: string;
  requiredAchievements: string[];
  bonusXP: number;
  rarity: AchievementRarity;
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
}

interface TrophyCollectionCard3DProps {
  collection: TrophyCollection;
  onPress?: () => void;
}

const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return '#007AFF'; // Fallback to iOS blue
  }
};

export const TrophyCollectionCard3D: React.FC<TrophyCollectionCard3DProps> = ({
  collection,
  onPress,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { isReduceMotionEnabled, isHighContrastEnabled } = useAccessibility();
  const deviceCapability = getDeviceCapability();
  
  // Animation values for 3D effects
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(collection.isCompleted ? 0.8 : 0.2));
  const [particleAnims] = useState(() => 
    Array.from({ length: 3 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  );
  
  const rarityColor = getRarityColor(collection.rarity);
  const progressPercentage = (collection.completedCount / collection.totalCount) * 100;
  
  // Completion celebration animation
  useEffect(() => {
    if (collection.isCompleted && 
        !isReduceMotionEnabled && 
        deviceCapability.canHandleComplexAnimations) {
      
      // Celebration particle burst
      const celebrateAnimation = Animated.stagger(200, 
        particleAnims.map((anim, index) => 
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.parallel([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateY, {
                toValue: -40 - (index * 10),
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateX, {
                toValue: (index - 1) * 30, // Spread particles horizontally
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ])
        )
      );
      
      // Start celebration
      celebrateAnimation.start(() => {
        // Reset particles
        particleAnims.forEach(anim => {
          anim.opacity.setValue(0);
          anim.translateY.setValue(0);
          anim.translateX.setValue(0);
          anim.scale.setValue(1);
        });
      });
    }
  }, [collection.isCompleted, deviceCapability.canHandleComplexAnimations, isReduceMotionEnabled, particleAnims]);
  
  // Ambient glow animation for completed collections
  useEffect(() => {
    if (collection.isCompleted && 
        !isReduceMotionEnabled && 
        deviceCapability.canHandleComplexAnimations) {
      
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      );
      
      glowAnimation.start();
      
      return () => glowAnimation.stop();
    }
    return undefined;
  }, [collection.isCompleted, deviceCapability.canHandleComplexAnimations, isReduceMotionEnabled, glowAnim]);
  
  // Press animations
  const handlePressIn = (): void => {
    if (isReduceMotionEnabled) return;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(rotateAnim, {
        toValue: collection.isCompleted ? 5 : 2,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePressOut = (): void => {
    if (isReduceMotionEnabled) return;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // 3D Transform styles
  const cardTransform = {
    transform: [
      { scale: scaleAnim },
      {
        rotateY: rotateAnim.interpolate({
          inputRange: [-10, 10],
          outputRange: ['-5deg', '5deg'],
        })
      },
    ],
  };

  // Dynamic styles using theme colors
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      position: 'relative',
      backgroundColor: colors.cardBackgroundElevated, // Prevent transparency when pressed
    },

    particleContainer: {
      position: 'absolute',
      top: 20,
      left: '50%',
      width: 100,
      height: 100,
      marginLeft: -50,
      zIndex: 10,
      pointerEvents: 'none',
    },

    particle: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 3,
      left: '50%',
      top: '50%',
      marginLeft: -3,
      marginTop: -3,
    },

    card: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      padding: 20,
      borderLeftWidth: 4,
      position: 'relative',
    },

    cardCompleted: {
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },

    cardHighContrast: {
      borderWidth: 3,
      borderColor: '#CCCCCC', // Light gray for better visibility in dark theme with high contrast
    },

    depthLayer: {
      position: 'absolute',
      top: 4,
      left: 4,
      right: 4,
      bottom: 4,
      borderRadius: 16,
      zIndex: -1,
      opacity: 0.15,
    },

    completionBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },

    completionText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.white,
    },

    collectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },

    iconContainer: {
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
    },

    collectionIcon: {
      fontSize: 28,
      textAlign: 'center',
    },

    iconCompleted: {
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    collectionInfo: {
      flex: 1,
    },

    collectionName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },

    collectionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    rarityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginRight: 12,
    },

    rarityText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.white,
    },

    bonusXP: {
      fontSize: 14,
      fontWeight: '700',
    },

    collectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },

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
      color: colors.textSecondary,
    },

    progressPercentage: {
      fontSize: 13,
      fontWeight: '700',
    },

    progressBarContainer: {
      position: 'relative',
    },

    progressTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',
      borderRadius: 3,
    },

    progressHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      borderRadius: 3,
      opacity: 0.6,
    },

    statusContainer: {
      alignItems: 'center',
      marginTop: 8,
    },

    statusCompleted: {
      fontSize: 14,
      fontWeight: '700',
    },

    statusIncomplete: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });

  return (
    <Animated.View style={[styles.container, cardTransform]}>
      {/* Particle effects for completed collections */}
      {collection.isCompleted && 
       !isReduceMotionEnabled && 
       deviceCapability.canHandleParticles && (
        <View style={styles.particleContainer}>
          {particleAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  backgroundColor: rarityColor,
                  opacity: anim.opacity,
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    { scale: anim.scale },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}
      
      <View
        style={[
          styles.card,
          {
            borderLeftColor: rarityColor,
            backgroundColor: collection.isCompleted
              ? `${rarityColor}10` // Very subtle tint for completed
              : colors.cardBackgroundElevated
          },
          collection.isCompleted && styles.cardCompleted,
          isHighContrastEnabled && styles.cardHighContrast,
        ]}
      >
        {/* 3D depth layer - back shadow */}
        <View style={[
          styles.depthLayer,
          {
            // Use a safe color that's never black, even in high contrast mode
            backgroundColor: isHighContrastEnabled
              ? 'rgba(255, 255, 255, 0.08)'  // Light semi-transparent white instead of rarity color
              : `${rarityColor}20`
          }
        ]} />
        
        {/* Completion badge */}
        {collection.isCompleted && (
          <View style={[styles.completionBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.completionText}>✓</Text>
          </View>
        )}
        
        {/* Collection header */}
        <View style={styles.collectionHeader}>
          <View style={styles.iconContainer}>
            <Text style={[
              styles.collectionIcon,
              collection.isCompleted && styles.iconCompleted
            ]}>
              {collection.icon}
            </Text>
          </View>
          
          <View style={styles.collectionInfo}>
            <Text style={[
              styles.collectionName,
              collection.isCompleted && { color: rarityColor }
            ]}>
              {t(collection.nameKey)}
            </Text>
            <View style={styles.collectionMeta}>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>
                  {collection.rarity.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.bonusXP, { color: rarityColor }]}>
                +{collection.bonusXP} XP
              </Text>
            </View>
          </View>
        </View>
        
        {/* Description */}
        <Text style={styles.collectionDescription}>{collection.description}</Text>
        
        {/* 3D Progress section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {collection.completedCount}/{collection.totalCount} completed
            </Text>
            <Text style={[styles.progressPercentage, { color: rarityColor }]}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          
          {/* 3D Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: collection.isCompleted ? rarityColor : `${rarityColor}80`
                  }
                ]} 
              />
            </View>
            {/* Progress bar highlight for 3D effect */}
            <View style={[styles.progressHighlight, { backgroundColor: `${rarityColor}40` }]} />
          </View>
        </View>
        
        {/* Collection status */}
        <View style={styles.statusContainer}>
          {collection.isCompleted ? (
            <Text style={[styles.statusCompleted, { color: rarityColor }]}>
              {t('social.trophy_combinations.collectionComplete')}
            </Text>
          ) : (
            <Text style={styles.statusIncomplete}>
              {collection.totalCount - collection.completedCount} more to unlock
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};