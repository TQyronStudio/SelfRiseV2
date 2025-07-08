import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Application dimension constants
export const Layout = {
  window: {
    width,
    height,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  
  // Component dimensions
  button: {
    height: 48,
    minWidth: 120,
  },
  
  input: {
    height: 48,
    minHeight: 48,
  },
  
  tab: {
    height: 60,
    iconSize: 24,
  },
  
  header: {
    height: 60,
  },
  
  card: {
    minHeight: 80,
  },
  
  // Layout breakpoints
  breakpoints: {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
  },
} as const;