import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useTabReload } from '@/hooks/use-tab-reload';
import NotificationItem from '@/src/components/NotificationItem';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'unread' | 'read';

export default function UpdatesScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
  } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>('unread');

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications(activeTab === 'unread');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications, activeTab]);

  // Refresh notifications when screen is focused or tab changes
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Updates tab focused, refreshing notifications...', { activeTab });
      refreshNotifications(activeTab === 'unread');
      return () => {};
    }, [refreshNotifications, activeTab])
  );

  // Register reload function for tab double press
  const handleReload = React.useCallback(async () => {
    await refreshNotifications(activeTab === 'unread');
  }, [refreshNotifications, activeTab]);

  const { scrollViewRef } = useTabReload(handleReload, 'updates');

  // Refresh when tab changes
  React.useEffect(() => {
    refreshNotifications(activeTab === 'unread');
  }, [activeTab, refreshNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đánh dấu đã đọc');
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc chắn muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotificationById(notificationId);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa thông báo');
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (notificationId: string, isRead: boolean) => {
    // Navigate to notification detail page
    router.push(`/notification/${notificationId}` as any);
    
    // Mark as read if not already read
    if (!isRead) {
      try {
        await markNotificationAsRead(notificationId);
      } catch (error: any) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  return (
    <FadeScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        <RefreshableScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Thông báo</Text>
              {unreadCount > 0 && activeTab === 'unread' && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount} chưa đọc</Text>
                </View>
              )}
            </View>
            {unreadCount > 0 && activeTab === 'unread' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.7}
              >
                <Check size={20} color="hsl(30, 55%, 55%)" />
                <Text style={styles.actionText}>Đọc tất cả</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
              onPress={() => setActiveTab('unread')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
                Chưa đọc
              </Text>
              {unreadCount > 0 && activeTab === 'unread' && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'read' && styles.tabActive]}
              onPress={() => setActiveTab('read')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'read' && styles.tabTextActive]}>
                Đã đọc
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="hsl(30, 55%, 55%)" />
              <Text style={styles.loadingText}>Đang tải thông báo...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo đã đọc'}
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification.id, notification.read)}
                  onMarkAsRead={() => markNotificationAsRead(notification.id)}
                  delay={index * 50}
                />
              ))}
            </View>
          )}
        </RefreshableScrollView>
      </SafeAreaView>
    </FadeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(30, 50%, 97%)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  unreadBadge: {
    backgroundColor: 'hsl(0, 70%, 55%)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: 'hsl(30, 55%, 55%)',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'hsl(25, 15%, 50%)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: 'hsl(25, 15%, 50%)',
  },
  notificationsList: {
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'hsl(30, 40%, 95%)',
  },
  tabActive: {
    backgroundColor: 'hsl(30, 55%, 55%)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(25, 15%, 50%)',
  },
  tabTextActive: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: 'hsl(0, 70%, 55%)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
});

