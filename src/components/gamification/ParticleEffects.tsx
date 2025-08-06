import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Animated, 
  StyleSheet, 
  Dimensions,
  Easing 
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
  const particleCount = getParticleCount(type, intensity);
  const particles = useRef<Particle[]>([]);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // Get default colors based on type
  const getDefaultColors = (): string[] => {
    switch (type) {
      case 'level_up':
        return ['#4CAF50', '#8BC34A', '#CDDC39'];
      case 'milestone':
        return ['#FFD700', '#FFA500', '#FF8C00'];
      case 'achievement':
        return ['#9C27B0', '#E91E63', '#F44336'];
      case 'celebration':
        return ['#2196F3', '#03A9F4', '#00BCD4'];
      default:
        return ['#4CAF50', '#2196F3', '#FF9800'];
    }
  };

  const particleColors = colors || getDefaultColors();

  // Initialize particles
  useEffect(() => {
    if (visible) {
      particles.current = createParticles(particleCount, particleColors);
      startAnimation();
    } else {
      stopAnimations();
    }

    return () => {
      stopAnimations();
    };
  }, [visible, particleCount]);

  const createParticles = (count: number, colors: string[]): Particle[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: `particle_${index}`,
      x: new Animated.Value(screenWidth / 2),
      y: new Animated.Value(screenHeight / 2),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)] || '#FFD700',
      shape: getRandomShape(),
    }));
  };

  const getRandomShape = (): 'circle' | 'star' | 'square' => {
    const shapes: ('circle' | 'star' | 'square')[] = ['circle', 'star', 'square'];
    return shapes[Math.floor(Math.random() * shapes.length)] || 'circle';
  };

  const startAnimation = () => {
    stopAnimations(); // Clear any existing animations

    const animations = particles.current.map((particle, index) => {
      // Improved stagger timing for better visual flow
      const delay = (index * 40) % 250;
      
      // More dynamic initial positioning based on type
      const angle = (Math.PI * 2 * index) / particles.current.length;
      const startRadius = type === 'milestone' ? 30 : 20;
      
      // Enhanced final positioning with better distribution
      const endX = Math.random() * (screenWidth * 0.8) + screenWidth * 0.1;
      const endY = Math.random() * (screenHeight * 0.4) + screenHeight * 0.3;
      
      // Set initial position with slight randomization
      const initialOffsetX = (Math.random() - 0.5) * 40;
      const initialOffsetY = (Math.random() - 0.5) * 40;
      particle.x.setValue(screenWidth / 2 + Math.cos(angle) * startRadius + initialOffsetX);
      particle.y.setValue(screenHeight / 2 + Math.sin(angle) * startRadius + initialOffsetY);
      
      return Animated.sequence([
        // Delay before starting
        Animated.delay(delay),
        
        // Enhanced particle lifecycle animation
        Animated.parallel([
          // Smooth fade in with bounce
          Animated.timing(particle.opacity, {
            toValue: 0.9,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          
          // Spring scale up for more life
          Animated.spring(particle.scale, {
            toValue: type === 'milestone' ? 1.3 : 1.0,
            damping: 12,
            mass: 1,
            stiffness: 400,
            useNativeDriver: false,
          }),
        ]),
        
        // Enhanced movement and fade out
        Animated.parallel([
          // Smooth curved movement
          Animated.timing(particle.x, {
            toValue: endX,
            duration: duration - 500,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: false,
          }),
          
          // Physics-based gravity with bounce
          Animated.timing(particle.y, {
            toValue: endY,
            duration: duration - 500,
            easing: Easing.bezier(0.55, 0.055, 0.675, 0.19),
            useNativeDriver: false,
          }),
          
          // Smooth continuous rotation
          Animated.timing(particle.rotation, {
            toValue: (360 + Math.random() * 180) * (Math.random() > 0.5 ? 1 : -1),
            duration: duration - 300,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          
          // Gradual fade out
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1000,
            delay: duration - 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          
          // Final scale down with slight bounce
          Animated.timing(particle.scale, {
            toValue: 0.2,
            duration: 600,
            delay: duration - 800,
            easing: Easing.in(Easing.back(1.2)),
            useNativeDriver: false,
          }),
        ]),
      ]);
    });

    // Start all animations
    const compositeAnimation = Animated.parallel(animations);
    animationsRef.current = [compositeAnimation];
    
    compositeAnimation.start(({ finished }) => {
      if (finished && onComplete) {
        onComplete();
      }
    });
  };

  const stopAnimations = () => {
    animationsRef.current.forEach(animation => {
      animation.stop();
    });
    animationsRef.current = [];
    
    // Reset particles
    particles.current.forEach(particle => {
      particle.opacity.setValue(0);
      particle.scale.setValue(0);
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            getParticleStyle(particle.shape),
            {
              left: particle.x,
              top: particle.y,
              opacity: particle.opacity,
              transform: [
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
function getParticleCount(type: string, intensity: string): number {
  const baseCount = {
    level_up: 18,
    milestone: 35,
    achievement: 25,
    celebration: 40,
  };

  const intensityMultiplier = {
    low: 0.6,
    medium: 1,
    high: 1.8,
  };

  return Math.floor((baseCount[type as keyof typeof baseCount] || 25) * intensityMultiplier[intensity as keyof typeof intensityMultiplier]);
}

function getParticleStyle(shape: 'circle' | 'star' | 'square') {
  const baseStyle = {
    width: 10,
    height: 10,
  };

  switch (shape) {
    case 'circle':
      return {
        ...baseStyle,
        width: 12,
        height: 12,
        borderRadius: 6,
      };
    case 'star':
      return {
        ...baseStyle,
        width: 14,
        height: 14,
        // Enhanced star shape with better visual impact
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
      };
    case 'square':
      return {
        ...baseStyle,
        width: 10,
        height: 10,
        borderRadius: 2,
      };
    default:
      return {
        ...baseStyle,
        borderRadius: 5,
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
    zIndex: 999,
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