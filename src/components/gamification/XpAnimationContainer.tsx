import React from 'react';
import { View, StyleSheet } from 'react-native';
import { XpPopupAnimation } from './XpPopupAnimation';
import { useXpPopup } from '../../contexts/XpAnimationContext';

interface XpAnimationContainerProps {
  children: React.ReactNode;
}

export const XpAnimationContainer: React.FC<XpAnimationContainerProps> = ({ children }) => {
  const { activePopups, isEnabled } = useXpPopup();

  return (
    <View style={styles.container}>
      {children}
      
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