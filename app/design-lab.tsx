import React from 'react';
import { Redirect } from 'expo-router';
import { DesignLabScreen } from '@/src/screens/design-lab/DesignLabScreen';
import { isDesignLabEnabled } from '@/src/config/designLab';

export default function DesignLabRoute() {
  // Internal tool: a store build never opens it, not even through a deep link.
  if (!isDesignLabEnabled()) {
    return <Redirect href="/(tabs)" />;
  }
  return <DesignLabScreen />;
}
