import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DayOfWeek } from '../../types/common';
import { Fonts } from '../../constants/fonts';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

interface DayPickerProps {
  selectedDays: DayOfWeek[];
  onDayToggle: (day: DayOfWeek) => void;
}

export function DayPicker({ selectedDays, onDayToggle }: DayPickerProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const DAYS = [
    { key: DayOfWeek.MONDAY, label: t('social.days.monday') },
    { key: DayOfWeek.TUESDAY, label: t('social.days.tuesday') },
    { key: DayOfWeek.WEDNESDAY, label: t('social.days.wednesday') },
    { key: DayOfWeek.THURSDAY, label: t('social.days.thursday') },
    { key: DayOfWeek.FRIDAY, label: t('social.days.friday') },
    { key: DayOfWeek.SATURDAY, label: t('social.days.saturday') },
    { key: DayOfWeek.SUNDAY, label: t('social.days.sunday') },
  ];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 16,
    },
    dayOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedDay: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayLabel: {
      fontSize: 16,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    selectedDayLabel: {
      color: colors.textInverse,
    },
  });

  return (
    <View style={styles.container}>
      {DAYS.map(({ key, label }) => {
        const isSelected = selectedDays.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.dayOption,
              isSelected && styles.selectedDay,
            ]}
            onPress={() => onDayToggle(key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.dayLabel,
                isSelected && styles.selectedDayLabel,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}