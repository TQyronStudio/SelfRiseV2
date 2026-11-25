/**
 * The frozen-streak warm-up, moved out of Home's card into one hook (E11a):
 * the behaviour of the card, now testable — and shared with the Journal (E12).
 */
import { act, renderHook } from '@testing-library/react-native';
import { useStreakWarmUp } from '../useStreakWarmUp';

const mockActions = {
  adsNeededToWarmUp: jest.fn(async () => 2),
  applySingleWarmUpPayment: jest.fn(async () => ({ remainingFrozenDays: 1, isFullyWarmed: false })),
  refreshStats: jest.fn(async () => null),
  calculateFrozenDays: jest.fn(async () => 0),
  resetStreak: jest.fn(async () => undefined),
};
jest.mock('../../contexts/GratitudeContext', () => ({ useGratitude: () => ({ actions: mockActions }) }));
jest.mock('../useI18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
const mockShowAd = jest.fn();
jest.mock('../../services/adService', () => ({ adService: { showRewardedAd: () => mockShowAd() } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockShowAd.mockResolvedValue({ rewarded: true });
});

it('opens the sheet with the ads needed; nothing to pay is a success note', async () => {
  const { result } = renderHook(() => useStreakWarmUp());
  await act(() => result.current.openWarmUp());
  expect(result.current.sheetOpen).toBe(true);
  expect(result.current.totalAdsNeeded).toBe(2);

  mockActions.adsNeededToWarmUp.mockResolvedValueOnce(0);
  await act(() => result.current.openWarmUp());
  expect(result.current.notice?.title).toBe('journal.rescue.noDebt.title');
});

it('a full ad pays one day; a second tap while it plays does nothing', async () => {
  let finish: (v: unknown) => void = () => undefined;
  mockShowAd.mockReturnValueOnce(new Promise(r => (finish = r)));
  const { result } = renderHook(() => useStreakWarmUp());
  let first: Promise<boolean> = Promise.resolve(false);
  let second = true;
  await act(async () => {
    first = result.current.watchAd();
    second = await result.current.watchAd();
  });
  expect(second).toBe(false);
  await act(async () => {
    finish({ rewarded: true });
    await first;
  });
  expect(mockActions.applySingleWarmUpPayment).toHaveBeenCalledTimes(1);
  expect(result.current.adsWatched).toBe(1);
});

it('an ad closed early pays nothing and says why', async () => {
  mockShowAd.mockResolvedValueOnce({ rewarded: false, error: 'AD_DISMISSED_EARLY' });
  const { result } = renderHook(() => useStreakWarmUp());
  let paid = true;
  await act(async () => {
    paid = await result.current.watchAd();
  });
  expect(paid).toBe(false);
  expect(mockActions.applySingleWarmUpPayment).not.toHaveBeenCalled();
  expect(result.current.notice).toEqual({
    kind: 'error',
    title: 'journal.rescue.adDismissed.title',
    message: 'journal.rescue.adDismissed.message',
  });
});

it('completing with no debt left congratulates; a leftover day is fixed without ads', async () => {
  const { result } = renderHook(() => useStreakWarmUp());
  await act(() => result.current.completeWarmUp());
  expect(result.current.notice?.kind).toBe('congratulations');

  mockActions.calculateFrozenDays.mockResolvedValueOnce(1);
  mockActions.adsNeededToWarmUp.mockResolvedValueOnce(1);
  mockActions.applySingleWarmUpPayment.mockResolvedValueOnce({ remainingFrozenDays: 0, isFullyWarmed: true });
  await act(() => result.current.completeWarmUp());
  expect(result.current.notice?.title).toBe('journal.rescue.autoFixed.title');
});
