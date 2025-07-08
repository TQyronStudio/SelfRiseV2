import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DayOfWeek } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface DayPickerProps {
  selectedDays: DayOfWeek[];
  onDayToggle: (day: DayOfWeek) => void;
}

const DAYS = [
  { key: DayOfWeek.MONDAY, label: 'M' },
  { key: DayOfWeek.TUESDAY, label: 'T' },
  { key: DayOfWeek.WEDNESDAY, label: 'W' },
  { key: DayOfWeek.THURSDAY, label: 'T' },
  { key: DayOfWeek.FRIDAY, label: 'F' },
  { key: DayOfWeek.SATURDAY, label: 'S' },
  { key: DayOfWeek.SUNDAY, label: 'S' },
];

export function DayPicker({ selectedDays, onDayToggle }: DayPickerProps) {
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
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  selectedDay: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  dayLabel: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.GRAY_600,
  },
  selectedDayLabel: {
    color: COLORS.WHITE,
  },
});