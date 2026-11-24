/**
 * refreshStats() hands back the streak it just calculated (live bug,
 * 2026-11-24): the journal screen read state.streakInfo right after refreshing
 * — the value its callback captured BEFORE today's entry — so the streak window
 * came a day late. The screen now uses this return value.
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { GratitudeProvider, useGratitude } from '../GratitudeContext';

const streak = (currentStreak: number) => ({
  currentStreak,
  longestStreak: currentStreak,
  lastEntryDate: null,
  streakStartDate: null,
});

const mockCalculate = jest.fn();

jest.mock('../../config/featureFlags', () => ({
  getGratitudeStorageImpl: () => ({
    migrateGratitudeNumbering: jest.fn(async () => undefined),
    getAll: jest.fn(async () => []),
    calculateAndUpdateStreak: (...a: unknown[]) => mockCalculate(...a),
    getStats: jest.fn(async () => ({})),
  }),
}));
jest.mock('../../services/analytics', () => ({ FirstDayAnalytics: {} }));

it('returns the fresh streak, not the one from before', async () => {
  mockCalculate.mockResolvedValueOnce(streak(6)); // the load
  const { result } = renderHook(() => useGratitude(), {
    wrapper: ({ children }) => <GratitudeProvider>{children}</GratitudeProvider>,
  });
  await waitFor(() => expect(result.current.state.streakInfo?.currentStreak).toBe(6));

  // Today's third entry made it 7. A callback from the earlier render still
  // sees 6 in its state — the returned value is the truth.
  const staleState = result.current.state;
  mockCalculate.mockResolvedValueOnce(streak(7));
  let fresh: Awaited<ReturnType<typeof result.current.actions.refreshStats>> = null;
  await act(async () => {
    fresh = await result.current.actions.refreshStats();
  });
  expect(staleState.streakInfo?.currentStreak).toBe(6);
  expect(fresh).toEqual(streak(7));
  expect(result.current.state.streakInfo?.currentStreak).toBe(7);
});
