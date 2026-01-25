import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';

interface NotificationBadgeProps {
  count: number;
  size?: number;
}

const NotificationBadge = ({ count, size = 20 }: NotificationBadgeProps) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (count > 0) {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      scale.value = withSpring(0, { damping: 10, stiffness: 200 });
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();
  const fontSize = count > 99 ? 10 : 12;

  return (
    <Animated.View style={[styles.badge, { width: size, height: size }, animatedStyle]}>
      <Text style={[styles.text, { fontSize }]}>{displayCount}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'hsl(0, 70%, 55%)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
  },
  text: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NotificationBadge;
