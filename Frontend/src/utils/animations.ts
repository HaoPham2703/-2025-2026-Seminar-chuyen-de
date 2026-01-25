/**
 * Animation utilities sử dụng react-native-reanimated
 */
import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

/**
 * Shake animation cho input khi có lỗi
 */
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return { shake, animatedStyle };
};

/**
 * Fade in animation cho error messages
 */
export const useFadeInAnimation = (isVisible: boolean) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-10);

  if (isVisible) {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 15 });
  } else {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-10, { duration: 200 });
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return animatedStyle;
};

/**
 * Slide up animation cho form elements
 */
export const useSlideUpAnimation = (delay: number = 0) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withTiming(0, { duration: 400 });
      opacity.value = withTiming(1, { duration: 400 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  return animatedStyle;
};

/**
 * Pulse animation cho logo
 */
export const usePulseAnimation = () => {
  const scale = useSharedValue(1);

  const pulse = () => {
    scale.value = withSequence(
      withTiming(1.1, { duration: 300 }),
      withTiming(1, { duration: 300 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return { pulse, animatedStyle };
};

/**
 * Scale animation cho buttons khi press
 */
export const useButtonPressAnimation = () => {
  const scale = useSharedValue(1);

  const pressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const pressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return { pressIn, pressOut, animatedStyle };
};
