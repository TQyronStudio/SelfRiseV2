import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitIcon } from '../../types/common';
import { COLORS } from '../../constants/colors';

interface IconPickerProps {
  selectedIcon: HabitIcon;
  onIconSelect: (icon: HabitIcon) => void;
}

const ICON_MAP = {
  [HabitIcon.FITNESS]: 'fitness-outline',
  [HabitIcon.BOOK]: 'book-outline',
  [HabitIcon.WATER]: 'water-outline',
  [HabitIcon.MEDITATION]: 'leaf-outline',
  [HabitIcon.MUSIC]: 'musical-notes-outline',
  [HabitIcon.FOOD]: 'restaurant-outline',
  [HabitIcon.SLEEP]: 'moon-outline',
  [HabitIcon.WORK]: 'briefcase-outline',
};

export function IconPicker({ selectedIcon, onIconSelect }: IconPickerProps) {
  return (
    <View style={styles.container}>
      {Object.entries(ICON_MAP).map(([icon, iconName]) => (
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
            name={iconName as any}
            size={24}
            color={selectedIcon === icon ? COLORS.WHITE : COLORS.GRAY_600}
          />
        </TouchableOpacity>
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
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  selectedIcon: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
});