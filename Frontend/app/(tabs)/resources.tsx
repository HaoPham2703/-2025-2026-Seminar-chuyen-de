import { View, Text, StyleSheet } from 'react-native';
import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';

export default function ResourcesScreen() {
  return (
    <FadeScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Resources</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </View>
    </FadeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'hsl(30, 50%, 97%)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'hsl(25, 15%, 50%)',
  },
});

