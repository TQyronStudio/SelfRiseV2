import { Fonts } from './fonts';
import { Colors } from './colors';

// Typography styles based on design system
export const Typography = {
  // Headings
  display: {
    fontSize: Fonts.sizes.display,
    lineHeight: Fonts.lineHeights.display,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  heading: {
    fontSize: Fonts.sizes.xxxl,
    lineHeight: Fonts.lineHeights.xxxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  subheading: {
    fontSize: Fonts.sizes.xxl,
    lineHeight: Fonts.lineHeights.xxl,
    fontWeight: Fonts.weights.semibold,
    color: Colors.text,
  },
  
  // Body text
  body: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.regular,
    color: Colors.text,
  },
  bodyBold: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.semibold,
    color: Colors.text,
  },
  bodyLarge: {
    fontSize: Fonts.sizes.lg,
    lineHeight: Fonts.lineHeights.lg,
    fontWeight: Fonts.weights.regular,
    color: Colors.text,
  },
  
  // Small text
  caption: {
    fontSize: Fonts.sizes.sm,
    lineHeight: Fonts.lineHeights.sm,
    fontWeight: Fonts.weights.regular,
    color: Colors.textSecondary,
  },
  captionBold: {
    fontSize: Fonts.sizes.sm,
    lineHeight: Fonts.lineHeights.sm,
    fontWeight: Fonts.weights.semibold,
    color: Colors.textSecondary,
  },
  small: {
    fontSize: Fonts.sizes.xs,
    lineHeight: Fonts.lineHeights.xs,
    fontWeight: Fonts.weights.regular,
    color: Colors.textSecondary,
  },
  
  // Interactive elements
  button: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.semibold,
    color: Colors.white,
  },
  buttonSmall: {
    fontSize: Fonts.sizes.sm,
    lineHeight: Fonts.lineHeights.sm,
    fontWeight: Fonts.weights.semibold,
    color: Colors.white,
  },
  link: {
    fontSize: Fonts.sizes.md,
    lineHeight: Fonts.lineHeights.md,
    fontWeight: Fonts.weights.medium,
    color: Colors.primary,
  },
} as const;