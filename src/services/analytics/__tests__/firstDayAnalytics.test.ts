/**
 * First-day funnel behaviour: who enters it, what is sent once, and that
 * nothing here can ever throw into the onboarding flow.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirstDayAnalytics, FIRST_DAY_STORAGE_KEYS } from '../firstDayAnalytics';
import { formatDateToString } from '../../../utils/date';
import { TUTORIAL_STORAGE_KEYS } from '../../../constants/tutorialStorageKeys';

jest.mock('../../../hooks/useFirebaseAnalytics', () => ({
  FirebaseAnalytics: {
    logEvent: jest.fn(() => Promise.resolve()),
    setUserProperty: jest.fn(() => Promise.resolve()),
  },
}));

// Jest runs with __DEV__ = true, which would make every call a no-op development
// session. The funnel is tested as in a store build; one test flips it on purpose.
jest.mock('../../../config/diagnosticsMode', () => ({
  isDevelopmentSession: jest.fn(() => false),
}));

const { isDevelopmentSession } = jest.requireMock('../../../config/diagnosticsMode') as {
  isDevelopmentSession: jest.Mock;
};

const { FirebaseAnalytics } = jest.requireMock('../../../hooks/useFirebaseAnalytics') as {
  FirebaseAnalytics: { logEvent: jest.Mock; setUserProperty: jest.Mock };
};

const sentEvents = () => FirebaseAnalytics.logEvent.mock.calls.map(call => call[0]);
const paramsOf = (name: string) =>
  FirebaseAnalytics.logEvent.mock.calls.find(call => call[0] === name)?.[1];
const userProperties = () =>
  FirebaseAnalytics.setUserProperty.mock.calls.map(call => `${call[0]}=${call[1]}`);

/** Enrols the install as if it had started onboarding `daysAgo` calendar days ago. */
async function enrolDaysAgo(daysAgo: number) {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  await AsyncStorage.setItem(
    FIRST_DAY_STORAGE_KEYS.STATE,
    JSON.stringify({ startedAt: start.getTime(), installDate: formatDateToString(start) })
  );
}

beforeEach(async () => {
  isDevelopmentSession.mockReturnValue(false);
  await AsyncStorage.clear();
  FirebaseAnalytics.logEvent.mockClear();
  FirebaseAnalytics.setUserProperty.mockClear();
});

describe('development sessions', () => {
  it('send nothing and write nothing — no funnel state, no used-up once-flags', async () => {
    isDevelopmentSession.mockReturnValue(true);

    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.welcomeDone();
    await FirstDayAnalytics.habitChecked();
    await FirstDayAnalytics.appActive();
    await FirstDayAnalytics.reminderOpened('evening_reminder', 'evening_reminder_day_1|9000');

    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
    expect(FirebaseAnalytics.setUserProperty).not.toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('leave the funnel untouched, so a deliberate test run afterwards still enrols', async () => {
    isDevelopmentSession.mockReturnValue(true);
    await FirstDayAnalytics.onboardingStarted();

    isDevelopmentSession.mockReturnValue(false); // EXPO_PUBLIC_ANALYTICS_IN_DEV=true
    await FirstDayAnalytics.onboardingStarted();

    expect(sentEvents()).toEqual(['onb_start']);
  });
});

describe('who enters the funnel', () => {
  it('sends nothing for an install that never opened the onboarding gate (updating users)', async () => {
    await FirstDayAnalytics.languageChosen('de');
    await FirstDayAnalytics.welcomeDone();
    await FirstDayAnalytics.habitCreated('water');
    await FirstDayAnalytics.onboardingCompleted('check');
    await FirstDayAnalytics.habitChecked();
    await FirstDayAnalytics.journalEntryCreated();
    await FirstDayAnalytics.appActive();

    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
    expect(FirebaseAnalytics.setUserProperty).not.toHaveBeenCalled();
  });

  it('never enrols an existing user whose Settings restart reopened the gate after a kill', async () => {
    // Installed before the gate existed (no PREFS_COMPLETED), restarted onboarding
    // from Settings, app killed on the welcome screen → next launch shows the gate.
    await AsyncStorage.setItem(TUTORIAL_STORAGE_KEYS.RESTARTED, 'true');

    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.welcomeDone();
    await FirstDayAnalytics.habitChecked();

    expect(await AsyncStorage.getItem(FIRST_DAY_STORAGE_KEYS.STATE)).toBeNull();
    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
    expect(FirebaseAnalytics.setUserProperty).not.toHaveBeenCalled();
  });

  it('enrols on the gate and keeps the first start time across a force-quit', async () => {
    await FirstDayAnalytics.onboardingStarted();
    const first = await AsyncStorage.getItem(FIRST_DAY_STORAGE_KEYS.STATE);

    await FirstDayAnalytics.onboardingStarted(); // gate shown again after a force-quit

    expect(await AsyncStorage.getItem(FIRST_DAY_STORAGE_KEYS.STATE)).toBe(first);
    expect(sentEvents()).toEqual(['onb_start']);
    expect(userProperties()).toEqual(['onb_result=in_progress']);
  });
});

describe('a complete first run', () => {
  it('sends every step once, in order, with only whitelisted values', async () => {
    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.languageChosen('de');
    await FirstDayAnalytics.themeChosen('dark');
    await FirstDayAnalytics.notificationsChosen(true, true);
    await FirstDayAnalytics.welcomeDone();
    await FirstDayAnalytics.habitCreated('water');
    await FirstDayAnalytics.goalCreated('read_books');
    await FirstDayAnalytics.habitChecked();
    await FirstDayAnalytics.onboardingCompleted('check');

    expect(sentEvents()).toEqual([
      'onb_start',
      'onb_language',
      'onb_theme',
      'onb_notifications',
      'onb_welcome_done',
      'onb_habit_created',
      'onb_goal_created',
      'first_habit_check',
      'onb_complete',
    ]);
    expect(paramsOf('onb_language')).toEqual({ language: 'de' });
    expect(paramsOf('onb_theme')).toEqual({ theme: 'dark' });
    expect(paramsOf('onb_notifications')).toEqual({ choice: 'yes', os: 'granted' });
    expect(paramsOf('onb_habit_created')).toEqual({ source: 'preset', preset: 'water' });
    expect(paramsOf('onb_goal_created')).toEqual({ source: 'template', template: 'read_books' });
    expect(paramsOf('first_habit_check')).toEqual({ in_onboarding: 1, min_since_start: 0 });
    expect(paramsOf('onb_complete')).toEqual({ method: 'check', duration_s: expect.any(Number) });
    expect(userProperties()).toEqual([
      'onb_result=in_progress',
      'notif_optin=granted',
      'onb_result=completed',
    ]);
  });

  it('measures the onboarding duration from the first gate', async () => {
    await enrolDaysAgo(0);
    const state = JSON.parse((await AsyncStorage.getItem(FIRST_DAY_STORAGE_KEYS.STATE))!);
    state.startedAt -= 95_000; // gate opened 95 s ago
    await AsyncStorage.setItem(FIRST_DAY_STORAGE_KEYS.STATE, JSON.stringify(state));

    await FirstDayAnalytics.onboardingCompleted('later');

    expect(paramsOf('onb_complete').duration_s).toBeGreaterThanOrEqual(95);
    expect(paramsOf('onb_complete').duration_s).toBeLessThan(100);
  });
});

describe('custom choices never reveal what the user typed', () => {
  it('a custom habit or goal is reported as "custom" / "none"', async () => {
    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.habitCreated('custom');
    await FirstDayAnalytics.goalCreated(null);

    expect(paramsOf('onb_habit_created')).toEqual({ source: 'custom', preset: 'none' });
    expect(paramsOf('onb_goal_created')).toEqual({ source: 'custom', template: 'none' });
  });
});

describe('notification choice', () => {
  it.each([
    [false, false, { choice: 'later', os: 'none' }, 'notif_optin=later'],
    [true, false, { choice: 'yes', os: 'denied' }, 'notif_optin=denied'],
    [true, true, { choice: 'yes', os: 'granted' }, 'notif_optin=granted'],
  ])('wants=%s granted=%s', async (wants, granted, params, property) => {
    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.notificationsChosen(wants, granted);

    expect(paramsOf('onb_notifications')).toEqual(params);
    expect(userProperties()).toContain(property);
  });
});

describe('the funnel ends once', () => {
  it('a skip ends it: later steps and a completion are not sent', async () => {
    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.welcomeDone();
    await FirstDayAnalytics.onboardingSkipped(2);
    await FirstDayAnalytics.habitCreated('read');
    await FirstDayAnalytics.onboardingCompleted('later');

    expect(sentEvents()).toEqual(['onb_start', 'onb_welcome_done', 'onb_skip']);
    expect(paramsOf('onb_skip')).toEqual({ screen: 2 });
    expect(userProperties()).toEqual(['onb_result=in_progress', 'onb_result=skipped']);
  });

  it('restarting onboarding from Settings after finishing sends nothing new', async () => {
    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.welcomeDone();
    await FirstDayAnalytics.habitCreated('water');
    await FirstDayAnalytics.onboardingCompleted('check');
    FirebaseAnalytics.logEvent.mockClear();

    // Restart: welcome → habit → goal → card, all over again.
    await FirstDayAnalytics.welcomeDone();
    await FirstDayAnalytics.habitCreated('read');
    await FirstDayAnalytics.goalCreated('save_money');
    await FirstDayAnalytics.onboardingCompleted('check');
    await FirstDayAnalytics.onboardingSkipped(1);

    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
  });
});

describe('onb_learn_more', () => {
  it('is sent once after the ending, only inside the funnel', async () => {
    await FirstDayAnalytics.learnMoreOpened(); // not enrolled → nothing
    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();

    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.onboardingCompleted('later');
    await FirstDayAnalytics.learnMoreOpened();
    await FirstDayAnalytics.learnMoreOpened();

    expect(sentEvents()).toEqual(['onb_start', 'onb_complete', 'onb_learn_more']);
    expect(paramsOf('onb_complete').method).toBe('later');
  });
});

describe('first habit check', () => {
  it('counts only the very first check, even when two arrive at once', async () => {
    await FirstDayAnalytics.onboardingStarted();
    await Promise.all([FirstDayAnalytics.habitChecked(), FirstDayAnalytics.habitChecked()]);
    await FirstDayAnalytics.habitChecked();

    expect(sentEvents().filter(name => name === 'first_habit_check')).toHaveLength(1);
  });

  it('sends each onboarding step once even when it fires twice at the same moment', async () => {
    await Promise.all([FirstDayAnalytics.onboardingStarted(), FirstDayAnalytics.onboardingStarted()]);
    await Promise.all([FirstDayAnalytics.welcomeDone(), FirstDayAnalytics.welcomeDone()]);
    await Promise.all([
      FirstDayAnalytics.onboardingCompleted('check'),
      FirstDayAnalytics.onboardingCompleted('later'),
    ]);

    expect(sentEvents()).toEqual(['onb_start', 'onb_welcome_done', 'onb_complete']);
  });

  it('knows whether it happened during or after onboarding', async () => {
    await FirstDayAnalytics.onboardingStarted();
    await FirstDayAnalytics.onboardingSkipped(1);
    await FirstDayAnalytics.habitChecked();

    expect(paramsOf('first_habit_check').in_onboarding).toBe(0);
  });
});

describe('first journal entry', () => {
  it('reports the day since install, once', async () => {
    await enrolDaysAgo(3);
    await FirstDayAnalytics.journalEntryCreated();
    await FirstDayAnalytics.journalEntryCreated();

    expect(sentEvents()).toEqual(['first_journal_entry']);
    expect(paramsOf('first_journal_entry')).toEqual({ day: 3 });
  });
});

describe('day_return', () => {
  it('is not sent on the install day', async () => {
    await enrolDaysAgo(0);
    await FirstDayAnalytics.appActive();
    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
  });

  it.each([1, 2, 7])('is sent once on day %i', async day => {
    await enrolDaysAgo(day);
    await FirstDayAnalytics.appActive();
    await FirstDayAnalytics.appActive(); // foregrounded again the same day

    expect(sentEvents()).toEqual(['day_return']);
    expect(paramsOf('day_return')).toEqual({ day });
  });

  it('stops after the first week', async () => {
    await enrolDaysAgo(8);
    await FirstDayAnalytics.appActive();
    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
  });
});

describe('reminder_open', () => {
  it('counts taps for every user, not only the funnel', async () => {
    await FirstDayAnalytics.reminderOpened('evening_reminder', 'evening_reminder_day_1|1000');
    await FirstDayAnalytics.reminderOpened('afternoon_reminder', 'afternoon-reminder|2000');

    expect(sentEvents()).toEqual(['reminder_open', 'reminder_open']);
    expect(FirebaseAnalytics.logEvent.mock.calls.map(call => call[1].type)).toEqual([
      'evening',
      'afternoon',
    ]);
  });

  it('counts the same tap once (live listener + cold-start lookup)', async () => {
    await FirstDayAnalytics.reminderOpened('evening_reminder', 'evening_reminder_day_0|5000');
    await FirstDayAnalytics.reminderOpened('evening_reminder', 'evening_reminder_day_0|5000');

    expect(sentEvents()).toEqual(['reminder_open']);
  });

  it('ignores notifications that are not our reminders', async () => {
    await FirstDayAnalytics.reminderOpened(undefined, 'x|1');
    await FirstDayAnalytics.reminderOpened('marketing', 'y|2');

    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
  });
});

describe('never throws into the app', () => {
  it('swallows a failing Firebase call', async () => {
    FirebaseAnalytics.logEvent.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    await expect(FirstDayAnalytics.onboardingStarted()).resolves.toBeUndefined();
  });

  it('swallows a failing storage read', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('disk full'))
    );
    await expect(FirstDayAnalytics.habitChecked()).resolves.toBeUndefined();
  });

  it('ignores corrupted funnel state instead of crashing', async () => {
    await AsyncStorage.setItem(FIRST_DAY_STORAGE_KEYS.STATE, '{not json');
    await expect(FirstDayAnalytics.appActive()).resolves.toBeUndefined();
    expect(FirebaseAnalytics.logEvent).not.toHaveBeenCalled();
  });
});
