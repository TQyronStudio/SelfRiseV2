import { Tabs } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar } from '@/src/components/ui/TabBar';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';

/**
 * The five tabs (migration E3, design-migration-plan.md): no blue header — every
 * screen draws its own top row (src/components/ui/TopRow.tsx) — and the new tab
 * bar. The Home controls that lived in the old header (trophy room, multiplier
 * timer, customize) are in Home's own top row now.
 *
 * Tabs stay mounted once visited (R-32): expo-router keeps them alive; never set
 * `unmountOnBlur` / `lazy: false` here.
 */
function TabLayoutContent() {
  const { t } = useI18n();
  const { isDark } = useTheme();

  return (
    <>
      {/* No blue header any more: the status bar icons follow the mode. */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        tabBar={props => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
        <Tabs.Screen name="habits" options={{ title: t('tabs.habits') }} />
        <Tabs.Screen name="journal" options={{ title: t('tabs.journal') }} />
        <Tabs.Screen name="goals" options={{ title: t('tabs.goals') }} />
        <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
      </Tabs>
    </>
  );
}

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <TabLayoutContent />
    </SafeAreaProvider>
  );
}
