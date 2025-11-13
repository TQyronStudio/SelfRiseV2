import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useHomeCustomization } from '@/src/contexts/HomeCustomizationContext';
import { Layout, Typography } from '@/src/constants';

interface HomeCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HomeCustomizationModal({ visible, onClose }: HomeCustomizationModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { state, actions } = useHomeCustomization();

  const handleToggleComponent = async (componentId: string) => {
    try {
      await actions.toggleComponentVisibility(componentId);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('home.customization.errors.visibilityFailed')
      );
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      t('home.customization.resetTitle'),
      t('home.customization.resetMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('home.customization.resetToDefaults'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.resetToDefaults();
            } catch (error) {
              Alert.alert(t('common.error'), t('home.customization.errors.visibilityFailed'));
            }
          }
        },
      ]
    );
  };

  const getComponentDisplayName = (componentId: string) => {
    const names: Record<string, string> = {
      xpProgressBar: 'XP Progress',
      journalStreak: 'Journal Streak',
      quickActions: 'Quick Actions',
      dailyQuote: 'Daily Quote',
      recommendations: 'Recommendations',
      streakHistory: 'Streak History',
      habitStats: 'Habit Statistics',
      habitPerformance: 'Performance',
      habitTrends: 'Trends',
    };
    return names[componentId] || componentId;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBackgroundElevated,
    },
    title: {
      ...Typography.heading,
      color: colors.text,
    },
    closeButton: {
      padding: Layout.spacing.xs,
    },
    content: {
      flex: 1,
      padding: Layout.spacing.md,
    },
    section: {
      marginBottom: Layout.spacing.lg,
    },
    sectionTitle: {
      ...Typography.subheading,
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    sectionDescription: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Layout.spacing.md,
      lineHeight: 18,
    },
    componentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    componentInfo: {
      flex: 1,
    },
    componentName: {
      ...Typography.body,
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    componentOrder: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    actionText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginLeft: Layout.spacing.sm,
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
          <Text style={styles.title}>{t('home.customization.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.customization.components')}</Text>
            <Text style={styles.sectionDescription}>
              {t('home.customization.componentsDescription')}
            </Text>

            {state.preferences.components
              .filter(component => component.configurable)
              .sort((a, b) => a.order - b.order)
              .map(component => (
                <View key={component.id} style={styles.componentRow}>
                  <View style={styles.componentInfo}>
                    <Text style={styles.componentName}>
                      {getComponentDisplayName(component.id)}
                    </Text>
                    <Text style={styles.componentOrder}>
                      {t('home.customization.order', { order: component.order })}
                    </Text>
                  </View>
                  <Switch
                    value={component.visible}
                    onValueChange={() => handleToggleComponent(component.id)}
                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                    thumbColor={component.visible ? colors.primary : colors.textSecondary}
                  />
                </View>
              ))
            }
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.customization.actions')}</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleResetToDefaults}
            >
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
              <Text style={styles.actionText}>{t('home.customization.resetToDefaults')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}