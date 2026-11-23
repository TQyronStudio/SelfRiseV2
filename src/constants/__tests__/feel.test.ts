import {
  FEEL,
  FeelMoment,
  feelFor,
  MAX_PATTERN_MS,
  SOUND_MOMENTS,
} from '../feel';

const moments = Object.keys(FEEL) as FeelMoment[];

describe('the feel of SelfRise', () => {
  it('makes a sound only at the rare windows', () => {
    for (const moment of moments) {
      if (FEEL[moment].sound !== null) {
        expect(SOUND_MOMENTS).toContain(moment);
      }
    }
    // Everyday moments stay silent.
    for (const daily of [
      'tap',
      'press',
      'check',
      'uncheck',
      'saved',
      'dayDone',
      'note',
    ] as const) {
      expect(FEEL[daily].sound).toBeNull();
    }
  });

  it('never gives a warning a sound', () => {
    expect(FEEL.invalid.sound).toBeNull();
    expect(FEEL.gentleWarning.sound).toBeNull();
  });

  it('keeps every pattern short, in order, with at most one heavy tap', () => {
    for (const moment of moments) {
      const { pattern } = FEEL[moment];
      expect(pattern.length).toBeGreaterThan(0);
      const times = pattern.map(p => p.at);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(times[times.length - 1]!).toBeLessThanOrEqual(MAX_PATTERN_MS);
      expect(pattern.filter(p => p.tap === 'heavy').length).toBeLessThanOrEqual(
        1
      );
    }
  });

  it("follows the user's switches", () => {
    expect(feelFor('chapter', { haptics: false, sounds: true })).toEqual({
      pattern: [],
      sound: 'chapter',
    });
    expect(
      feelFor('chapter', { haptics: true, sounds: false }).sound
    ).toBeNull();
    expect(
      feelFor('chapter', { haptics: true, sounds: false }).pattern
    ).toHaveLength(3);
  });
});
