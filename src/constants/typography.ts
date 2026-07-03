import { Fonts } from './fonts';

// Typography styles based on design system.
//
// INTENTIONALLY COLOR-FREE: color must always come from the active theme
// (`const { colors } = useTheme()`), e.g. `{ ...Typography.body, color: colors.text }`.
// Static colors were removed because they silently rendered light-theme text
// in dark mode whenever a consumer forgot to override them.
export const Typography = {
  // Headings
  display: {
    fontSize: Fonts.sizes.display,
    lineHeight: Fonts.lineHeights.display,
    fontWeight: Fonts.weights.bold,
  },
  heading: {
    fontSize: Fonts.sizes.xxxl,
    lineHeight: Fonts.lineHeights.xxxl,
    fontWeight: Fonts.weights.bold,
  },
  subheading: {
    fontSize: Fonts.sizes.xxl,
    lineHeight: Fonts.lineHeights.xxl,
    fontWeight: Fonts.weights.semibold,
  },

  // Body text
  body: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.regular,
  },
  bodyBold: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.semibold,
  },
  bodyLarge: {
    fontSize: Fonts.sizes.lg,
    lineHeight: Fonts.lineHeights.lg,
    fontWeight: Fonts.weights.regular,
  },

  // Small text
  caption: {
    fontSize: Fonts.sizes.sm,
    lineHeight: Fonts.lineHeights.sm,
    fontWeight: Fonts.weights.regular,
  },
  captionBold: {
    fontSize: Fonts.sizes.sm,
    lineHeight: Fonts.lineHeights.sm,
    fontWeight: Fonts.weights.semibold,
  },
  small: {
    fontSize: Fonts.sizes.xs,
    lineHeight: Fonts.lineHeights.xs,
    fontWeight: Fonts.weights.regular,
  },

  // Interactive elements
  button: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.semibold,
  },
  buttonSmall: {
    fontSize: Fonts.sizes.sm,
    lineHeight: Fonts.lineHeights.sm,
    fontWeight: Fonts.weights.semibold,
  },
  link: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.medium,
  },
} as const;
