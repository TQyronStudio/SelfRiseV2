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
 * Moved from the Design Lab in migration E2 (the lab keeps its copy — O-6). The
 * font is loaded at start (src/design/fontFiles.ts), the colours are tokens
 * (signatureTones). The font is changed only by scripts/build-icon-font.py, never
 * by hand (P78), and needs its PostScript name (src/design/__tests__/fonts.test.ts).
 * An icon inside a sentence gets a spoken label on the parent text
 * (AppText's accessibilityLabel) — the glyph itself says nothing.
 */
import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useDesign } from '@/src/contexts/ThemeContext';
import { fontFiles } from '@/src/design/fontFiles';
import { fonts, SignatureName, signatureTones } from '@/src/design/tokens';

export type { SignatureName };

/** Font family name as registered in src/design/fontFiles.ts. */
export const ICON_FONT = fonts.icons;

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
      [ICON_FONT]: fontFiles[ICON_FONT],
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
  tones?: readonly [string, string];
}) {
  const { mode } = useDesign();
  const fontReady = useIconFont();
  const [base, core] = tones ?? signatureTones[name][mode];
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
  const { mode } = useDesign();
  // Without the font the glyph is a "?": say nothing until it is in.
  if (!useIconFont()) return null;
  return (
    <Text
      style={{
        fontFamily: ICON_FONT,
        color: color ?? signatureTones[name][mode][0],
      }}
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
