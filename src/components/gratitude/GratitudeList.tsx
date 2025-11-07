import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { Gratitude } from '@/src/types/gratitude';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';

interface GratitudeListProps {
  gratitudes: Gratitude[];
  showDate?: boolean;
  onEdit?: (gratitude: Gratitude) => void;
  onDelete?: (gratitude: Gratitude) => void;
}

export default function GratitudeList({ gratitudes, showDate = false, onEdit, onDelete }: GratitudeListProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    list: {
      padding: Layout.spacing.md,
      paddingTop: 0,
    },
    gratitudeItem: {
      backgroundColor: colors.gratitudeBackground,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.gratitudeBorder,
    },
    bonusGratitudeItem: {
      borderLeftColor: colors.gold,
      backgroundColor: colors.bonusGlow,
    },
    selfPraiseItem: {
      backgroundColor: colors.selfPraiseBackground,
      borderLeftColor: colors.selfPraiseBorder,
    },
    bonusSelfPraiseItem: {
      borderLeftColor: colors.gold,
      backgroundColor: colors.bonusGlow,
    },
    gratitudeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    orderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    labelContainer: {
      flexDirection: 'column',
      alignItems: 'flex-end',
    },
    orderText: {
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: colors.primaryLight,
      backgroundColor: colors.primaryDark,
      width: 32,
      height: 32,
      textAlign: 'center',
      lineHeight: 32,
      borderRadius: 16,
      marginRight: Layout.spacing.sm,
    },
    bonusOrderText: {
      color: colors.gold,
      backgroundColor: colors.bonusGlow,
      lineHeight: 32,
    },
    selfPraiseOrderText: {
      color: colors.success,
      backgroundColor: colors.successLight,
      lineHeight: 32,
    },
    bonusSelfPraiseOrderText: {
      color: colors.gold,
      backgroundColor: colors.bonusGlow,
      lineHeight: 32,
    },
    bonusLabel: {
      fontSize: Fonts.sizes.xs,
      color: colors.gold,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    typeLabel: {
      fontSize: Fonts.sizes.xs,
      color: colors.primary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    selfPraiseTypeLabel: {
      color: colors.success,
    },
    gratitudeContent: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      lineHeight: 22,
      marginBottom: Layout.spacing.sm,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    gratitudeDate: {
      fontSize: Fonts.sizes.xs,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    gratitudeTime: {
      fontSize: Fonts.sizes.xs,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: Layout.spacing.sm,
      marginTop: Layout.spacing.md,
      justifyContent: 'flex-end',
    },
    actionButton: {
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: colors.primary,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    editButtonText: {
      color: colors.white,
      fontSize: Fonts.sizes.sm,
      fontWeight: '600',
    },
    deleteButtonText: {
      color: colors.white,
      fontSize: Fonts.sizes.sm,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    emptyText: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  const renderGratitudeItem = ({ item, index }: { item: Gratitude; index: number }) => (
    <View
      style={[
        styles.gratitudeItem,
        item.isBonus && styles.bonusGratitudeItem,
        item.type === 'self-praise' && styles.selfPraiseItem,
        item.isBonus && item.type === 'self-praise' && styles.bonusSelfPraiseItem,
      ]}
    >
      <View style={styles.gratitudeHeader}>
        <View style={styles.orderContainer}>
          <Text style={[
            styles.orderText,
            item.isBonus && styles.bonusOrderText,
            item.type === 'self-praise' && !item.isBonus && styles.selfPraiseOrderText,
            item.isBonus && item.type === 'self-praise' && styles.bonusSelfPraiseOrderText,
          ]}>
            {item.order}
          </Text>
          <View style={styles.labelContainer}>
            {item.isBonus && (
              <Text style={styles.bonusLabel}>
                BONUS ⭐
              </Text>
            )}
            <Text style={[
              styles.typeLabel,
              item.type === 'self-praise' && styles.selfPraiseTypeLabel
            ]}>
              {item.type === 'gratitude' ? 'Gratitude' : 'Self-Praise'}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.gratitudeContent}>
        {item.content}
      </Text>
      
      <View style={styles.timeContainer}>
        {showDate && (
          <Text style={styles.gratitudeDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        )}
        <Text style={styles.gratitudeTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      
      {/* Edit/Delete buttons - only show if handlers are provided */}
      {(onEdit || onDelete) && (
        <View style={styles.actionButtons}>
          {onEdit && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(item)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (gratitudes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t('journal.minimumRequired')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {gratitudes.map((item, index) => (
        <View key={item.id}>
          {renderGratitudeItem({ item, index })}
        </View>
      ))}
    </View>
  );
}