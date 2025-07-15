import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { Colors, Layout, Fonts } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';
// Note: Using Alert for export since clipboard is not available

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExportModal({ visible, onClose }: ExportModalProps) {
  const { t } = useI18n();
  const { state, actions } = useGratitude();
  const [isExporting, setIsExporting] = useState(false);

  const generateTextExport = async () => {
    const gratitudes = await actions.searchGratitudes(''); // Get all gratitudes
    const stats = state.stats;
    const streakInfo = state.streakInfo;
    
    let exportText = `📖 My Journal Export\n`;
    exportText += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    // Statistics
    exportText += `📊 STATISTICS\n`;
    exportText += `Total entries: ${stats?.totalGratitudes || 0}\n`;
    exportText += `Active days: ${stats?.totalDays || 0}\n`;
    exportText += `Average per day: ${stats?.averagePerDay?.toFixed(1) || '0.0'}\n`;
    exportText += `Current streak: ${streakInfo?.currentStreak || 0} days\n`;
    exportText += `Longest streak: ${streakInfo?.longestStreak || 0} days\n\n`;
    
    // Entries grouped by date
    const groupedByDate = gratitudes.reduce((acc, gratitude) => {
      const date = gratitude.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(gratitude);
      return acc;
    }, {} as Record<string, any[]>);

    const sortedDates = Object.keys(groupedByDate).sort().reverse();
    
    exportText += `📝 JOURNAL ENTRIES\n\n`;
    
    sortedDates.forEach(date => {
      const entries = groupedByDate[date];
      exportText += `${new Date(date).toLocaleDateString()}\n`;
      exportText += `${'-'.repeat(20)}\n`;
      
      entries.forEach((entry, index) => {
        const typeEmoji = entry.type === 'gratitude' ? '🙏' : '💪';
        const bonusText = entry.isBonus ? ' [BONUS ⭐]' : '';
        exportText += `${index + 1}. ${typeEmoji} ${entry.content}${bonusText}\n`;
      });
      
      exportText += `\n`;
    });
    
    return exportText;
  };

  const generateJSONExport = async () => {
    const gratitudes = await actions.searchGratitudes(''); // Get all gratitudes
    const stats = state.stats;
    const streakInfo = state.streakInfo;
    
    const exportData = {
      exportDate: new Date().toISOString(),
      statistics: {
        totalGratitudes: stats?.totalGratitudes || 0,
        totalDays: stats?.totalDays || 0,
        averagePerDay: stats?.averagePerDay || 0,
        currentStreak: streakInfo?.currentStreak || 0,
        longestStreak: streakInfo?.longestStreak || 0,
        badges: {
          stars: streakInfo?.starCount || 0,
          flames: streakInfo?.flameCount || 0,
          crowns: streakInfo?.crownCount || 0,
        },
      },
      entries: gratitudes.map(g => ({
        id: g.id,
        type: g.type,
        content: g.content,
        date: g.date,
        order: g.order,
        isBonus: g.isBonus,
        createdAt: g.createdAt,
      })),
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  const exportData = async (format: 'text' | 'json') => {
    try {
      setIsExporting(true);
      
      let content: string;
      let formatName: string;
      
      if (format === 'text') {
        content = await generateTextExport();
        formatName = 'Text';
      } else {
        content = await generateJSONExport();
        formatName = 'JSON';
      }
      
      // Show the exported data in an alert (since clipboard is not available)
      Alert.alert(
        `Journal Export - ${formatName} Format`,
        content.length > 1000 ? 
          `${content.substring(0, 1000)}...\n\n[Content truncated for display]` : 
          content,
        [{ text: 'OK', onPress: onClose }]
      );
      
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export journal data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Export Journal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.description}>
              Export your journal entries and statistics. The data will be displayed in a popup for you to copy and save.
            </Text>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={() => exportData('text')}
                disabled={isExporting}
              >
                <View style={styles.exportButtonContent}>
                  <IconSymbol name="doc.text" size={24} color={Colors.primary} />
                  <Text style={styles.exportButtonTitle}>Text Format</Text>
                  <Text style={styles.exportButtonDescription}>
                    Human-readable format perfect for sharing and reading
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={() => exportData('json')}
                disabled={isExporting}
              >
                <View style={styles.exportButtonContent}>
                  <IconSymbol name="chevron.left.slash.chevron.right" size={24} color={Colors.primary} />
                  <Text style={styles.exportButtonTitle}>JSON Format</Text>
                  <Text style={styles.exportButtonDescription}>
                    Structured data format for backup or technical use
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {isExporting && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Exporting your journal...</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
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
  content: {
    padding: Layout.spacing.lg,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  exportOptions: {
    gap: Layout.spacing.md,
  },
  exportButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonContent: {
    alignItems: 'center',
  },
  exportButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  exportButtonDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.sm,
  },
});