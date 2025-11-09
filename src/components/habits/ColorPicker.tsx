import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { HabitColor } from '../../types/common';
import { useTheme } from '../../contexts/ThemeContext';

interface ColorPickerProps {
  selectedColor: HabitColor;
  onColorSelect: (color: HabitColor) => void;
}

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  const { colors } = useTheme();

  const COLOR_MAP = {
    [HabitColor.RED]: colors.habitRed,
    [HabitColor.BLUE]: colors.habitBlue,
    [HabitColor.GREEN]: colors.habitGreen,
    [HabitColor.YELLOW]: colors.habitYellow,
    [HabitColor.PURPLE]: colors.habitPurple,
    [HabitColor.ORANGE]: colors.habitOrange,
    [HabitColor.PINK]: colors.habitPink,
    [HabitColor.TEAL]: colors.habitTeal,
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginVertical: 16,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginBottom: 12,
      // NO shadows in dark mode (AMOLED-friendly)
    },
    selectedColor: {
      borderWidth: 3,
      borderColor: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      {Object.entries(COLOR_MAP).map(([color, colorValue]) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: colorValue }, // Keep habit colors unchanged
            selectedColor === color && styles.selectedColor,
          ]}
          onPress={() => onColorSelect(color as HabitColor)}
          activeOpacity={0.8}
        />
      ))}
    </View>
  );
}