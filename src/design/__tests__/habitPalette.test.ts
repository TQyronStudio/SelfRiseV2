/**
 * One habit palette for both modes (design-migration-plan.md E1, point 4): a
 * colour keeps its hue in light and dark — only the brightness is tuned. The old
 * palette (constants/colors.ts) called a blue "green" in light mode (hue 191°);
 * a user who picked green must see green in both modes.
 */
import { HabitColorName, palettes } from '../tokens';

function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(
    i => parseInt(hex.slice(i, i + 2), 16) / 255
  ) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h =
    max === r
      ? ((g - b) / d) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

const distance = (a: number, b: number) =>
  Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/** The hue band each named colour must stay in, in both modes. */
const BAND: Record<HabitColorName, [from: number, to: number]> = {
  red: [340, 15],
  orange: [15, 40],
  yellow: [40, 65],
  green: [90, 170],
  teal: [170, 195],
  blue: [200, 235],
  purple: [245, 285],
  pink: [290, 340],
};

const inBand = (h: number, [from, to]: [number, number]) =>
  from <= to ? h >= from && h <= to : h >= from || h <= to;

describe('habit palette', () => {
  it('has the same colours in both modes', () => {
    expect(Object.keys(palettes.dark.habit).sort()).toEqual(
      Object.keys(palettes.light.habit).sort()
    );
  });

  it.each(Object.keys(BAND) as HabitColorName[])(
    '%s keeps its hue band in both modes',
    name => {
      const light = hue(palettes.light.habit[name]);
      const dark = hue(palettes.dark.habit[name]);
      expect(inBand(light, BAND[name])).toBe(true);
      expect(inBand(dark, BAND[name])).toBe(true);
      expect(distance(light, dark)).toBeLessThanOrEqual(20);
    }
  );

  it('measures hue right', () => {
    expect(hue('#FF0000')).toBe(0);
    expect(hue('#00FF00')).toBe(120);
    expect(hue('#0000FF')).toBe(240);
    // The old light "green" was a blue.
    expect(inBand(hue('#45B7D1'), BAND.green)).toBe(false);
  });
});
