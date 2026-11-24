/**
 * WCAG AA for every text/surface pair of the new look, in both modes
 * (design-migration-plan.md E1, point 5). Text needs 4.5:1; large text (≥ 24 px,
 * or ≥ 18.66 px bold), icons and chart marks need 3:1. Translucent colours are
 * laid over the surface they sit on, as the screen draws them.
 */
import {
  DesignMode,
  fixed,
  night,
  HabitColorName,
  onHabitColor,
  palettes,
  rarity,
  Rarity,
  tier,
  TierId,
} from '../tokens';

type RGB = [number, number, number];

function parse(color: string, under: RGB = [255, 255, 255]): RGB {
  if (color.startsWith('#')) {
    const h = color.slice(1);
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as RGB;
  }
  const parts = color
    .replace(/rgba?\(|\)/g, '')
    .split(',')
    .map(Number);
  const a = parts.length > 3 ? parts[3]! : 1;
  return [0, 1, 2].map(i => parts[i]! * a + under[i]! * (1 - a)) as RGB;
}

function luminance([r, g, b]: RGB): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Contrast of `fg` on `bg`; a translucent `bg` lies on `base`. */
function contrast(fg: string, bg: string, base = '#FFFFFF'): number {
  const back = parse(bg, parse(base));
  const front = parse(fg, back);
  const [hi, lo] = [luminance(front), luminance(back)].sort((a, b) => b - a);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = 4.5;
const LARGE_OR_MARK = 3;
const MODES: DesignMode[] = ['light', 'dark'];

describe.each(MODES)('contrast in %s mode', mode => {
  const c = palettes[mode];
  const grounds = {
    canvas: c.canvas,
    surface: c.surface,
    raised: c.surfaceRaised,
  };

  it.each([
    'text',
    'textMuted',
    'primary',
    'rewardText',
    'flame',
    'successText',
    'danger',
    'ice',
  ] as const)('%s reads as text on every ground', role => {
    const failing = Object.entries(grounds)
      .filter(([, bg]) => contrast(c[role], bg) < TEXT)
      .map(([name]) => name);
    expect(failing).toEqual([]);
  });

  it('textFaint is a hint: at least 3:1 everywhere (plan 4.1)', () => {
    for (const bg of Object.values(grounds)) {
      expect(contrast(c.textFaint, bg)).toBeGreaterThanOrEqual(LARGE_OR_MARK);
    }
  });

  it('coloured text reads on its own soft background', () => {
    const on = (fg: string, soft: string) => contrast(fg, soft, c.surface);
    expect(on(c.primary, c.primarySoft)).toBeGreaterThanOrEqual(TEXT);
    expect(on(c.rewardText, c.rewardSoft)).toBeGreaterThanOrEqual(TEXT);
    expect(on(c.flame, c.flameSoft)).toBeGreaterThanOrEqual(TEXT);
    expect(on(c.successText, c.successSoft)).toBeGreaterThanOrEqual(TEXT);
    // The frozen streak card: its title is ice on iceSoft.
    expect(on(c.ice, c.iceSoft)).toBeGreaterThanOrEqual(TEXT);
  });

  it('text reads on the primary button, missed and danger fills', () => {
    for (const stop of c.primaryGradient) {
      expect(contrast(c.onPrimary, stop)).toBeGreaterThanOrEqual(TEXT);
    }
    expect(contrast(c.onMissed, c.missed)).toBeGreaterThanOrEqual(TEXT);
    // The confirm button (delete, start fresh).
    expect(contrast(c.onDanger, c.danger)).toBeGreaterThanOrEqual(TEXT);
  });

  it.each(Object.keys(c.habit) as HabitColorName[])(
    'the symbol on a %s habit stays visible',
    name => {
      const fill = c.habit[name];
      expect(contrast(onHabitColor(fill), fill)).toBeGreaterThanOrEqual(
        LARGE_OR_MARK
      );
    }
  );

  it('chart marks and the missed × stand out from the surface', () => {
    for (const mark of [
      c.chart.primary,
      c.chart.bonus,
      c.chart.success,
      c.missed,
    ]) {
      expect(contrast(mark, c.surface)).toBeGreaterThanOrEqual(LARGE_OR_MARK);
    }
  });

  it.each(Object.keys(tier) as TierId[])(
    'tier %s: label and number read',
    id => {
      const t = tier[id];
      expect(contrast(t.text[mode], c.surface)).toBeGreaterThanOrEqual(TEXT);
      expect(contrast(t.text[mode], c.canvas)).toBeGreaterThanOrEqual(TEXT);
      expect(
        contrast(t.text[mode], t.soft[mode], c.surface)
      ).toBeGreaterThanOrEqual(TEXT);
      // A number sits on the darker stop only.
      expect(contrast(t.on, t.fill[1])).toBeGreaterThanOrEqual(TEXT);
    }
  );

  it.each(Object.keys(rarity) as Rarity[])('rarity %s: the chip reads', id => {
    const r = rarity[id];
    expect(
      contrast(r.chipText[mode], r.chipBg[mode], c.surface)
    ).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(r.chipText[mode], c.surface)).toBeGreaterThanOrEqual(TEXT);
  });
});

describe('the first-run night (always dark)', () => {
  const grounds = [night.background, ...night.skies.flat()];

  it('white and muted text read on every sky of the scenes', () => {
    for (const bg of grounds) {
      expect(contrast(night.text, bg)).toBeGreaterThanOrEqual(TEXT);
      expect(contrast(night.textMuted, bg, bg)).toBeGreaterThanOrEqual(TEXT);
    }
  });

  it('ink reads on a white chip', () => {
    expect(contrast(night.ink, fixed.white)).toBeGreaterThanOrEqual(TEXT);
  });
});

describe('fixed colours', () => {
  it('ink on gold reads (a number or star on the reward gold)', () => {
    for (const gold of fixed.gold) {
      expect(contrast(fixed.goldInk, gold)).toBeGreaterThanOrEqual(TEXT);
    }
  });
});

describe('contrast()', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    // A translucent black over white is a grey.
    expect(contrast('#FFFFFF', 'rgba(0, 0, 0, 0.5)')).toBeCloseTo(
      contrast('#FFFFFF', '#808080'),
      1
    );
  });
});
