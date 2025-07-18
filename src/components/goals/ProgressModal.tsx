import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, AddGoalProgressInput } from '../../types/goal';
import { ProgressEntryForm } from './ProgressEntryForm';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface ProgressModalProps {
  visible: boolean;
  goal: Goal;
  onClose: () => void;
  onSubmit: (data: AddGoalProgressInput) => Promise<void>;
  isLoading?: boolean;
}

export function ProgressModal({
  visible,
  goal,
  onClose,
  onSubmit,
  isLoading = false,
}: ProgressModalProps) {
  const { t } = useI18n();

  // STANDARDÍ React Native Modal s krásným pageSheet stylem
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {t('goals.progress.addProgress')}
            </Text>
            <Text style={styles.subtitle}>
              {goal.title}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <ProgressEntryForm
          goalId={goal.id}
          goalUnit={goal.unit}
          currentValue={goal.currentValue}
          targetValue={goal.targetValue}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </SafeAreaView>
    </Modal>
  );
}

// STANDARDÍ React Native Modal styly
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
});