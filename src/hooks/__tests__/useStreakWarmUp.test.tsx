/**
 * The frozen-streak warm-up on the card (E11a moved it into this hook, E11c made
 * it the inline rescue): one ad pays one day, the shared streak refreshes after
 * every payment, no success windows, problems go to the calm note.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useStreakWarmUp } from '../useStreakWarmUp';

const mockState = { streakInfo: { isFrozen: true, frozenDays: 2 } };
const mockActions = {
  adsNeededToWarmUp: jest.fn(async () => 2),
  applySingleWarmUpPayment: jest.fn(async () => ({ remainingFrozenDays: 1, isFullyWarmed: false })),
  refreshStats: jest.fn(async () => null),
  calculateFrozenDays: jest.fn(async () => 0),
  resetStreak: jest.fn(async () => undefined),
  getWarmUpPaymentProgress: jest.fn(async () => ({
    totalMissedDays: 2,
    paidDays: 0,
    unpaidDays: 2,
    paidDates: [],
    unpaidDates: [],
  })),
};
jest.mock('../../contexts/GratitudeContext', () => ({
  useGratitude: () => ({ state: mockState, actions: mockActions }),
}));
jest.mock('../useI18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
const mockShowProblem = jest.fn();
jest.mock('../../components/ui/ProblemNote', () => ({
  useProblemNote: () => ({ showProblem: mockShowProblem }),
}));
const mockShowAd = jest.fn();
jest.mock('../../services/adService', () => ({ adService: { showRewardedAd: () => mockShowAd() } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockShowAd.mockResolvedValue({ rewarded: true });
});

it('reads the missed days and the paid ones while frozen', async () => {
  const { result } = renderHook(() => useStreakWarmUp());
  await waitFor(() => expect(result.current.progress).toEqual({ total: 2, paid: 0 }));
});

it('a full ad pays one day and refreshes the shared streak at once', async () => {
  const { result } = renderHook(() => useStreakWarmUp());
  mockActions.getWarmUpPaymentProgress.mockResolvedValue({
    totalMissedDays: 2,
    paidDays: 1,
    unpaidDays: 1,
    paidDates: [],
    unpaidDates: [],
  });
  let paid = false;
  await act(async () => {
    paid = await result.current.watchAd();
  });
  expect(paid).toBe(true);
  expect(mockActions.applySingleWarmUpPayment).toHaveBeenCalledTimes(1);
  expect(mockActions.refreshStats).toHaveBeenCalled();
  expect(result.current.progress).toEqual({ total: 2, paid: 1 });
  expect(mockShowProblem).not.toHaveBeenCalled();
});

it('a second tap while the ad plays does nothing', async () => {
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
});

it('an ad closed early pays nothing and says why, with Try again', async () => {
  mockShowAd.mockResolvedValueOnce({ rewarded: false, error: 'AD_DISMISSED_EARLY' });
  const { result } = renderHook(() => useStreakWarmUp());
  let paid = true;
  await act(async () => {
    paid = await result.current.watchAd();
  });
  expect(paid).toBe(false);
  expect(mockActions.applySingleWarmUpPayment).not.toHaveBeenCalled();
  expect(mockShowProblem).toHaveBeenCalledWith({
    message: 'journal.rescue.adDismissed.message',
    retry: expect.any(Function),
  });
});

it('the last day: no window; a day left frozen is fixed without ads, quietly', async () => {
  mockActions.applySingleWarmUpPayment
    .mockResolvedValueOnce({ remainingFrozenDays: 0, isFullyWarmed: true })
    .mockResolvedValueOnce({ remainingFrozenDays: 0, isFullyWarmed: true });
  mockActions.calculateFrozenDays.mockResolvedValueOnce(1);
  mockActions.adsNeededToWarmUp.mockResolvedValueOnce(1);
  const { result } = renderHook(() => useStreakWarmUp());
  await act(async () => {
    await result.current.watchAd();
  });
  // the ad's payment + the quiet fix's payment
  expect(mockActions.applySingleWarmUpPayment).toHaveBeenCalledTimes(2);
  expect(mockShowProblem).not.toHaveBeenCalled();
});

it('if warming truly fails, the note says the ad sentence', async () => {
  mockActions.applySingleWarmUpPayment.mockRejectedValueOnce(new Error('db'));
  const { result } = renderHook(() => useStreakWarmUp());
  await act(async () => {
    await result.current.watchAd();
  });
  expect(mockShowProblem).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'journal.rescue.adError.message' })
  );
});

it('start fresh resets the streak; a failure is a note', async () => {
  const { result } = renderHook(() => useStreakWarmUp());
  await act(() => result.current.startFresh());
  expect(mockActions.resetStreak).toHaveBeenCalledTimes(1);

  mockActions.resetStreak.mockRejectedValueOnce(new Error('db'));
  await act(() => result.current.startFresh());
  expect(mockShowProblem).toHaveBeenCalledWith({ message: 'journal.rescue.resetFailed.message' });
});
