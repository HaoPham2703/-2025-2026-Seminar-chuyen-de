import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { X, Bell, Moon, Sun, Globe, Shield, Info } from 'lucide-react-native';
import { useSettings } from '@/src/contexts/SettingsContext';
import { AppSettings } from '@/src/contexts/SettingsContext';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    if (visible) {
      setLocalSettings(settings);
    }
  }, [visible, settings]);

  const handleNotificationToggle = async (key: keyof AppSettings['notifications'], value: boolean) => {
    const newSettings = {
      ...localSettings,
      notifications: {
        ...localSettings.notifications,
        [key]: value,
      },
    };
    setLocalSettings(newSettings);
    try {
      await updateSettings({ notifications: newSettings.notifications });
      // Không hiển thị alert để UX mượt hơn
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    const newSettings = {
      ...localSettings,
      theme,
    };
    setLocalSettings(newSettings);
    try {
      await updateSettings({ theme });
      // Theme sẽ được áp dụng tự động qua context
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handleLanguageChange = async (language: 'vi' | 'en') => {
    const newSettings = {
      ...localSettings,
      language,
    };
    setLocalSettings(newSettings);
    try {
      await updateSettings({ language });
      // Language sẽ được áp dụng tự động qua context
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handlePrivacyToggle = async (key: keyof AppSettings['privacy'], value: boolean) => {
    const newSettings = {
      ...localSettings,
      privacy: {
        ...localSettings.privacy,
        [key]: value,
      },
    };
    setLocalSettings(newSettings);
    try {
      await updateSettings({ privacy: newSettings.privacy });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Đặt lại cài đặt',
      'Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đặt lại',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              setLocalSettings(settings);
              Alert.alert('Thành công', 'Đã đặt lại cài đặt về mặc định');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể đặt lại cài đặt');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cài đặt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="hsl(25, 30%, 20%)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Notifications Section */}
            <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Bell size={20} color="hsl(30, 55%, 55%)" />
                <Text style={styles.sectionTitle}>Thông báo</Text>
              </View>

              <SettingItem
                title="Bật thông báo"
                subtitle="Nhận thông báo từ ứng dụng"
                value={localSettings.notifications.enabled}
                onValueChange={(value) => handleNotificationToggle('enabled', value)}
                delay={100}
              />

              {localSettings.notifications.enabled && (
                <>
                  <SettingItem
                    title="Nhắc nhở chấm công"
                    subtitle="Nhắc nhở khi đến giờ chấm công"
                    value={localSettings.notifications.clockInReminder}
                    onValueChange={(value) => handleNotificationToggle('clockInReminder', value)}
                    delay={150}
                    indent={true}
                  />

                  <SettingItem
                    title="Tóm tắt chấm công"
                    subtitle="Gửi tóm tắt chấm công hàng ngày"
                    value={localSettings.notifications.attendanceSummary}
                    onValueChange={(value) => handleNotificationToggle('attendanceSummary', value)}
                    delay={200}
                    indent={true}
                  />
                </>
              )}
            </Animated.View>

            {/* Theme Section */}
            <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                {localSettings.theme === 'dark' ? (
                  <Moon size={20} color="hsl(30, 55%, 55%)" />
                ) : (
                  <Sun size={20} color="hsl(30, 55%, 55%)" />
                )}
                <Text style={styles.sectionTitle}>Giao diện</Text>
              </View>

              <ThemeOption
                title="Sáng"
                subtitle="Giao diện sáng"
                selected={localSettings.theme === 'light'}
                onPress={() => handleThemeChange('light')}
                delay={300}
              />

              <ThemeOption
                title="Tối"
                subtitle="Giao diện tối"
                selected={localSettings.theme === 'dark'}
                onPress={() => handleThemeChange('dark')}
                delay={350}
              />

              <ThemeOption
                title="Tự động"
                subtitle="Theo cài đặt hệ thống"
                selected={localSettings.theme === 'auto'}
                onPress={() => handleThemeChange('auto')}
                delay={400}
              />
            </Animated.View>

            {/* Language Section */}
            <Animated.View entering={FadeInDown.delay(450).duration(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe size={20} color="hsl(30, 55%, 55%)" />
                <Text style={styles.sectionTitle}>Ngôn ngữ</Text>
              </View>

              <LanguageOption
                title="Tiếng Việt"
                subtitle="Vietnamese"
                selected={localSettings.language === 'vi'}
                onPress={() => handleLanguageChange('vi')}
                delay={500}
              />

              <LanguageOption
                title="English"
                subtitle="Tiếng Anh"
                selected={localSettings.language === 'en'}
                onPress={() => handleLanguageChange('en')}
                delay={550}
              />
            </Animated.View>

            {/* Privacy Section */}
            <Animated.View entering={FadeInDown.delay(600).duration(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={20} color="hsl(30, 55%, 55%)" />
                <Text style={styles.sectionTitle}>Quyền riêng tư</Text>
              </View>

              <SettingItem
                title="Hiển thị email"
                subtitle="Cho phép người khác xem email của bạn"
                value={localSettings.privacy.showEmail}
                onValueChange={(value) => handlePrivacyToggle('showEmail', value)}
                delay={650}
              />

              <SettingItem
                title="Hiển thị số điện thoại"
                subtitle="Cho phép người khác xem số điện thoại của bạn"
                value={localSettings.privacy.showPhone}
                onValueChange={(value) => handlePrivacyToggle('showPhone', value)}
                delay={700}
              />
            </Animated.View>

            {/* About Section */}
            <Animated.View entering={FadeInDown.delay(750).duration(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Info size={20} color="hsl(30, 55%, 55%)" />
                <Text style={styles.sectionTitle}>Khác</Text>
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetSettings}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Đặt lại cài đặt về mặc định</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface SettingItemProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  delay?: number;
  indent?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
  delay = 0,
  indent = false,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <View style={[styles.settingItem, indent && styles.settingItemIndent]}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: 'hsl(30, 25%, 88%)', true: 'hsl(30, 55%, 55%)' }}
          thumbColor={value ? '#FFF' : '#f4f3f4'}
        />
      </View>
    </Animated.View>
  );
};

interface ThemeOptionProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  delay?: number;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({ title, subtitle, selected, onPress, delay = 0 }) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={[styles.optionItem, selected && styles.optionItemSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
            {title}
          </Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
        {selected && (
          <View style={styles.selectedIndicator}>
            <View style={styles.selectedDot} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface LanguageOptionProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  delay?: number;
}

const LanguageOption: React.FC<LanguageOptionProps> = ({ title, subtitle, selected, onPress, delay = 0 }) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={[styles.optionItem, selected && styles.optionItemSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
            {title}
          </Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
        {selected && (
          <View style={styles.selectedIndicator}>
            <View style={styles.selectedDot} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'hsl(30, 50%, 97%)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: '80%',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingItemIndent: {
    marginLeft: 20,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: 'hsl(25, 15%, 50%)',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    backgroundColor: 'hsl(30, 50%, 97%)',
    borderColor: 'hsl(30, 55%, 55%)',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: 'hsl(30, 55%, 55%)',
  },
  optionSubtitle: {
    fontSize: 12,
    color: 'hsl(25, 15%, 50%)',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'hsl(30, 55%, 55%)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  resetButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'hsl(0, 30%, 96%)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'hsl(0, 50%, 90%)',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(0, 70%, 55%)',
  },
});

export default SettingsScreen;
