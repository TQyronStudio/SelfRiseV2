/**
 * Journal statistics follow the journal (live bug, 2026-11-24): the screen kept
 * a local copy of the numbers taken while loading — from before the refresh —
 * and never updated it.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import JournalStatsScreen from '../../app/journal-stats';

// The global setup replaces react-native with a few stubs; this test renders.
jest.unmock('react-native');

let mockState: any;
const mockActions = {
  refreshStats: jest.fn(async () => null),
  loadGratitudes: jest.fn(async () => undefined),
};

jest.mock('@/src/contexts/GratitudeContext', () => ({
  useGratitude: () => ({ state: mockState, actions: mockActions }),
}));
jest.mock('@/src/hooks/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
jest.mock('@/src/contexts/ThemeContext', () => ({
  useTheme: () => ({ colors: new Proxy({}, { get: () => '#000000' }) }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  Stack: { Screen: () => null },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@/src/components/ads/AdBanner', () => ({ AdBanner: () => null }));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('@/src/components/gratitude/StatisticsCard', () => {
  const { Text: T } = require('react-native');
  return ({ title, value }: { title: string; value: number | string }) => (
    <T>{`${title}=${value}`}</T>
  );
});

const stats = (totalGratitudes: number) => ({
  totalGratitudes,
  totalDays: 2,
  averagePerDay: 1,
});

beforeEach(() => {
  mockState = {
    gratitudes: [],
    stats: stats(4),
    streakInfo: { currentStreak: 1, longestStreak: 1 },
  };
});

it('shows the numbers the journal has now, and follows them', async () => {
  const screen = render(<JournalStatsScreen />);
  await waitFor(() => screen.getByText('journal.stats.totalEntries=4'));

  // A refresh lands new numbers in the context.
  mockState = { ...mockState, stats: stats(7) };
  screen.rerender(<JournalStatsScreen />);
  await waitFor(() => screen.getByText('journal.stats.totalEntries=7'));
});
