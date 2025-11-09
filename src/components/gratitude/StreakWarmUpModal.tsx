import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Fonts, Layout } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Specialized modal components following CelebrationModal pattern
interface WarmUpModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

interface WarmUpConfirmationModalProps extends WarmUpModalProps {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

// AdFailedModal Component
function AdFailedModal({ visible, onClose, title, message, buttonText }: WarmUpModalProps) {
  const { colors } = useTheme();

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      paddingVertical: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      maxWidth: screenWidth * 0.85,
      width: '100%',
    },
    emoji: {
      fontSize: 64,
      marginBottom: Layout.spacing.md,
    },
    title: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    message: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      minWidth: 120,
    },
    buttonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          <Text style={modalStyles.emoji}>❌</Text>
          <Text style={modalStyles.title}>{title || 'Ad Failed'}</Text>
          <Text style={modalStyles.message}>
            {message || 'Failed to load ad. Please try again.'}
          </Text>
          <TouchableOpacity style={modalStyles.button} onPress={onClose}>
            <Text style={modalStyles.buttonText}>{buttonText || 'OK'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// WarmUpErrorModal Component
function WarmUpErrorModal({ visible, onClose, title, message, buttonText }: WarmUpModalProps) {
  const { colors } = useTheme();

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      paddingVertical: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      maxWidth: screenWidth * 0.85,
      width: '100%',
    },
    emoji: {
      fontSize: 64,
      marginBottom: Layout.spacing.md,
    },
    title: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    message: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      minWidth: 120,
    },
    buttonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          <Text style={modalStyles.emoji}>⚠️</Text>
          <Text style={modalStyles.title}>{title || 'Error'}</Text>
          <Text style={modalStyles.message}>
            {message || 'Something went wrong. Please try again.'}
          </Text>
          <TouchableOpacity style={modalStyles.button} onPress={onClose}>
            <Text style={modalStyles.buttonText}>{buttonText || 'OK'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// WarmUpConfirmationModal Component
function WarmUpConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText
}: WarmUpConfirmationModalProps) {
  const { colors } = useTheme();

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      paddingVertical: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      maxWidth: screenWidth * 0.85,
      width: '100%',
    },
    emoji: {
      fontSize: 64,
      marginBottom: Layout.spacing.md,
    },
    title: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    message: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      minWidth: 120,
    },
    buttonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: Layout.spacing.md,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.text,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          <Text style={modalStyles.emoji}>🔄</Text>
          <Text style={modalStyles.title}>{title || 'Watch Ad to Warm Up Streak'}</Text>
          <Text style={modalStyles.message}>
            {message || 'This would show a real advertisement. Continue with ad simulation?'}
          </Text>
          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[modalStyles.buttonText, modalStyles.cancelButtonText]}>
                {cancelText || 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.button} onPress={onConfirm}>
              <Text style={modalStyles.buttonText}>{confirmText || 'Watch Ad'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface StreakWarmUpModalProps {
  visible: boolean;
  onClose: () => void;
  frozenDays: number;
  adsWatched: number;
  totalAdsNeeded: number;
  onWatchAd: () => Promise<boolean>; // Returns true if ad was successfully watched
  onComplete: () => void; // Called when all ads are watched
  onResetStreak?: () => void; // Called when user chooses to reset streak instead of watching ads
}

export default function StreakWarmUpModal({
  visible,
  onClose,
  frozenDays,
  adsWatched,
  totalAdsNeeded,
  onWatchAd,
  onComplete,
  onResetStreak,
}: StreakWarmUpModalProps) {
  const { colors } = useTheme();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [showAdFailedModal, setShowAdFailedModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const remainingAds = totalAdsNeeded - adsWatched;
  const progressPercentage = totalAdsNeeded > 0 ? (adsWatched / totalAdsNeeded) * 100 : 0;

  const handleWatchAd = async () => {
    if (isWatchingAd || remainingAds <= 0) return;

    setIsWatchingAd(true);
    try {
      const success = await onWatchAd();
      if (success) {
        // CRITICAL FIX: Calculate ads after increment (React state is async)
        const newAdsWatched = adsWatched + 1;
        
        if (newAdsWatched >= totalAdsNeeded) {
          // All ads watched, warm up complete
          setTimeout(() => {
            onComplete();
            onClose();
          }, 500);
        }
      } else {
        setShowAdFailedModal(true);
      }
    } catch (error) {
      setShowErrorModal(true);
    } finally {
      setIsWatchingAd(false);
    }
  };

  const handleResetStreak = () => {
    if (onResetStreak) {
      onResetStreak();
      onClose();
    }
  };

  const getFrozenMessage = () => {
    if (frozenDays === 1) {
      return `Your streak has been frozen for 1 day. Watch ${totalAdsNeeded} ad to warm it up, then continue journaling freely! ❄️➡️🔥`;
    }
    return `Your streak has been frozen for ${frozenDays} days. Watch ${totalAdsNeeded} ads to warm it up, then continue journaling freely! ❄️➡️🔥`;
  };

  const getProgressMessage = () => {
    if (remainingAds === 0) {
      return 'Streak warmed up! Go to Journal and continue your journey! ✨';
    }
    return `Warming up: ${adsWatched + 1}/${totalAdsNeeded} 🔥`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Layout.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: Layout.spacing.sm,
    },
    title: {
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: Layout.spacing.md,
    },
    frozenCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.lg,
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    frozenEmoji: {
      fontSize: 48,
      marginBottom: Layout.spacing.sm,
    },
    frozenTitle: {
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: colors.warning,
      marginBottom: Layout.spacing.xs,
    },
    frozenMessage: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    progressCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.lg,
      marginBottom: Layout.spacing.md,
    },
    progressTitle: {
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.md,
    },
    progressBarContainer: {
      marginBottom: Layout.spacing.md,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: Layout.spacing.sm,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '600',
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
      flexWrap: 'wrap',
    },
    dot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
      marginVertical: 4,
    },
    completedDot: {
      backgroundColor: colors.success,
    },
    currentDot: {
      backgroundColor: colors.primary,
    },
    dotNumber: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.textSecondary,
    },
    progressMessage: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '600',
    },
    watchButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: Layout.spacing.md,
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    watchButtonDisabled: {
      backgroundColor: colors.border,
    },
    watchButtonText: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: colors.white,
    },
    resetButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      padding: Layout.spacing.md,
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
      borderWidth: 1,
      borderColor: colors.error,
    },
    resetButtonText: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: colors.error,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: Layout.spacing.md,
      alignItems: 'flex-start',
    },
    infoText: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      marginLeft: Layout.spacing.sm,
      flex: 1,
      lineHeight: 20,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Warm Up Your Streak</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Frozen Status */}
          <View style={styles.frozenCard}>
            <Text style={styles.frozenEmoji}>❄️</Text>
            <Text style={styles.frozenTitle}>Frozen Days</Text>
            <Text style={styles.frozenMessage}>{getFrozenMessage()}</Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Warming Progress</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {adsWatched}/{totalAdsNeeded} ads
              </Text>
            </View>

            {/* Progress Dots */}
            <View style={styles.dotsContainer}>
              {Array.from({ length: totalAdsNeeded }, (_, index) => {
                const dotStyle = [
                  styles.dot,
                  index < adsWatched && styles.completedDot,
                  index === adsWatched && styles.currentDot,
                ];
                
                return React.createElement(View, {
                  key: `dot-${index}`,
                  style: dotStyle
                },
                  index < adsWatched ? (
                    <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                  ) : index === adsWatched ? (
                    <Text style={styles.dotNumber}>{index + 1}</Text>
                  ) : (
                    <Text style={styles.dotNumber}>{index + 1}</Text>
                  )
                );
              })}
            </View>

            <Text style={styles.progressMessage}>{getProgressMessage()}</Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[
              styles.watchButton,
              (isWatchingAd || remainingAds <= 0) && styles.watchButtonDisabled,
            ]}
            onPress={handleWatchAd}
            disabled={isWatchingAd || remainingAds <= 0}
          >
            <Text style={styles.watchButtonText}>
              {isWatchingAd 
                ? 'Loading Ad...' 
                : remainingAds <= 0 
                  ? 'Warm Up Complete! ✓' 
                  : `Warm Up (${adsWatched + 1}/${totalAdsNeeded})`
              }
            </Text>
          </TouchableOpacity>

          {/* Reset Option */}
          {onResetStreak && remainingAds > 0 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setShowResetConfirmation(true)}
            >
              <Text style={styles.resetButtonText}>
                Start Fresh
              </Text>
            </TouchableOpacity>
          )}

          {/* Info */}
          <View style={styles.infoCard}>
            <IconSymbol name="info.circle" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              First warm up your frozen streak by watching ads. After your streak is warmed up, you can write journal entries normally without watching more ads.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Specialized Modals */}
      <AdFailedModal
        visible={showAdFailedModal}
        onClose={() => setShowAdFailedModal(false)}
      />
      
      <WarmUpErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />

      <WarmUpConfirmationModal
        visible={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        onConfirm={handleResetStreak}
        title="Start Fresh?"
        message="⚠️ This will permanently reset your current streak to 0. You can start fresh without warming up your frozen streak. This action cannot be undone."
        confirmText="Start Fresh"
        cancelText="Cancel"
      />
    </Modal>
  );
}