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
import { t, getLanguage } from '@/src/utils/i18n';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const { settings, updateSettings, resetSettings, currentTheme } = useSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render when language changes

  useEffect(() => {
    if (visible) {
      setLocalSettings(settings);
      setForceUpdate(prev => prev + 1); // Force re-render to update translations
    }
  }, [visible, settings]);

  const handleNotificationToggle = async (key: keyof AppSettings['notifications'], value: boolean) => {
    const newNotifications = {
      ...localSettings.notifications,
      [key]: value,
    };
    // Optimistic update
    setLocalSettings({
      ...localSettings,
      notifications: newNotifications,
    });
    try {
      await updateSettings({ notifications: newNotifications });
      // useEffect will sync localSettings with settings from context automatically
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    // Optimistic update
    setLocalSettings({
      ...localSettings,
      theme,
    });
    try {
      await updateSettings({ theme });
      // Theme sẽ được áp dụng tự động qua context
      // useEffect will sync localSettings with settings from context automatically
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handleLanguageChange = async (language: 'vi' | 'en') => {
    // Optimistic update
    setLocalSettings({
      ...localSettings,
      language,
    });
    try {
      await updateSettings({ language });
      // Language sẽ được áp dụng tự động qua context
      // useEffect will sync localSettings with settings from context automatically
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handlePrivacyToggle = async (key: keyof AppSettings['privacy'], value: boolean) => {
    const newPrivacy = {
      ...localSettings.privacy,
      [key]: value,
    };
    // Optimistic update
    setLocalSettings({
      ...localSettings,
      privacy: newPrivacy,
    });
    try {
      await updateSettings({ privacy: newPrivacy });
      // useEffect will sync localSettings with settings from context automatically
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      setLocalSettings(settings); // Revert on error
    }
  };

  const handleResetSettings = () => {
    const lang = getLanguage();
    Alert.alert(
      lang === 'vi' ? 'Đặt lại cài đặt' : 'Reset Settings',
      lang === 'vi' 
        ? 'Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?'
        : 'Are you sure you want to reset all settings to default?',
      [
        {
          text: lang === 'vi' ? 'Hủy' : 'Cancel',
          style: 'cancel',
        },
        {
          text: lang === 'vi' ? 'Đặt lại' : 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              setForceUpdate(prev => prev + 1);
              Alert.alert(
                lang === 'vi' ? 'Thành công' : 'Success',
                lang === 'vi' ? 'Đã đặt lại cài đặt về mặc định' : 'Settings have been reset to default'
              );
            } catch (error) {
              Alert.alert(
                lang === 'vi' ? 'Lỗi' : 'Error',
                lang === 'vi' ? 'Không thể đặt lại cài đặt' : 'Failed to reset settings'
              );
            }
          },
        },
      ]
    );
  };

  // Get theme colors based on current theme
  const getThemeColors = () => {
    const isDark = currentTheme === 'dark';
    return {
      background: isDark ? 'hsl(25, 20%, 10%)' : 'hsl(30, 50%, 97%)',
      text: isDark ? 'hsl(30, 50%, 95%)' : 'hsl(25, 30%, 20%)',
      textSecondary: isDark ? 'hsl(30, 30%, 70%)' : 'hsl(25, 15%, 50%)',
      card: isDark ? 'hsl(25, 25%, 15%)' : 'hsl(30, 40%, 95%)',
      border: isDark ? 'hsl(30, 20%, 25%)' : 'hsl(30, 25%, 88%)',
      accent: 'hsl(30, 55%, 55%)',
      icon: isDark ? 'hsl(30, 50%, 80%)' : 'hsl(30, 55%, 55%)',
    };
  };

  const themeColors = getThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t('settings.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Notifications Section */}
            <Animated.View entering={FadeInDown.delay(50).duration(300)} style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.sectionHeader}>
                <Bell size={20} color={themeColors.icon} />
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('settings.notifications')}</Text>
              </View>

              <SettingItem
                title={t('settings.enableNotifications')}
                subtitle={getLanguage() === 'vi' ? 'Nhận thông báo từ ứng dụng' : 'Receive notifications from the app'}
                value={localSettings.notifications.enabled}
                onValueChange={(value) => handleNotificationToggle('enabled', value)}
                delay={100}
                themeColors={themeColors}
              />

              {localSettings.notifications.enabled && (
                <>
                  <SettingItem
                    title={t('settings.clockInReminder')}
                    subtitle={getLanguage() === 'vi' ? 'Nhắc nhở khi đến giờ chấm công' : 'Remind when it\'s time to clock in'}
                    value={localSettings.notifications.clockInReminder}
                    onValueChange={(value) => handleNotificationToggle('clockInReminder', value)}
                    delay={150}
                    indent={true}
                    themeColors={themeColors}
                  />

                  <SettingItem
                    title={t('settings.attendanceSummary')}
                    subtitle={getLanguage() === 'vi' ? 'Gửi tóm tắt chấm công hàng ngày' : 'Send daily attendance summary'}
                    value={localSettings.notifications.attendanceSummary}
                    onValueChange={(value) => handleNotificationToggle('attendanceSummary', value)}
                    delay={200}
                    indent={true}
                    themeColors={themeColors}
                  />
                </>
              )}
            </Animated.View>

            {/* Theme Section */}
            <Animated.View entering={FadeInDown.delay(250).duration(300)} style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.sectionHeader}>
                {localSettings.theme === 'dark' ? (
                  <Moon size={20} color={themeColors.icon} />
                ) : (
                  <Sun size={20} color={themeColors.icon} />
                )}
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('settings.theme')}</Text>
              </View>

              <ThemeOption
                title={t('settings.light')}
                subtitle={getLanguage() === 'vi' ? 'Giao diện sáng' : 'Light interface'}
                selected={localSettings.theme === 'light'}
                onPress={() => handleThemeChange('light')}
                delay={300}
                themeColors={themeColors}
              />

              <ThemeOption
                title={t('settings.dark')}
                subtitle={getLanguage() === 'vi' ? 'Giao diện tối' : 'Dark interface'}
                selected={localSettings.theme === 'dark'}
                onPress={() => handleThemeChange('dark')}
                delay={350}
                themeColors={themeColors}
              />

              <ThemeOption
                title={t('settings.auto')}
                subtitle={getLanguage() === 'vi' ? 'Theo cài đặt hệ thống' : 'Follow system settings'}
                selected={localSettings.theme === 'auto'}
                onPress={() => handleThemeChange('auto')}
                delay={400}
                themeColors={themeColors}
              />
            </Animated.View>

            {/* Language Section */}
            <Animated.View entering={FadeInDown.delay(450).duration(300)} style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.sectionHeader}>
                <Globe size={20} color={themeColors.icon} />
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('settings.language')}</Text>
              </View>

              <LanguageOption
                title={t('settings.vietnamese')}
                subtitle="Vietnamese"
                selected={localSettings.language === 'vi'}
                onPress={() => handleLanguageChange('vi')}
                delay={500}
                themeColors={themeColors}
              />

              <LanguageOption
                title={t('settings.english')}
                subtitle={getLanguage() === 'vi' ? 'Tiếng Anh' : 'English'}
                selected={localSettings.language === 'en'}
                onPress={() => handleLanguageChange('en')}
                delay={550}
                themeColors={themeColors}
              />
            </Animated.View>

            {/* Privacy Section */}
            <Animated.View entering={FadeInDown.delay(600).duration(300)} style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.sectionHeader}>
                <Shield size={20} color={themeColors.icon} />
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('settings.privacy')}</Text>
              </View>

              <SettingItem
                title={t('settings.showEmail')}
                subtitle={getLanguage() === 'vi' ? 'Cho phép người khác xem email của bạn' : 'Allow others to view your email'}
                value={localSettings.privacy.showEmail}
                onValueChange={(value) => handlePrivacyToggle('showEmail', value)}
                delay={650}
                themeColors={themeColors}
              />

              <SettingItem
                title={t('settings.showPhone')}
                subtitle={getLanguage() === 'vi' ? 'Cho phép người khác xem số điện thoại của bạn' : 'Allow others to view your phone number'}
                value={localSettings.privacy.showPhone}
                onValueChange={(value) => handlePrivacyToggle('showPhone', value)}
                delay={700}
                themeColors={themeColors}
              />
            </Animated.View>

            {/* About Section */}
            <Animated.View entering={FadeInDown.delay(750).duration(300)} style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.sectionHeader}>
                <Info size={20} color={themeColors.icon} />
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  {getLanguage() === 'vi' ? 'Khác' : 'Other'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: currentTheme === 'dark' ? 'hsl(0, 30%, 20%)' : 'hsl(0, 30%, 96%)', borderColor: currentTheme === 'dark' ? 'hsl(0, 50%, 30%)' : 'hsl(0, 50%, 90%)' }]}
                onPress={handleResetSettings}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetButtonText, { color: currentTheme === 'dark' ? 'hsl(0, 70%, 70%)' : 'hsl(0, 70%, 55%)' }]}>
                  {t('settings.reset')}
                </Text>
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
  themeColors?: {
    background: string;
    text: string;
    textSecondary: string;
    card: string;
    border: string;
    accent: string;
    icon: string;
  };
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
  delay = 0,
  indent = false,
  themeColors,
}) => {
  const colors = themeColors || {
    background: 'hsl(30, 50%, 97%)',
    text: 'hsl(25, 30%, 20%)',
    textSecondary: 'hsl(25, 15%, 50%)',
    card: 'hsl(30, 40%, 95%)',
    border: 'hsl(30, 25%, 88%)',
    accent: 'hsl(30, 55%, 55%)',
    icon: 'hsl(30, 55%, 55%)',
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <View style={[styles.settingItem, indent && styles.settingItemIndent, { backgroundColor: colors.card }]}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.accent }}
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
  themeColors?: {
    background: string;
    text: string;
    textSecondary: string;
    card: string;
    border: string;
    accent: string;
    icon: string;
  };
}

const ThemeOption: React.FC<ThemeOptionProps> = ({ title, subtitle, selected, onPress, delay = 0, themeColors }) => {
  const colors = themeColors || {
    background: 'hsl(30, 50%, 97%)',
    text: 'hsl(25, 30%, 20%)',
    textSecondary: 'hsl(25, 15%, 50%)',
    card: 'hsl(30, 40%, 95%)',
    border: 'hsl(30, 25%, 88%)',
    accent: 'hsl(30, 55%, 55%)',
    icon: 'hsl(30, 55%, 55%)',
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={[
          styles.optionItem,
          { backgroundColor: colors.card, borderColor: selected ? colors.accent : 'transparent' },
          selected && { backgroundColor: colors.background }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: selected ? colors.accent : colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        {selected && (
          <View style={[styles.selectedIndicator, { backgroundColor: colors.accent }]}>
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
  themeColors?: {
    background: string;
    text: string;
    textSecondary: string;
    card: string;
    border: string;
    accent: string;
    icon: string;
  };
}

const LanguageOption: React.FC<LanguageOptionProps> = ({ title, subtitle, selected, onPress, delay = 0, themeColors }) => {
  const colors = themeColors || {
    background: 'hsl(30, 50%, 97%)',
    text: 'hsl(25, 30%, 20%)',
    textSecondary: 'hsl(25, 15%, 50%)',
    card: 'hsl(30, 40%, 95%)',
    border: 'hsl(30, 25%, 88%)',
    accent: 'hsl(30, 55%, 55%)',
    icon: 'hsl(30, 55%, 55%)',
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={[
          styles.optionItem,
          { backgroundColor: colors.card, borderColor: selected ? colors.accent : 'transparent' },
          selected && { backgroundColor: colors.background }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: selected ? colors.accent : colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        {selected && (
          <View style={[styles.selectedIndicator, { backgroundColor: colors.accent }]}>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
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
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
