import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppStore } from '../store/appStore';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: typeof width === 'number' ? width : width,
          height,
          borderRadius,
          backgroundColor: theme.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const APODLoadingSkeleton: React.FC = () => {
  const theme = useAppStore((state) => state.theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LoadingSkeleton height={300} borderRadius={16} style={styles.imageSkeleton} />
      <View style={styles.contentContainer}>
        <LoadingSkeleton width="80%" height={28} style={styles.titleSkeleton} />
        <LoadingSkeleton width="40%" height={16} style={styles.dateSkeleton} />
        <LoadingSkeleton width="100%" height={16} style={styles.textSkeleton} />
        <LoadingSkeleton width="100%" height={16} style={styles.textSkeleton} />
        <LoadingSkeleton width="90%" height={16} style={styles.textSkeleton} />
        <LoadingSkeleton width="70%" height={16} style={styles.textSkeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {},
  container: {
    flex: 1,
    padding: 16,
  },
  imageSkeleton: {
    marginBottom: 16,
  },
  contentContainer: {
    gap: 12,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  dateSkeleton: {
    marginBottom: 8,
  },
  textSkeleton: {},
});
