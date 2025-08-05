import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PremiumTrophyIconProps {
  size?: number;
}

export const PremiumTrophyIcon: React.FC<PremiumTrophyIconProps> = ({ 
  size = 32 
}) => {
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
          TROPHIES
        </Text>
      </View>
    </View>
  );
};

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
    shadowColor: '#DAA520',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  labelContainer: {
    position: 'absolute',
  },
  trophyLabel: {
    fontWeight: 'bold',
    color: '#DAA520',
    letterSpacing: 0.8,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
});