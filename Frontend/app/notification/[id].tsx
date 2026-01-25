import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { Notification } from '@/src/services/notificationService';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Bell, Calendar, FileText, Info, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    notifications,
    markNotificationAsRead,
    deleteNotificationById,
    refreshNotifications,
  } = useNotifications();

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  // Track if we've already marked as read to avoid duplicate calls
  const hasMarkedAsRead = React.useRef(false);

  // Load notification when id changes
  useEffect(() => {
    hasMarkedAsRead.current = false; // Reset when id changes
    if (id && notifications.length > 0) {
      const found = notifications.find(n => n.id === id);
      if (found) {
        setNotification(found);
        setLoading(false);
        // Auto mark as read when viewing (only if not already read and not already marked)
        if (!found.read && !hasMarkedAsRead.current) {
          hasMarkedAsRead.current = true;
          // Mark as read on server (this will refresh notifications automatically)
          markNotificationAsRead(id)
            .catch((error) => {
              console.error('Error marking notification as read:', error);
              hasMarkedAsRead.current = false; // Reset on error
            });
        }
      } else {
        setLoading(false);
      }
    } else if (notifications.length === 0) {
      setLoading(false);
    }
  }, [id]); // Only depend on id to avoid re-marking as read

  // Also mark as read when screen is focused (in case notifications array was empty on mount)
  useFocusEffect(
    React.useCallback(() => {
      if (id && notifications.length > 0) {
        const found = notifications.find(n => n.id === id);
        if (found && !found.read && !hasMarkedAsRead.current) {
          hasMarkedAsRead.current = true;
          console.log('📖 Focus effect: marking notification as read:', id);
          markNotificationAsRead(id).catch((error) => {
            console.error('Error marking notification as read:', error);
            hasMarkedAsRead.current = false;
          });
        }
      }
      return () => {};
    }, [id, notifications, markNotificationAsRead])
  );

  // Sync local notification state when notifications array updates (after mark as read)
  useEffect(() => {
    if (id && notifications.length > 0) {
      const found = notifications.find(n => n.id === id);
      if (found) {
        console.log('🔄 Syncing notification state:', {
          id: found.id,
          read: found.read,
          readAt: found.readAt
        });
        // Always update to get latest read status from context (after server refresh)
        setNotification(prev => {
          // Only update if read status changed
          if (!prev || prev.read !== found.read || prev.readAt !== found.readAt) {
            console.log('✅ Updating notification state:', { 
              oldRead: prev?.read, 
              newRead: found.read 
            });
            return found;
          }
          return prev;
        });
      }
    }
  }, [id, notifications]);

  const getIcon = () => {
    if (!notification) return null;
    switch (notification.type) {
      case 'URGENT':
        return <AlertTriangle size={32} color="hsl(0, 70%, 55%)" />;
      case 'ATTENDANCE':
        return <Calendar size={32} color="hsl(30, 55%, 55%)" />;
      case 'LEAVE':
        return <FileText size={32} color="hsl(200, 70%, 55%)" />;
      case 'SYSTEM':
        return <Info size={32} color="hsl(220, 70%, 55%)" />;
      default:
        return <Bell size={32} color="hsl(30, 55%, 55%)" />;
    }
  };

  const getPriorityColor = () => {
    if (!notification) return 'hsl(25, 15%, 50%)';
    switch (notification.priority) {
      case 'URGENT':
        return 'hsl(0, 70%, 55%)';
      case 'HIGH':
        return 'hsl(35, 95%, 55%)';
      case 'MEDIUM':
        return 'hsl(200, 70%, 55%)';
      default:
        return 'hsl(25, 15%, 50%)';
    }
  };

  const getPriorityLabel = () => {
    if (!notification) return '';
    switch (notification.priority) {
      case 'URGENT':
        return 'Khẩn cấp';
      case 'HIGH':
        return 'Cao';
      case 'MEDIUM':
        return 'Trung bình';
      default:
        return 'Thấp';
    }
  };

  const getTypeLabel = () => {
    if (!notification) return '';
    switch (notification.type) {
      case 'ANNOUNCEMENT':
        return 'Thông báo';
      case 'ATTENDANCE':
        return 'Chấm công';
      case 'LEAVE':
        return 'Nghỉ phép';
      case 'SYSTEM':
        return 'Hệ thống';
      case 'URGENT':
        return 'Khẩn cấp';
      default:
        return 'Thông báo';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (!notification) return;
    
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
              await deleteNotificationById(notification.id);
              router.back();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa thông báo');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <FadeScreenWrapper>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="hsl(30, 55%, 55%)" />
            <Text style={styles.loadingText}>Đang tải thông báo...</Text>
          </View>
        </SafeAreaView>
      </FadeScreenWrapper>
    );
  }

  if (!notification) {
    return (
      <FadeScreenWrapper>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="hsl(25, 30%, 20%)" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy thông báo</Text>
          </View>
        </SafeAreaView>
      </FadeScreenWrapper>
    );
  }

  const priorityColor = getPriorityColor();
  const iconBgColor = `${priorityColor}15`;

  return (
    <FadeScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <ArrowLeft size={20} color="hsl(25, 30%, 20%)" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <View style={styles.deleteButtonInner}>
              <Trash2 size={20} color="hsl(0, 70%, 55%)" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon and Type */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.iconSection}>
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
              {getIcon()}
            </View>
            <View style={styles.badgeContainer}>
              <View style={[styles.typeBadge, { backgroundColor: priorityColor }]}>
                <Text style={styles.typeText}>{getTypeLabel()}</Text>
              </View>
              <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {getPriorityLabel()}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{notification.title}</Text>
              {!notification.read && (
                <View style={styles.unreadBadge}>
                  <View style={styles.unreadDot} />
                  <Text style={styles.unreadText}>Chưa đọc</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Message */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.messageSection}>
            <Text style={styles.messageLabel}>Nội dung thông báo</Text>
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{notification.message}</Text>
            </View>
          </Animated.View>

          {/* Metadata */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.metadataSection}>
            <Text style={styles.metadataSectionTitle}>Thông tin</Text>
            <View style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <View style={styles.metadataLabelContainer}>
                  <Text style={styles.metadataLabel}>Gửi lúc</Text>
                </View>
                <Text style={styles.metadataValue}>{formatDate(notification.sentAt)}</Text>
              </View>
              {notification.read && notification.readAt && (
                <View style={styles.metadataRow}>
                  <View style={styles.metadataLabelContainer}>
                    <Text style={styles.metadataLabel}>Đọc lúc</Text>
                  </View>
                  <Text style={styles.metadataValue}>{formatDate(notification.readAt)}</Text>
                </View>
              )}
              {notification.metadata.actionUrl && (
                <View style={[styles.metadataRow, styles.metadataRowLast]}>
                  <View style={styles.metadataLabelContainer}>
                    <Text style={styles.metadataLabel}>Liên kết</Text>
                  </View>
                  <Text style={[styles.metadataValue, styles.link]} numberOfLines={1}>
                    {notification.metadata.actionUrl}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </FadeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'hsl(30, 40%, 95%)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'hsl(0, 70%, 95%)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
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
    backgroundColor: 'white',
  },
  emptyText: {
    fontSize: 16,
    color: 'hsl(25, 15%, 50%)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'white',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  titleSection: {
    marginBottom: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
    lineHeight: 36,
    flex: 1,
    minWidth: '60%',
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'hsl(0, 70%, 55%)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  unreadText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  messageSection: {
    marginBottom: 28,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'hsl(25, 15%, 50%)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageContainer: {
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: 'hsl(30, 55%, 55%)',
  },
  message: {
    fontSize: 16,
    color: 'hsl(25, 30%, 20%)',
    lineHeight: 26,
  },
  metadataSection: {
    marginBottom: 20,
  },
  metadataSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'hsl(25, 15%, 50%)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metadataCard: {
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderRadius: 16,
    padding: 20,
    gap: 0,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  metadataRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  metadataLabelContainer: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(25, 15%, 50%)',
  },
  metadataValue: {
    fontSize: 14,
    color: 'hsl(25, 30%, 20%)',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  link: {
    color: 'hsl(200, 70%, 55%)',
    fontWeight: '600',
  },
});
