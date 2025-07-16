import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { GoalProgress } from '../../types/goal';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface ProgressHistoryListProps {
  progress: GoalProgress[];
  goalUnit: string;
}

interface ProgressItemProps {
  item: GoalProgress;
  goalUnit: string;
}

function ProgressItem({ item, goalUnit }: ProgressItemProps) {

  const getProgressTypeIcon = (type: string) => {
    switch (type) {
      case 'add':
        return '+';
      case 'subtract':
        return '-';
      case 'set':
        return '=';
      default:
        return '?';
    }
  };

  const getProgressTypeColor = (type: string) => {
    switch (type) {
      case 'add':
        return Colors.success;
      case 'subtract':
        return Colors.error;
      case 'set':
        return Colors.primary;
      default:
        return Colors.textSecondary;
    }
  };


  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <View style={styles.progressTypeContainer}>
          <View style={[styles.progressTypeIcon, { backgroundColor: getProgressTypeColor(item.progressType) }]}>
            <Text style={styles.progressTypeText}>{getProgressTypeIcon(item.progressType)}</Text>
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressValue}>
              {item.value} {goalUnit}
            </Text>
            <Text style={styles.progressDate}>{item.date}</Text>
          </View>
        </View>
      </View>
      
      {item.note && (
        <Text style={styles.progressNote}>{item.note}</Text>
      )}
    </View>
  );
}

export function ProgressHistoryList({ progress, goalUnit }: ProgressHistoryListProps) {
  const { t } = useI18n();

  const renderProgressItem = ({ item }: { item: GoalProgress }) => (
    <ProgressItem
      item={item}
      goalUnit={goalUnit}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('goals.progress.noProgress')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('goals.progress.progressHistory')}</Text>
      <FlatList
        data={progress}
        renderItem={renderProgressItem}
        keyExtractor={(item, index) => {
          // Use ID + timestamp for uniqueness
          const timestamp = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
          return `${item.id || `progress-${index}`}-${timestamp}`;
        }}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 16,
  },
  progressItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressTypeText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  progressInfo: {
    flex: 1,
  },
  progressValue: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  progressDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressNote: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 8,
    marginLeft: 44,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});