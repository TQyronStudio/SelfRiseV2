import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitIcon } from '../../types/common';
import { useTheme } from '../../contexts/ThemeContext';
// Single source of truth — the picker renders straight from it, so adding an icon
// there is all it takes to offer it here. See constants/habitIcons.ts.
import { HABIT_ICON_MAP } from '../../constants/habitIcons';

interface IconPickerProps {
  selectedIcon: HabitIcon;
  onIconSelect: (icon: HabitIcon) => void;
}

export function IconPicker({ selectedIcon, onIconSelect }: IconPickerProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginVertical: 16,
    },
    iconOption: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedIcon: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      {Object.entries(HABIT_ICON_MAP).map(([icon, iconName]) => (
        <TouchableOpacity
          key={icon}
          style={[
            styles.iconOption,
            selectedIcon === icon && styles.selectedIcon,
          ]}
          onPress={() => onIconSelect(icon as HabitIcon)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={iconName}
            size={24}
            color={selectedIcon === icon ? colors.textInverse : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}