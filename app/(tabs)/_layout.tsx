import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: t('tabs.habits'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="repeat.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gratitude"
        options={{
          title: t('tabs.gratitude'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('tabs.goals'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="target" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
