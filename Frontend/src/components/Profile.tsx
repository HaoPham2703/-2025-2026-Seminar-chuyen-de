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
    User,
    Bell
} from "lucide-react-native";
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { logout } from "@/src/services/authService";
import { getEmployeeProfile, EmployeeProfileResponse } from "@/src/services/employeeService";
import { getAuthToken } from "@/src/services/api";
import EditProfileModal from "./EditProfileModal";
import SettingsScreen from "./SettingsScreen";
import NotificationCenter from "./NotificationCenter";
import NotificationBadge from "./NotificationBadge";
import { useSettings } from "@/src/contexts/SettingsContext";
import { useNotifications } from "@/src/contexts/NotificationContext";
import { RefreshableScrollView } from "@/components/refreshable-scroll-view";
import { useTabReload } from "@/hooks/use-tab-reload";

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
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<EmployeeProfileResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  // Register reload function for tab double press
  const handleReload = useCallback(async () => {
    await loadProfileData();
  }, []);

  const { scrollViewRef } = useTabReload(handleReload, 'profile');

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        console.warn('No token available for API call');
        setLoading(false);
        return;
      }

      const data = await getEmployeeProfile();
      setProfileData(data);
    } catch (error: any) {
      console.error("Error loading profile data:", error);
      if (error.message && !error.message.includes('Authentication')) {
        Alert.alert("Error", error.message || "Failed to load profile data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleProfileUpdated = () => {
    loadProfileData();
    setShowEditModal(false);
  };

  const handleSettings = () => {
    setShowSettings(true);
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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="hsl(30, 55%, 55%)" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Không thể tải thông tin profile</Text>
      </View>
    );
  }

  const firstName = profileData.employee.personalInfo.firstName || "";
  const lastName = profileData.employee.personalInfo.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || profileData.user.email;
  const email = profileData.user.email;
  const role = profileData.employee.employment.position || "Employee";
  const employeeId = profileData.employee.employeeId || "";
  const stats = profileData.employee.statistics;

  return (
    <View style={styles.container}>
      <RefreshableScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 20, 40) }
        ]}
        showsVerticalScrollIndicator={false}
        onRefresh={handleReload}
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
          
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.role}>{role}</Text>
          
          {settings.privacy.showEmail && (
            <View style={styles.infoRow}>
              <Mail size={16} color="hsl(25, 15%, 50%)" />
              <Text style={styles.email}>{email}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Briefcase size={16} color="hsl(25, 15%, 50%)" />
            <Text style={styles.employeeId}>{employeeId}</Text>
          </View>

          {settings.privacy.showPhone && profileData.employee.personalInfo.phone && (
            <View style={styles.infoRow}>
              <Briefcase size={16} color="hsl(25, 15%, 50%)" />
              <Text style={styles.email}>{profileData.employee.personalInfo.phone}</Text>
            </View>
          )}
        </Animated.View>

        {/* Thống kê */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.statsContainer}
        >
          <StatCard
            icon={<Calendar size={24} color="hsl(30, 55%, 55%)" />}
            label="Ngày làm việc"
            value={stats.totalWorkingDays.toString()}
            delay={150}
          />
          <StatCard
            icon={<Clock size={24} color="hsl(30, 55%, 55%)" />}
            label="Tổng giờ"
            value={`${Math.round(stats.totalHours)}h`}
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
            icon={
              <View style={{ position: 'relative' }}>
                <Bell size={20} color="hsl(30, 55%, 55%)" />
                <View style={{ position: 'absolute', top: -4, right: -4 }}>
                  <NotificationBadge count={unreadCount} size={16} />
                </View>
              </View>
            }
            title="Thông báo"
            subtitle={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Xem thông báo"}
            onPress={() => setShowNotifications(true)}
            delay={350}
          />
          
          <MenuItem
            icon={<Settings size={20} color="hsl(30, 55%, 55%)" />}
            title="Cài đặt"
            subtitle="Quản lý cài đặt ứng dụng"
            onPress={handleSettings}
            delay={400}
          />
          
          <MenuItem
            icon={<Info size={20} color="hsl(30, 55%, 55%)" />}
            title="Về ứng dụng"
            subtitle="Thông tin phiên bản và giấy phép"
            onPress={handleAbout}
            delay={450}
          />
          
          <MenuItem
            icon={<HelpCircle size={20} color="hsl(30, 55%, 55%)" />}
            title="Trợ giúp"
            subtitle="Câu hỏi thường gặp và hỗ trợ"
            onPress={handleHelp}
            delay={500}
          />
          
          <MenuItem
            icon={<LogOut size={20} color="hsl(0, 70%, 55%)" />}
            title="Đăng xuất"
            subtitle="Đăng xuất khỏi tài khoản"
            onPress={handleLogout}
            delay={550}
            isDestructive={true}
          />
        </Animated.View>
      </RefreshableScrollView>

      {/* Edit Profile Modal */}
      {showEditModal && profileData && (
        <EditProfileModal
          profileData={profileData}
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleProfileUpdated}
        />
      )}

      {/* Settings Screen */}
      <SettingsScreen
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Notification Center */}
      <NotificationCenter
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "hsl(0, 70%, 55%)",
  },
});

export default Profile;
