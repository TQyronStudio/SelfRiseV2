import React from 'react';
import { LevelsJourneyScreen } from '@/src/screens/levels/LevelsJourneyScreen';

/**
 * All levels (E9): the journey in the new look. The root status bar follows the
 * mode; the old table (LevelsOverviewScreen) goes in E26.
 */
export default function LevelsOverviewRoute() {
  return <LevelsJourneyScreen />;
}
