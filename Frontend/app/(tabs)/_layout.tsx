import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, Bell, Folder, Settings } from 'lucide-react-native';

import { CustomTabButton } from '@/components/custom-tab-button';
import NotificationBadge from '@/src/components/NotificationBadge';
import { useNotifications } from '@/src/contexts/NotificationContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: CustomTabButton,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom, 28), // Tăng lên 28 để nhích xuống nhiều hơn
            height: 60 + Math.max(insets.bottom, 28), // Giảm height
          },
        ],
        tabBarActiveTintColor: 'hsl(25, 30%, 20%)',
        tabBarInactiveTintColor: 'hsl(25, 15%, 50%)',
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={24} 
              color={focused ? 'hsl(25, 30%, 20%)' : 'hsl(25, 15%, 50%)'} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Calendar 
              size={24} 
              color={focused ? 'hsl(25, 30%, 20%)' : 'hsl(25, 15%, 50%)'} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <Bell 
                size={24} 
                color={focused ? 'hsl(25, 30%, 20%)' : 'hsl(25, 15%, 50%)'} 
                strokeWidth={focused ? 2.5 : 2}
              />
              <View style={{ position: 'absolute', top: -4, right: -4 }}>
                <NotificationBadge count={unreadCount} size={16} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color, focused }) => (
            <Folder 
              size={24} 
              color={focused ? 'hsl(25, 30%, 20%)' : 'hsl(25, 15%, 50%)'} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Settings 
              size={24} 
              color={focused ? 'hsl(25, 30%, 20%)' : 'hsl(25, 15%, 50%)'} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Ẩn tab explore khỏi navigation bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 8,
    marginBottom: -20,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
