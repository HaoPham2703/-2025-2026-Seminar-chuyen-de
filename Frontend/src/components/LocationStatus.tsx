import { Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface LocationStatusProps {
  isNearOffice: boolean;
}

const LocationStatus = ({ isNearOffice }: LocationStatusProps) => {
  return (
    <Animated.Text
      entering={FadeInDown.delay(400).duration(400)}
      style={styles.text}
    >
      You are 1 meter away from office
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: "hsl(25, 15%, 50%)",
    marginTop: 8,
    marginBottom: 8,
  },
});

export default LocationStatus;

