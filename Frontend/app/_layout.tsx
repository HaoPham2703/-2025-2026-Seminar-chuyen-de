import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsProvider, useSettings } from '@/src/contexts/SettingsContext';
import { NotificationProvider } from '@/src/contexts/NotificationContext';
import { AUTH_UNAUTHORIZED_EVENT } from '@/src/services/api';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { currentTheme } = useSettings();
  const router = useRouter();

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(AUTH_UNAUTHORIZED_EVENT, () => {
      router.replace('/login');
    });

    return () => {
      sub.remove();
    };
  }, [router]);

  return (
    <ThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="notification/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </SettingsProvider>
  );
}
