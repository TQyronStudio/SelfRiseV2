import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';

function TabLayoutContent() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* Status Bar Background - Edge-to-Edge Design */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: Colors.primary,
          zIndex: 1000,
        }}
      />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors.tabIconSelected,
            tabBarInactiveTintColor: Colors.tabIconDefault,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              backgroundColor: Colors.tabBarBackground,
              borderTopColor: 'transparent',
              borderTopWidth: 0,
              height: Platform.OS === 'ios' ? 84 : 70,
              paddingBottom: Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 20 : 10,
              paddingTop: 8,
              paddingHorizontal: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: -2,
              marginBottom: 2,
            },
            tabBarIconStyle: {
              marginBottom: 0,
            },
          }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: t('tabs.habits'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="repeat.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gratitude"
        options={{
          title: t('tabs.gratitude'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('tabs.goals'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="target" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="gearshape.fill" color={color} />,
        }}
      />
        </Tabs>
      </SafeAreaView>
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
