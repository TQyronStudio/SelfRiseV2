import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isTablet = (): boolean => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;

  // Consider devices with width > 1000 logical pixels as tablets
  return (
    Math.min(adjustedWidth, adjustedHeight) > 1000 ||
    (SCREEN_WIDTH > 768 && SCREEN_HEIGHT > 1024)
  );
};

export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

// Screen size categories
export enum ScreenSize {
  SMALL = 'small',    // < 375px width (iPhone SE, small phones)
  MEDIUM = 'medium',  // 375-414px width (iPhone 6/7/8, iPhone X/11)
  LARGE = 'large',    // 414-768px width (iPhone Plus, large phones)
  TABLET = 'tablet'   // > 768px width (iPad, tablets)
}

export const getScreenSize = (): ScreenSize => {
  if (isTablet()) return ScreenSize.TABLET;
  if (SCREEN_WIDTH < 375) return ScreenSize.SMALL;
  if (SCREEN_WIDTH < 414) return ScreenSize.MEDIUM;
  return ScreenSize.LARGE;
};

// Responsive values based on screen size
export const getResponsiveValue = (values: {
  small?: number;
  medium?: number;
  large?: number;
  tablet?: number;
  default: number;
}): number => {
  const screenSize = getScreenSize();
  return values[screenSize] || values.default;
};

// Font scaling
export const scaleFont = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base scale on iPhone X/11 width
  const newSize = size * scale;

  // Prevent fonts from getting too small or too large
  const minSize = size * 0.8;
  const maxSize = size * 1.3;

  return Math.max(minSize, Math.min(newSize, maxSize));
};

// Responsive spacing
export const getSpacing = (baseSize: number): number => {
  return getResponsiveValue({
    small: baseSize * 0.75,
    medium: baseSize,
    large: baseSize * 1.1,
    tablet: baseSize * 1.25,
    default: baseSize
  });
};

// Modal width calculation
export const getModalWidth = (): number => {
  const maxWidth = getResponsiveValue({
    small: SCREEN_WIDTH - 32, // 16px margin on each side
    medium: SCREEN_WIDTH - 40, // 20px margin on each side
    large: Math.min(SCREEN_WIDTH - 40, 420),
    tablet: Math.min(SCREEN_WIDTH - 80, 500), // Larger margin and max width for tablets
    default: Math.min(SCREEN_WIDTH - 40, 400)
  });

  return maxWidth;
};

// Content positioning for overlays
export const getContentBottomPosition = (): number => {
  return getResponsiveValue({
    small: 80,  // Less space on small screens
    medium: 100,
    large: 120,
    tablet: 140, // More space on tablets
    default: 100
  });
};

// Button sizing
export const getButtonHeight = (): number => {
  return getResponsiveValue({
    small: 48,
    medium: 52,
    large: 56,
    tablet: 60,
    default: 52
  });
};

// Skip button sizing
export const getSkipButtonSize = (): number => {
  return getResponsiveValue({
    small: 36,
    medium: 40,
    large: 44,
    tablet: 48,
    default: 40
  });
};

// Padding values
export const getCardPadding = (): number => {
  return getResponsiveValue({
    small: 18,
    medium: 24,
    large: 28,
    tablet: 32,
    default: 24
  });
};

export const getModalPadding = (): number => {
  return getResponsiveValue({
    small: 24,
    medium: 32,
    large: 36,
    tablet: 40,
    default: 32
  });
};

// Responsive margin
export const getHorizontalMargin = (): number => {
  return getResponsiveValue({
    small: 12,
    medium: 16,
    large: 20,
    tablet: 32,
    default: 16
  });
};

// Icon sizes
export const getIconSize = (baseSize: number): number => {
  return getResponsiveValue({
    small: baseSize - 2,
    medium: baseSize,
    large: baseSize + 2,
    tablet: baseSize + 4,
    default: baseSize
  });
};

// Safe area adjustments
export const getSafeAreaMultiplier = (): number => {
  return getResponsiveValue({
    small: 0.8,
    medium: 1.0,
    large: 1.1,
    tablet: 1.2,
    default: 1.0
  });
};