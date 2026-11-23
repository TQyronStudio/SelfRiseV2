/**
 * The token helpers (src/design/tokens.ts): withAlpha, onHabitColor, getDaypart,
 * and the shape useTheme().design hands a converted screen.
 */
import {
  designThemes,
  fixed,
  getDaypart,
  onHabitColor,
  palettes,
  withAlpha,
} from '../tokens';

describe('withAlpha()', () => {
  it('turns an opaque colour into rgba', () => {
    expect(withAlpha('#000000', 0.32)).toBe('rgba(0, 0, 0, 0.32)');
    expect(withAlpha('#F6C350', 0.5)).toBe('rgba(246, 195, 80, 0.5)');
    expect(withAlpha('#fff', 0)).toBe('rgba(255, 255, 255, 0)');
  });

  it('refuses what is not #RGB / #RRGGBB instead of drawing rgba(NaN…)', () => {
    expect(() => withAlpha(palettes.dark.primarySoft, 0.5)).toThrow(
      /not a #RGB/
    );
    expect(() => withAlpha('#12345', 0.5)).toThrow();
    expect(() => withAlpha('white', 0.5)).toThrow();
  });
});

describe('onHabitColor()', () => {
  it('keeps white where it has 3:1 and switches to ink above', () => {
    expect(onHabitColor(palettes.light.habit.blue)).toBe(fixed.white);
    expect(onHabitColor(palettes.light.habit.yellow)).toBe(fixed.ink);
    // The four dark-mode colours where a white tick was below 3:1 (E1).
    for (const name of ['purple', 'orange', 'pink', 'red'] as const) {
      expect(onHabitColor(palettes.dark.habit[name])).toBe(fixed.ink);
    }
  });
});

describe('getDaypart()', () => {
  it('splits the day at 5, 11, 17 and 22', () => {
    expect([4, 5, 10, 11, 16, 17, 21, 22, 0].map(getDaypart)).toEqual([
      'night',
      'morning',
      'morning',
      'day',
      'day',
      'evening',
      'evening',
      'night',
      'night',
    ]);
  });
});

describe('designThemes', () => {
  it('hands each mode its own palette', () => {
    expect(designThemes.light).toEqual({ mode: 'light', c: palettes.light });
    expect(designThemes.dark).toEqual({ mode: 'dark', c: palettes.dark });
  });
});
