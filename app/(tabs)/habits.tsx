import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HabitsScreen } from '@/src/screens/habits';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Fonts, Layout } from '@/src/constants';

export default function HabitsTab() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.safeContainer} edges={[]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.title}>{t('habits.title')}</Text>
        </View>
        <View style={styles.content}>
          <HabitsScreen />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: Colors.primary, // Primary color extends to top edge
  },
  safeContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});