/**
 * Stage F — knowing when the final card has done its job.
 *
 * The card exists for one moment: the user ticks their brand-new habit and
 * watches XP arrive. Getting the predicate wrong costs exactly that moment —
 * a card that vanishes before the user has done anything.
 *
 * The trap is the restart case. Rerunning onboarding from Settings in the
 * evening means today's habits may already be ticked, so "has anything been
 * checked today?" is true the instant the card mounts.
 */
import { countChecksOn, hasNewCheckSince, CompletionLike } from '../checkDetection';

const TODAY = '2026-08-02';
const YESTERDAY = '2026-08-01';

const check = (date: string, completed = true): CompletionLike => ({ date, completed });

describe('countChecksOn', () => {
  it('counts only today', () => {
    expect(countChecksOn([check(TODAY), check(YESTERDAY)], TODAY)).toBe(1);
  });

  it('ignores records that are switched off', () => {
    // Unchecking leaves a record behind with completed: false.
    expect(countChecksOn([check(TODAY, false)], TODAY)).toBe(0);
  });

  it('is zero for a fresh install', () => {
    expect(countChecksOn([], TODAY)).toBe(0);
  });
});

describe('hasNewCheckSince', () => {
  it('is false while nothing new has been ticked', () => {
    expect(hasNewCheckSince([], TODAY, 0)).toBe(false);
  });

  it('turns true on the first tick', () => {
    expect(hasNewCheckSince([check(TODAY)], TODAY, 0)).toBe(true);
  });

  it('ignores ticks that were already there when the card appeared', () => {
    // The restart case: two habits already done today, card mounts, nothing
    // new happens. The user must still get their moment.
    const existing = [check(TODAY), check(TODAY)];
    expect(hasNewCheckSince(existing, TODAY, 2)).toBe(false);
  });

  it('fires once the user adds a tick on top of the existing ones', () => {
    const existing = [check(TODAY), check(TODAY)];
    expect(hasNewCheckSince([...existing, check(TODAY)], TODAY, 2)).toBe(true);
  });

  it('is not fooled by yesterday', () => {
    expect(hasNewCheckSince([check(YESTERDAY)], TODAY, 0)).toBe(false);
  });

  it('does not fire when the user UNchecks something', () => {
    // Count falls below the baseline — that is not an achievement.
    expect(hasNewCheckSince([check(TODAY, false)], TODAY, 1)).toBe(false);
  });
});

describe('isHabitCheckedOn — the habit screen 1 created', () => {
  const { isHabitCheckedOn } = require('../checkDetection') as typeof import('../checkDetection');
  const tick = (habitId: string, date = TODAY, completed = true) => ({ habitId, date, completed });

  it('sees a tick on exactly that habit today', () => {
    expect(isHabitCheckedOn([tick('mine')], 'mine', TODAY)).toBe(true);
  });

  it('ignores ticks on other habits — the evening-restart trap needs no baseline', () => {
    // Restarted in the evening with other habits already ticked today.
    expect(isHabitCheckedOn([tick('older-1'), tick('older-2')], 'mine', TODAY)).toBe(false);
  });

  it('ignores yesterday and un-ticked records', () => {
    expect(isHabitCheckedOn([tick('mine', YESTERDAY), tick('mine', TODAY, false)], 'mine', TODAY)).toBe(false);
  });
});

describe('screen 3 copy — what the ask and the ending say', () => {
  const { askCopyKeys, endingCopyKeys } =
    require('../firstCheckCopy') as typeof import('../firstCheckCopy');

  it('the ask names the habit when it is known, generic wording otherwise', () => {
    expect(askCopyKeys(true)).toEqual({
      titleKey: 'onboarding.done.askTitleNamed',
      bodyKey: 'onboarding.done.askBodyNamed',
    });
    expect(askCopyKeys(false)).toEqual({
      titleKey: 'onboarding.done.title',
      bodyKey: 'onboarding.done.body',
    });
  });

  it('"Day 1 done" and rewards only after a real check', () => {
    for (const reminders of [true, false]) {
      for (const known of [true, false]) {
        const later = endingCopyKeys('later', reminders, known);
        expect(later.titleKey).toBe('onboarding.done.laterTitle');
        expect(later.showRewards).toBe(false);

        const done = endingCopyKeys('done', reminders, known);
        expect(done.titleKey).toBe('onboarding.done.dayOneTitle');
        expect(done.showRewards).toBe(true);
      }
    }
  });

  it('promises a reminder only to users who will get one', () => {
    expect(endingCopyKeys('done', true, true).bodyKey).toBe('onboarding.done.dayOneBodyReminders');
    expect(endingCopyKeys('done', false, true).bodyKey).toBe('onboarding.done.dayOneBodyNoReminders');
    expect(endingCopyKeys('later', true, true).reminderLineKey).toBe('onboarding.done.laterReminder');
    expect(endingCopyKeys('later', false, true).reminderLineKey).toBeNull();
    expect(endingCopyKeys('done', true, true).reminderLineKey).toBeNull();
  });

  it('the "later" ending names the habit when it is known', () => {
    expect(endingCopyKeys('later', false, true).bodyKey).toBe('onboarding.done.laterBodyNamed');
    expect(endingCopyKeys('later', false, false).bodyKey).toBe('onboarding.done.laterBody');
  });

  it('every key it can return exists in all three languages, with {{habit}} where needed', () => {
    const locales = {
      en: require('../../../locales/en').default,
      de: require('../../../locales/de').default,
      es: require('../../../locales/es').default,
    } as Record<string, any>;
    const keys = new Set<string>();
    for (const known of [true, false]) {
      const ask = askCopyKeys(known);
      keys.add(ask.titleKey);
      keys.add(ask.bodyKey);
      for (const ending of ['done', 'later'] as const) {
        for (const reminders of [true, false]) {
          const copy = endingCopyKeys(ending, reminders, known);
          keys.add(copy.titleKey);
          keys.add(copy.bodyKey);
          if (copy.reminderLineKey) keys.add(copy.reminderLineKey);
        }
      }
    }
    const named = ['onboarding.done.askTitleNamed', 'onboarding.done.laterBodyNamed'];
    for (const [name, locale] of Object.entries(locales)) {
      for (const key of keys) {
        const value = key.split('.').reduce((node: any, part: string) => node?.[part], locale);
        const ok =
          typeof value === 'string' &&
          value.length > 0 &&
          (!named.includes(key) || value.includes('{{habit}}'));
        expect({ name, key, ok }).toEqual({ name, key, ok: true });
      }
    }
  });
});

describe('quotedHabitName — the habit name inside a sentence', () => {
  const { quotedHabitName, QUOTED_HABIT_NAME_MAX } =
    require('../firstCheckCopy') as typeof import('../firstCheckCopy');

  it('keeps normal names as they are (trimmed)', () => {
    expect(quotedHabitName('  Drink water ')).toBe('Drink water');
  });

  it('shortens very long names with an ellipsis, so the sentence around them survives', () => {
    const long = 'Walk the dog around the whole park twice before breakfast every day';
    const quoted = quotedHabitName(long);
    expect(quoted.length).toBeLessThanOrEqual(QUOTED_HABIT_NAME_MAX);
    expect(quoted.endsWith('…')).toBe(true);
    expect(long.startsWith(quoted.slice(0, -1))).toBe(true);
  });
});
