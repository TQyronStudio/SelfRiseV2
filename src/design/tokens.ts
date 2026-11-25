/**
 * Design tokens of the new look (premium redesign) — the ONLY place a colour,
 * font size, spacing, radius or motion value of a converted screen is written.
 *
 * Source: the Design Lab (src/screens/design-lab/labTokens.ts and the colours that
 * lab files wrote inline), moved here 1:1 in migration stage E1
 * (design-migration-plan.md). The lab keeps its own copy while it exists: a fix
 * made here is made in the lab too (O-6).
 *
 * Rules (checked by src/design/__tests__):
 * - Every text/surface pair passes WCAG AA (4.5:1 text, 3:1 large text and marks).
 *   Re-run the tests after any tweak.
 * - Tokens are named by ROLE (surface, textMuted…), never by shade — a third mode
 *   can be added later without touching the screens.
 * - Habit colours belong to the user (red and yellow too); a day's status is SHAPE,
 *   never a reserved colour. Symbols on a habit colour use onHabitColor().
 * - One font family per weight — never fontWeight with Fraunces/Figtree (Android
 *   silently falls back to the system font).
 * - Converted screens never write a hex/rgba colour, fontSize or borderRadius
 *   literally (the ratchet test): use these tokens and withAlpha().
 *
 * The old palette (src/constants/colors.ts) stays until nothing reads it.
 */

export type DesignMode = 'light' | 'dark';

/** Mirrors the app's HabitColor enum (8), red and yellow included. */
export type HabitColorName =
  'blue' | 'green' | 'purple' | 'teal' | 'orange' | 'pink' | 'red' | 'yellow';

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

/**
 * "#RGB" / "#RRGGBB" → [r, g, b]. Anything else (an rgba token, a typo) is a
 * programming error: it throws at once in development instead of drawing an
 * invisible "rgba(NaN, …)" colour that nobody notices.
 */
function rgbOf(hex: string): [number, number, number] {
  const short = /^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/.exec(hex);
  const long = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
  const parts = short ? short.slice(1).map(d => d + d) : long?.slice(1);
  if (!parts) {
    throw new Error(`Design tokens: "${hex}" is not a #RGB or #RRGGBB colour`);
  }
  return parts.map(p => parseInt(p, 16)) as [number, number, number];
}

/**
 * "#RRGGBB" + opacity → "rgba(r, g, b, a)" — the way to a translucent token.
 * Takes an opaque token only (not an rgba one such as `primarySoft`).
 */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Text/symbol colour that stays readable on a habit colour: white wherever it
 * keeps 3:1 (the look of a white tick), dark ink on lighter colours. Users may
 * pick any colour, so a fixed white tick would vanish on yellow.
 */
export function onHabitColor(hex: string): string {
  const [r, g, b] = rgbOf(hex).map(channel => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  // White while it keeps 3:1 on the colour (1.05 / (L + 0.05) ≥ 3 ⇔ L ≤ 0.3),
  // dark ink above. Was 0.4 until E1 (2026-11-23): a white tick on the dark-mode
  // purple, orange, pink and red was 2.4–3.0:1 (src/design/__tests__/contrast).
  return luminance > 0.3 ? fixed.ink : fixed.white;
}

// ---------------------------------------------------------------------------
// Colours that are the same in both modes
// ---------------------------------------------------------------------------

export const fixed = {
  white: '#FFFFFF',
  /** Base of every dimming scrim (animated opacity over the screen). */
  black: '#000000',
  /** Dark ink for a symbol on a light colour (onHabitColor, a star on gold). */
  ink: '#1A2233',
  /** Ink on gold — a number or symbol on the reward gold. */
  goldInk: '#4A2F00',
  /** Reward gold as a fill: XP spark, chapter seal, coin (light → deep). */
  gold: ['#FFD36B', '#F4A93F'] as const,
  /** The white-hot core of an XP spark. */
  sparkCore: '#FFF6D6',
  /** Behind the big trophy window — darker than any mode's canvas. */
  stage: '#05060C',
  /** Behind the rewarded-ad stand-in (journal warm-up: paying a frozen day). */
  stageVeil: 'rgba(5, 6, 12, 0.94)',
  /** Core tone of a white emblem on the gold medal (journal milestones). */
  goldWhite: '#FFF3C4',
} as const;

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

export interface Palette {
  canvas: string;
  /** Soft tint behind the top of the screen (the "morning light" of the hero). */
  canvasGlow: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  /** Hints only (≥ 3:1, plan 4.1) — never the only carrier of information. */
  textFaint: string;
  /** Primary as text/icon colour (AA on surface and canvas). */
  primary: string;
  /** Primary fills: buttons and progress. White text passes AA on both stops. */
  primaryGradient: readonly [string, string];
  primarySoft: string;
  onPrimary: string;
  /** Warm second tone of the "today" and "journal" tab icons. */
  accentWarm: string;
  /** Today's-progress arc. */
  arcGradient: readonly [string, string];
  /** Gold of rewards (XP). As a fill only in light mode — gold text fails on white. */
  reward: string;
  rewardSoft: string;
  rewardText: string;
  /** Where an XP spark lands on the level badge. */
  rewardHit: string;
  flame: string;
  flameSoft: string;
  success: string;
  successSoft: string;
  successText: string;
  /** Destructive actions and "you will lose this" (delete, lost stars). */
  danger: string;
  /** Text on a danger fill (the confirm button): white in light, ink in dark. */
  onDanger: string;
  /** A frozen streak — the one cold colour of the app. */
  ice: string;
  iceSoft: string;
  iceRing: string;
  track: string;
  /** Level tier 11–20 is green (technical-guides:Gamification-UI.md). */
  tierGreen: readonly [string, string];
  heroGradient: readonly [string, string];
  shadow: string;
  tabBar: string;
  /** Same hue in both modes (the old light palette called blue "green"). */
  habit: Record<HabitColorName, string>;
  /**
   * "Missed" red. It always comes with its own shape (× in the mini week and the
   * calendar), so it never has to be told apart from a red habit by colour alone.
   */
  missed: string;
  onMissed: string;
  /** Charts: marks ≥ 3:1 on the surface (the UI gold fails as a mark on white). */
  chart: {
    primary: string;
    bonus: string;
    success: string;
    /** Heat ramp, weakest → strongest. */
    ramp: readonly [string, string, string, string];
  };
}

const light: Palette = {
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
  accentWarm: '#F4A93F',
  arcGradient: ['#7DB4FF', '#1E6CEB'],
  reward: '#F4B63F',
  rewardSoft: '#FFF4DA',
  rewardText: '#9A6400',
  rewardHit: '#EE8A12',
  flame: '#B04A12',
  flameSoft: '#FFF0E6',
  success: '#1E9E5A',
  successSoft: '#E7F6EE',
  successText: '#12703E',
  danger: '#C8344A',
  onDanger: '#FFFFFF',
  ice: '#216DB3',
  iceSoft: '#E4F1FC',
  iceRing: '#7DB9EC',
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
  chart: {
    primary: '#0A62D8',
    bonus: '#B97F0E',
    success: '#1E9E5A',
    ramp: ['#86AFEF', '#5A92EA', '#2E76E2', '#0A55C2'],
  },
};

const dark: Palette = {
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
  accentWarm: '#FFC24A',
  arcGradient: ['#2F6FD8', '#7DB4FF'],
  reward: '#F6C350',
  rewardSoft: 'rgba(246, 195, 80, 0.14)',
  rewardText: '#F6C350',
  rewardHit: '#FFE08A',
  flame: '#FF9A4D',
  flameSoft: 'rgba(255, 154, 77, 0.14)',
  success: '#3CCB7F',
  successSoft: 'rgba(60, 203, 127, 0.14)',
  successText: '#3CCB7F',
  danger: '#FF8A97',
  // White on this pink-red is 2.25:1 (E4, 2026-11-23); ink is 7.07:1.
  onDanger: '#1A2233',
  ice: '#8FD0FF',
  iceSoft: 'rgba(143, 208, 255, 0.13)',
  iceRing: '#5FA9DF',
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
  chart: {
    primary: '#3F86F0',
    bonus: '#BE8A1A',
    success: '#22A062',
    ramp: ['#2F5FAF', '#3F7BDD', '#6EA3F5', '#A9CCFF'],
  },
};

export const palettes: Record<DesignMode, Palette> = { light, dark };

/**
 * Shadows of floating layers (boxShadow strings). Cards use `Palette.shadow`;
 * these are for things that float above the page.
 */
export const shadows = {
  /** A quiet note sliding out of the level badge. */
  note: '0px 8px 24px rgba(0, 0, 0, 0.16)',
  /** The undo toast after a goal log. */
  toast: '0px 8px 24px rgba(0, 0, 0, 0.25)',
  /** A journal page sliding over the one below. */
  page: '-8px 0px 24px rgba(0, 0, 0, 0.12)',
  /** The level panel dropping from the badge. */
  panel: '0px 18px 44px rgba(0, 0, 0, 0.20)',
  /** The big trophy window. */
  window: '0px 24px 60px rgba(0, 0, 0, 0.45)',
  /** The trophy medal inside the window. */
  medal: '0px 12px 30px rgba(0, 0, 0, 0.35)',
} as const;

// ---------------------------------------------------------------------------
// The hero: sky, sun and gold by time of day
// ---------------------------------------------------------------------------

/**
 * Time of day drives the hero's sky and the colour of the "sun" on the day arc —
 * the screen quietly matches the moment the user opens it. At night the sun is a moon.
 */
export type Daypart = 'morning' | 'day' | 'evening' | 'night';

export function getDaypart(hour: number): Daypart {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export const sky: Record<
  DesignMode,
  Record<Daypart, readonly [string, string]>
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

export const sun: Record<DesignMode, Record<Daypart, string>> = {
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
/**
 * The chart palette (Home's habit statistics, E11d; from the Design Lab, kolo 41).
 * Validated with the dataviz skill's palette script: done + bonus as a
 * categorical pair, the year's shades as an ordinal ramp — each against its own
 * surface. Not the UI gold: that one fails as a fill on white. On a dark surface
 * "more" is the lighter end of the ramp.
 */
export const chart: Record<
  DesignMode,
  {
    done: string;
    bonus: string;
    /** Self-praise in the journal's entry types (E13). */
    selfPraise: string;
    ramp: readonly [string, string, string, string];
  }
> = {
  light: {
    done: '#0A62D8',
    bonus: '#B97F0E',
    selfPraise: '#1E9E5A',
    ramp: ['#86AFEF', '#5A92EA', '#2E76E2', '#0A55C2'],
  },
  dark: {
    done: '#3F86F0',
    bonus: '#BE8A1A',
    selfPraise: '#22A062',
    ramp: ['#2F5FAF', '#3F7BDD', '#6EA3F5', '#A9CCFF'],
  },
};

export const skyGold: Record<DesignMode, readonly [string, string]> = {
  light: ['rgba(255, 214, 150, 0)', 'rgba(255, 196, 110, 0.5)'],
  dark: ['rgba(255, 170, 70, 0)', 'rgba(255, 170, 70, 0.22)'],
};

// ---------------------------------------------------------------------------
// Rewards: rarity and level tiers
// ---------------------------------------------------------------------------

/**
 * Achievement rarity. The tier names stay English everywhere (technical-guides.md,
 * "Rarity Tiers (Always English)"); colours keep their meaning — silver, blue,
 * violet, gold — tuned to sit on the new surfaces.
 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export const rarity: Record<
  Rarity,
  {
    label: string;
    ring: readonly [string, string];
    glow: string;
    /** Chip text per mode (gold text fails AA on a light surface, so it darkens). */
    chipText: Record<DesignMode, string>;
    chipBg: Record<DesignMode, string>;
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

/**
 * The six level tiers (technical-guides:Gamification-UI.md: grey → green → blue →
 * purple → gold → red; the colours carry meaning and stay). `fill` for bars and
 * marks, `on` for a number on the DARKER stop (`fill[1]`, AA ≥ 4.5 — never on the
 * gradient: its light end fails), `text`/`soft` for a label and its background
 * per mode (AA on surface and canvas).
 */
export type TierId =
  'beginner' | 'growing' | 'rare' | 'epic' | 'legendary' | 'mythic';

export const tier: Record<
  TierId,
  {
    fill: readonly [string, string];
    on: string;
    text: Record<DesignMode, string>;
    soft: Record<DesignMode, string>;
  }
> = {
  beginner: {
    fill: ['#9AA5B5', '#687488'],
    on: '#FFFFFF',
    text: { light: '#4A5568', dark: '#D3DAE6' },
    soft: { light: '#EEF1F6', dark: 'rgba(201, 209, 221, 0.14)' },
  },
  growing: {
    fill: ['#22A565', '#157F4A'],
    on: '#FFFFFF',
    text: { light: '#12733F', dark: '#6FDBA3' },
    soft: { light: '#E3F6EC', dark: 'rgba(34, 165, 101, 0.16)' },
  },
  rare: {
    fill: ['#5A9DFF', '#1E6CEB'],
    on: '#FFFFFF',
    text: { light: '#0A62D8', dark: '#8CC2FF' },
    soft: { light: '#E8F0FE', dark: 'rgba(90, 157, 255, 0.16)' },
  },
  epic: {
    fill: ['#A97CFF', '#7C4DFF'],
    on: '#FFFFFF',
    text: { light: '#6A3BE0', dark: '#C9A8FF' },
    soft: { light: '#F1EAFF', dark: 'rgba(169, 124, 255, 0.16)' },
  },
  legendary: {
    fill: ['#F6C350', '#F09A2C'],
    on: '#4A2F00',
    text: { light: '#8A5A00', dark: '#FFD97A' },
    soft: { light: '#FFF4DA', dark: 'rgba(246, 195, 80, 0.16)' },
  },
  mythic: {
    fill: ['#FF7A7A', '#D8304A'],
    on: '#FFFFFF',
    text: { light: '#C0243C', dark: '#FF9AA5' },
    soft: { light: '#FFE9EC', dark: 'rgba(255, 122, 122, 0.16)' },
  },
};

// ---------------------------------------------------------------------------
// Signature icons (the icon font: ⭐ 🔥 👑 🏆 and the five tabs)
// ---------------------------------------------------------------------------

export type SignatureName =
  | 'star'
  | 'flame'
  | 'crown'
  | 'trophy'
  | 'today'
  | 'habits'
  | 'journal'
  | 'goals'
  | 'settings';

/** [base, core] of each two-layer icon, per mode. */
export const signatureTones: Record<
  SignatureName,
  Record<DesignMode, readonly [string, string]>
> = {
  star: { light: ['#E9A11C', '#FFD66B'], dark: ['#F4B23F', '#FFE29A'] },
  flame: { light: ['#EE6E1F', '#FFC15A'], dark: ['#FF8A3D', '#FFD27A'] },
  crown: { light: ['#D99A0B', '#FFF1C2'], dark: ['#F0B429', '#FFF4CF'] },
  trophy: { light: ['#E3A21A', '#FFE08A'], dark: ['#F2B53C', '#FFEBB0'] },
  today: { light: ['#2F6FE4', '#F4A93F'], dark: ['#6EA3F5', '#FFC24A'] },
  habits: { light: ['#2F6FE4', '#2F6FE4'], dark: ['#6EA3F5', '#6EA3F5'] },
  journal: { light: ['#2F6FE4', '#F4A93F'], dark: ['#6EA3F5', '#FFC24A'] },
  goals: { light: ['#2F6FE4', '#2F6FE4'], dark: ['#6EA3F5', '#6EA3F5'] },
  settings: { light: ['#2F6FE4', '#2F6FE4'], dark: ['#6EA3F5', '#6EA3F5'] },
};

// ---------------------------------------------------------------------------
// Launch and first run: the night that turns into a morning
// ---------------------------------------------------------------------------

/** The native splash (app.json → expo-splash-screen). The launch intro starts from this exact frame. */
export const SPLASH_BACKGROUND = '#07051A';
export const SPLASH_ICON_SIZE = 200;

/**
 * The first-run (onboarding) and launch scenery. Always dark, whatever the mode —
 * it is the night before the user's first morning.
 */
export const night = {
  background: SPLASH_BACKGROUND,
  /** Text on a white chip/button in the night. */
  ink: '#12123A',
  /** The hill silhouette. */
  hill: '#080618',
  text: '#FFFFFF',
  /** 0.76, not the lab's first 0.72: AA (4.6:1) even on the day sky's lightest stop. */
  textMuted: 'rgba(255, 255, 255, 0.76)',
  placeholder: 'rgba(255, 255, 255, 0.5)',
  glass: 'rgba(255, 255, 255, 0.09)',
  glassLine: 'rgba(255, 255, 255, 0.16)',
  /** The sky as the scenes advance: night → first light → dawn → sunrise → day. */
  skies: [
    ['#07051A', '#0F0B2E'],
    ['#0B0A2A', '#2A1B52'],
    ['#12123A', '#4A2560'],
    ['#171845', '#6E3560'],
    ['#1E2A5C', '#8A4A4A'],
  ] as const,
  /** The rising sun, the reminder bell and the text cursor. */
  sun: '#F6C350',
  /** The cyan light of the logo. */
  glow: '#7DE3F4',
  /** The gold → blue streak that draws the logo in the launch intro. */
  streak: ['#F4B63F', '#7DB4FF'] as const,
  /** The three day slots of the first-run preview. */
  slot: { sun: '#E8A020', heart: '#E0558E', check: '#1E9E5A' },
} as const;

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

/**
 * One family per weight: Android ignores `fontWeight` for a custom family and
 * silently falls back to the system font, so weights are never set separately.
 * The files are listed in ./fontFiles.ts (loaded in app/_layout.tsx).
 */
export const fonts = {
  display: 'Fraunces-SemiBold',
  displayItalic: 'Fraunces-SemiBoldItalic',
  regular: 'Figtree-Regular',
  medium: 'Figtree-Medium',
  semibold: 'Figtree-SemiBold',
  bold: 'Figtree-Bold',
  /** The signature icons as a font (needs a PostScript name, or iOS draws "?"). */
  icons: 'SelfRiseIcons',
} as const;

export interface TypeStyle {
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

export type TypeVariant =
  | 'display'
  | 'streak'
  | 'title'
  | 'titleSm'
  | 'number'
  | 'numberMd'
  | 'numberSm'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'micro'
  | 'overline';

export const type: Record<TypeVariant, TypeStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    maxScale: 1.3,
  },
  /** The journal streak's big number next to its flame (Home card, Journal). */
  streak: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -1,
    maxScale: 1.2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    maxScale: 1.4,
  },
  titleSm: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    maxScale: 1.4,
  },
  number: {
    fontFamily: fonts.semibold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
    maxScale: 1.2,
    tabular: true,
  },
  /** The number inside a progress ring (goal detail, challenge). */
  numberMd: {
    fontFamily: fonts.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
    maxScale: 1.2,
    tabular: true,
  },
  numberSm: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    maxScale: 1.4,
    tabular: true,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    maxScale: 1.6,
  },
  bodyStrong: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    maxScale: 1.6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    maxScale: 1.5,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    maxScale: 1.5,
  },
  /** The day letters under a habit's mini week (fixed 14 pt columns). */
  micro: {
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.1,
    maxScale: 1.3,
  },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    maxScale: 1.4,
    uppercase: true,
  },
};

// ---------------------------------------------------------------------------
// Space, shape, motion
// ---------------------------------------------------------------------------

/** 4/8 grid. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Cards 24, sheets and windows 28, buttons and chips a pill, small elements 12. */
export const radius = {
  /** The smallest corners: make-up brackets, tiny tags. */
  xs: 3,
  sm: 12,
  md: 16,
  lg: 24,
  /** Bottom sheets (top corners) and celebration windows. */
  xl: 28,
  pill: 999,
} as const;

/**
 * Motion language. Reanimated's default ReduceMotion.System makes every
 * withTiming/withSpring jump to its end value when the OS asks for reduced
 * motion, so nothing here needs a manual check.
 */
export const motion = {
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

// ---------------------------------------------------------------------------
// What useTheme() hands a converted screen
// ---------------------------------------------------------------------------

/** The tokens of the current mode — `useTheme().design` (the lab's `useLab()`). */
export interface DesignTheme {
  mode: DesignMode;
  /** The palette of the current mode. */
  c: Palette;
}

export const designThemes: Record<DesignMode, DesignTheme> = {
  light: { mode: 'light', c: light },
  dark: { mode: 'dark', c: dark },
};
