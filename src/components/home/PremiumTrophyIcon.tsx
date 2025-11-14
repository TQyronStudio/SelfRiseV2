import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';

interface PremiumTrophyIconProps {
  size?: number;
}

export const PremiumTrophyIcon: React.FC<PremiumTrophyIconProps> = ({
  size = 32
}) => {
  const { t } = useI18n();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    trophyContainer: {
      position: 'absolute',
    },
    trophyIcon: {
      // Shadows removed for AMOLED-friendly dark mode
    },
    labelContainer: {
      position: 'absolute',
    },
    trophyLabel: {
      fontWeight: 'bold',
      color: '#DAA520',
      letterSpacing: 0.8,
      textAlign: 'center',
      // Shadows removed for AMOLED-friendly dark mode
    },
  });

  return (
    <View style={[styles.container, { width: size * 1.4, height: size * 1.4 }]}>
      {/* Main trophy */}
      <View style={[styles.trophyContainer, {
        top: size * 0.05,
        alignSelf: 'center',
      }]}>
        <Ionicons
          name="trophy"
          size={size * 1.0}
          color="#FFD700"
          style={styles.trophyIcon}
        />
      </View>

      {/* Trophy label */}
      <View style={[styles.labelContainer, {
        bottom: size * 0.05,
        width: size * 1.3,
        alignSelf: 'center',
      }]}>
        <Text style={[styles.trophyLabel, {
          fontSize: size * 0.22,
        }]} numberOfLines={1} adjustsFontSizeToFit>
          {t('home.premiumTrophy.label').toUpperCase()}
        </Text>
      </View>
    </View>
  );
};