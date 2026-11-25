/**
 * Journal statistics follow the journal (live bug, 2026-11-24): the old screen
 * kept a local copy of the numbers taken while loading — from before the
 * refresh — and never updated it. Since E13 the page is JournalStatsPage; it
 * must still read GratitudeContext's stats on every render.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { JournalStatsPage } from '../../src/components/journal/JournalStatsPage';

// The global setup replaces react-native with a few stubs; this test renders.
jest.unmock('react-native');

let mockState: any;
jest.mock('@/src/contexts/GratitudeContext', () => ({
  useGratitude: () => ({ state: mockState, actions: {} }),
}));
jest.mock('@/src/hooks/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => (key === 'common.locale' ? 'en-US' : key) }),
}));
jest.mock('@/src/contexts/ThemeContext', () => ({
  useDesign: () => ({ c: new Proxy({}, { get: () => '#000000' }), mode: 'light' }),
}));
jest.mock('@/src/hooks/useJournalFlame', () => ({
  useJournalFlame: () => ({ state: 'fire', onWarmed: () => undefined }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/src/services/feelService', () => ({ feel: () => undefined }));
// Animation is not what this test checks: a plain stand-in (no native worklets).
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const chain = { duration: () => chain };
  return {
    __esModule: true,
    default: { View },
    FadeIn: chain,
    Easing: { out: () => () => 0, cubic: () => 0 },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withDelay: (_d: number, v: unknown) => v,
    withTiming: (v: unknown) => v,
  };
});
// The new look's pieces as plain views and texts: the test is about the numbers.
jest.mock('@/src/components/ui', () => {
  const { Text, View } = require('react-native');
  const Box = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  return {
    AppText: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
    RollingNumber: ({ text }: { text: string }) => <Text>{`number:${text}`}</Text>,
    Surface: Box,
    IconBadge: () => null,
    InlineIcon: () => null,
    PageTopBar: () => null,
    SignatureIcon: () => null,
    StreakFlame: () => null,
  };
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
    streakInfo: { currentStreak: 1, longestStreak: 1, starCount: 0, flameCount: 0, crownCount: 0 },
  };
});

const page = () => <JournalStatsPage bottomInset={0} topInset={0} onClose={() => undefined} />;

it('shows the numbers the journal has now, and follows them', async () => {
  const screen = render(page());
  await waitFor(() => screen.getByText('number:4'));

  // A refresh lands new numbers in the context.
  mockState = { ...mockState, stats: stats(7) };
  screen.rerender(page());
  await waitFor(() => screen.getByText('number:7'));
});
