import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useHabits } from '@/src/contexts/HabitsContext';
import { armTutorialAchievementGate } from '@/src/utils/tutorialAchievementGate';
import { HABIT_PRESETS, CUSTOM_HABIT_DEFAULTS, ALL_DAYS } from '@/src/constants/habitPresets';
import { DayOfWeek, HabitColor, HabitIcon } from '@/src/types/common';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { scaleFont } from '@/src/utils/responsive';
import { ColorPicker } from '@/src/components/habits/ColorPicker';
import { IconPicker } from '@/src/components/habits/IconPicker';
import { DayPicker } from '@/src/components/habits/DayPicker';
import { OnbScreenContainer } from './OnbScreenContainer';
import { OnbTileGrid, OnbTileGridItem } from './OnbTileGrid';
import { createWithTrophyGate } from './createWithTrophyGate';

/**
 * Onboarding screen 1 — the user leaves with a habit of their own.
 *
 * The old tutorial spent six coach-marked steps walking through the habit form
 * field by field, four of which only explained fields that already had working
 * defaults. Here one tap on a preset fills name, icon and colour at once.
 *
 * A preset is a starting point, not a lock: the real pickers sit underneath and
 * every value stays editable, which is the rule the whole rework is built on.
 */

/** Maps a habit icon onto the Ionicons name the tiles and pickers draw. */
const PRESET_TILE_ICON: Record<string, string> = {
  water: 'water',
  exercise: 'fitness',
  read: 'book',
  meditate: 'leaf',
  sleep: 'moon',
  eatHealthy: 'restaurant',
};

const CUSTOM_ID = 'custom';

export interface FirstHabitScreenProps {
  onCreated: () => void;
  onSkip: () => void;
}

export function FirstHabitScreen({ onCreated, onSkip }: FirstHabitScreenProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { actions: habitActions } = useHabits();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<HabitColor>(CUSTOM_HABIT_DEFAULTS.color);
  const [icon, setIcon] = useState<HabitIcon>(CUSTOM_HABIT_DEFAULTS.icon);
  const [days, setDays] = useState<DayOfWeek[]>([...ALL_DAYS]);
  const [submitting, setSubmitting] = useState(false);

  const tiles: OnbTileGridItem[] = [
    ...HABIT_PRESETS.map(preset => ({
      id: preset.id,
      label: t(preset.nameKey),
      icon: PRESET_TILE_ICON[preset.id] ?? 'ellipse',
      accentColor: colors.primary,
    })),
    {
      id: CUSTOM_ID,
      label: t('onboarding.habit.customTile'),
      icon: 'create-outline',
      accentColor: colors.textSecondary,
    },
  ];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const preset = HABIT_PRESETS.find(p => p.id === id);
    if (preset) {
      // One tap fills all three — the four form steps the old tutorial spent
      // on colour and icon are exactly what this replaces.
      setName(t(preset.nameKey));
      setColor(preset.color);
      setIcon(preset.icon);
    } else {
      setName('');
      setColor(CUSTOM_HABIT_DEFAULTS.color);
      setIcon(CUSTOM_HABIT_DEFAULTS.icon);
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    setDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  // Every required field must hold before the CTA lights up — an onboarding
  // screen has no room for a validation error the user has to decode.
  const canSubmit = name.trim().length > 0 && days.length > 0 && !submitting;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Arm-create-wait, in that order — see createWithTrophyGate for why it
      // matters and how it has gone wrong before (K4).
      await createWithTrophyGate({
        arm: () => armTutorialAchievementGate('first-habit'),
        create: () =>
          habitActions.createHabit({
            name: name.trim(),
            color,
            icon,
            scheduledDays: days,
          }),
      });
      onCreated();
    } catch (error) {
      console.warn('[ONBOARDING] Failed to create first habit:', error);
      // Never strand the user on a dead screen — let them try again.
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
  });

  return (
    <OnbScreenContainer
      screen={1}
      title={t('onboarding.habit.title')}
      subtitle={t('onboarding.habit.subtitle')}
      ctaLabel={t('onboarding.habit.cta')}
      {...(canSubmit ? { onPressCta: handleCreate } : {})}
      onSkip={onSkip}
    >
      <OnbTileGrid items={tiles} selectedId={selectedId} onSelect={handleSelect} />

      {/* Shown once something is picked: an empty form above the tiles would
          make the screen look like work before the user has chosen anything. */}
      {selectedId !== null && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>{t('onboarding.habit.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('onboarding.habit.namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('onboarding.habit.nameLabel')}
              autoFocus={selectedId === CUSTOM_ID}
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('onboarding.habit.colorLabel')}</Text>
            <ColorPicker selectedColor={color} onColorSelect={setColor} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('onboarding.habit.iconLabel')}</Text>
            <IconPicker selectedIcon={icon} onIconSelect={setIcon} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('onboarding.habit.daysLabel')}</Text>
            <DayPicker selectedDays={days} onDayToggle={toggleDay} />
          </View>
        </>
      )}
    </OnbScreenContainer>
  );
}
