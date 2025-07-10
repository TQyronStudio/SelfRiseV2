import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DailyHabitTracker } from '../../components/habits';
import { Colors } from '../../constants/colors';

export function DailyHabitTrackingScreen() {
  return (
    <View style={styles.container}>
      <DailyHabitTracker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});