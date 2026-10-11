/**
 * First-day funnel analytics — where new users drop off between installing the
 * app and coming back the next day.
 *
 * Rules every function here keeps (see technical-guides:Analytics.md):
 *
 * 1. NEVER THROWS, NEVER BLOCKS. Call sites fire and forget (`void ...`). The
 *    onboarding's modal ordering protects iOS from freezing; analytics must not
 *    be able to delay or break any of it.
 *
 * 2. NEW INSTALLS ONLY. `onboardingStarted()` runs only when the onboarding
 *    preferences gate opens on a first launch (never during a Settings restart),
 *    and it writes the funnel state (start time + install date). Every funnel
 *    event requires that state, so users who installed before this release — or
 *    anyone restarting onboarding from Settings — never enter the funnel.
 *
 * 3. ONCE PER INSTALL. Each funnel step is sent at most once (a storage flag per
 *    step). After onboarding ends (complete or skip) no further `onb_*` step is
 *    sent, so a later restart from Settings cannot add a second run.
 *
 * 4. NO PERSONAL CONTENT. Parameters are checked against the whitelist in
 *    `firstDayEvents.ts` right before sending.
 *
 * Firebase is required lazily inside `send()`, so importing this module (from
 * contexts, screens) never drags the native module into a Jest graph.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateToString, daysBetween } from '../../utils/date';
import { TUTORIAL_STORAGE_KEYS } from '../../constants/tutorialStorageKeys';
import {
  FirstDayEventName,
  FirstDayEventParams,
  FirstDayUserProperty,
  FirstDayUserPropertyValue,
  HABIT_PRESET_IDS,
  GOAL_TEMPLATE_IDS,
  HabitPresetId,
  GoalTemplateId,
  sanitizeFirstDayParams,
  isAllowedUserProperty,
} from './firstDayEvents';

export const FIRST_DAY_STORAGE_KEYS = {
  /** `{ startedAt, installDate }` — exists only for installs that entered the funnel. */
  STATE: 'analytics_first_day_state',
  /** Prefix of the per-step "already sent" flags. */
  ONCE_PREFIX: 'analytics_first_day_once_',
  /** Identity of the last reminder tap that was counted (tap seen twice → counted once). */
  LAST_REMINDER_RESPONSE: 'analytics_last_reminder_response',
} as const;

/** `day_return` covers the first week; Firebase's own retention covers the rest. */
const DAY_RETURN_LAST_DAY = 7;

interface FunnelState {
  /** ms timestamp of the first onboarding screen. */
  startedAt: number;
  /** Local calendar date of that moment (YYYY-MM-DD). */
  installDate: string;
}

type OnboardingStep = Exclude<
  FirstDayEventName,
  | 'onb_start'
  | 'onb_complete'
  | 'onb_skip'
  | 'onb_learn_more'
  | 'first_habit_check'
  | 'first_journal_entry'
  | 'day_return'
  | 'reminder_open'
>;

// Same-step calls racing each other (double tap, effect + button) must not both
// pass the storage check before either has written the flag.
const claimsInFlight = new Set<string>();

// ---------------------------------------------------------------------------
// Plumbing
// ---------------------------------------------------------------------------

async function guard(label: string, work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    console.warn(`[FirstDayAnalytics] ${label} failed (ignored):`, error);
  }
}

async function send<E extends FirstDayEventName>(
  name: E,
  params: FirstDayEventParams<E>
): Promise<void> {
  const clean = sanitizeFirstDayParams(name, params as Record<string, unknown>);
  if (clean === null) return;
  const { FirebaseAnalytics } =
    require('../../hooks/useFirebaseAnalytics') as typeof import('../../hooks/useFirebaseAnalytics');
  await FirebaseAnalytics.logEvent(name, clean);
}

async function setProperty<P extends FirstDayUserProperty>(
  name: P,
  value: FirstDayUserPropertyValue<P>
): Promise<void> {
  if (!isAllowedUserProperty(name, value)) return;
  const { FirebaseAnalytics } =
    require('../../hooks/useFirebaseAnalytics') as typeof import('../../hooks/useFirebaseAnalytics');
  await FirebaseAnalytics.setUserProperty(name, value);
}

async function readState(): Promise<FunnelState | null> {
  const raw = await AsyncStorage.getItem(FIRST_DAY_STORAGE_KEYS.STATE);
  if (!raw) return null;
  let parsed: Partial<FunnelState>;
  try {
    parsed = JSON.parse(raw) as Partial<FunnelState>;
  } catch {
    return null; // corrupted → treated as "not in the funnel", never as a crash
  }
  if (typeof parsed?.startedAt !== 'number' || typeof parsed?.installDate !== 'string') return null;
  return { startedAt: parsed.startedAt, installDate: parsed.installDate };
}

async function wasSent(step: string): Promise<boolean> {
  return (await AsyncStorage.getItem(FIRST_DAY_STORAGE_KEYS.ONCE_PREFIX + step)) !== null;
}

/**
 * True exactly once per install for `step`. The flag is written BEFORE the event
 * is sent: a crash in between loses one event, which is better than a funnel
 * that counts the same step twice.
 */
async function claimOnce(step: string): Promise<boolean> {
  if (claimsInFlight.has(step)) return false;
  claimsInFlight.add(step);
  try {
    if (await wasSent(step)) return false;
    await AsyncStorage.setItem(FIRST_DAY_STORAGE_KEYS.ONCE_PREFIX + step, '1');
    return true;
  } finally {
    claimsInFlight.delete(step);
  }
}

async function onboardingEnded(): Promise<boolean> {
  return (await wasSent('onb_complete')) || (await wasSent('onb_skip'));
}

/** A middle onboarding step: needs the funnel, an unfinished onboarding and a fresh step. */
async function onboardingStep<E extends OnboardingStep>(
  name: E,
  params: FirstDayEventParams<E>
): Promise<void> {
  if (!(await readState())) return;
  if (await onboardingEnded()) return;
  if (!(await claimOnce(name))) return;
  await send(name, params);
}

function isHabitPreset(id: string | null): id is HabitPresetId {
  return id !== null && (HABIT_PRESET_IDS as readonly string[]).includes(id);
}

function isGoalTemplate(id: string | null): id is GoalTemplateId {
  return id !== null && (GOAL_TEMPLATE_IDS as readonly string[]).includes(id);
}

// ---------------------------------------------------------------------------
// Public API — one function per moment in the user's first day
// ---------------------------------------------------------------------------

export const FirstDayAnalytics = {
  /**
   * The onboarding preferences gate opened on a first launch. This is the ONLY
   * place that enrols an install into the funnel.
   */
  onboardingStarted(): Promise<void> {
    return guard('onboardingStarted', async () => {
      // The gate can also open for an EXISTING user: one who installed before
      // the gate existed (no PREFS_COMPLETED), restarted onboarding from
      // Settings and had the app killed mid-way. RESTARTED survives that kill
      // and is cleared only on complete/skip, so it tells the two apart.
      if ((await AsyncStorage.getItem(TUTORIAL_STORAGE_KEYS.RESTARTED)) === 'true') return;
      // A force-quit on the gate brings the gate back next launch: keep the
      // original start, so durations measure the real first contact.
      if (!(await readState())) {
        const now = new Date();
        const state: FunnelState = { startedAt: now.getTime(), installDate: formatDateToString(now) };
        await AsyncStorage.setItem(FIRST_DAY_STORAGE_KEYS.STATE, JSON.stringify(state));
      }
      if (!(await claimOnce('onb_start'))) return;
      await send('onb_start', {});
      await setProperty('onb_result', 'in_progress');
    });
  },

  languageChosen(language: FirstDayEventParams<'onb_language'>['language']): Promise<void> {
    return guard('languageChosen', () => onboardingStep('onb_language', { language }));
  },

  themeChosen(theme: FirstDayEventParams<'onb_theme'>['theme']): Promise<void> {
    return guard('themeChosen', () => onboardingStep('onb_theme', { theme }));
  },

  /**
   * @param wantsReminders the user tapped "yes" on our priming screen
   * @param osGranted what the OS prompt returned (ignored when wantsReminders is false)
   */
  notificationsChosen(wantsReminders: boolean, osGranted: boolean): Promise<void> {
    return guard('notificationsChosen', async () => {
      if (!(await readState()) || (await onboardingEnded())) return;
      if (!(await claimOnce('onb_notifications'))) return;
      const os = !wantsReminders ? 'none' : osGranted ? 'granted' : 'denied';
      await send('onb_notifications', { choice: wantsReminders ? 'yes' : 'later', os });
      await setProperty('notif_optin', !wantsReminders ? 'later' : osGranted ? 'granted' : 'denied');
    });
  },

  welcomeDone(): Promise<void> {
    return guard('welcomeDone', () => onboardingStep('onb_welcome_done', {}));
  },

  /** @param selectedTileId the tile the user started from — never the habit's name */
  habitCreated(selectedTileId: string | null): Promise<void> {
    return guard('habitCreated', () => {
      const preset = isHabitPreset(selectedTileId) ? selectedTileId : null;
      return onboardingStep('onb_habit_created', {
        source: preset ? 'preset' : 'custom',
        preset: preset ?? 'none',
      });
    });
  },

  /** @param selectedTileId the template the user started from — never the goal's title */
  goalCreated(selectedTileId: string | null): Promise<void> {
    return guard('goalCreated', () => {
      const template = isGoalTemplate(selectedTileId) ? selectedTileId : null;
      return onboardingStep('onb_goal_created', {
        source: template ? 'template' : 'custom',
        template: template ?? 'none',
      });
    });
  },

  onboardingCompleted(method: FirstDayEventParams<'onb_complete'>['method']): Promise<void> {
    return guard('onboardingCompleted', async () => {
      const state = await readState();
      if (!state || (await onboardingEnded())) return;
      if (!(await claimOnce('onb_complete'))) return;
      await send('onb_complete', { method, duration_s: (Date.now() - state.startedAt) / 1000 });
      await setProperty('onb_result', 'completed');
    });
  },

  /**
   * "How it all works" on the onboarding ending. Comes AFTER `onb_complete`
   * (the ending is shown once onboarding counts as completed), so it is not
   * blocked by the end-of-onboarding guard — only by the funnel and once.
   */
  learnMoreOpened(): Promise<void> {
    return guard('learnMoreOpened', async () => {
      if (!(await readState())) return;
      if (!(await claimOnce('onb_learn_more'))) return;
      await send('onb_learn_more', {});
    });
  },

  /** @param screen the onboarding screen (1 or 2) the user skipped from */
  onboardingSkipped(screen: number): Promise<void> {
    return guard('onboardingSkipped', async () => {
      if (!(await readState()) || (await onboardingEnded())) return;
      if (!(await claimOnce('onb_skip'))) return;
      await send('onb_skip', { screen });
      await setProperty('onb_result', 'skipped');
    });
  },

  /** Any habit checked anywhere in the app — only the very first one counts. */
  habitChecked(): Promise<void> {
    return guard('habitChecked', async () => {
      const state = await readState();
      if (!state || (await wasSent('first_habit_check'))) return;
      // Read before claiming, so the answer reflects the moment of the check.
      const inOnboarding = !(await onboardingEnded());
      if (!(await claimOnce('first_habit_check'))) return;
      await send('first_habit_check', {
        in_onboarding: inOnboarding ? 1 : 0,
        min_since_start: (Date.now() - state.startedAt) / 60_000,
      });
    });
  },

  /** Any journal entry — only the very first one counts. */
  journalEntryCreated(): Promise<void> {
    return guard('journalEntryCreated', async () => {
      const state = await readState();
      if (!state || (await wasSent('first_journal_entry'))) return;
      if (!(await claimOnce('first_journal_entry'))) return;
      await send('first_journal_entry', {
        day: daysBetween(state.installDate, formatDateToString(new Date())),
      });
    });
  },

  /** App opened or brought to the foreground. Counts each of days 1–7 once. */
  appActive(): Promise<void> {
    return guard('appActive', async () => {
      const state = await readState();
      if (!state) return;
      const day = daysBetween(state.installDate, formatDateToString(new Date()));
      if (day < 1 || day > DAY_RETURN_LAST_DAY) return;
      if (!(await claimOnce(`day_return_${day}`))) return;
      await send('day_return', { day });
    });
  },

  /**
   * A reminder notification was tapped — counted for ALL users, not only the
   * funnel, because it answers "do reminders bring people back?".
   *
   * @param category the notification's `data.category`
   * @param responseKey identity of this tap; the same tap can arrive twice (live
   *   listener + cold-start lookup) and must count once
   */
  reminderOpened(category: unknown, responseKey: string): Promise<void> {
    return guard('reminderOpened', async () => {
      const type =
        category === 'afternoon_reminder' ? 'afternoon' : category === 'evening_reminder' ? 'evening' : null;
      if (type === null) return;
      if (claimsInFlight.has(responseKey)) return;
      claimsInFlight.add(responseKey);
      try {
        const last = await AsyncStorage.getItem(FIRST_DAY_STORAGE_KEYS.LAST_REMINDER_RESPONSE);
        if (last === responseKey) return;
        await AsyncStorage.setItem(FIRST_DAY_STORAGE_KEYS.LAST_REMINDER_RESPONSE, responseKey);
      } finally {
        claimsInFlight.delete(responseKey);
      }
      await send('reminder_open', { type });
    });
  },
};
