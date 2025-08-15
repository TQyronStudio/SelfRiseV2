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
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Fonts, Layout } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width: screenWidth } = Dimensions.get('window');

// Specialized modal components following CelebrationModal pattern
interface DebtModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

interface DebtConfirmationModalProps extends DebtModalProps {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

// AdFailedModal Component
function AdFailedModal({ visible, onClose, title, message, buttonText }: DebtModalProps) {
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

// DebtErrorModal Component  
function DebtErrorModal({ visible, onClose, title, message, buttonText }: DebtModalProps) {
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

// DebtConfirmationModal Component
function DebtConfirmationModal({ 
  visible, 
  onClose, 
  onConfirm,
  title, 
  message, 
  confirmText,
  cancelText 
}: DebtConfirmationModalProps) {
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
          <Text style={modalStyles.title}>{title || 'Watch Ad to Pay Debt'}</Text>
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    maxWidth: screenWidth * 0.85,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  message: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    minWidth: 120,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  cancelButtonText: {
    color: Colors.text,
  },
});

interface DebtRecoveryModalProps {
  visible: boolean;
  onClose: () => void;
  debtDays: number;
  adsWatched: number;
  totalAdsNeeded: number;
  onWatchAd: () => Promise<boolean>; // Returns true if ad was successfully watched
  onComplete: () => void; // Called when all ads are watched
  onResetStreak?: () => void; // Called when user chooses to reset streak instead of watching ads
}

export default function DebtRecoveryModal({
  visible,
  onClose,
  debtDays,
  adsWatched,
  totalAdsNeeded,
  onWatchAd,
  onComplete,
  onResetStreak,
}: DebtRecoveryModalProps) {
  const { t } = useI18n();
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
          // All ads watched, recovery complete
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

  const getDebtMessage = () => {
    if (debtDays === 1) {
      return `You missed 1 day. Watch ${totalAdsNeeded} ad to rescue your streak, then write entries normally.`;
    }
    return `You missed ${debtDays} days. Watch ${totalAdsNeeded} ads to rescue your streak, then write entries normally.`;
  };

  const getProgressMessage = () => {
    if (remainingAds === 0) {
      return 'Streak rescued! Go to Journal to write entries normally.';
    }
    return `Rescuing streak: ${adsWatched + 1}/${totalAdsNeeded}`;
  };

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
            <IconSymbol name="xmark" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Streak Recovery</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Debt Status */}
          <View style={styles.debtCard}>
            <Text style={styles.debtEmoji}>⚠️</Text>
            <Text style={styles.debtTitle}>Missed Days</Text>
            <Text style={styles.debtMessage}>{getDebtMessage()}</Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Recovery Progress</Text>
            
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
                    <IconSymbol name="checkmark" size={12} color={Colors.white} />
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
                  ? 'Recovery Complete! ✓' 
                  : `Watch Ad ${adsWatched + 1}/${totalAdsNeeded}`
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
                Skip Ads & Reset Streak to 0
              </Text>
            </TouchableOpacity>
          )}

          {/* Info */}
          <View style={styles.infoCard}>
            <IconSymbol name="info.circle" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              First rescue your streak by watching ads. After your streak is rescued, you can write journal entries normally without watching more ads.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Specialized Modals */}
      <AdFailedModal
        visible={showAdFailedModal}
        onClose={() => setShowAdFailedModal(false)}
      />
      
      <DebtErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />

      <DebtConfirmationModal
        visible={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        onConfirm={handleResetStreak}
        title="Reset Streak?"
        message="This will permanently reset your current streak to 0. You can start fresh without rescuing your streak. This action cannot be undone."
        confirmText="Reset to 0"
        cancelText="Cancel"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Layout.spacing.sm,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  debtCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debtEmoji: {
    fontSize: 48,
    marginBottom: Layout.spacing.sm,
  },
  debtTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.warning,
    marginBottom: Layout.spacing.xs,
  },
  debtMessage: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  progressBarContainer: {
    marginBottom: Layout.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Layout.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  completedDot: {
    backgroundColor: Colors.success,
  },
  currentDot: {
    backgroundColor: Colors.primary,
  },
  dotNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  progressMessage: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  watchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Layout.spacing.md,
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  watchButtonDisabled: {
    backgroundColor: Colors.border,
  },
  watchButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    color: Colors.white,
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: Layout.spacing.md,
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  resetButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    color: Colors.error,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Layout.spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
});