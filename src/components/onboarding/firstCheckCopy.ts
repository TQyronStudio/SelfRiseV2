/**
 * Which texts onboarding screen 3 shows (FirstCheckCard + DayOneCelebration).
 *
 * Kept import-free like checkDetection.ts, so the rules below are tested without
 * mounting anything:
 * - the ask names the user's habit when it is known, generic wording otherwise;
 * - "Day 1 done" only after a real check — "later" gets an honest variant;
 * - a reminder is promised only to someone who will get one.
 */

/** Where screen 3 is: the ask card, or the full-screen ending after a check / "later". */
export type ScreenThreeEnding = 'done' | 'later';

export interface AskCopyKeys {
  titleKey: 'onboarding.done.askTitleNamed' | 'onboarding.done.title';
  bodyKey: 'onboarding.done.askBodyNamed' | 'onboarding.done.body';
}

export interface EndingCopyKeys {
  titleKey: 'onboarding.done.dayOneTitle' | 'onboarding.done.laterTitle';
  bodyKey:
    | 'onboarding.done.dayOneBodyReminders'
    | 'onboarding.done.dayOneBodyNoReminders'
    | 'onboarding.done.laterBodyNamed'
    | 'onboarding.done.laterBody';
  /** Extra line under the body, or null. */
  reminderLineKey: 'onboarding.done.laterReminder' | null;
  /** XP / level / streak — a reward exists only after a real check. */
  showRewards: boolean;
}

/** Longest habit name quoted in a sentence before it is shortened with "…". */
export const QUOTED_HABIT_NAME_MAX = 40;

/**
 * The habit name as it goes INTO a sentence. Cut in code rather than by the
 * Text's line limit: German puts the verb after the name („Hake „…“ ab"), so a
 * line-limit ellipsis on a very long name would swallow the verb.
 */
export function quotedHabitName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= QUOTED_HABIT_NAME_MAX) return trimmed;
  return `${trimmed.slice(0, QUOTED_HABIT_NAME_MAX - 1).trimEnd()}…`;
}

/** @param habitKnown screen 3 knows the onboarding habit and its name */
export function askCopyKeys(habitKnown: boolean): AskCopyKeys {
  return habitKnown
    ? { titleKey: 'onboarding.done.askTitleNamed', bodyKey: 'onboarding.done.askBodyNamed' }
    : { titleKey: 'onboarding.done.title', bodyKey: 'onboarding.done.body' };
}

/**
 * @param ending 'done' after a real check, 'later' after "I'll do it later"
 * @param remindersOn the afternoon reminder is switched on
 * @param habitKnown screen 3 knows the onboarding habit and its name
 */
export function endingCopyKeys(
  ending: ScreenThreeEnding,
  remindersOn: boolean,
  habitKnown: boolean
): EndingCopyKeys {
  if (ending === 'done') {
    return {
      titleKey: 'onboarding.done.dayOneTitle',
      bodyKey: remindersOn
        ? 'onboarding.done.dayOneBodyReminders'
        : 'onboarding.done.dayOneBodyNoReminders',
      reminderLineKey: null,
      showRewards: true,
    };
  }
  return {
    titleKey: 'onboarding.done.laterTitle',
    bodyKey: habitKnown ? 'onboarding.done.laterBodyNamed' : 'onboarding.done.laterBody',
    reminderLineKey: remindersOn ? 'onboarding.done.laterReminder' : null,
    showRewards: false,
  };
}
