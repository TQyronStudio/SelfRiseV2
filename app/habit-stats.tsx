import React from 'react';
import { Stack } from 'expo-router';
import { IndividualHabitStatsScreen } from '@/src/screens/habits/IndividualHabitStatsScreen';
import { Colors } from '@/src/constants/colors';

export default function HabitStatsPage() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Individual Habit Stats',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: 'Habits',
        }}
      />
      <IndividualHabitStatsScreen />
    </>
  );
}