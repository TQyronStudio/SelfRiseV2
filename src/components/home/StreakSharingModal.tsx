import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { GratitudeStreak } from '../../types/gratitude';

interface StreakSharingModalProps {
  visible: boolean;
  onClose: () => void;
  streak: GratitudeStreak;
}

export function StreakSharingModal({ visible, onClose, streak }: StreakSharingModalProps) {
  const { t } = useI18n();
  const [isSharing, setIsSharing] = useState(false);

  const generateShareText = (): string => {
    const { currentStreak, longestStreak, starCount, flameCount, crownCount } = streak;
    
    let shareText = `🔥 ${t('home.shareStreakText', { current: currentStreak })}`;
    
    if (longestStreak > currentStreak) {
      shareText += `\n🏆 ${t('home.shareBestStreak', { best: longestStreak })}`;
    }
    
    // Add badges if available
    const badges = [];
    if (starCount > 0) badges.push(`⭐ ${starCount}`);
    if (flameCount > 0) badges.push(`🔥 ${flameCount}`);
    if (crownCount > 0) badges.push(`👑 ${crownCount}`);
    
    if (badges.length > 0) {
      shareText += `\n${t('home.shareBadges')}: ${badges.join(' • ')}`;
    }
    
    shareText += `\n\n${t('home.shareAppPromo')}`;
    
    return shareText;
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    try {
      setIsSharing(true);
      const shareText = generateShareText();
      
      const result = await Share.share({
        message: shareText,
        title: t('home.shareTitle'),
      });
      
      if (result.action === Share.sharedAction) {
        // Successfully shared
        onClose();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('home.shareError')
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const shareText = generateShareText();
      await Clipboard.setStringAsync(shareText);
      
      Alert.alert(
        t('common.success'),
        t('home.copiedToClipboard'),
        [{ text: t('common.ok'), onPress: onClose }]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('home.copyError')
      );
    }
  };

  const renderStreakPreview = () => {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.streakDisplay}>
          <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
          <Text style={styles.streakLabel}>
            {streak.currentStreak === 1 ? t('home.day') : t('home.days')}
          </Text>
        </View>
        
        <View style={styles.badgesRow}>
          {streak.starCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>⭐</Text>
              <Text style={styles.badgeCount}>{streak.starCount}</Text>
            </View>
          )}
          {streak.flameCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🔥</Text>
              <Text style={styles.badgeCount}>{streak.flameCount}</Text>
            </View>
          )}
          {streak.crownCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>👑</Text>
              <Text style={styles.badgeCount}>{streak.crownCount}</Text>
            </View>
          )}
        </View>
        
        {streak.longestStreak > streak.currentStreak && (
          <View style={styles.bestStreakContainer}>
            <Text style={styles.bestStreakText}>
              {t('home.bestStreak')}: {streak.longestStreak} {t('home.days')}
            </Text>
          </View>
        )}
      </View>
    );
  };

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
            <Ionicons name="share-outline" size={24} color={Colors.primary} />
            <Text style={styles.title}>{t('home.shareStreak')}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            {t('home.shareSubtitle')}
          </Text>
          
          {renderStreakPreview()}
          
          {/* Share text preview */}
          <View style={styles.textPreviewContainer}>
            <Text style={styles.textPreviewLabel}>{t('home.sharePreview')}:</Text>
            <View style={styles.textPreview}>
              <Text style={styles.previewText}>{generateShareText()}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCopyToClipboard}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.actionText}>{t('home.copyText')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.textInverse} />
            <Text style={[styles.actionText, styles.shareButtonText]}>
              {isSharing ? t('home.sharing') : t('home.shareNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  previewContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  streakDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    lineHeight: 56,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeCount: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginTop: 2,
  },
  bestStreakContainer: {
    marginTop: 8,
  },
  bestStreakText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  textPreviewContainer: {
    marginBottom: 24,
  },
  textPreviewLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 8,
  },
  textPreview: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    maxHeight: 120,
  },
  previewText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  shareButton: {
    backgroundColor: Colors.primary,
  },
  actionText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginLeft: 8,
  },
  shareButtonText: {
    color: Colors.textInverse,
  },
});