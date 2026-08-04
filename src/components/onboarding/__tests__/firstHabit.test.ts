/**
 * Stage D — the parts of the first-habit screen that fail silently.
 *
 * Rendering is not what breaks here. Two things are:
 *   - the trophy gate's ORDER (arm, create, wait). The project has got this
 *     wrong twice already: once the flow looked frozen, once the celebration
 *     never appeared at all. Both were invisible to any test at the time.
 *   - the presets themselves — a typo in an icon or colour is a runtime-only
 *     failure, because they are plain strings by the time they reach the form.
 */
import { createWithTrophyGate } from '../createWithTrophyGate';
import { HABIT_PRESETS, CUSTOM_HABIT_DEFAULTS, ALL_DAYS } from '../../../constants/habitPresets';
import { DayOfWeek, HabitColor, HabitIcon } from '../../../types/common';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('createWithTrophyGate', () => {
  it('arms the gate BEFORE creating, so the unlock event cannot be missed', async () => {
    const order: string[] = [];
    await createWithTrophyGate({
      arm: () => {
        order.push('arm');
        return { wait: async () => { order.push('wait'); } };
      },
      create: async () => { order.push('create'); return 'habit'; },
    });
    expect(order).toEqual(['arm', 'create', 'wait']);
  });

  it('does not resolve until the celebration has been dismissed', async () => {
    let releaseCelebration!: () => void;
    const dismissed = new Promise<void>(resolve => { releaseCelebration = resolve; });
    let advanced = false;

    const pending = createWithTrophyGate({
      arm: () => ({ wait: () => dismissed }),
      create: async () => 'habit',
    }).then(() => { advanced = true; });

    // Drain every pending microtask. A single `await Promise.resolve()` is not
    // enough: the awaits inside the helper resolve over several ticks, so the
    // assertion would pass even against a version that never waits at all
    // (found by deliberately breaking it).
    await new Promise(resolve => setImmediate(resolve));

    // The user is still reading the trophy modal — onboarding must not move on.
    expect(advanced).toBe(false);

    releaseCelebration();
    await pending;
    expect(advanced).toBe(true);
  });

  it('passes the created entity through', async () => {
    const created = await createWithTrophyGate({
      arm: () => ({ wait: async () => {} }),
      create: async () => ({ id: 'h1' }),
    });
    expect(created).toEqual({ id: 'h1' });
  });

  it('never waits when creation fails', async () => {
    let waited = false;
    await expect(
      createWithTrophyGate({
        arm: () => ({ wait: async () => { waited = true; } }),
        create: async () => { throw new Error('storage full'); },
      })
    ).rejects.toThrow('storage full');
    // Waiting for a celebration that will never come would hang the screen.
    expect(waited).toBe(false);
  });
});

describe('habit presets', () => {
  it('offers six ready-made habits', () => {
    expect(HABIT_PRESETS).toHaveLength(6);
  });

  it('uses ids that are unique', () => {
    const ids = HABIT_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses real icon and colour enum values', () => {
    for (const preset of HABIT_PRESETS) {
      expect(Object.values(HabitIcon)).toContain(preset.icon);
      expect(Object.values(HabitColor)).toContain(preset.color);
    }
  });

  it('points every preset at a translation key that exists in EN', () => {
    const en = readFileSync(join(__dirname, '../../../locales/en/index.ts'), 'utf8');
    for (const preset of HABIT_PRESETS) {
      const leaf = preset.nameKey.split('.').pop()!;
      expect(en).toMatch(new RegExp(`^\\s{6}${leaf}: '`, 'm'));
    }
  });

  it('schedules every day by default', () => {
    // scheduledDays is the only required field with no default in the form,
    // so an empty list would block the user on a validation error mid-flow.
    expect(ALL_DAYS).toHaveLength(7);
    expect(new Set(ALL_DAYS)).toEqual(new Set(Object.values(DayOfWeek)));
    expect(CUSTOM_HABIT_DEFAULTS.scheduledDays).toHaveLength(7);
  });
});
