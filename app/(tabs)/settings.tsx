import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Fonts, Layout } from '@/src/constants';

export default function SettingsScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.safeContainer} edges={[]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.placeholder}>
            {t('settings.language')} - Coming Soon
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.background,
  },
  placeholder: {
    fontSize: Fonts.sizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});