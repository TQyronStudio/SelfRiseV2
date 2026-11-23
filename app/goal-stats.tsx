import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GoalStatsScreen } from '@/src/screens/goals/GoalStatsScreen';

export default function GoalStatsPage() {
  // Still the blue header until this screen's migration stage: light icons
  // (the root status bar follows the mode since E3).
  return (
    <>
      <StatusBar style="light" />
      <GoalStatsScreen />
    </>
  );
}
