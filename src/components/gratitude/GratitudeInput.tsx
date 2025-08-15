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
import { useOptimizedGamification } from '@/src/contexts/OptimizedGamificationContext';
import { Colors, Fonts, Layout } from '@/src/constants';
import { today } from '@/src/utils/date';
import { ErrorModal } from '@/src/components/common';
import { gratitudeStorage } from '@/src/services/storage/gratitudeStorage';
import { XPSourceType } from '@/src/types/gamification';
import { XP_REWARDS } from '@/src/constants/gamification';

interface GratitudeInputProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void; // funkce pro zavření formuláře
  isBonus?: boolean; // true if this is a bonus gratitude (already have 3+)
  inputType?: 'gratitude' | 'self-praise';
}

// Rotační placeholdery pro Vděčnost
const GRATITUDE_PLACEHOLDERS = [
  "What made you smile today?",
  "Who are you thankful for right now?",
  "What small thing brought you joy?",
  "What beautiful thing did you see today?",
  "What skill are you grateful to have?",
  "What part of your day are you most thankful for?",
  "What is something you're looking forward to?",
  "What food are you grateful for today?",
  "What song made your day better?",
  "What simple pleasure did you enjoy?"
];

// Rotační placeholdery pro Pochvalu
const SELF_PRAISE_PLACEHOLDERS = [
  "What challenge did you overcome today?",
  "What's one thing you did well today?",
  "What did you do today that you're proud of?",
  "How did you take a step towards your goals?",
  "What good decision did you make?",
  "When were you disciplined today?",
  "How did you show kindness to yourself?",
  "What did you learn today?",
  "What effort are you proud of, regardless of the outcome?",
  "What did you do today that was just for you?"
];

export default function GratitudeInput({ onSubmitSuccess, onCancel, isBonus = false, inputType = 'gratitude' }: GratitudeInputProps) {
  const { t } = useI18n();
  const { actions } = useGratitude();
  const { addXP } = useOptimizedGamification();
  const [gratitudeText, setGratitudeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPlaceholder] = useState(() => {
    const placeholders = inputType === 'gratitude' ? GRATITUDE_PLACEHOLDERS : SELF_PRAISE_PLACEHOLDERS;
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  });

  const handleSubmit = async () => {
    const trimmedText = gratitudeText.trim();
    
    if (!trimmedText) {
      setErrorMessage('Please enter your gratitude');
      setShowError(true);
      return;
    }

    if (trimmedText.length < 3) {
      setErrorMessage('Gratitude must be at least 3 characters long');
      setShowError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // ENHANCED DEBT CHECK with BUG #2 FIX: Multi-source validation to prevent phantom debt
      const currentStreak = await gratitudeStorage.getStreak();
      const calculatedDebt = await gratitudeStorage.calculateDebt();
      
      // PRIMARY SOURCE: Use streak.debtDays as authoritative (respects auto-reset)
      const authoritative_debt = currentStreak.debtDays;
      
      // SAFETY CHECK: If current streak = 0, no debt should exist (auto-reset case)
      if (currentStreak.currentStreak === 0 && authoritative_debt === 0) {
        console.log(`[DEBUG] GratitudeInput: Streak = 0, debt = 0. Allowing entry creation (post-reset state)`);
        // Allow entry creation - no debt after reset
      } else if (authoritative_debt > 0) {
        // Check how many entries user has today  
        const allGratitudes = await gratitudeStorage.getAll();
        const todayEntries = allGratitudes.filter(g => g.date === today()).length;
        
        if (todayEntries < 3) {
          // User hasn't completed daily requirement - must rescue streak first
          console.log(`[DEBUG] GratitudeInput: Blocking entry. Authoritative debt: ${authoritative_debt}, Calculated debt: ${calculatedDebt}`);
          
          // CONSISTENCY WARNING: Log discrepancy for debugging
          if (authoritative_debt !== calculatedDebt) {
            console.warn(`[DEBUG] GratitudeInput: Debt discrepancy! authoritative=${authoritative_debt}, calculated=${calculatedDebt}`);
          }
          
          setErrorMessage(`You have ${authoritative_debt} day${authoritative_debt > 1 ? 's' : ''} of debt. Please go to Home screen and tap "Rescue Streak" to watch ads before writing your daily entries.`);
          setShowError(true);
          return;
        }
        // If user has 3+ entries today, allow bonus entries even with debt
        console.log(`[DEBUG] GratitudeInput: Allowing bonus entry despite debt. Today entries: ${todayEntries}`);
      }
      
      const newEntry = await actions.createGratitude({
        content: trimmedText,
        date: today(),
        type: inputType,
      });

      // Award real-time XP for journal entry (streaks/milestones handled by storage)
      if (newEntry) {
        const xpAmount = inputType === 'self-praise' ? 
          XP_REWARDS.JOURNAL.FIRST_ENTRY : // Same reward for self-praise as regular entries
          XP_REWARDS.JOURNAL.FIRST_ENTRY;
        const xpSource = inputType === 'self-praise' ? 
          XPSourceType.JOURNAL_ENTRY : 
          XPSourceType.JOURNAL_ENTRY;
        const description = inputType === 'self-praise' ? 
          'Added self-praise entry' : 
          'Added gratitude entry';

        console.log(`🚀 Real-time XP: Awarding ${xpAmount} XP for journal entry`);
        await addXP(xpAmount, { source: xpSource, description });
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

  return (
    <View style={styles.container}>
      {/* Header s křížkem pro zavření */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {inputType === 'gratitude' ? 'Add Gratitude' : 'Add Self-Praise'}
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
        placeholderTextColor={Colors.textSecondary}
        value={gratitudeText}
        onChangeText={setGratitudeText}
        multiline
        maxLength={200}
        editable={!isSubmitting}
        autoFocus
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Layout.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 8,
  },
  submitButtonSelfPraise: {
    backgroundColor: Colors.success,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
  },
  submitButtonTextDisabled: {
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: 'bold',
    lineHeight: 18,
  },
});