import { getAuthToken } from '@/src/services/api';
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  Notification,
} from '@/src/services/notificationService';
import Constants from 'expo-constants';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  connected: boolean;
  refreshNotifications: (unreadOnly?: boolean) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotificationById: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Get Socket.IO server URL (same logic as API base URL)
const getSocketUrl = () => {
  // Nếu có env variable, dùng nó (bỏ /api)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  }

  // Trên web, dùng localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // Android Emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // Auto-detect IP từ Expo dev server
  const hostUri = Constants.expoConfig?.hostUri || Constants.hostUri;
  const host = hostUri?.split(':')?.[0];
  if (host && /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return `http://${host}:3000`;
  }

  // Fallback
  return 'http://localhost:3000';
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    let mounted = true;
    let socketInstance: Socket | null = null;

    const initializeSocket = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          console.log('No auth token, skipping Socket.IO connection');
          setLoading(false);
          return;
        }

        const socketUrl = getSocketUrl();
        console.log('Connecting to Socket.IO server:', socketUrl);

        socketInstance = io(socketUrl, {
          auth: {
            token,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socketInstance.on('connect', () => {
          console.log('✅ Socket.IO connected');
          if (mounted) {
            setConnected(true);
          }
        });

        socketInstance.on('disconnect', () => {
          console.log('❌ Socket.IO disconnected');
          if (mounted) {
            setConnected(false);
          }
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          if (mounted) {
            setConnected(false);
          }
        });

        // Listen for new notifications
        socketInstance.on('new_notification', async (data: {
          notificationId: string;
          title: string;
          message: string;
          type: string;
          priority: string;
          sentAt: string;
        }) => {
          console.log('📬 New notification received via Socket.IO:', data);
          
          // Refresh notifications (this will also update unreadCount from response)
          if (mounted) {
            await refreshNotifications(false); // Load all notifications
            // Don't call refreshUnreadCount() separately - refreshNotifications() already updates it
          }
        });

        if (mounted) {
          setSocket(socketInstance);
        }
      } catch (error) {
        console.error('Error initializing Socket.IO:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeSocket();

    return () => {
      mounted = false;
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, []);

  // Load notifications on mount and when socket connects
  useEffect(() => {
    if (connected) {
      refreshNotifications(false); // Load all notifications by default
      // Don't call refreshUnreadCount() separately - refreshNotifications() already updates it
    }
  }, [connected]);

  const refreshNotifications = useCallback(async (unreadOnly: boolean = false) => {
    try {
      setLoading(true);
      const data = await getNotifications(1, 50, unreadOnly); // Load first 50 notifications
      console.log('📬 Refreshed notifications:', {
        unreadOnly,
        count: data.notifications.length,
        unreadCount: data.unreadCount,
        readStatus: data.notifications.map(n => ({ id: n.id, read: n.read, title: n.title }))
      });
      // Log unread notifications specifically
      const unreadNotifications = data.notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        console.log('⚠️ Unread notifications:', unreadNotifications.map(n => ({ id: n.id, title: n.title })));
      } else {
        console.log('✅ All notifications are read');
      }
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('📖 Marking notification as read:', notificationId);
      await markAsRead(notificationId);
      console.log('✅ Marked as read, refreshing notifications...');
      // Refresh notifications from server to get updated read status and unread count
      await refreshNotifications(false); // Load all notifications
      console.log('✅ Notifications refreshed after mark as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [refreshNotifications]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      // Refresh notifications from server to get updated read status and unread count
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [refreshNotifications]);

  const deleteNotificationById = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      // Remove from local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      // Refresh unread count
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        connected,
        refreshNotifications,
        refreshUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotificationById,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
