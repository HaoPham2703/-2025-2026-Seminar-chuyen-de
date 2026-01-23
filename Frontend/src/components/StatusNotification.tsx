import { View, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { useEffect } from "react";

interface StatusNotificationProps {
  type: "success" | "late" | null;
  time?: string;
  onClose: () => void;
}

const StatusNotification = ({ type, time, onClose }: StatusNotificationProps) => {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (type) {
      // Show notification
      translateY.value = withTiming(0, { duration: 300 });
      // Hide after 3 seconds
      const timer = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 }, () => {
          runOnJS(onClose)();
        });
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      translateY.value = -100;
    }
  }, [type]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!type) return null;

  const isSuccess = type === "success";
  const iconBgColor = isSuccess ? "hsl(145, 60%, 45%)" : "hsl(35, 95%, 55%)";

  return (
    <Animated.View style={[styles.notification, animatedStyle]}>
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIcon, { backgroundColor: iconBgColor }]}>
          <Check size={20} color="white" strokeWidth={2} />
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>
            {isSuccess ? "On Time!" : "You're Late!"}
          </Text>
          {time && (
            <Text style={styles.notificationTime}>Clocked in at {time}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notification: {
    position: "absolute",
    top: 24,
    alignSelf: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 200,
    width: "90%",
    maxWidth: 400,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    flex: 1,
    flexDirection: "column",
  },
  notificationTitle: {
    fontWeight: "600",
    color: "hsl(25, 30%, 20%)",
  },
  notificationTime: {
    fontSize: 14,
    color: "hsl(25, 15%, 50%)",
  },
});

export default StatusNotification;

