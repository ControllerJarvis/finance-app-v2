import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../lib/theme';

type ProgressBarProps = {
  progress: number;
  color?: string;
  height?: number;
  breached?: boolean;
};

export function ProgressBar({ progress, color = Colors.primary, height = 10, breached = false }: ProgressBarProps) {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;
  const clamped = Math.min(Math.max(progress, 0), 1);

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clamped,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, animatedWidth]);

  const barColor = breached ? Colors.error : color;

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
});
