import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DayOfWeek } from '../../types/common';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';

interface DayPickerProps {
  selectedDays: DayOfWeek[];
  onDayToggle: (day: DayOfWeek) => void;
}

const DAYS = [
  { key: DayOfWeek.MONDAY, label: 'Mo' },
  { key: DayOfWeek.TUESDAY, label: 'Tu' },
  { key: DayOfWeek.WEDNESDAY, label: 'We' },
  { key: DayOfWeek.THURSDAY, label: 'Th' },
  { key: DayOfWeek.FRIDAY, label: 'Fr' },
  { key: DayOfWeek.SATURDAY, label: 'Sa' },
  { key: DayOfWeek.SUNDAY, label: 'Su' },
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
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  selectedDayLabel: {
    color: Colors.textInverse,
  },
});