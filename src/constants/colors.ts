// Application color themes for light and dark modes

// Light theme colors (current app design)
export const lightColors = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#357ABD',
  primaryLight: '#7BB3F0',

  // Secondary colors
  secondary: '#F39C12',
  secondaryDark: '#E67E22',
  secondaryLight: '#F8C471',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#E9ECEF',

  // Text colors
  text: '#212529',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  textInverse: '#FFFFFF',

  // Status colors
  success: '#28A745',
  successLight: '#D4EDDA',
  warning: '#FFC107',
  warningLight: '#FFF3CD',
  error: '#DC3545',
  errorLight: '#F8D7DA',
  info: '#17A2B8',
  infoLight: '#D1ECF1',

  // Habit colors
  habitRed: '#FF6B6B',
  habitBlue: '#4ECDC4',
  habitGreen: '#45B7D1',
  habitYellow: '#F9CA24',
  habitPurple: '#6C5CE7',
  habitOrange: '#FD79A8',
  habitPink: '#FDCB6E',
  habitTeal: '#00B894',

  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
  green: '#28A745',
  gold: '#FFD700',
  gray: '#6C757D',

  // UI colors
  border: '#DEE2E6',
  borderLight: '#F1F3F4',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  accent: '#E83E8C',

  // Navigation colors
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E9ECEF',
  tabIconDefault: '#ADB5BD',
  tabIconSelected: '#007AFF',
} as const;

// Dark theme colors (iOS-style dark mode with #1C1C1E base)
export const darkColors = {
  // Primary colors - brighter for better contrast on dark background
  primary: '#0A84FF',
  primaryDark: '#409CFF',
  primaryLight: '#5EB0FF',

  // Secondary colors - adjusted for dark mode
  secondary: '#FFB340',
  secondaryDark: '#FFA020',
  secondaryLight: '#FFC870',

  // Background colors - iOS-style dark grays (not pure black)
  background: '#1C1C1E',
  backgroundSecondary: '#2C2C2E',
  backgroundTertiary: '#3A3A3C',

  // Text colors - inverted for readability
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#98989D',
  textTertiary: '#636366',
  textInverse: '#000000',

  // Status colors - slightly brighter for visibility
  success: '#32D74B',
  successLight: '#1E4620',
  warning: '#FFD60A',
  warningLight: '#4D3A00',
  error: '#FF453A',
  errorLight: '#4D1B1B',
  info: '#64D2FF',
  infoLight: '#1A3A4D',

  // Habit colors - adjusted saturation for dark mode
  habitRed: '#FF6B6B',
  habitBlue: '#64D2FF',
  habitGreen: '#5AC8FA',
  habitYellow: '#FFD60A',
  habitPurple: '#BF5AF2',
  habitOrange: '#FF9F0A',
  habitPink: '#FF375F',
  habitTeal: '#5AC8FA',

  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
  green: '#32D74B',
  gold: '#FFD700',
  gray: '#8E8E93',

  // UI colors - adjusted for dark mode
  border: '#38383A',
  borderLight: '#2C2C2E',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  accent: '#FF375F',

  // Navigation colors
  tabBarBackground: '#1C1C1E',
  tabBarBorder: '#38383A',
  tabIconDefault: '#8E8E93',
  tabIconSelected: '#0A84FF',
} as const;

// Type for theme colors - removes 'as const' literal types to allow both themes
export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

// Legacy export for backward compatibility during refactoring
// TODO: Remove this after all components are migrated to useTheme hook
export const Colors = lightColors;