import React, { ReactNode } from 'react';
import { AppProvider } from './AppContext';
import { GamificationProvider } from './GamificationContext';
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
        <HabitsProvider>
          <GratitudeProvider>
            <GoalsProvider>
              <HomeCustomizationProvider>
                {children}
              </HomeCustomizationProvider>
            </GoalsProvider>
          </GratitudeProvider>
        </HabitsProvider>
      </GamificationProvider>
    </AppProvider>
  );
}