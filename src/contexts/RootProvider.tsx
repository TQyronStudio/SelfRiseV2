import React, { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { AppProvider } from './AppContext';
// OptimizedGamificationProvider removed - components use GamificationService directly
import { XpAnimationProvider } from './XpAnimationContext';
import { XpAnimationContainer } from '../components/gamification/XpAnimationContainer';
import { HabitsProvider } from './HabitsContext';
import { GratitudeProvider } from './GratitudeContext';
import { GoalsProvider } from './GoalsContext';
import { HomeCustomizationProvider } from './HomeCustomizationContext';
import { AchievementProvider } from './AchievementContext';

interface RootProviderProps {
  children: ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <ThemeProvider>
      <AppProvider>
        <XpAnimationProvider>
          <HabitsProvider>
            <GratitudeProvider>
              <GoalsProvider>
                <AchievementProvider>
                  <HomeCustomizationProvider>
                    <XpAnimationContainer>
                      {children}
                    </XpAnimationContainer>
                  </HomeCustomizationProvider>
                </AchievementProvider>
              </GoalsProvider>
            </GratitudeProvider>
          </HabitsProvider>
        </XpAnimationProvider>
      </AppProvider>
    </ThemeProvider>
  );
}