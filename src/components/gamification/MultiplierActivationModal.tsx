/**
 * Multiplier Activation Modal Component
 * 
 * Celebration modal for XP multiplier activations with stunning animations,
 * particle effects, and comprehensive information display.
 * 
 * Features:
 * - Celebration animations with particle effects
 * - Multiplier information and countdown display
 * - Harmony streak achievement visualization
 * - Share functionality for social features
 * - Accessibility support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { ActiveMultiplierInfo } from '../../services/xpMultiplierService';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface MultiplierActivationModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  
  /**
   * Multiplier information to display
   */
  multiplier: ActiveMultiplierInfo | null;
  
  /**
   * Harmony streak length that triggered the multiplier
   */
  harmonyStreakLength?: number;
  
  /**
   * Bonus XP awarded for activation
   */
  bonusXP?: number;
  
  /**
   * Callback when modal is dismissed
   */
  onClose: () => void;
  
  /**
   * Callback when user wants to share
   */
  onShare?: () => void;
  
  /**
   * Whether to show sharing option
   */
  showShare?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Particle interface for animation effects
 */
interface Particle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  emoji: string;
}

/**
 * Multiplier Activation Modal Component
 */
export const MultiplierActivationModal: React.FC<MultiplierActivationModalProps> = ({
  visible,
  multiplier,
  harmonyStreakLength = 0,
  bonusXP = 0,
  onClose,
  onShare,
  showShare = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // ========================================
  // STATE & ANIMATIONS
  // ========================================
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Main animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Celebration animations
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // ========================================
  // PARTICLE SYSTEM
  // ========================================
  
  /**
   * Create celebration particles
   */
  const createParticles = () => {
    const newParticles: Particle[] = [];
    const emojis = ['⚡', '✨', '🚀', '💫', '⭐', '🎉', '🔥'];
    
    for (let i = 0; i < 20; i++) {
      const particle: Particle = {
        id: `particle_${i}`,
        x: new Animated.Value(screenWidth / 2),
        y: new Animated.Value(screenHeight / 2),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0.5 + Math.random() * 0.5),
        rotation: new Animated.Value(0),
        emoji: emojis[Math.floor(Math.random() * emojis.length)]!,
      };
      
      newParticles.push(particle);
    }
    
    setParticles(newParticles);
    return newParticles;
  };
  
  /**
   * Animate particles
   */
  const animateParticles = (particleList: Particle[]) => {
    const animations = particleList.map((particle) => {
      const targetX = screenWidth / 2 + (Math.random() - 0.5) * screenWidth * 0.8;
      const targetY = screenHeight / 2 + (Math.random() - 0.5) * screenHeight * 0.6;
      
      return Animated.parallel([
        Animated.timing(particle.x, {
          toValue: targetX,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: false,
        }),
        Animated.timing(particle.y, {
          toValue: targetY,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: false,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(particle.rotation, {
          toValue: 360 + Math.random() * 360,
          duration: 3000,
          useNativeDriver: false,
        }),
      ]);
    });
    
    Animated.parallel(animations).start();
  };
  
  // ========================================
  // ANIMATION SEQUENCES
  // ========================================
  
  /**
   * Start entrance animation
   */
  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      startCelebrationAnimation();
    });
  };
  
  /**
   * Start celebration animation sequence
   */
  const startCelebrationAnimation = () => {
    // Create and animate particles
    const newParticles = createParticles();
    animateParticles(newParticles);
    
    // Celebration pulse
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
    
    // Continuous pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };
  
  /**
   * Start exit animation
   */
  const startExitAnimation = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };
  
  // ========================================
  // TIMER UPDATE
  // ========================================
  
  /**
   * Update countdown timer
   */
  const updateTimer = () => {
    if (!multiplier?.isActive || !multiplier.timeRemaining) return;
    
    const now = Date.now();
    const activatedTime = multiplier.activatedAt?.getTime() || now;
    const totalDuration = (multiplier.expiresAt?.getTime() || now) - activatedTime;
    const elapsed = now - activatedTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    setTimeRemaining(`${hours}h ${minutes}m`);
  };
  
  // ========================================
  // EFFECTS
  // ========================================
  
  useEffect(() => {
    if (visible && multiplier) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      slideAnim.setValue(50);
      
      // Start entrance animation
      startEntranceAnimation();
      
      // Announce for accessibility
      AccessibilityInfo.announceForAccessibility(
        `XP Multiplier activated! ${multiplier.multiplier}x XP for ${Math.ceil((multiplier.timeRemaining || 0) / (1000 * 60 * 60))} hours`
      );
      
      // Start timer
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [visible, multiplier]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  /**
   * Handle modal close
   */
  const handleClose = () => {
    startExitAnimation(() => {
      setParticles([]);
      onClose();
    });
  };
  
  /**
   * Handle share action
   */
  const handleShare = () => {
    onShare?.();
  };
  
  // ========================================
  // RENDER HELPERS
  // ========================================
  
  /**
   * Render particle effects
   */
  const renderParticles = () => {
    return particles.map((particle) => (
      <Animated.Text
        key={particle.id}
        style={[
          styles.particle,
          {
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            transform: [
              { scale: particle.scale },
              {
                rotate: particle.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        {particle.emoji}
      </Animated.Text>
    ));
  };
  
  /**
   * Render multiplier details
   */
  const renderMultiplierDetails = () => {
    if (!multiplier) return null;
    
    const glowColor = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.8)'],
    });
    
    return (
      <Animated.View
        style={[
          styles.multiplierDetails,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.multiplierIcon}>⚡</Text>
        <Text style={styles.multiplierValue}>{multiplier.multiplier}x XP</Text>
        <Text style={styles.multiplierDuration}>{timeRemaining}</Text>
        
        {multiplier.source === 'harmony_streak' && (
          <Text style={styles.multiplierSource}>Harmony Streak Activated!</Text>
        )}
      </Animated.View>
    );
  };
  
  /**
   * Render achievement summary
   */
  const renderAchievementSummary = () => {
    return (
      <View style={styles.achievementSummary}>
        <Text style={styles.achievementTitle}>🎯 Achievement Unlocked!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{harmonyStreakLength}</Text>
            <Text style={styles.statLabel}>Day Harmony Streak</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+{bonusXP}</Text>
            <Text style={styles.statLabel}>Bonus XP</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statLabel}>Multiplier Duration</Text>
          </View>
        </View>
        
        <Text style={styles.achievementDescription}>
          You've used all three features (Habits, Journal, Goals) daily for {harmonyStreakLength} consecutive days! 
          Enjoy double XP rewards for the next 24 hours.
        </Text>
      </View>
    );
  };
  
  /**
   * Render action buttons
   */
  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtons}>
        {showShare && (
          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            onPress={handleShare}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share your achievement"
          >
            <Text style={styles.shareButtonText}>🎉 Share</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.continueButton]}
          onPress={handleClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue using the app with multiplier active"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // ========================================
  // MAIN RENDER
  // ========================================

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Particle effects */}
        {renderParticles()}

        {/* Main content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="XP Multiplier activation celebration"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.celebrationTitle}>🚀 MULTIPLIER ACTIVATED!</Text>

            {/* Multiplier details */}
            {renderMultiplierDetails()}

            {/* Achievement summary */}
            {renderAchievementSummary()}

            {/* Action buttons */}
            {renderActionButtons()}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ========================================
// STYLES
// ========================================

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: 20,
    width: Math.min(screenWidth - 40, 380),
    maxHeight: screenHeight * 0.8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  scrollContent: {
    padding: 24,
  },

  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFD700',
    marginBottom: 20,
  },

  multiplierDetails: {
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },

  multiplierIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  multiplierValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },

  multiplierDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },

  multiplierSource: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
  },

  achievementSummary: {
    marginBottom: 24,
  },

  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 16,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },

  shareButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },

  continueButton: {
    backgroundColor: colors.success,
  },

  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  particle: {
    position: 'absolute',
    fontSize: 24,
    zIndex: 1000,
  },
});

export default MultiplierActivationModal;