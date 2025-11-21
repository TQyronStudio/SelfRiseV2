// Achievement Sharing Modal - Social Features Foundation
// Beautiful achievement sharing with privacy protection

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialSharingService, AchievementShareData } from '../../services/socialSharingService';
import { Achievement } from '../../types/gamification';
import { Layout } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

// ========================================
// INTERFACES
// ========================================

interface AchievementShareModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

interface ShareOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

// ========================================
// COMPONENT
// ========================================

export const AchievementShareModal: React.FC<AchievementShareModalProps> = ({
  visible,
  achievement,
  onClose
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [shareData, setShareData] = useState<AchievementShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Load sharing data when modal opens
  useEffect(() => {
    if (visible && achievement) {
      loadSharingData();
    } else {
      setShareData(null);
    }
  }, [visible, achievement]);

  const loadSharingData = async () => {
    if (!achievement) return;

    try {
      setLoading(true);
      const data = await SocialSharingService.createAchievementShare(achievement.id);
      setShareData(data);
    } catch (error) {
      console.error('Failed to load sharing data:', error);
      Alert.alert(t('common.error'), t('social.achievements.shareError'));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!shareData) return;

    try {
      setSharing(true);
      const success = await SocialSharingService.shareAchievement(shareData);
      
      if (success) {
        // Show success feedback
        Alert.alert(
          t('social.achievements.shareSuccessTitle'),
          t('social.achievements.shareSuccessMessage'),
          [{ text: t('common.ok'), onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert(t('common.error'), t('social.achievements.shareError'));
    } finally {
      setSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!shareData) return;

    try {
      const success = await SocialSharingService.copyAchievementToClipboard(shareData);
      
      if (success) {
        Alert.alert(
          t('social.achievements.copiedTitle'),
          t('social.achievements.copiedMessage'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert(t('common.error'), t('social.achievements.shareError'));
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'native_share',
      title: t('social.achievements.shareAchievementTitle'),
      description: t('social.achievements.shareAchievementDescription'),
      icon: 'share-social',
      color: '#3B82F6',
      onPress: handleShare
    },
    {
      id: 'copy_clipboard',
      title: t('social.achievements.copyClipboardTitle'),
      description: t('social.achievements.copyClipboardDescription'),
      icon: 'copy',
      color: '#10B981',
      onPress: handleCopyToClipboard
    }
  ];

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#9E9E9E',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FFD700'
    };
    return colors[rarity as keyof typeof colors] || '#9E9E9E';
  };

  const getRarityEmoji = (rarity: string) => {
    const emojis = {
      common: '⭐',
      rare: '🌟',
      epic: '💫',
      legendary: '✨'
    };
    return emojis[rarity as keyof typeof emojis] || '🏆';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: Layout.spacing.lg,
      paddingTop: Platform.OS === 'ios' ? Layout.spacing.lg : Layout.spacing.md,
      paddingBottom: Layout.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    closeButton: {
      padding: Layout.spacing.sm,
      borderRadius: Layout.borderRadius.md,
      marginTop: -Layout.spacing.sm,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: Layout.spacing.lg,
      paddingBottom: Layout.spacing.xl,
    },
    loadingContainer: {
      paddingVertical: Layout.spacing.xl * 2,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    achievementPreview: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
      marginBottom: Layout.spacing.lg,
    },
    achievementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    achievementIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    achievementEmoji: {
      fontSize: 28,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    achievementRarity: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    achievementDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
    achievementStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: Layout.spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    messagePreview: {
      marginBottom: Layout.spacing.lg,
    },
    messageTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: Layout.spacing.md,
    },
    messageContainer: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: Layout.spacing.md,
    },
    hashtagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Layout.spacing.sm,
    },
    hashtag: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    sharingOptions: {
      marginBottom: Layout.spacing.lg,
    },
    optionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: Layout.spacing.md,
    },
    shareOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
      marginBottom: Layout.spacing.sm,
    },
    shareOptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    shareOptionContent: {
      flex: 1,
    },
    shareOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    shareOptionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    privacyNotice: {
      backgroundColor: colors.success + '15',
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
      borderWidth: 1,
      borderColor: colors.success,
    },
    privacyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    privacyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.success,
      marginLeft: Layout.spacing.sm,
    },
    privacyText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    errorContainer: {
      paddingVertical: Layout.spacing.xl * 2,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Layout.spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.sm,
      borderRadius: Layout.borderRadius.md,
    },
    retryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{t('social.shareModal.title')}</Text>
            <Text style={styles.headerSubtitle}>Celebrate your progress! 🎉</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close sharing modal"
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Preparing your achievement... 🏆</Text>
            </View>
          ) : shareData && achievement ? (
            <>
              {/* Achievement Preview */}
              <View style={styles.achievementPreview}>
                <View style={styles.achievementHeader}>
                  <View style={styles.achievementIcon}>
                    <Text style={styles.achievementEmoji}>
                      {getRarityEmoji(achievement.rarity)}
                    </Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{t(achievement.nameKey)}</Text>
                    <Text 
                      style={[
                        styles.achievementRarity,
                        { color: getRarityColor(achievement.rarity) }
                      ]}
                    >
                      {achievement.rarity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.achievementDescription}>
                  {t(achievement.descriptionKey)}
                </Text>

                <View style={styles.achievementStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{shareData.currentLevel}</Text>
                    <Text style={styles.statLabel}>Level</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{shareData.totalXP.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total XP</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {shareData.anonymizedStats?.achievementsCount || 0}
                    </Text>
                    <Text style={styles.statLabel}>Achievements</Text>
                  </View>
                </View>
              </View>

              {/* Share Message Preview */}
              <View style={styles.messagePreview}>
                <Text style={styles.messageTitle}>Share Message Preview</Text>
                <View style={styles.messageContainer}>
                  <Text style={styles.messageText}>{shareData.shareMessage}</Text>
                  <View style={styles.hashtagContainer}>
                    {shareData.hashtags.map((hashtag, index) => (
                      <Text key={index} style={styles.hashtag}>
                        {hashtag}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              {/* Sharing Options */}
              <View style={styles.sharingOptions}>
                <Text style={styles.optionsTitle}>Sharing Options</Text>
                {shareOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.shareOption}
                    onPress={option.onPress}
                    disabled={sharing}
                    accessibilityLabel={option.title}
                    accessibilityHint={option.description}
                  >
                    <View style={[styles.shareOptionIcon, { backgroundColor: option.color + '15' }]}>
                      <Ionicons name={option.icon} size={24} color={option.color} />
                    </View>
                    <View style={styles.shareOptionContent}>
                      <Text style={styles.shareOptionTitle}>{option.title}</Text>
                      <Text style={styles.shareOptionDescription}>{option.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Privacy Notice */}
              <View style={styles.privacyNotice}>
                <View style={styles.privacyHeader}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                  <Text style={styles.privacyTitle}>Privacy Protected</Text>
                </View>
                <Text style={styles.privacyText}>
                  Your personal information is never shared. Only achievement progress and motivational content are included in shares.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to load achievement data</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadSharingData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};