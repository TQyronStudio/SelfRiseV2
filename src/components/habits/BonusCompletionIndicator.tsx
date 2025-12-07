import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

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
  const { t } = useI18n();
  const { colors } = useTheme();

  if (!isVisible) return null;

  const sizeConfig = {
    small: { icon: 12, text: 10 },
    medium: { icon: 16, text: 12 },
    large: { icon: 20, text: 14 },
  };

  const config = sizeConfig[size];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
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
      color: colors.primary,
      marginLeft: 4,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <Ionicons
        name="star"
        size={config.icon}
        color={colors.primary}
      />
      {showText && (
        <Text style={[styles.text, { fontSize: config.text }]}>
          {t('habits.bonus')}
        </Text>
      )}
    </View>
  );
};