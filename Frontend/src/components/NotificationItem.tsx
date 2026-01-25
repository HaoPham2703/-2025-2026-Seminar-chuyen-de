import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, AlertCircle, Calendar, FileText, Info, AlertTriangle } from 'lucide-react-native';
import { Notification } from '@/src/services/notificationService';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onMarkAsRead?: () => void;
  delay?: number;
}

const NotificationItem = ({ notification, onPress, onMarkAsRead, delay = 0 }: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'URGENT':
        return <AlertTriangle size={20} color="hsl(0, 70%, 55%)" />;
      case 'ATTENDANCE':
        return <Calendar size={20} color="hsl(30, 55%, 55%)" />;
      case 'LEAVE':
        return <FileText size={20} color="hsl(200, 70%, 55%)" />;
      case 'SYSTEM':
        return <Info size={20} color="hsl(220, 70%, 55%)" />;
      default:
        return <Bell size={20} color="hsl(30, 55%, 55%)" />;
    }
  };

  const getPriorityColor = () => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={[
          styles.container,
          !notification.read && styles.unread,
          { borderLeftColor: getPriorityColor() }
        ]}
        onPress={() => {
          onPress();
          if (!notification.read && onMarkAsRead) {
            onMarkAsRead();
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.time}>{formatDate(notification.sentAt)}</Text>
            {notification.priority === 'URGENT' && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor() }]}>
                <Text style={styles.priorityText}>URGENT</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'hsl(30, 55%, 55%)',
  },
  unread: {
    backgroundColor: 'hsl(30, 50%, 97%)',
    borderWidth: 1,
    borderColor: 'hsl(30, 55%, 55%)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'hsl(30, 50%, 97%)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'hsl(0, 70%, 55%)',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: 'hsl(25, 15%, 50%)',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    color: 'hsl(25, 15%, 50%)',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
});

export default NotificationItem;
