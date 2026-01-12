import { Tabs } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { PremiumTrophyIcon } from '@/src/components/home/PremiumTrophyIcon';
import { MultiplierCountdownTimer } from '@/src/components/gamification/MultiplierCountdownTimer';

function TabLayoutContent() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.textInverse,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: 'transparent',
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarIconStyle: {
          },
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="house.fill" color={color} />,
          tabBarButton: (props) => <HapticTab {...props} nativeID="home-tab" />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/achievements')}
              style={{ marginLeft: 16 }}
            >
              <PremiumTrophyIcon size={28} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: colors.textInverse, fontSize: 17, fontWeight: 'bold' }}>
                {t('tabs.home')}
              </Text>
              <MultiplierCountdownTimer
                size="small"
                variant="light"
                showMultiplier={false}
              />
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                // Emit event to open customization modal in HomeScreen
                const { DeviceEventEmitter } = require('react-native');
                DeviceEventEmitter.emit('openHomeCustomization');
              }}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="options" size={22} color={colors.textInverse} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: t('tabs.habits'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="repeat.circle.fill" color={color} />,
          tabBarButton: (props) => <HapticTab {...props} nativeID="habits-tab" />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t('tabs.journal'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="book.fill" color={color} />,
          tabBarButton: (props) => <HapticTab {...props} nativeID="journal-tab" />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('tabs.goals'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="target" color={color} />,
          tabBarButton: (props) => <HapticTab {...props} nativeID="goals-tab" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="gearshape.fill" color={color} />,
          tabBarButton: (props) => <HapticTab {...props} nativeID="settings-tab" />,
        }}
      />
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
