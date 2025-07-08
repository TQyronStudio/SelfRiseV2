import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { HabitColor } from '../../types/common';
import { COLORS } from '../../constants/colors';

interface ColorPickerProps {
  selectedColor: HabitColor;
  onColorSelect: (color: HabitColor) => void;
}

const COLOR_MAP = {
  [HabitColor.RED]: '#FF6B6B',
  [HabitColor.BLUE]: '#4ECDC4',
  [HabitColor.GREEN]: '#45B7D1',
  [HabitColor.YELLOW]: '#FFA07A',
  [HabitColor.PURPLE]: '#98D8C8',
  [HabitColor.ORANGE]: '#F7DC6F',
  [HabitColor.PINK]: '#BB8FCE',
  [HabitColor.TEAL]: '#85C1E9',
};

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      {Object.entries(COLOR_MAP).map(([color, colorValue]) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: colorValue },
            selectedColor === color && styles.selectedColor,
          ]}
          onPress={() => onColorSelect(color as HabitColor)}
          activeOpacity={0.8}
        />
      ))}
    </View>
  );
}

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
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
});