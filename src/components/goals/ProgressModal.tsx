import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
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

  if (Platform.OS === 'android') {
    // Android - BEZ overlay divu!
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
        statusBarTranslucent
        presentationStyle="fullScreen"
      >
        <KeyboardAvoidingView
          style={styles.androidContainer}
          behavior="height"
          keyboardVerticalOffset={StatusBar.currentHeight || 0}
        >
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
        </KeyboardAvoidingView>
      </Modal>
    );
  }
  
  // iOS - zachovat původní strukturu
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior="padding"
          >
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
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Pro Android - jednoduchý container bez position absolute
  androidContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: StatusBar.currentHeight || 0,
  },
  // iOS styly zůstávají stejné
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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