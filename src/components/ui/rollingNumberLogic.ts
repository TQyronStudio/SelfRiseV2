/**
 * The pure rules of RollingNumber (tested in __tests__/rollingNumberLogic.test.ts).
 */
import type { TextStyle } from 'react-native';

const MARGIN_KEYS = [
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
] as const;

/**
 * Margins belong to the whole number, not to each digit: inside a digit's clipped
 * column a margin shifts the digit out of view (kolo 20 — "9" showed as a sliver
 * under the star, P34). Split them off onto the row.
 */
export function splitMargins(flat: TextStyle): {
  rowMargins: Partial<Pick<TextStyle, (typeof MARGIN_KEYS)[number]>>;
  ownText: TextStyle;
} {
  const rowMargins: Record<string, unknown> = {};
  const ownText: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat ?? {})) {
    if ((MARGIN_KEYS as readonly string[]).includes(key))
      rowMargins[key] = value;
    else ownText[key] = value;
  }
  return { rowMargins, ownText: ownText as TextStyle };
}

/**
 * The columns of a text: digits roll, everything else stands. Keys count from the
 * right, so "145" → "170" keeps the hundreds' column (it does not remount), and
 * `order` is the digit's place from the right — the roll reads right to left.
 */
export function rollColumns(text: string) {
  const chars = Array.from(text);
  let digitIndexFromRight = 0;
  return chars
    .map((ch, i) => ({ ch, keyFromRight: chars.length - 1 - i }))
    .reverse()
    .map(col => {
      const isDigit = /[0-9]/.test(col.ch);
      const order = isDigit ? digitIndexFromRight++ : -1;
      return { ...col, isDigit, order };
    })
    .reverse();
}
