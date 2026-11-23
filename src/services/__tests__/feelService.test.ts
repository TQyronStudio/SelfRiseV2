/**
 * feelService: the switches decide what plays, one player per sound, and a
 * failing sound never breaks the moment (migration E2, R-35).
 */
const mockSelection = jest.fn();
const mockImpact = jest.fn();
const mockNotification = jest.fn();
let mockHapticsOn = true;

jest.mock('../hapticsService', () => ({
  selection: () => mockSelection(),
  impact: (style: string) => mockImpact(style),
  notification: (type: string) => mockNotification(type),
  isHapticsEnabled: () => mockHapticsOn,
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

const mockPlay = jest.fn();
const mockCreatePlayer = jest.fn(() => ({
  volume: 1,
  play: mockPlay,
  seekTo: () => Promise.resolve(),
}));
jest.mock(
  'expo-audio',
  () => ({
    createAudioPlayer: mockCreatePlayer,
    setAudioModeAsync: () => Promise.resolve(),
  }),
  { virtual: true }
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  feel,
  initSounds,
  isSoundsEnabled,
  setSoundsEnabled,
} from '../feelService';

const flush = () => new Promise(resolve => setImmediate(resolve));

beforeEach(async () => {
  jest.clearAllMocks();
  mockHapticsOn = true;
  await setSoundsEnabled(true);
});

describe('feel()', () => {
  it('plays the pattern: the first tap at once, the rest on time', () => {
    jest.useFakeTimers();
    try {
      feel('chapter'); // light, medium @110, heavy @220
      expect(mockImpact.mock.calls).toEqual([['light']]);
      jest.advanceTimersByTime(220);
      expect(mockImpact.mock.calls).toEqual([['light'], ['medium'], ['heavy']]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps an everyday moment silent', async () => {
    feel('saved');
    await flush();
    expect(mockNotification).toHaveBeenCalledWith('success');
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('plays the sound of a big moment with one player per sound', async () => {
    feel('trophyWindow');
    await flush();
    feel('trophyWindow');
    await flush();
    expect(mockCreatePlayer).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledTimes(2);
  });

  it('follows the switches', async () => {
    mockHapticsOn = false;
    await setSoundsEnabled(false);
    feel('multiplierOn');
    await flush();
    expect(mockImpact).not.toHaveBeenCalled();
    expect(mockNotification).not.toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('never lets a failing sound break the moment', async () => {
    mockCreatePlayer.mockImplementationOnce(() => {
      throw new Error('no audio session');
    });
    expect(() => feel('goalDone')).not.toThrow();
    await flush();
    expect(mockImpact).toHaveBeenCalledWith('medium');
  });
});

describe('the sounds switch', () => {
  it('is stored and loaded like the haptics switch', async () => {
    await setSoundsEnabled(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@sounds_enabled',
      'false'
    );
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');
    await setSoundsEnabled(true);
    await initSounds();
    expect(isSoundsEnabled()).toBe(false);
  });
});
