import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DailyHabitTracker } from '../../components/habits';
import { useTheme } from '../../contexts/ThemeContext';

export function DailyHabitTrackingScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <DailyHabitTracker />
    </View>
  );
}