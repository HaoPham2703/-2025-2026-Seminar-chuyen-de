import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useTabReload } from '@/hooks/use-tab-reload';

export default function ResourcesScreen() {
  const handleReload = useCallback(async () => {
    // Reload logic nếu có
    console.log('Reloading resources...');
  }, []);

  const { scrollViewRef } = useTabReload(handleReload, 'resources');

  return (
    <FadeScreenWrapper>
      <RefreshableScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        onRefresh={handleReload}
      >
        <Text style={styles.title}>Resources</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </RefreshableScrollView>
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

