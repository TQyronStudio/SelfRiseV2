/**
 * Design Lab tokens — the first draft of the design system (premium-design-plan.md,
 * kap. 4 + 5). Direction decided 2026-10-22: today's colours, refined; the change
 * is in type, space, surfaces and motion.
 *
 * Lab-only for now: nothing outside src/screens/design-lab reads these. Once Petr
 * approves the look they graduate to src/design/ (phase F2) and the old
 * constants/colors.ts is phased out.
 *
 * Every text/surface pair here was checked against WCAG AA (4.5:1 text, 3:1 UI)
 * on 2026-10-22 — keep it that way when tuning (see the plan, kap. 4.1).
 *
 * GOING LIVE (1:1) — see PREVOD.md and premium-design-plan.md ch. 10:
 * - Move to src/design/ (F2); keep constants/colors.ts until nothing reads it.
 * - Re-check WCAG AA of every text/surface pair after any tweak (plan 4.1).
 * - Habit colours belong to the user (red, yellow too); status is SHAPE, never a
 *   reserved colour (lesson 18–19). Symbols on a habit colour use onHabitColor().
 * - Custom fonts: one family per weight — never fontWeight with Fraunces/Figtree
 *   (Android silently falls back to the system font).
 */

export type LabMode = 'light' | 'dark';

/**
 * Mirrors the app's HabitColor enum (8), red and yellow included. Kolo 19 (Petr):
 * users keep the colour they chose — a day's STATUS is carried by shape (dot,
 * ring, star, cross, bar), so a yellow habit's bonus or a red habit's missed day
 * still reads. (Kolo 17 had reserved red/gold and remapped them; withdrawn.)
 */
export type LabHabitColor =
  'blue' | 'green' | 'purple' | 'teal' | 'orange' | 'pink' | 'red' | 'yellow';

export interface LabPalette {
  canvas: string;
  /** Soft tint behind the top of the screen (the "morning light" of the hero). */
  canvasGlow: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** Primary as text/icon colour (AA on surface and canvas). */
  primary: string;
  /** Primary fills: buttons and progress. White text passes AA on both stops. */
  primaryGradient: readonly [string, string];
  primarySoft: string;
  onPrimary: string;
  /** Today's-progress arc. */
  arcGradient: readonly [string, string];
  /** Gold of rewards (XP). As a fill only in light mode — gold text fails on white. */
  reward: string;
  rewardSoft: string;
  rewardText: string;
  flame: string;
  flameSoft: string;
  success: string;
  successSoft: string;
  successText: string;
  track: string;
  /** Level tier 11–20 is green (technical-guides:Gamification-UI.md). */
  tierGreen: readonly [string, string];
  heroGradient: readonly [string, string];
  shadow: string;
  tabBar: string;
  /** Same hue in both modes — today's light palette calls blue "green". */
  habit: Record<LabHabitColor, string>;
  /**
   * "Missed" red. It always comes with its own shape (× in the mini week and the
   * calendar), so it never has to be told apart from a red habit by colour alone.
   */
  missed: string;
  onMissed: string;
}

const light: LabPalette = {
  canvas: '#F3F5F9',
  canvasGlow: 'rgba(30, 108, 235, 0.10)',
  surface: '#FFFFFF',
  surfaceRaised: '#F6F8FB',
  border: 'rgba(16, 24, 40, 0.07)',
  text: '#1A2233',
  textMuted: '#5D6678',
  textFaint: '#7C8598',
  primary: '#0A62D8',
  primaryGradient: ['#1E6CEB', '#0A57C7'],
  primarySoft: '#E8F0FE',
  onPrimary: '#FFFFFF',
  arcGradient: ['#7DB4FF', '#1E6CEB'],
  reward: '#F4B63F',
  rewardSoft: '#FFF4DA',
  rewardText: '#9A6400',
  flame: '#B04A12',
  flameSoft: '#FFF0E6',
  success: '#1E9E5A',
  successSoft: '#E7F6EE',
  successText: '#12703E',
  track: 'rgba(16, 24, 40, 0.07)',
  tierGreen: ['#22A565', '#157F4A'],
  heroGradient: ['#FFFFFF', '#EDF3FF'],
  shadow:
    '0px 1px 2px rgba(16, 24, 40, 0.04), 0px 12px 32px rgba(16, 24, 40, 0.07)',
  tabBar: '#FFFFFF',
  habit: {
    blue: '#2F7BF6',
    green: '#22A565',
    purple: '#7C5CE6',
    teal: '#13A3A3',
    orange: '#EE6E1F',
    pink: '#E0558E',
    red: '#E5484D',
    yellow: '#E8B500',
  },
  missed: '#B0102C',
  onMissed: '#FFFFFF',
};

const dark: LabPalette = {
  canvas: '#0E1014',
  canvasGlow: 'rgba(35, 112, 234, 0.18)',
  surface: '#171A21',
  surfaceRaised: '#1F232C',
  border: 'rgba(255, 255, 255, 0.07)',
  text: '#F3F5F9',
  textMuted: '#A0A8B8',
  textFaint: '#737C8E',
  primary: '#5A9DFF',
  primaryGradient: ['#2370EA', '#1A5AD6'],
  primarySoft: 'rgba(90, 157, 255, 0.14)',
  onPrimary: '#FFFFFF',
  arcGradient: ['#2F6FD8', '#7DB4FF'],
  reward: '#F6C350',
  rewardSoft: 'rgba(246, 195, 80, 0.14)',
  rewardText: '#F6C350',
  flame: '#FF9A4D',
  flameSoft: 'rgba(255, 154, 77, 0.14)',
  success: '#3CCB7F',
  successSoft: 'rgba(60, 203, 127, 0.14)',
  successText: '#3CCB7F',
  track: 'rgba(255, 255, 255, 0.08)',
  tierGreen: ['#22A565', '#157F4A'],
  heroGradient: ['#1A1E27', '#13213A'],
  shadow: '0px 12px 32px rgba(0, 0, 0, 0.35)',
  tabBar: '#15181E',
  habit: {
    blue: '#4C8DFF',
    green: '#3CCB7F',
    purple: '#9B82FF',
    teal: '#2CC4C4',
    orange: '#F57A2E',
    pink: '#F57AD0',
    red: '#FF6B6B',
    yellow: '#FFD43B',
  },
  missed: '#E0213D',
  onMissed: '#FFFFFF',
};

export const labPalettes: Record<LabMode, LabPalette> = { light, dark };

/**
 * Time of day drives the hero's sky and the colour of the "sun" on the day arc —
 * the screen quietly matches the moment the user opens it. At night the sun is a moon.
 */
export type LabDaypart = 'morning' | 'day' | 'evening' | 'night';

export function getDaypart(hour: number): LabDaypart {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export const labSky: Record<
  LabMode,
  Record<LabDaypart, readonly [string, string]>
> = {
  light: {
    morning: ['#FFFFFF', '#FFF2E4'],
    day: ['#FFFFFF', '#E9F2FF'],
    evening: ['#FFFFFF', '#ECE9FF'],
    night: ['#F7F8FC', '#E2E8F6'],
  },
  dark: {
    morning: ['#1A1E27', '#2B2231'],
    day: ['#1A1E27', '#13213A'],
    evening: ['#1A1E27', '#1F1B3D'],
    night: ['#15181F', '#0D1426'],
  },
};

export const labSun: Record<LabMode, Record<LabDaypart, string>> = {
  light: {
    morning: '#FFB45C',
    day: '#F4B63F',
    evening: '#FF9A55',
    night: '#8EA2D0',
  },
  dark: {
    morning: '#FFC27A',
    day: '#F6C350',
    evening: '#FFA266',
    night: '#DCE5FF',
  },
};

/**
 * Golden light laid over the hero sky as the day fills up — finishing habits
 * literally warms the screen. Opacity follows today's progress.
 */
export const labSkyGold: Record<LabMode, readonly [string, string]> = {
  light: ['rgba(255, 214, 150, 0)', 'rgba(255, 196, 110, 0.5)'],
  dark: ['rgba(255, 170, 70, 0)', 'rgba(255, 170, 70, 0.22)'],
};

/**
 * Achievement rarity, in the lab's palette. The tier names stay English everywhere
 * (technical-guides.md, "Rarity Tiers (Always English)"); colours keep their meaning
 * — silver, blue, violet, gold — but are tuned to sit on the new surfaces.
 */
export type LabRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const labRarity: Record<
  LabRarity,
  {
    label: string;
    ring: readonly [string, string];
    glow: string;
    /** Chip text per mode (gold text fails AA on a light surface, so it darkens). */
    chipText: Record<LabMode, string>;
    chipBg: Record<LabMode, string>;
    particles: number;
  }
> = {
  common: {
    label: 'COMMON',
    ring: ['#E3E8F0', '#8E99AB'],
    glow: '#C9D1DD',
    chipText: { light: '#4A5568', dark: '#D3DAE6' },
    chipBg: { light: '#EEF1F6', dark: 'rgba(201, 209, 221, 0.14)' },
    particles: 12,
  },
  rare: {
    label: 'RARE',
    ring: ['#8CC2FF', '#1E6CEB'],
    glow: '#5A9DFF',
    chipText: { light: '#0A62D8', dark: '#8CC2FF' },
    chipBg: { light: '#E8F0FE', dark: 'rgba(90, 157, 255, 0.16)' },
    particles: 14,
  },
  epic: {
    label: 'EPIC',
    ring: ['#D2B4FF', '#7C4DFF'],
    glow: '#A97CFF',
    chipText: { light: '#6A3BE0', dark: '#C9A8FF' },
    chipBg: { light: '#F1EAFF', dark: 'rgba(169, 124, 255, 0.16)' },
    particles: 16,
  },
  legendary: {
    label: 'LEGENDARY',
    ring: ['#FFE7A0', '#F09A2C'],
    glow: '#F6C350',
    chipText: { light: '#8A5A00', dark: '#FFD97A' },
    chipBg: { light: '#FFF4DA', dark: 'rgba(246, 195, 80, 0.16)' },
    particles: 22,
  },
};

/** The native splash (app.json → expo-splash-screen). The launch intro starts from this exact frame. */
export const SPLASH_BACKGROUND = '#07051A';
export const SPLASH_ICON_SIZE = 200;

/**
 * One family per weight: Android ignores `fontWeight` for a custom family and
 * silently falls back to the system font, so weights are never set separately.
 */
export const labFonts = {
  display: 'Fraunces-SemiBold',
  displayItalic: 'Fraunces-SemiBoldItalic',
  regular: 'Figtree-Regular',
  medium: 'Figtree-Medium',
  semibold: 'Figtree-SemiBold',
  bold: 'Figtree-Bold',
} as const;

export const labFontFiles = {
  [labFonts.display]: require('../../../assets/fonts/Fraunces-SemiBold.ttf'),
  [labFonts.displayItalic]: require('../../../assets/fonts/Fraunces-SemiBoldItalic.ttf'),
  [labFonts.regular]: require('../../../assets/fonts/Figtree-Regular.ttf'),
  [labFonts.medium]: require('../../../assets/fonts/Figtree-Medium.ttf'),
  [labFonts.semibold]: require('../../../assets/fonts/Figtree-SemiBold.ttf'),
  [labFonts.bold]: require('../../../assets/fonts/Figtree-Bold.ttf'),
};

export interface LabTypeStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  /** Cap for the system text-size setting — big type stops growing before it breaks the layout. */
  maxScale: number;
  uppercase?: boolean;
  /** Figtree has tabular figures; Fraunces does not, so counting numbers use Figtree. */
  tabular?: boolean;
}

export type LabTypeVariant =
  | 'display'
  | 'title'
  | 'titleSm'
  | 'number'
  | 'numberSm'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline';

export const labType: Record<LabTypeVariant, LabTypeStyle> = {
  display: {
    fontFamily: labFonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    maxScale: 1.3,
  },
  title: {
    fontFamily: labFonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    maxScale: 1.4,
  },
  titleSm: {
    fontFamily: labFonts.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    maxScale: 1.4,
  },
  number: {
    fontFamily: labFonts.semibold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
    maxScale: 1.2,
    tabular: true,
  },
  numberSm: {
    fontFamily: labFonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    maxScale: 1.4,
    tabular: true,
  },
  body: {
    fontFamily: labFonts.regular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    maxScale: 1.6,
  },
  bodyStrong: {
    fontFamily: labFonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    maxScale: 1.6,
  },
  label: {
    fontFamily: labFonts.medium,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    maxScale: 1.5,
  },
  caption: {
    fontFamily: labFonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    maxScale: 1.5,
  },
  overline: {
    fontFamily: labFonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    maxScale: 1.4,
    uppercase: true,
  },
};

/** 4/8 grid. */
export const labSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const labRadius = { sm: 12, md: 16, lg: 24, pill: 999 } as const;

/**
 * Motion language. Reanimated's default ReduceMotion.System makes every
 * withTiming/withSpring jump to its end value when the OS asks for reduced
 * motion, so nothing here needs a manual check.
 */
export const labMotion = {
  fast: 150,
  base: 250,
  slow: 400,
  /** The screen's one main movement: today's progress filling up. */
  fill: 700,
  stagger: 50,
  /** Later items enter together — a long list must not take seconds to settle. */
  maxStaggered: 6,
  riseDistance: 12,
  pressScale: 0.97,
  pressSpring: { damping: 18, stiffness: 320, mass: 0.6 },
  checkSpring: { damping: 11, stiffness: 260, mass: 0.7 },
} as const;

/**
 * Text/symbol colour that stays readable on a habit colour: dark on light
 * colours (yellow, lime…), white on the rest. Users may pick any colour, so a
 * fixed white tick would vanish on yellow (kolo 19).
 */
export function onHabitColor(hex: string): string {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return luminance > 0.4 ? '#1A2233' : '#FFFFFF';
}
