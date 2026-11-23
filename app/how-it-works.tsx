import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { HowItWorksScreen } from '@/src/screens/help/HowItWorksScreen';

export default function HowItWorksRoute() {
  // Still the blue header until this screen's migration stage: light icons
  // (the root status bar follows the mode since E3).
  return (
    <>
      <StatusBar style="light" />
      <HowItWorksScreen />
    </>
  );
}
