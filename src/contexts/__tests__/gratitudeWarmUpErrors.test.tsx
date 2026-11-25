/**
 * The rescue actions report a failure (review of E11c, 2026-11-25): the context
 * used to swallow it — a watched ad whose payment failed returned
 * "0 left, not warmed", "Start fresh" looked done, and a failed progress read
 * showed "0 of 1". useStreakWarmUp shows its error note only when they throw.
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { GratitudeProvider, useGratitude } from '../GratitudeContext';

const mockPayment = jest.fn();
const mockReset = jest.fn();
const mockProgress = jest.fn();

jest.mock('../../config/featureFlags', () => ({
  getGratitudeStorageImpl: () => ({
    migrateGratitudeNumbering: jest.fn(async () => undefined),
    getAll: jest.fn(async () => []),
    calculateAndUpdateStreak: jest.fn(async () => null),
    getStats: jest.fn(async () => ({})),
    applySingleWarmUpPayment: (...a: unknown[]) => mockPayment(...a),
    resetStreak: (...a: unknown[]) => mockReset(...a),
    getWarmUpPaymentProgress: (...a: unknown[]) => mockProgress(...a),
  }),
}));
jest.mock('../../services/analytics', () => ({ FirstDayAnalytics: {} }));

async function context() {
  const hook = renderHook(() => useGratitude(), {
    wrapper: ({ children }) => <GratitudeProvider>{children}</GratitudeProvider>,
  });
  await waitFor(() => expect(hook.result.current.state.isLoading).toBe(false));
  return hook.result;
}

it('a failed warm-up payment throws instead of looking paid', async () => {
  const result = await context();
  mockPayment.mockRejectedValueOnce(new Error('db'));
  await act(async () => {
    await expect(result.current.actions.applySingleWarmUpPayment()).rejects.toThrow('db');
  });
});

it('a failed reset throws', async () => {
  const result = await context();
  mockReset.mockRejectedValueOnce(new Error('db'));
  await act(async () => {
    await expect(result.current.actions.resetStreak()).rejects.toThrow('db');
  });
});

it('a failed progress read throws instead of all zeros', async () => {
  const result = await context();
  mockProgress.mockRejectedValueOnce(new Error('db'));
  await act(async () => {
    await expect(result.current.actions.getWarmUpPaymentProgress()).rejects.toThrow('db');
  });
});
