import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface StatCardProps {
  label: string;
  value: string;
  delay?: number;
}

const StatCard = ({ label, value, delay = 0 }: StatCardProps) => (
  <Animated.View
    entering={FadeInDown.delay(delay * 1000).duration(400)}
    style={styles.statCard}
  >
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Animated.View>
);

interface TimeStatsProps {
  workHours: string;
  breakTime: string;
  overtime: string;
  isClockedIn: boolean;
  clockInTime?: string;
}

const TimeStats = ({ workHours, breakTime, overtime, isClockedIn, clockInTime }: TimeStatsProps) => {
  if (isClockedIn && clockInTime) {
    // When clocked in, show: Check In, Work Hours, Total Hours
    return (
      <View style={styles.container}>
      <StatCard
        label="Check In"
        value={clockInTime}
        delay={0.5}
      />
      <StatCard
        label="Work Hours"
        value={workHours}
        delay={0.6}
      />
      <StatCard
        label="Total Hours"
        value={workHours}
        delay={0.7}
      />
      </View>
    );
  }

  // When not clocked in, show: Work Hours, Break Time, Overtime
  return (
    <View style={styles.container}>
      <StatCard
        label="Working Hour"
        value={workHours}
        delay={0.5}
      />
      <StatCard
        label="Break Time"
        value={breakTime}
        delay={0.6}
      />
      <StatCard
        label="Over Time"
        value={overtime}
        delay={0.7}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "hsl(30, 40%, 95%)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "hsl(30, 25%, 88%)",
    minHeight: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "hsl(25, 30%, 20%)",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "hsl(25, 15%, 50%)",
    textAlign: "center",
  },
});

export default TimeStats;

