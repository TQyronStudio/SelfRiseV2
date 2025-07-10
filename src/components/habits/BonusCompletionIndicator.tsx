import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface BonusCompletionIndicatorProps {
  isVisible: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const BonusCompletionIndicator: React.FC<BonusCompletionIndicatorProps> = ({
  isVisible,
  size = 'medium',
  showText = true,
}) => {
  if (!isVisible) return null;
  
  const sizeConfig = {
    small: { icon: 12, text: 10 },
    medium: { icon: 16, text: 12 },
    large: { icon: 20, text: 14 },
  };
  
  const config = sizeConfig[size];
  
  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <Ionicons 
        name="star" 
        size={config.icon} 
        color={Colors.primary} 
      />
      {showText && (
        <Text style={[styles.text, { fontSize: config.text }]}>
          Bonus
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
});