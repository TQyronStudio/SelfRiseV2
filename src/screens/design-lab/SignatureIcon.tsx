/**
 * SelfRise's own signature icons (kolo 51, lab debt L-5, R-34; Petr 2026-11-21,
 * O-15): the star, flame and crown of the journal's bonus entries and the trophy
 * — until now the system emoji ⭐ 🔥 👑 🏆, which look different on every phone
 * and break the palette.
 *
 * - An icon FONT (assets/fonts/SelfRiseIcons.ttf, built by
 *   scripts/build-icon-font.py): sharp at any size, light even in long lists (it is
 *   text — no canvas per icon), and it needs no native module, so it works on the
 *   current build. react-native-svg is not in the app.
 * - Duotone: every icon is two glyphs drawn on top of each other — a base and a
 *   lighter core — in the app's own colours, so they sit in the palette in light
 *   and dark mode and give the depth the emoji had.
 * - Decorative by default (hidden from the screen reader): the words next to the
 *   icon carry the meaning. Pass `label` where the icon stands alone.
 *
 * GOING LIVE (1:1) — see PREVOD.md: font into the app's font loading, this
 * component into src/components/ui, colours into the tokens.
 */
import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LabMode } from './labTokens';
import { useLab } from './labPrimitives';

export type SignatureName =
  | 'star'
  | 'flame'
  | 'crown'
  | 'trophy'
  // The tab bar (kolo 51): one silhouette, the colour says which tab is open.
  | 'today'
  | 'habits'
  | 'journal'
  | 'goals'
  | 'settings';

/** Font family name as registered in labFontFiles. */
export const ICON_FONT = 'SelfRiseIcons';

const CODEPOINT: Record<SignatureName, number> = {
  star: 0xe001,
  flame: 0xe003,
  crown: 0xe005,
  trophy: 0xe007,
  today: 0xe009,
  habits: 0xe00b,
  journal: 0xe00d,
  goals: 0xe00f,
  settings: 0xe011,
};

/**
 * The font may not be in yet: a fast refresh after the font was added, or a slow
 * first start. Until it is, a private-use glyph draws as "?" — so the icon waits
 * (an empty box of its size) and loads the font itself if nobody has (kolo 51).
 */
let fontLoading: Promise<void> | null = null;
function useIconFont(): boolean {
  const [ready, setReady] = useState(() => Font.isLoaded(ICON_FONT));
  useEffect(() => {
    if (ready) return undefined;
    let alive = true;
    fontLoading ??= Font.loadAsync({
      [ICON_FONT]: require('../../../assets/fonts/SelfRiseIcons.ttf'),
    });
    fontLoading
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => {
        fontLoading = null;
      });
    return () => {
      alive = false;
    };
  }, [ready]);
  return ready;
}

/** Base and core per icon; the core is the lighter, warmer one. */
const TONES: Record<SignatureName, Record<LabMode, [string, string]>> = {
  star: { light: ['#E9A11C', '#FFD66B'], dark: ['#F4B23F', '#FFE29A'] },
  flame: { light: ['#EE6E1F', '#FFC15A'], dark: ['#FF8A3D', '#FFD27A'] },
  crown: { light: ['#D99A0B', '#FFF1C2'], dark: ['#F0B429', '#FFF4CF'] },
  trophy: { light: ['#E3A21A', '#FFE08A'], dark: ['#F2B53C', '#FFEBB0'] },
  // Tab icons always get their tones from the tab bar (active / idle).
  today: { light: ['#2F6FE4', '#F4A93F'], dark: ['#6EA3F5', '#FFC24A'] },
  habits: { light: ['#2F6FE4', '#2F6FE4'], dark: ['#6EA3F5', '#6EA3F5'] },
  journal: { light: ['#2F6FE4', '#F4A93F'], dark: ['#6EA3F5', '#FFC24A'] },
  goals: { light: ['#2F6FE4', '#2F6FE4'], dark: ['#6EA3F5', '#6EA3F5'] },
  settings: { light: ['#2F6FE4', '#2F6FE4'], dark: ['#6EA3F5', '#6EA3F5'] },
};

export function SignatureIcon({
  name,
  size = 20,
  label,
  tones,
}: {
  name: SignatureName;
  size?: number;
  /** For an icon that stands alone; otherwise it is decoration. */
  label?: string;
  /** Another pair of colours (e.g. a muted, not-yet-earned state). */
  tones?: [string, string];
}) {
  const { mode } = useLab();
  const fontReady = useIconFont();
  const [base, core] = tones ?? TONES[name][mode];
  const glyph = (cp: number, color: string) => (
    <Text
      allowFontScaling={false}
      style={[
        styles.glyph,
        { fontSize: size, lineHeight: size, width: size, color },
      ]}
    >
      {String.fromCharCode(cp)}
    </Text>
  );
  return (
    <View
      style={{ width: size, height: size }}
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {fontReady && glyph(CODEPOINT[name], base)}
      {fontReady && glyph(CODEPOINT[name] + 1, core)}
    </View>
  );
}

/**
 * The same icon inside a sentence ("+20 XP ⭐", "2 more to 🔥"): one glyph in the
 * base colour, nested in the text so it flows and scales with it.
 */
export function InlineIcon({
  name,
  color,
}: {
  name: SignatureName;
  color?: string;
}) {
  const { mode } = useLab();
  // Without the font the glyph is a "?": say nothing until it is in.
  if (!useIconFont()) return null;
  return (
    <Text
      style={{ fontFamily: ICON_FONT, color: color ?? TONES[name][mode][0] }}
    >
      {String.fromCharCode(CODEPOINT[name])}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontFamily: ICON_FONT,
    textAlign: 'center',
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false, textAlignVertical: 'center' as const }
      : null),
  },
});
