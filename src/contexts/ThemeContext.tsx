import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '../constants/colors';

// Storage key for theme preference
const THEME_STORAGE_KEY = 'user_theme_preference';

// Theme mode type
export type ThemeMode = 'light' | 'dark' | 'system';

// Theme context type
interface ThemeContextType {
  colors: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  themeMode: 'light',
  isDark: false,
  setThemeMode: async () => {},
});

// Theme Provider Props
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // State for user's theme preference
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        console.log('System theme changed to:', colorScheme);
        // Context will automatically re-render with new systemColorScheme
      });

      return () => subscription.remove();
    }

    return undefined;
  }, [themeMode]);

  // Load theme preference from AsyncStorage
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  // Save theme preference to AsyncStorage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
      console.log('Theme mode updated to:', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine the active theme based on mode and system preference
  const getActiveTheme = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const activeTheme = getActiveTheme();
  const isDark = activeTheme === 'dark';

  // Select the appropriate color palette
  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    colors,
    themeMode,
    isDark,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
