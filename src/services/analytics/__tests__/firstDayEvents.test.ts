/**
 * The whitelist is the privacy promise of the first-day funnel: nothing the
 * user typed may ever leave the device. These tests pin that promise, plus the
 * Firebase naming limits (a name Firebase rejects is an event silently lost).
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  FIRST_DAY_EVENTS,
  FIRST_DAY_USER_PROPERTIES,
  HABIT_PRESET_IDS,
  GOAL_TEMPLATE_IDS,
  OTHER_VALUE,
  sanitizeFirstDayParams,
  isAllowedUserProperty,
} from '../firstDayEvents';
import { HABIT_PRESETS } from '../../../constants/habitPresets';

describe('sanitizeFirstDayParams — nothing personal gets through', () => {
  it('replaces a free-text value with "other" and never passes the text on', () => {
    const typedByUser = 'Call mum every Sunday';
    const clean = sanitizeFirstDayParams('onb_habit_created', {
      source: 'custom',
      preset: typedByUser,
    });
    expect(clean).toEqual({ source: 'custom', preset: OTHER_VALUE });
    expect(JSON.stringify(clean)).not.toContain(typedByUser);
  });

  it('drops parameters that are not in the table', () => {
    const clean = sanitizeFirstDayParams('onb_goal_created', {
      source: 'template',
      template: 'read_books',
      title: 'Read 12 books about my divorce',
    });
    expect(clean).toEqual({ source: 'template', template: 'read_books' });
  });

  it('refuses events that are not in the table', () => {
    expect(sanitizeFirstDayParams('journal_text', { text: 'Dear diary' })).toBeNull();
    expect(sanitizeFirstDayParams('toString', {})).toBeNull();
  });

  it('keeps numbers whole and non-negative, and drops non-numbers', () => {
    expect(sanitizeFirstDayParams('onb_complete', { method: 'check', duration_s: 73.6 })).toEqual({
      method: 'check',
      duration_s: 74,
    });
    expect(sanitizeFirstDayParams('day_return', { day: -3 })).toEqual({ day: 0 });
    expect(sanitizeFirstDayParams('day_return', { day: NaN })).toEqual({});
    expect(sanitizeFirstDayParams('day_return', { day: '2' })).toEqual({});
  });

  it('passes every allowed value through unchanged', () => {
    for (const [event, rules] of Object.entries(FIRST_DAY_EVENTS)) {
      for (const [param, rule] of Object.entries(rules as Record<string, unknown>)) {
        if (rule === 'number') continue;
        for (const value of rule as readonly string[]) {
          expect(sanitizeFirstDayParams(event, { [param]: value })?.[param]).toBe(value);
        }
      }
    }
  });
});

describe('user properties', () => {
  it('accepts only listed properties and values', () => {
    expect(isAllowedUserProperty('onb_result', 'completed')).toBe(true);
    expect(isAllowedUserProperty('notif_optin', 'later')).toBe(true);
    expect(isAllowedUserProperty('notif_optin', 'maybe')).toBe(false);
    expect(isAllowedUserProperty('favourite_habit', 'water')).toBe(false);
  });
});

describe('Firebase naming limits', () => {
  const NAME = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  const RESERVED_PREFIXES = ['firebase_', 'google_', 'ga_'];

  it('event and parameter names are valid and at most 40 characters', () => {
    for (const [event, rules] of Object.entries(FIRST_DAY_EVENTS)) {
      for (const name of [event, ...Object.keys(rules)]) {
        expect(name).toMatch(NAME);
        expect(name.length).toBeLessThanOrEqual(40);
        for (const prefix of RESERVED_PREFIXES) expect(name.startsWith(prefix)).toBe(false);
      }
    }
  });

  it('string parameter values are at most 100 characters', () => {
    for (const rules of Object.values(FIRST_DAY_EVENTS)) {
      for (const rule of Object.values(rules as Record<string, unknown>)) {
        if (rule === 'number') continue;
        for (const value of rule as readonly string[]) expect(value.length).toBeLessThanOrEqual(100);
      }
    }
  });

  it('user property names are at most 24 and values at most 36 characters', () => {
    for (const [name, values] of Object.entries(FIRST_DAY_USER_PROPERTIES)) {
      expect(name).toMatch(NAME);
      expect(name.length).toBeLessThanOrEqual(24);
      for (const value of values) expect(value.length).toBeLessThanOrEqual(36);
    }
  });
});

describe('whitelists stay in step with the real onboarding tiles', () => {
  it('habit presets match HABIT_PRESETS', () => {
    expect([...HABIT_PRESET_IDS].sort()).toEqual(HABIT_PRESETS.map(p => p.id).sort());
  });

  it('goal templates match the ids in goalTemplates.ts', () => {
    // The templates live inside a hook (they need t()), so read the ids from source.
    const source = fs.readFileSync(
      path.join(__dirname, '../../../constants/goalTemplates.ts'),
      'utf8'
    );
    const ids = [...source.matchAll(/\bid:\s*'([^']+)'/g)].map(m => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect([...GOAL_TEMPLATE_IDS].sort()).toEqual(ids.sort());
  });
});
