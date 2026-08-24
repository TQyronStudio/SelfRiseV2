import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { XpPopupAnimation } from './XpPopupAnimation';
import { XpNotification } from './XpNotification';
import { useXpPopup, useXpNotification } from '../../contexts/XpAnimationContext';

interface XpAnimationContainerProps {
  children: React.ReactNode;
}

export const XpAnimationContainer: React.FC<XpAnimationContainerProps> = ({ children }) => {
  const { colors } = useTheme();
  const { activePopups, isEnabled } = useXpPopup();
  const {
    pendingNotifications,
    isNotificationVisible,
    dismissNotification,
    isAnimationEnabled
  } = useXpNotification();

  return (
    <View style={styles.container}>
      {children}
      
      {/* Render smart notification (top-level, non-disruptive) */}
      {isAnimationEnabled && (
        <XpNotification
          visible={isNotificationVisible}
          /*
           * Passed straight through. Re-mapping it here built a NEW array on
           * every render of this container (which re-renders whenever an XP
           * popup appears or disappears, i.e. constantly), defeating the memo
           * on XpNotification and making the summary bar replay its entrance
           * animation — the flicker reported from the field.
           */
          xpGains={pendingNotifications}
          onAnimationComplete={dismissNotification}
          onDismiss={dismissNotification}
        />
      )}
      
      {/* Render active XP popup animations */}
      {isEnabled && activePopups.map((popup) => (
        <XpPopupAnimation
          key={popup.id}
          visible={true}
          amount={popup.amount}
          source={popup.source}
          position={popup.position}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});