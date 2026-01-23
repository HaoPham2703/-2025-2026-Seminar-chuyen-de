import React, { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

interface FadeScreenWrapperProps {
  children: React.ReactNode;
}

const tabOrder = ['index', 'attendance', 'updates', 'resources', 'profile'];

export function FadeScreenWrapper({ children }: FadeScreenWrapperProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const route = useRoute();
  const prevIndexRef = useRef<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const currentRouteName = route.name;
      const currentIndex = tabOrder.indexOf(currentRouteName);
      
      // Xác định hướng slide
      let slideDirection = 1; // 1 = từ phải sang trái, -1 = từ trái sang phải
      if (prevIndexRef.current !== null) {
        slideDirection = currentIndex > prevIndexRef.current ? -1 : 1;
      }
      prevIndexRef.current = currentIndex;

      // Reset và slide in
      slideAnim.setValue(slideDirection * 50);
      opacityAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Slide out khi mất focus
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: slideDirection * -50,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      };
    }, [slideAnim, opacityAnim, route.name])
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
