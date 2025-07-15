import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoalProgress } from '../../types/goal';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ConfirmationModal } from '../common';

interface ProgressHistoryListProps {
  progress: GoalProgress[];
  goalUnit: string;
  onDeleteProgress: (progressId: string) => void;
}

interface ProgressItemProps {
  item: GoalProgress;
  goalUnit: string;
  onDelete: () => void;
}

function ProgressItem({ item, goalUnit, onDelete }: ProgressItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDeletePress = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete();
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
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
      
      {item.note && (
        <Text style={styles.progressNote}>{item.note}</Text>
      )}

      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Progress"
        message="Are you sure you want to delete this progress entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </View>
  );
}

export function ProgressHistoryList({ progress, goalUnit, onDeleteProgress }: ProgressHistoryListProps) {
  const { t } = useI18n();
  
  // Debug: Check for duplicate IDs
  const ids = progress.map(p => p.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    console.warn('Duplicate progress IDs found:', duplicates);
  }

  const renderProgressItem = ({ item }: { item: GoalProgress }) => (
    <ProgressItem
      item={item}
      goalUnit={goalUnit}
      onDelete={() => onDeleteProgress(item.id)}
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
  deleteButton: {
    padding: 8,
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