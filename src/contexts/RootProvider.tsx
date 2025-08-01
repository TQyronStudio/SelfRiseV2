import React, { ReactNode } from 'react';
import { AppProvider } from './AppContext';
import { GamificationProvider } from './GamificationContext';
import { XpAnimationProvider } from './XpAnimationContext';
import { XpAnimationContainer } from '../components/gamification/XpAnimationContainer';
import { HabitsProvider } from './HabitsContext';
import { GratitudeProvider } from './GratitudeContext';
import { GoalsProvider } from './GoalsContext';
import { HomeCustomizationProvider } from './HomeCustomizationContext';

interface RootProviderProps {
  children: ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <AppProvider>
      <GamificationProvider>
        <XpAnimationProvider>
          <HabitsProvider>
            <GratitudeProvider>
              <GoalsProvider>
                <HomeCustomizationProvider>
                  <XpAnimationContainer>
                    {children}
                  </XpAnimationContainer>
                </HomeCustomizationProvider>
              </GoalsProvider>
            </GratitudeProvider>
          </HabitsProvider>
        </XpAnimationProvider>
      </GamificationProvider>
    </AppProvider>
  );
}