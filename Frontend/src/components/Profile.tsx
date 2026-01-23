import {
    Award,
    Briefcase,
    Calendar,
    Clock,
    Edit,
    HelpCircle,
    Info,
    LogOut,
    Mail,
    Settings,
    User
} from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { logout } from "@/src/services/authService";

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  delay?: number;
  isDestructive?: boolean;
}

const MenuItem = ({ icon, title, subtitle, onPress, delay = 0, isDestructive = false }: MenuItemProps) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={[styles.menuItem, isDestructive && styles.menuItemDestructive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIconContainer, isDestructive && styles.menuIconContainerDestructive]}>
          {icon}
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, isDestructive && styles.menuTitleDestructive]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay?: number;
}

const StatCard = ({ icon, label, value, delay = 0 }: StatCardProps) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(300)}
      style={styles.statCard}
    >
      <View style={styles.statIconContainer}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

const Profile = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user] = useState({
    name: "Jack",
    email: "jack@codezone.com",
    role: "UI/UX Intern",
    avatar: null, // Có thể thêm avatar sau
    employeeId: "EMP-2024-001",
    joinDate: "2024-01-15",
  });

  const [stats] = useState({
    totalDays: 45,
    totalHours: 360,
    onTimeRate: 95,
  });

  const handleEditProfile = () => {
    Alert.alert("Chỉnh sửa hồ sơ", "Tính năng này sẽ được thêm vào sau.");
  };

  const handleSettings = () => {
    Alert.alert("Cài đặt", "Tính năng này sẽ được thêm vào sau.");
  };

  const handleAbout = () => {
    Alert.alert(
      "Về ứng dụng",
      "CodeZone Mobile\nPhiên bản: 1.0.0\n\nỨng dụng chấm công và quản lý thời gian làm việc."
    );
  };

  const handleHelp = () => {
    Alert.alert("Trợ giúp", "Tính năng này sẽ được thêm vào sau.");
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              // Xóa token khỏi AsyncStorage
              await logout();
              
              // Navigate về màn hình login
              router.replace('/login');
            } catch (error: any) {
              console.error("Logout error:", error);
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 20, 40) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header với Avatar và Thông tin */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color="hsl(30, 55%, 55%)" />
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
              activeOpacity={0.7}
            >
              <Edit size={16} color="hsl(30, 55%, 55%)" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.role}>{user.role}</Text>
          
          <View style={styles.infoRow}>
            <Mail size={16} color="hsl(25, 15%, 50%)" />
            <Text style={styles.email}>{user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Briefcase size={16} color="hsl(25, 15%, 50%)" />
            <Text style={styles.employeeId}>{user.employeeId}</Text>
          </View>
        </Animated.View>

        {/* Thống kê */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.statsContainer}
        >
          <StatCard
            icon={<Calendar size={24} color="hsl(30, 55%, 55%)" />}
            label="Ngày làm việc"
            value={stats.totalDays.toString()}
            delay={150}
          />
          <StatCard
            icon={<Clock size={24} color="hsl(30, 55%, 55%)" />}
            label="Tổng giờ"
            value={`${stats.totalHours}h`}
            delay={200}
          />
          <StatCard
            icon={<Award size={24} color="hsl(30, 55%, 55%)" />}
            label="Đúng giờ"
            value={`${stats.onTimeRate}%`}
            delay={250}
          />
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(300)}
          style={styles.menuContainer}
        >
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          
          <MenuItem
            icon={<Settings size={20} color="hsl(30, 55%, 55%)" />}
            title="Cài đặt"
            subtitle="Quản lý cài đặt ứng dụng"
            onPress={handleSettings}
            delay={350}
          />
          
          <MenuItem
            icon={<Info size={20} color="hsl(30, 55%, 55%)" />}
            title="Về ứng dụng"
            subtitle="Thông tin phiên bản và giấy phép"
            onPress={handleAbout}
            delay={400}
          />
          
          <MenuItem
            icon={<HelpCircle size={20} color="hsl(30, 55%, 55%)" />}
            title="Trợ giúp"
            subtitle="Câu hỏi thường gặp và hỗ trợ"
            onPress={handleHelp}
            delay={450}
          />
          
          <MenuItem
            icon={<LogOut size={20} color="hsl(0, 70%, 55%)" />}
            title="Đăng xuất"
            subtitle="Đăng xuất khỏi tài khoản"
            onPress={handleLogout}
            delay={500}
            isDestructive={true}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "hsl(30, 50%, 97%)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "hsl(30, 40%, 92%)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "hsl(30, 55%, 55%)",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "hsl(30, 50%, 97%)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "hsl(30, 55%, 55%)",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "hsl(25, 30%, 20%)",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: "hsl(30, 55%, 55%)",
    fontWeight: "600",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  email: {
    fontSize: 14,
    color: "hsl(25, 15%, 50%)",
  },
  employeeId: {
    fontSize: 14,
    color: "hsl(25, 15%, 50%)",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "hsl(30, 40%, 95%)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "hsl(30, 25%, 88%)",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "hsl(30, 50%, 97%)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "hsl(25, 30%, 20%)",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "hsl(25, 15%, 50%)",
    textAlign: "center",
  },
  menuContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "hsl(25, 30%, 20%)",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "hsl(30, 40%, 95%)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "hsl(30, 25%, 88%)",
  },
  menuItemDestructive: {
    backgroundColor: "hsl(0, 30%, 96%)",
    borderColor: "hsl(0, 50%, 90%)",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "hsl(30, 50%, 97%)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconContainerDestructive: {
    backgroundColor: "hsl(0, 40%, 97%)",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "hsl(25, 30%, 20%)",
    marginBottom: 2,
  },
  menuTitleDestructive: {
    color: "hsl(0, 70%, 55%)",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "hsl(25, 15%, 50%)",
  },
});

export default Profile;
