import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface LightConfettiProps {
  active: boolean;
  duration?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LightConfetti: React.FC<LightConfettiProps> = ({ active, duration = 3000 }) => {
  // Reduce to 50 pieces for better performance
  const confettiPieces = useMemo(
    () => Array.from({ length: 50 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    })),
    []
  );

  useEffect(() => {
    if (active) {
      // Start all confetti animations
      confettiPieces.forEach((piece, index) => {
        const startX = Math.random() * SCREEN_WIDTH;
        const endX = startX + (Math.random() - 0.5) * 200; // More horizontal spread
        const delay = Math.random() * 400; // More staggered start
        const animDuration = duration + (Math.random() - 0.5) * 1000; // Varying speeds

        // Reset values
        piece.translateY.setValue(0);
        piece.translateX.setValue(startX);
        piece.rotate.setValue(0);
        piece.opacity.setValue(1);

        // Animate upward
        Animated.parallel([
          Animated.timing(piece.translateY, {
            toValue: -SCREEN_HEIGHT - 100,
            duration: animDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.translateX, {
            toValue: endX,
            duration: animDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotate, {
            toValue: Math.random() > 0.5 ? 720 : -720, // More rotation
            duration: animDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: animDuration * 0.3,
            delay: delay + animDuration * 0.7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [active, confettiPieces, duration]);

  if (!active) return null;

  const colors = ['#a855f7', '#c084fc', '#e9d5ff', '#8b5cf6', '#f3e8ff', '#d8b4fe'];

  return (
    <View style={styles.container}>
      {confettiPieces.map((piece, index) => {
        const size = Math.random() * 12 + 6; // Bigger pieces (6-18px)
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = Math.random() > 0.5 ? 'circle' : 'square';

        return (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: shape === 'circle' ? size / 2 : 0,
                transform: [
                  { translateX: piece.translateX },
                  { translateY: piece.translateY },
                  {
                    rotate: piece.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: piece.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    bottom: 0,
    pointerEvents: 'none',
  },
});

export default LightConfetti;

