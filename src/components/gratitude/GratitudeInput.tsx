import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
// useEnhancedGamification removed - XP handled by gratitudeStorage
import { Fonts, Layout } from '@/src/constants';
import { useTheme } from '@/src/contexts/ThemeContext';
import { today } from '@/src/utils/date';
import { ErrorModal } from '@/src/components/common';
import { getGratitudeStorageImpl } from '@/src/config/featureFlags';
import { XPSourceType } from '@/src/types/gamification';
import { XP_REWARDS } from '@/src/constants/gamification';
import { Router } from 'expo-router';

// Get storage implementation based on feature flag
const gratitudeStorage = getGratitudeStorageImpl();

interface GratitudeInputProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void; // funkce pro zavření formuláře
  isBonus?: boolean; // true if this is a bonus gratitude (already have 3+)
  inputType?: 'gratitude' | 'self-praise';
  router?: Router; // For automatic navigation to Home screen on debt
}

export default function GratitudeInput({ onSubmitSuccess, onCancel, isBonus = false, inputType = 'gratitude', router }: GratitudeInputProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { actions } = useGratitude();
  // addXP removed - XP handled by gratitudeStorage
  const [gratitudeText, setGratitudeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPlaceholder] = useState(() => {
    let placeholders: any = inputType === 'gratitude'
      ? t('journal.input.gratitudePlaceholders')
      : t('journal.input.selfPraisePlaceholders');

    // Ensure placeholders is an array (handle ESM default export case)
    if (!Array.isArray(placeholders)) {
      if (placeholders && typeof placeholders === 'object' && 'default' in placeholders) {
        placeholders = (placeholders as any).default;
      }
      if (!Array.isArray(placeholders)) {
        // Fallback to default placeholders if something goes wrong
        placeholders = ['What are you grateful for today?'];
      }
    }

    return (placeholders as string[])[Math.floor(Math.random() * (placeholders as string[]).length)];
  });

  const handleSubmit = async () => {
    const trimmedText = gratitudeText.trim();

    if (!trimmedText) {
      setErrorMessage(t('journal.input.emptyError'));
      setShowError(true);
      return;
    }

    if (trimmedText.length < 3) {
      setErrorMessage(t('journal.input.minLengthError'));
      setShowError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // ENHANCED DEBT CHECK with BUG #2 FIX: Multi-source validation to prevent phantom debt
      const currentStreak = await gratitudeStorage.getStreak();
      const calculatedFrozenDays = await gratitudeStorage.calculateFrozenDays();
      
      // PRIMARY SOURCE: Use streak.debtDays as authoritative (respects auto-reset)
      const authoritative_frozenDays = currentStreak.frozenDays;
      
      // SAFETY CHECK: If current streak = 0, no debt should exist (auto-reset case)
      if (currentStreak.currentStreak === 0 && authoritative_frozenDays === 0) {
        // Allow entry creation - no debt after reset
      } else if (authoritative_frozenDays > 0) {
        // STRICT DEBT BLOCKING: No entries allowed when debt exists
        
        // CONSISTENCY WARNING: Log discrepancy for debugging
        if (authoritative_frozenDays !== calculatedFrozenDays) {
        }
        
        // 🚀 SPECIFICATION COMPLIANCE: Automatic redirect to Home screen with modal auto-open
        if (router) {
          // Navigate to Home screen with flag to auto-open debt recovery modal
          router.push({ pathname: '/(tabs)', params: { openDebtModal: 'true' } });
          return;
        } else {
          // Fallback: Show error message if router not available
          const errorKey = authoritative_frozenDays === 1
            ? 'journal.input.frozenStreakError_one'
            : 'journal.input.frozenStreakError_other';
          setErrorMessage(t(errorKey, { count: authoritative_frozenDays }));
          setShowError(true);
          return;
        }
      }
      
      const newEntry = await actions.createGratitude({
        content: trimmedText,
        date: today(),
        type: inputType,
      });

      // XP is now handled entirely by GratitudeStorage - no dual system
      if (newEntry) {
        console.log(`✅ Journal entry added successfully - XP handled by storage layer`);
      }

      setGratitudeText('');
      onSubmitSuccess?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save gratitude');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    textInput: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
      paddingVertical: Layout.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: Layout.spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    characterCount: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.sm,
      borderRadius: 8,
    },
    submitButtonSelfPraise: {
      backgroundColor: colors.success,
    },
    submitButtonDisabled: {
      backgroundColor: colors.gray,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
    },
    submitButtonTextDisabled: {
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    headerTitle: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.gray,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: 'bold',
      lineHeight: 18,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header s křížkem pro zavření */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {inputType === 'gratitude' ? t('journal.input.addGratitudeTitle') : t('journal.input.addSelfPraiseTitle')}
        </Text>
        {onCancel && (
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onCancel}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TextInput
        style={styles.textInput}
        placeholder={isBonus ? `${currentPlaceholder} (optional)` : currentPlaceholder}
        placeholderTextColor={colors.textSecondary}
        value={gratitudeText}
        onChangeText={setGratitudeText}
        multiline
        maxLength={200}
        editable={!isSubmitting}
        autoFocus
        nativeID="gratitude-input"
      />
      
      <View style={styles.footer}>
        <Text style={styles.characterCount}>
          {gratitudeText.length}/200
        </Text>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            inputType === 'self-praise' && styles.submitButtonSelfPraise,
            (gratitudeText.trim().length < 3 || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={gratitudeText.trim().length < 3 || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            (gratitudeText.trim().length < 3 || isSubmitting) && styles.submitButtonTextDisabled
          ]}>
            {isSubmitting ? t('common.loading') : t('common.add')}
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />
    </View>
  );
}