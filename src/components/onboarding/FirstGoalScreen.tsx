import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useGoals } from '@/src/contexts/GoalsContext';
import { armTutorialAchievementGate } from '@/src/utils/tutorialAchievementGate';
import { useGoalTemplates, templateToGoalInput } from '@/src/constants/goalTemplates';
import { GoalCategory } from '@/src/types/goal';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont } from '@/src/utils/responsive';
import { OnbScreenContainer } from './OnbScreenContainer';
import { OnbTileGrid, OnbTileGridItem } from './OnbTileGrid';
import { createWithTrophyGate } from './createWithTrophyGate';
import { parseGoalTarget, isGoalDraftComplete } from './goalDraft';

/**
 * Onboarding screen 2 — the user leaves with a goal of their own.
 *
 * Reuses the goal TEMPLATE DATA that the Goals tab already ships (11 of them),
 * but not the modal that presents them: rule K2 keeps RN modals out of
 * onboarding, and the tab's wide rows would not fit here anyway. See D-TPL in
 * technical-guides:Tutorial.md.
 *
 * The suggested number is the field users most want to change, so it sits
 * right under the tiles rather than behind an "edit" step.
 *
 * No target-date picker on purpose: the date is optional, no template sets one
 * (so nothing is locked away), and a calendar inside a seven-tap flow is pure
 * friction. It stays available when editing the goal later.
 */

const CUSTOM_ID = 'custom';

export interface FirstGoalScreenProps {
  onCreated: () => void;
  onSkip: () => void;
}

export function FirstGoalScreen({ onCreated, onSkip }: FirstGoalScreenProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { actions: goalActions } = useGoals();
  const templates = useGoalTemplates();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [category, setCategory] = useState<GoalCategory>(GoalCategory.PERSONAL);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = [
    { value: GoalCategory.PERSONAL, label: t('goals.categories.personal') },
    { value: GoalCategory.HEALTH, label: t('goals.categories.health') },
    { value: GoalCategory.LEARNING, label: t('goals.categories.learning') },
    { value: GoalCategory.CAREER, label: t('goals.categories.career') },
    { value: GoalCategory.FINANCIAL, label: t('goals.categories.financial') },
    { value: GoalCategory.OTHER, label: t('goals.categories.other') },
  ];

  const tiles: OnbTileGridItem[] = [
    ...templates.map(template => ({
      id: template.id,
      label: template.title,
      icon: template.icon,
      accentColor: template.color,
      detail: `${template.suggestedTargetValue} ${template.unit}`,
    })),
    {
      id: CUSTOM_ID,
      label: t('onboarding.goal.customTile'),
      icon: 'create-outline',
      accentColor: colors.textSecondary,
    },
  ];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const template = templates.find(tpl => tpl.id === id);
    if (template) {
      // One tap fills title, unit, number and category together.
      const input = templateToGoalInput(template);
      setTitle(input.title);
      setUnit(input.unit);
      setTargetValue(String(input.targetValue));
      setCategory(input.category);
    } else {
      setTitle('');
      setUnit('');
      setTargetValue('');
      setCategory(GoalCategory.PERSONAL);
    }
  };

  const parsedTarget = parseGoalTarget(targetValue);
  const canSubmit = isGoalDraftComplete({ title, unit, targetValue }) && !submitting;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Same arm-create-wait order as the habit screen — the helper exists so
      // this screen cannot rediscover the bugs that one already paid for (K4).
      await createWithTrophyGate({
        arm: () => armTutorialAchievementGate('first-goal'),
        create: () =>
          goalActions.createGoal({
            title: title.trim(),
            unit: unit.trim(),
            targetValue: parsedTarget!,
            category,
          }),
      });
      onCreated();
    } catch (error) {
      console.warn('[ONBOARDING] Failed to create first goal:', error);
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    section: {
      marginTop: Layout.spacing.lg,
    },
    label: {
      fontSize: scaleFont(Fonts.sizes.sm),
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: Layout.spacing.sm,
    },
    input: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      paddingHorizontal: Layout.spacing.md,
      minHeight: 48,
      fontSize: scaleFont(Fonts.sizes.md),
      color: colors.textPrimary,
    },
    // Number and unit belong together — "12 books" reads as one answer.
    inlineRow: {
      flexDirection: 'row',
      gap: Layout.spacing.sm,
    },
    inlineTarget: {
      flex: 1,
    },
    inlineUnit: {
      flex: 2,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Layout.spacing.sm,
    },
    chip: {
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      minHeight: 44,
      justifyContent: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      borderColor: colors.border,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: scaleFont(Fonts.sizes.sm),
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.white,
      fontWeight: '600',
    },
  });

  return (
    <OnbScreenContainer
      screen={2}
      title={t('onboarding.goal.title')}
      subtitle={t('onboarding.goal.subtitle')}
      ctaLabel={t('onboarding.goal.cta')}
      {...(canSubmit ? { onPressCta: handleCreate } : {})}
      onSkip={onSkip}
    >
      <OnbTileGrid items={tiles} selectedId={selectedId} onSelect={handleSelect} />

      {selectedId !== null && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>{t('onboarding.goal.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('onboarding.goal.namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('onboarding.goal.nameLabel')}
              autoFocus={selectedId === CUSTOM_ID}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.inlineRow}>
              <View style={styles.inlineTarget}>
                <Text style={styles.label}>{t('onboarding.goal.targetLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel={t('onboarding.goal.targetLabel')}
                  maxLength={12}
                />
              </View>
              <View style={styles.inlineUnit}>
                <Text style={styles.label}>{t('onboarding.goal.unitLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder={t('goals.form.unitPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel={t('onboarding.goal.unitLabel')}
                  maxLength={20}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('goals.form.category')}</Text>
            <View style={styles.chips}>
              {categoryOptions.map(option => {
                const active = category === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(option.value)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}
    </OnbScreenContainer>
  );
}
