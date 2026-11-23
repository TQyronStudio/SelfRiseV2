/**
 * Stars — five stars, `count` of them filled (the monthly challenge's star level
 * per category). Moved from the Design Lab's ChallengeDetailConcept in migration
 * E2 (the lab keeps its copy). Read as one element: "3 / 5".
 */
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';

export function Stars({ count, size = 14 }: { count: number; size?: number }) {
  const { c } = useDesign();
  return (
    <View
      style={{ flexDirection: 'row' }}
      accessible
      accessibilityLabel={`${count} / 5`}
    >
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= count ? 'star' : 'star-outline'}
          size={size}
          color={i <= count ? c.reward : c.textFaint}
          style={{ marginLeft: i === 1 ? 0 : 2 }}
        />
      ))}
    </View>
  );
}
