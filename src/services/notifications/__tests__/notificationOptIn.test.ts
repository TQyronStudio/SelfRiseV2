// First-launch notification opt-in — Regression Suite
//
// WHY THIS EXISTS (July 2026): testers never noticed the app had reminders at all, so
// the onboarding gate now ends with a pre-permission ("priming") screen. Tapping "Yes,
// remind me" must do the whole job in one go — ask the OS AND switch BOTH daily
// reminders on AND schedule them — because the whole point is that the user never has
// to hunt for the toggles in Settings.
//
// These tests pin that contract, plus the fail-safe behaviour: a declined permission
// must leave everything off, and nothing here may throw (a failed opt-in must never
// block onboarding / the tutorial from starting).

const mockRequestPermissions = jest.fn();
const mockUpdateSettings = jest.fn();
const mockRescheduleAll = jest.fn();
const mockAnalyzeDailyProgress = jest.fn();

jest.mock('../notificationService', () => ({
  notificationService: { requestPermissions: () => mockRequestPermissions() },
}));
jest.mock('../notificationScheduler', () => ({
  notificationScheduler: {
    updateSettings: (u: unknown) => mockUpdateSettings(u),
    rescheduleAll: (p: unknown) => mockRescheduleAll(p),
  },
}));
jest.mock('../progressAnalyzer', () => ({
  progressAnalyzer: { analyzeDailyProgress: () => mockAnalyzeDailyProgress() },
}));

import { enableAllRemindersAfterOptIn } from '../notificationOptIn';

const PROGRESS = { journalEntriesCount: 0 };

describe('enableAllRemindersAfterOptIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateSettings.mockResolvedValue({});
    mockRescheduleAll.mockResolvedValue(undefined);
    mockAnalyzeDailyProgress.mockResolvedValue(PROGRESS);
  });

  it('permission granted → turns on BOTH reminders and schedules them', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true, canAskAgain: false });

    await expect(enableAllRemindersAfterOptIn()).resolves.toBe(true);

    // The user asked for reminders once — they must not have to flip two toggles.
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      afternoonReminderEnabled: true,
      eveningReminderEnabled: true,
    });
    // Scheduled immediately, with today's progress (the evening reminder is progress-aware).
    expect(mockRescheduleAll).toHaveBeenCalledWith(PROGRESS);
  });

  it('permission denied → changes nothing, schedules nothing', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(enableAllRemindersAfterOptIn()).resolves.toBe(false);

    expect(mockUpdateSettings).not.toHaveBeenCalled();
    expect(mockRescheduleAll).not.toHaveBeenCalled();
  });

  it('already granted (e.g. Android < 13, no runtime prompt) → still enables both', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true, canAskAgain: true });

    await expect(enableAllRemindersAfterOptIn()).resolves.toBe(true);
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      afternoonReminderEnabled: true,
      eveningReminderEnabled: true,
    });
  });

  it('never throws when the permission request blows up (onboarding must continue)', async () => {
    mockRequestPermissions.mockRejectedValue(new Error('native module missing'));

    await expect(enableAllRemindersAfterOptIn()).resolves.toBe(false);
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it('never throws when scheduling fails after permission was granted', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true, canAskAgain: false });
    mockRescheduleAll.mockRejectedValue(new Error('scheduling failed'));

    // Settings were still flipped on; the lifecycle hook reschedules on next app open.
    await expect(enableAllRemindersAfterOptIn()).resolves.toBe(false);
    expect(mockUpdateSettings).toHaveBeenCalled();
  });

  it('asks the OS before writing any settings (permission gates everything)', async () => {
    const order: string[] = [];
    mockRequestPermissions.mockImplementation(async () => {
      order.push('permission');
      return { granted: true, canAskAgain: false };
    });
    mockUpdateSettings.mockImplementation(async () => {
      order.push('settings');
      return {};
    });

    await enableAllRemindersAfterOptIn();

    expect(order).toEqual(['permission', 'settings']);
  });
});
