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
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  accent: '#E83E8C',

  // Navigation colors
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E9ECEF',
  tabIconDefault: '#ADB5BD',
  tabIconSelected: '#007AFF',

  // Elevation system (light mode uses subtle shadows)
  elevation1: '#F8F9FA',
  elevation2: '#E9ECEF',
  elevation3: '#DEE2E6',

  // Input states
  inputBackground: '#FFFFFF',
  inputBorder: '#CED4DA',
  inputBorderFocus: '#007AFF',
  inputPlaceholder: '#6C757D',
  inputDisabled: '#E9ECEF',

  // Card variations
  cardBackground: '#FFFFFF',
  cardBackgroundElevated: '#F8F9FA',
  cardBorder: '#DEE2E6',

  // Gratitude/Journal specific
  gratitudeBackground: '#FFFFFF',
  gratitudeBorder: '#007AFF',
  selfPraiseBackground: '#F8F9FA',
  selfPraiseBorder: '#28A745',
  bonusGlow: 'rgba(255, 215, 0, 0.2)',

  // Charts & Graphs
  chartPrimary: '#007AFF',
  chartSecondary: '#28A745',
  chartTertiary: '#FFC107',
  chartGrid: '#E9ECEF',
  chartAxis: '#6C757D',

  // Gamification
  xpGold: '#FFD700',
  xpBackground: 'rgba(255, 215, 0, 0.1)',
  levelBadge: '#9C27B0',
  achievementGold: '#FFD700',

  // Transparent
  transparent: 'transparent',
} as const;

// Dark theme colors (AMOLED-friendly pure black base)
export const darkColors = {
  // Primary colors - brighter for better contrast on dark background
  primary: '#1E9FFF', // Brighter, more vibrant blue for better visibility
  primaryDark: '#0A84FF',
  primaryLight: '#5CB8FF',

  // Secondary colors - adjusted for dark mode
  secondary: '#FFB340',
  secondaryDark: '#FFA020',
  secondaryLight: '#FFC870',

  // Background colors - Pure black AMOLED-friendly base
  background: '#000000',              // Pure black (AMOLED)
  backgroundSecondary: '#1C1C1E',     // Elevated surfaces
  backgroundTertiary: '#2C2C2E',      // Modals, higher elevation

  // Text colors - inverted for readability
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#98989D',
  textTertiary: '#636366',
  textInverse: '#000000',

  // Status colors - vivid for dark backgrounds
  success: '#32D74B',
  successLight: '#1E4620',
  warning: '#FFD60A',
  warningLight: '#4D3A00',
  error: '#FF453A',
  errorLight: '#4D1B1B',
  info: '#64D2FF',
  infoLight: '#1A3A4D',

  // Habit colors - vivid for dark mode visibility
  habitRed: '#FF6B6B',
  habitBlue: '#4ECDC4',
  habitGreen: '#51CF66',
  habitYellow: '#FFE66D',
  habitPurple: '#B197FC',
  habitOrange: '#FF922B',
  habitPink: '#FF6B9D',
  habitTeal: '#20C997',

  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
  green: '#32D74B',
  gold: '#FFD700',
  gray: '#8E8E93',

  // UI colors - adjusted for dark mode
  border: '#38383A',
  borderLight: '#48484A',
  shadow: 'transparent',              // No shadows in dark mode
  overlay: 'rgba(0, 0, 0, 0.85)',     // Darker overlay
  overlayLight: 'rgba(0, 0, 0, 0.6)',
  accent: '#FF375F',

  // Navigation colors
  tabBarBackground: '#1C1C1E',
  tabBarBorder: '#38383A',
  tabIconDefault: '#98989D',
  tabIconSelected: '#0A84FF',

  // Elevation system (dark mode uses lighter backgrounds)
  elevation1: '#2C2C2E',              // 1dp elevation
  elevation2: '#3A3A3C',              // 2dp elevation
  elevation3: '#48484A',              // 3dp elevation

  // Input states
  inputBackground: '#1C1C1E',
  inputBorder: '#38383A',
  inputBorderFocus: '#0A84FF',
  inputPlaceholder: '#636366',
  inputDisabled: '#2C2C2E',

  // Card variations
  cardBackground: '#1C1C1E',
  cardBackgroundElevated: '#2C2C2E',
  cardBorder: '#38383A',

  // Gratitude/Journal specific
  gratitudeBackground: '#1C1C1E',
  gratitudeBorder: '#0A84FF',
  selfPraiseBackground: '#2C2C2E',
  selfPraiseBorder: '#32D74B',
  bonusGlow: 'rgba(255, 215, 0, 0.3)',

  // Charts & Graphs
  chartPrimary: '#0A84FF',
  chartSecondary: '#32D74B',
  chartTertiary: '#FFD60A',
  chartGrid: '#2C2C2E',
  chartAxis: '#636366',

  // Gamification
  xpGold: '#FFD700',
  xpBackground: 'rgba(255, 215, 0, 0.15)',
  levelBadge: '#9C27B0',
  achievementGold: '#FFD700',

  // Transparent
  transparent: 'transparent',
} as const;

// Type for theme colors - removes 'as const' literal types to allow both themes
export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

// Legacy export for backward compatibility during refactoring
// TODO: Remove this after all components are migrated to useTheme hook
export const Colors = lightColors;