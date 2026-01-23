import { Pressable, View, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSpring, interpolate } from "react-native-reanimated";
import { Clock } from "lucide-react-native";
import { useEffect } from "react";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

interface ClockButtonProps {
  isClockedIn: boolean;
  isLate?: boolean;
  onClick: () => void;
}

const ClockButton = ({ isClockedIn, isLate = false, onClick }: ClockButtonProps) => {
  // Pulse ring animations - matching CSS pulseRing animation
  const pulse1Progress = useSharedValue(0);
  const pulse2Progress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Pulse ring 1: 2s ease-in-out infinite
    pulse1Progress.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
    // Pulse ring 2: 2s ease-in-out infinite 0.5s delay
    pulse2Progress.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const pulse1Style = useAnimatedStyle(() => {
    const scale = interpolate(pulse1Progress.value, [0, 0.5, 1], [0.9, 1.1, 0.9]);
    const opacity = interpolate(pulse1Progress.value, [0, 0.5, 1], [0.4, 0.2, 0.4]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const pulse2Style = useAnimatedStyle(() => {
    const scale = interpolate(pulse2Progress.value, [0, 0.5, 1], [0.9, 1.1, 0.9]);
    const opacity = interpolate(pulse2Progress.value, [0, 0.5, 1], [0.4, 0.2, 0.4]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1.05);
    setTimeout(() => {
      buttonScale.value = withSpring(1);
    }, 150);
  };

  // Colors from CSS
  // When not clocked in: orange/yellow
  // When clocked in on time: green
  // When clocked in late: red
  const clockInGradient = ["hsl(35, 90%, 55%)", "hsl(30, 80%, 60%)"];
  const clockOutGradient = isClockedIn 
    ? (isLate 
        ? ["hsl(0, 75%, 55%)", "hsl(0, 65%, 50%)"] // Red when late
        : ["hsl(145, 60%, 45%)", "hsl(145, 55%, 50%)"]) // Green when on time
    : ["hsl(0, 75%, 55%)", "hsl(0, 65%, 50%)"];
  const ringColor = isClockedIn 
    ? (isLate 
        ? "hsl(0, 75%, 55%)" // Red when late
        : "hsl(145, 60%, 45%)") // Green when on time
    : "hsl(35, 90%, 55%)"; // Orange when not clocked in

  return (
    <View style={styles.container}>
      {/* Pulse Ring 1 - 180px, opacity 0.3 */}
      <Animated.View
        style={[
          styles.pulseRing,
          { width: 180, height: 180 },
          pulse1Style,
          {
            backgroundColor: ringColor,
            opacity: 0.3,
          },
        ]}
      />

      {/* Pulse Ring 2 - 180px, opacity 0.2, delay 0.5s */}
      <Animated.View
        style={[
          styles.pulseRing,
          { width: 180, height: 180 },
          pulse2Style,
          {
            backgroundColor: ringColor,
            opacity: 0.2,
          },
        ]}
      />

      {/* Main button - 160px */}
      <Animated.View style={buttonAnimatedStyle}>
        <Pressable
          onPress={onClick}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.button}
        >
          <Svg width={160} height={160} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={isClockedIn ? clockOutGradient[0] : clockInGradient[0]} />
                <Stop offset="100%" stopColor={isClockedIn ? clockOutGradient[1] : clockInGradient[1]} />
              </LinearGradient>
            </Defs>
            <Rect width="160" height="160" rx="80" fill="url(#buttonGradient)" />
          </Svg>
          <View style={styles.buttonContent}>
            <Clock size={40} color="white" strokeWidth={2} />
            <Text style={styles.buttonText}>
              {isClockedIn ? "Clock Out" : "Clock In"}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pulseRing: {
    position: "absolute",
    borderRadius: 90,
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: "hsla(35, 90%, 55%, 0.5)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginTop: 8,
  },
});

export default ClockButton;

