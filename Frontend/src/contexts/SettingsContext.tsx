import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Platform, Alert } from 'react-native';
import { setLanguage } from '@/src/utils/i18n';

const SETTINGS_KEY = '@dacn_app_settings';

export interface AppSettings {
  notifications: {
    enabled: boolean;
    clockInReminder: boolean;
    attendanceSummary: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: 'vi' | 'en';
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
  };
}

const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    clockInReminder: true,
    attendanceSummary: true,
  },
  theme: 'light',
  language: 'vi',
  privacy: {
    showEmail: true,
    showPhone: false,
  },
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  currentTheme: 'light' | 'dark';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Tính toán theme hiện tại dựa trên settings và system
  const currentTheme: 'light' | 'dark' = 
    settings.theme === 'auto' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : settings.theme;

  useEffect(() => {
    loadSettings();
    setupNotifications();
  }, []);

  // Setup notifications khi settings thay đổi
  useEffect(() => {
    setupNotifications();
  }, [settings.notifications]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedSettings = { ...defaultSettings, ...parsed };
        setSettings(loadedSettings);
        // Apply language on load
        setLanguage(loadedSettings.language);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupNotifications = async () => {
    try {
      // Dynamic import để tránh lỗi nếu expo-notifications chưa được cài
      let Notifications;
      try {
        Notifications = await import('expo-notifications');
      } catch (e) {
        console.warn('expo-notifications not available, skipping notification setup');
        return;
      }

      if (settings.notifications.enabled) {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
          return;
        }

        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // Cancel existing notifications
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule clock-in reminder if enabled
        if (settings.notifications.clockInReminder) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Nhắc nhở chấm công',
              body: 'Đã đến giờ chấm công vào ca. Đừng quên chấm công nhé!',
              sound: true,
            },
            trigger: {
              hour: 9,
              minute: 0,
              repeats: true,
            },
          });
        }

        // Schedule attendance summary if enabled
        if (settings.notifications.attendanceSummary) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Tóm tắt chấm công',
              body: 'Xem lại thống kê chấm công hôm nay của bạn',
              sound: true,
            },
            trigger: {
              hour: 18,
              minute: 0,
              repeats: true,
            },
          });
        }
      } else {
        // Cancel all notifications if disabled
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (e) {
          // Ignore if Notifications is not available
        }
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      setSettings(updated);
      
      // Apply language change immediately
      if (newSettings.language) {
        setLanguage(newSettings.language);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      setSettings(defaultSettings);
      await setupNotifications();
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  };

  if (loading) {
    return null; // Hoặc có thể return loading spinner
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        currentTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
