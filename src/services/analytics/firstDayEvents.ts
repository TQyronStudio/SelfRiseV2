/**
 * The first-day funnel: every event SelfRise may send, and every value each
 * parameter may carry.
 *
 * WHY A WHITELIST: the funnel must never leak personal content — no habit or
 * goal names, no journal text. TypeScript already narrows the call sites, but
 * types vanish at runtime, so `sanitizeFirstDayParams()` re-checks every value
 * against this table before anything leaves the device. A value that is not on
 * the list is replaced with `other` (never passed through), and a parameter
 * that is not in the table is dropped.
 *
 * `other` instead of dropping the whole event on purpose: losing a funnel step
 * because a new preset was added and this list was not updated would make the
 * funnel lie. `firstDayEvents.test.ts` keeps the preset and template lists in
 * step with the real constants.
 *
 * Deliberately import-free, so the test can load it without pulling in i18n,
 * the theme or native modules.
 */

/** A parameter is either a closed list of strings or a whole number. */
type ParamRule = readonly string[] | 'number';

export const OTHER_VALUE = 'other';

export const HABIT_PRESET_IDS = [
  'water',
  'exercise',
  'read',
  'meditate',
  'sleep',
  'eatHealthy',
] as const;

export const GOAL_TEMPLATE_IDS = [
  'lose_weight',
  'save_money',
  'pay_debt',
  'read_books',
  'learn_language',
  'online_course',
  'job_applications',
  'networking',
  'meditation',
  'art_projects',
  'cooking_recipes',
] as const;

export const FIRST_DAY_EVENTS = {
  // Onboarding, in the order the user meets it.
  onb_start: {},
  onb_language: { language: ['en', 'de', 'es'] },
  onb_theme: { theme: ['light', 'dark'] },
  onb_notifications: { choice: ['yes', 'later'], os: ['granted', 'denied', 'none'] },
  onb_welcome_done: {},
  onb_habit_created: { source: ['preset', 'custom'], preset: [...HABIT_PRESET_IDS, 'none'] },
  onb_goal_created: { source: ['template', 'custom'], template: [...GOAL_TEMPLATE_IDS, 'none'] },
  // 'check' = ticked the onboarding habit, 'later' = "I'll do it later".
  onb_complete: { method: ['check', 'later'], duration_s: 'number' },
  onb_skip: { screen: 'number' },
  // "How it all works" tapped on the onboarding ending.
  onb_learn_more: {},

  // After (or alongside) onboarding.
  first_habit_check: { in_onboarding: 'number', min_since_start: 'number' },
  first_journal_entry: { day: 'number' },
  day_return: { day: 'number' },
  reminder_open: { type: ['afternoon', 'evening'] },
} as const satisfies Record<string, Record<string, ParamRule>>;

export const FIRST_DAY_USER_PROPERTIES = {
  /** How the user's onboarding ended. */
  onb_result: ['in_progress', 'completed', 'skipped'],
  /** What the user chose on the onboarding notification step (not later changes). */
  notif_optin: ['granted', 'denied', 'later'],
} as const satisfies Record<string, readonly string[]>;

export type FirstDayEventName = keyof typeof FIRST_DAY_EVENTS;

type RuleValue<R> = R extends readonly (infer V)[] ? V : R extends 'number' ? number : never;

export type FirstDayEventParams<E extends FirstDayEventName> = {
  [K in keyof (typeof FIRST_DAY_EVENTS)[E]]: RuleValue<(typeof FIRST_DAY_EVENTS)[E][K]>;
};

export type FirstDayUserProperty = keyof typeof FIRST_DAY_USER_PROPERTIES;

export type FirstDayUserPropertyValue<P extends FirstDayUserProperty> =
  (typeof FIRST_DAY_USER_PROPERTIES)[P][number];

export type HabitPresetId = (typeof HABIT_PRESET_IDS)[number];
export type GoalTemplateId = (typeof GOAL_TEMPLATE_IDS)[number];

/**
 * The parameters exactly as they may leave the device, or `null` for an event
 * that is not in the table (which must never be sent).
 */
export function sanitizeFirstDayParams(
  name: string,
  params: Record<string, unknown>
): Record<string, string | number> | null {
  if (!Object.prototype.hasOwnProperty.call(FIRST_DAY_EVENTS, name)) return null;
  const rules = FIRST_DAY_EVENTS[name as FirstDayEventName] as Record<string, ParamRule>;

  const clean: Record<string, string | number> = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = params[key];
    if (rule === 'number') {
      // Counts and durations only: whole, non-negative. Anything else is dropped.
      if (typeof value === 'number' && Number.isFinite(value)) {
        clean[key] = Math.max(0, Math.round(value));
      }
    } else {
      clean[key] = typeof value === 'string' && rule.includes(value) ? value : OTHER_VALUE;
    }
  }
  return clean;
}

/** True only for a property and value that are both in the table. */
export function isAllowedUserProperty(name: string, value: string): boolean {
  if (!Object.prototype.hasOwnProperty.call(FIRST_DAY_USER_PROPERTIES, name)) return false;
  const allowed = FIRST_DAY_USER_PROPERTIES[name as FirstDayUserProperty] as readonly string[];
  return allowed.includes(value);
}
