import React from 'react';
import { View, StyleSheet } from 'react-native';
import { XpPopupAnimation } from './XpPopupAnimation';
import { XpNotification } from './XpNotification';
import { useXpPopup, useXpNotification } from '../../contexts/XpAnimationContext';

interface XpAnimationContainerProps {
  children: React.ReactNode;
}

export const XpAnimationContainer: React.FC<XpAnimationContainerProps> = ({ children }) => {
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
      
      {/* Render smart notification (top-level, non-disruptive) - DISABLED to fix duplicates */}
      {false && isAnimationEnabled && (
        <XpNotification
          visible={isNotificationVisible}
          xpGains={pendingNotifications.map(notification => ({
            id: notification.id,
            amount: notification.amount,
            source: notification.source,
            timestamp: notification.timestamp,
          }))}
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