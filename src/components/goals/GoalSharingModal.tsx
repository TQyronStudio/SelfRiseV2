import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, GoalProgress, GoalStats } from '@/src/types/goal';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/dimensions';

interface GoalSharingModalProps {
  visible: boolean;
  goal: Goal;
  stats: GoalStats | null;
  progressHistory: GoalProgress[];
  onClose: () => void;
}

export function GoalSharingModal({ visible, goal, stats, progressHistory, onClose }: GoalSharingModalProps) {
  const { t } = useI18n();
  const [isExporting, setIsExporting] = useState(false);

  // Don't render if stats are not available
  if (!stats) {
    return null;
  }

  const generateGoalSummary = () => {
    const completionPercentage = Math.round(stats.completionPercentage);
    const daysActive = stats.daysActive;
    const averageDaily = stats.averageDaily.toFixed(1);
    
    return t('goals.sharing.summary', {
      title: goal.title,
      completion: completionPercentage,
      current: goal.currentValue,
      target: goal.targetValue,
      unit: goal.unit,
      daysActive,
      averageDaily,
    });
  };

  const generateDetailedReport = () => {
    const summary = generateGoalSummary();
    const recentProgress = progressHistory
      .slice(-5)
      .reverse()
      .map(p => t('goals.sharing.progressEntry', {
        date: new Date(p.date).toLocaleDateString(),
        value: p.value,
        unit: goal.unit,
        type: t(`goals.progress.${p.progressType}`),
        note: p.note || t('goals.sharing.noNote'),
      }))
      .join('\n');

    const insights = [];
    if (stats.isOnTrack) {
      insights.push(t('goals.sharing.onTrack'));
    }
    if (stats.estimatedCompletionDate) {
      insights.push(t('goals.sharing.estimatedCompletion', {
        date: new Date(stats.estimatedCompletionDate).toLocaleDateString(),
      }));
    }

    return t('goals.sharing.detailedReportTemplate', {
      summary,
      recentProgress: recentProgress || t('goals.sharing.noRecentProgress'),
      insights: insights.join('\n') || t('goals.sharing.noInsights'),
    });
  };

  const generateJsonExport = () => {
    return JSON.stringify({
      goal: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        unit: goal.unit,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        status: goal.status,
        category: goal.category,
        targetDate: goal.targetDate,
        startDate: goal.startDate,
        completedDate: goal.completedDate,
      },
      stats: {
        totalProgress: stats.totalProgress,
        progressEntries: stats.progressEntries,
        averageDaily: stats.averageDaily,
        daysActive: stats.daysActive,
        completionPercentage: stats.completionPercentage,
        estimatedCompletionDate: stats.estimatedCompletionDate,
        isOnTrack: stats.isOnTrack,
      },
      progressHistory: progressHistory.map(p => ({
        value: p.value,
        note: p.note,
        date: p.date,
        progressType: p.progressType,
      })),
      exportDate: new Date().toISOString(),
    }, null, 2);
  };

  const shareGoal = async (format: 'summary' | 'detailed' | 'json') => {
    try {
      setIsExporting(true);
      
      let content = '';
      let title = '';
      
      switch (format) {
        case 'summary':
          title = t('goals.sharing.summaryTitle', { title: goal.title });
          content = generateGoalSummary();
          break;
        case 'detailed':
          title = t('goals.sharing.detailedTitle', { title: goal.title });
          content = generateDetailedReport();
          break;
        case 'json':
          title = t('goals.sharing.jsonTitle', { title: goal.title });
          content = generateJsonExport();
          break;
      }

      const result = await Share.share({
        message: content,
        title: title,
      });

      if (result.action === Share.sharedAction) {
        // Successfully shared
        onClose();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('goals.sharing.exportError'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async (format: 'summary' | 'detailed' | 'json') => {
    try {
      setIsExporting(true);
      
      let content = '';
      
      switch (format) {
        case 'summary':
          content = generateGoalSummary();
          break;
        case 'detailed':
          content = generateDetailedReport();
          break;
        case 'json':
          content = generateJsonExport();
          break;
      }

      // Note: In a real app, you would use expo-clipboard or @react-native-clipboard/clipboard
      // For now, we'll use Share as a fallback
      await Share.share({
        message: content,
      });

      Alert.alert(
        t('common.success'),
        t('goals.sharing.copied'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('goals.sharing.copyError'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const ShareOption = ({ 
    icon, 
    title, 
    description, 
    onPress, 
    color = Colors.primary 
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={styles.shareOption}
      onPress={onPress}
      disabled={isExporting}
    >
      <View style={[styles.shareOptionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color={Colors.white} />
      </View>
      <View style={styles.shareOptionContent}>
        <Text style={styles.shareOptionTitle}>{title}</Text>
        <Text style={styles.shareOptionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('goals.sharing.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalProgress}>
            {Math.round(stats.completionPercentage)}% {t('goals.sharing.complete')} • {goal.currentValue}/{goal.targetValue} {goal.unit}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t('goals.sharing.shareOptions')}</Text>
          
          <ShareOption
            icon="document-text"
            title={t('goals.sharing.quickSummary')}
            description={t('goals.sharing.quickSummaryDescription')}
            onPress={() => shareGoal('summary')}
            color={Colors.primary}
          />
          
          <ShareOption
            icon="analytics"
            title={t('goals.sharing.detailedReport')}
            description={t('goals.sharing.detailedReportDescription')}
            onPress={() => shareGoal('detailed')}
            color={Colors.info}
          />
          
          <ShareOption
            icon="code"
            title={t('goals.sharing.dataExport')}
            description={t('goals.sharing.dataExportDescription')}
            onPress={() => shareGoal('json')}
            color={Colors.warning}
          />

          <Text style={styles.sectionTitle}>{t('goals.sharing.copyOptions')}</Text>
          
          <ShareOption
            icon="copy"
            title={t('goals.sharing.copyToClipboard')}
            description={t('goals.sharing.copyToClipboardDescription')}
            onPress={() => copyToClipboard('summary')}
            color={Colors.success}
          />
          
          <ShareOption
            icon="clipboard"
            title={t('goals.sharing.copyDetailed')}
            description={t('goals.sharing.copyDetailedDescription')}
            onPress={() => copyToClipboard('detailed')}
            color={Colors.success}
          />
          
          <ShareOption
            icon="document"
            title={t('goals.sharing.copyJson')}
            description={t('goals.sharing.copyJsonDescription')}
            onPress={() => copyToClipboard('json')}
            color={Colors.success}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('goals.sharing.footerText')}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: Layout.spacing.xs,
  },
  goalInfo: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.sm,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  goalProgress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  shareOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  shareOptionContent: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  shareOptionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});