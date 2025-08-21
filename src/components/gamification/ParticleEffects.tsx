import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Animated, 
  StyleSheet, 
  Dimensions,
  Easing,
  AccessibilityInfo 
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  color: string;
  shape: 'circle' | 'star' | 'square';
}

interface ParticleEffectsProps {
  visible: boolean;
  type: 'level_up' | 'milestone' | 'achievement' | 'celebration';
  intensity?: 'low' | 'medium' | 'high';
  colors?: string[];
  duration?: number;
  onComplete?: () => void;
}

export const ParticleEffects: React.FC<ParticleEffectsProps> = ({
  visible,
  type,
  intensity = 'medium',
  colors,
  duration = 3000,
  onComplete,
}) => {
  const particlesRef = useRef<Particle[]>([]);

  // Get default colors based on type
  const getDefaultColors = () => {
    switch (type) {
      case 'level_up':
        return ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'];
      case 'milestone':
        return ['#FF9800', '#FF5722', '#F44336', '#E91E63'];
      case 'achievement':
        return ['#9C27B0', '#673AB7', '#3F51B5', '#2196F3'];
      default:
        return ['#FFC107', '#FF9800', '#FF5722', '#4CAF50'];
    }
  };

  const effectColors = colors || getDefaultColors();

  // Create a single particle
  const createParticle = (index: number): Particle => {
    // Start at center (0, 0) and use relative movements
    const horizontalSpread = (Math.random() - 0.5) * screenWidth * 0.6; // Random horizontal spread

    return {
      id: `particle-${index}`,
      x: new Animated.Value(horizontalSpread), // Start with horizontal spread
      y: new Animated.Value(0), // Start at center
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
      color: effectColors[Math.floor(Math.random() * effectColors.length)] || '#FFC107',
      shape: getRandomShape() || 'circle',
    };
  };

  const getRandomShape = (): 'circle' | 'star' | 'square' => {
    const shapes: ('circle' | 'star' | 'square')[] = ['circle', 'star', 'square'];
    return shapes[Math.floor(Math.random() * shapes.length)] || 'circle';
  };

  // Create particles array
  useEffect(() => {
    if (!visible) {
      return;
    }

    // Create particles
    const particleCount = getParticleCount(intensity);
    particlesRef.current = Array.from({ length: particleCount }, (_, index) => 
      createParticle(index)
    );

    // Use setTimeout to defer animation start after render
    const animationTimeout = setTimeout(() => {
      // Start animation
      const animations = particlesRef.current.map((particle, index) => {
        const delay = index * 50; // Stagger animation
        
        return Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            // Fade in and scale up
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(particle.scale, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            // Move upward (relative movement from center)
            Animated.timing(particle.y, {
              toValue: -150, // Move up 150 pixels from center
              duration: duration * 0.6,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            // Rotate
            Animated.timing(particle.rotation, {
              toValue: 360,
              duration: duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          // Fade out and fall
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: duration * 0.4,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: 300, // Fall down 300 pixels from the upward position
              duration: duration * 0.4,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      // Start all animations
      Animated.parallel(animations).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }, 0);

    // Announce for accessibility (defer this too)
    if (intensity === 'high' || type === 'milestone') {
      setTimeout(() => {
        const announcement = `${type} celebration with ${intensity} intensity particle effects`;
        AccessibilityInfo.announceForAccessibility(announcement);
      }, 100);
    }

    return () => {
      clearTimeout(animationTimeout);
    };
  }, [visible, intensity, type, duration, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            getParticleStyle(particle.shape),
            {
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
                { 
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })
                },
              ],
              backgroundColor: particle.color,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Helper functions
function getParticleCount(intensity: 'low' | 'medium' | 'high'): number {
  const counts = {
    low: 15,
    medium: 25,
    high: 35,
  };
  return counts[intensity];
}

function getParticleStyle(shape: 'circle' | 'star' | 'square') {
  const baseSize = 8;
  
  switch (shape) {
    case 'circle':
      return {
        width: baseSize,
        height: baseSize,
        borderRadius: baseSize / 2,
      };
    case 'star':
      return {
        width: baseSize * 1.2,
        height: baseSize * 1.2,
        // Star shape approximation using border radius (removed transform to avoid conflicts)
        borderRadius: 2,
      };
    case 'square':
      return {
        width: baseSize,
        height: baseSize,
        borderRadius: 1,
      };
    default:
      return {
        width: baseSize,
        height: baseSize,
        borderRadius: baseSize / 2,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});