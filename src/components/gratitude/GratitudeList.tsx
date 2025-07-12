import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { Gratitude } from '@/src/types/gratitude';
import { Colors, Fonts, Layout } from '@/src/constants';

interface GratitudeListProps {
  gratitudes: Gratitude[];
}

export default function GratitudeList({ gratitudes }: GratitudeListProps) {
  const { t } = useI18n();

  const renderGratitudeItem = ({ item, index }: { item: Gratitude; index: number }) => (
    <View
      style={[
        styles.gratitudeItem,
        item.isBonus && styles.bonusGratitudeItem,
      ]}
    >
      <View style={styles.gratitudeHeader}>
        <View style={styles.orderContainer}>
          <Text style={[
            styles.orderText,
            item.isBonus && styles.bonusOrderText,
          ]}>
            {item.order}
          </Text>
          {item.isBonus && (
            <Text style={styles.bonusLabel}>
              BONUS ⭐
            </Text>
          )}
        </View>
      </View>
      
      <Text style={styles.gratitudeContent}>
        {item.content}
      </Text>
      
      <Text style={styles.gratitudeTime}>
        {new Date(item.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  if (gratitudes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t('gratitude.minimumRequired')}
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

const styles = StyleSheet.create({
  list: {
    padding: Layout.spacing.md,
    paddingTop: 0,
  },
  gratitudeItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  bonusGratitudeItem: {
    borderLeftColor: Colors.gold || '#FFD700',
    backgroundColor: Colors.background,
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
  },
  orderText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight || Colors.background,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    borderRadius: 16,
    marginRight: Layout.spacing.sm,
  },
  bonusOrderText: {
    color: Colors.gold || '#FFD700',
    backgroundColor: '#FFF9E6',
    lineHeight: 32,
  },
  bonusLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gold || '#FFD700',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gratitudeContent: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Layout.spacing.sm,
  },
  gratitudeTime: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  emptyText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});