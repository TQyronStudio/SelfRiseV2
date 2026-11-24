import React from 'react';
import { View, StyleSheet } from 'react-native';

interface XpAnimationContainerProps {
  children: React.ReactNode;
}

export const XpAnimationContainer: React.FC<XpAnimationContainerProps> = ({ children }) => {
  // E7 (R-10): the summary bar (XpNotification) and the popups (XpPopupAnimation)
  // are replaced by the level badge and its sparks (src/components/xp/XpDisplay.tsx).
  // Disconnected here; the files and their tests go in E26.
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});