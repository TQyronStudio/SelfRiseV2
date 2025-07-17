import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Layout } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { IndividualHabitStatsScreen } from '@/src/screens/habits/IndividualHabitStatsScreen';

export default function HabitStatsPage() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          presentation: 'card',
          animationTypeForReplace: 'push',
        }} 
      />
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={Colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Habits</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <IndividualHabitStatsScreen />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textInverse,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40, // Same width as back button for centered title
  },
});