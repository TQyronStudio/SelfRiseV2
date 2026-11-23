import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { LevelsOverviewScreen } from '@/src/screens/levels/LevelsOverviewScreen';

export default function LevelsOverviewTab() {
  // Still the blue header until this screen's migration stage: light icons
  // (the root status bar follows the mode since E3).
  return (
    <>
      <StatusBar style="light" />
      <LevelsOverviewScreen />
    </>
  );
}
