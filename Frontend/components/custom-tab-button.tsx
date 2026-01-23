import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { View, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import React from 'react';

export function CustomTabButton(props: BottomTabBarButtonProps) {
  const { children, onPress, onPressIn, accessibilityState, style, ...restProps } = props;
  const isSelected = accessibilityState?.selected;
  const [pressed, setPressed] = React.useState(false);

  const buttonStyle: ViewStyle[] = [
    styles.button,
    isSelected && styles.buttonActive,
    pressed && styles.buttonPressed,
    style,
  ].filter(Boolean) as ViewStyle[];

  return (
    <PlatformPressable
      {...restProps}
      onPress={onPress}
      onPressIn={(ev) => {
        setPressed(true);
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
      onPressOut={() => setPressed(false)}
      style={buttonStyle}
    >
      <View style={styles.content}>
        {children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 12,
  },
  buttonActive: {
    backgroundColor: 'hsl(30, 20%, 92%)',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

