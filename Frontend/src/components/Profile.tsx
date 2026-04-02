import { RefreshableScrollView } from "@/components/refreshable-scroll-view";
import { useTabReload } from "@/hooks/use-tab-reload";
import { useNotifications } from "@/src/contexts/NotificationContext";
import { useSettings } from "@/src/contexts/SettingsContext";
import { useTheme } from "@/src/hooks/use-theme";
import { getAuthToken } from "@/src/services/api";
import { logout } from "@/src/services/authService";
import { EmployeeProfileResponse, getEmployeeProfile } from "@/src/services/employeeService";
import { useRouter } from "expo-router";
import {
  Award,
  Bell,
  Briefcase,
  Calendar,
  Clock,
  Edit,
  HelpCircle,
  Info,
  LogOut,
  Mail,
  QrCode,
  Settings,
  User
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EditProfileModal from "./EditProfileModal";
import EmployeeQrCard from "./EmployeeQrCard";
import NotificationBadge from "./NotificationBadge";
import NotificationCenter from "./NotificationCenter";
import SettingsScreen from "./SettingsScreen";

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  delay?: number;
  isDestructive?: boolean;
}

const MenuItem = ({ icon, title, subtitle, onPress, delay = 0, isDestructive = false }: MenuItemProps) => {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }, isDestructive && { backgroundColor: isDestructive ? colors.error + '15' : colors.card }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: colors.backgroundSecondary }, isDestructive && { backgroundColor: colors.error + '20' }]}>
          {icon}
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: isDestructive ? colors.error : colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
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
  const { colors } = useTheme();
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(300)}
      style={[styles.statCard, { backgroundColor: colors.card }]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Animated.View>
  );
};

const Profile = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<EmployeeProfileResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

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

  const handleShowQr = () => {
    setShowQrModal(true);
  };

  const performLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      console.error("Logout warning:", error);
    }
    // Luôn navigate về login bất kể logout có lỗi hay không
    router.replace('/login');
  };

  const handleLogout = () => {
    // Trên web, Alert.alert không hỗ trợ callback buttons như native
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('Bạn có chắc chắn muốn đăng xuất?')
        : true;
      if (confirmed) {
        void performLogout();
      }
      return;
    }

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
          onPress: () => {
            void performLogout();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Không thể tải thông tin profile</Text>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefreshableScrollView
        ref={scrollViewRef}
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
            <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.accent }]}>
              <User size={48} color={colors.accent} />
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.background, borderColor: colors.accent }]}
              onPress={handleEditProfile}
              activeOpacity={0.7}
            >
              <Edit size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
          <Text style={[styles.role, { color: colors.accent }]}>{role}</Text>
          
          {settings.privacy.showEmail && (
            <View style={styles.infoRow}>
              <Mail size={16} color={colors.textSecondary} />
              <Text style={[styles.email, { color: colors.textSecondary }]}>{email}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Briefcase size={16} color={colors.textSecondary} />
            <Text style={[styles.employeeId, { color: colors.textSecondary }]}>{employeeId}</Text>
          </View>

          {settings.privacy.showPhone && profileData.employee.personalInfo.phone && (
            <View style={styles.infoRow}>
              <Briefcase size={16} color={colors.textSecondary} />
              <Text style={[styles.email, { color: colors.textSecondary }]}>{profileData.employee.personalInfo.phone}</Text>
            </View>
          )}
        </Animated.View>

        {/* Thống kê */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.statsContainer}
        >
          <StatCard
            icon={<Calendar size={24} color={colors.accent} />}
            label="Ngày làm việc"
            value={stats.totalWorkingDays.toString()}
            delay={150}
          />
          <StatCard
            icon={<Clock size={24} color={colors.accent} />}
            label="Tổng giờ"
            value={`${Math.round(stats.totalHours)}h`}
            delay={200}
          />
          <StatCard
            icon={<Award size={24} color={colors.accent} />}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tài khoản</Text>
          
          <MenuItem
            icon={
              <View style={{ position: 'relative' }}>
                <Bell size={20} color={colors.icon} />
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
            icon={<Settings size={20} color={colors.icon} />}
            title="Cài đặt"
            subtitle="Quản lý cài đặt ứng dụng"
            onPress={handleSettings}
            delay={400}
          />
          
          <MenuItem
            icon={<QrCode size={20} color={colors.icon} />}
            title="Mã QR của tôi"
            subtitle="Hiển thị mã QR cho quản lý quét"
            onPress={handleShowQr}
            delay={425}
          />
          
          <MenuItem
            icon={<Info size={20} color={colors.icon} />}
            title="Về ứng dụng"
            subtitle="Thông tin phiên bản và giấy phép"
            onPress={handleAbout}
            delay={450}
          />
          
          <MenuItem
            icon={<HelpCircle size={20} color={colors.icon} />}
            title="Trợ giúp"
            subtitle="Câu hỏi thường gặp và hỗ trợ"
            onPress={handleHelp}
            delay={500}
          />
          
          <MenuItem
            icon={<LogOut size={20} color={colors.error} />}
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

      {/* Employee QR Modal */}
      <EmployeeQrCard
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        qrValue={profileData.employee.qrToken || profileData.employee.qrCode?.code || null}
        employeeName={fullName}
        employeeCode={employeeId}
        employeeId={profileData.employee.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
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
  },
  employeeId: {
    fontSize: 14,
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
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  menuContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  menuItemDestructive: {
    // Applied dynamically
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconContainerDestructive: {
    // Applied dynamically
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuTitleDestructive: {
    // Applied dynamically
  },
  menuSubtitle: {
    fontSize: 12,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
  },
});

export default Profile;
