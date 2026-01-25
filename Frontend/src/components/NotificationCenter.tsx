import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Trash2 } from 'lucide-react-native';
import { useNotifications } from '@/src/contexts/NotificationContext';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ visible, onClose }: NotificationCenterProps) => {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
  } = useNotifications();

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
    if (!isRead) {
      try {
        await markNotificationAsRead(notificationId);
      } catch (error: any) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Thông báo</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount} chưa đọc</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.7}
              >
                <Check size={20} color="hsl(30, 55%, 55%)" />
                <Text style={styles.actionText}>Đọc tất cả</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color="hsl(25, 30%, 20%)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="hsl(30, 55%, 55%)" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification.id, notification.read)}
                onMarkAsRead={() => markNotificationAsRead(notification.id)}
                delay={index * 50}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(30, 50%, 97%)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'hsl(25, 15%, 50%)',
  },
});

export default NotificationCenter;
