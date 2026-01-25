/**
 * Simple i18n utility for language switching
 */

export type Language = 'vi' | 'en';

interface Translations {
  [key: string]: {
    vi: string;
    en: string;
  };
}

const translations: Translations = {
  'settings.title': {
    vi: 'Cài đặt',
    en: 'Settings',
  },
  'settings.notifications': {
    vi: 'Thông báo',
    en: 'Notifications',
  },
  'settings.theme': {
    vi: 'Giao diện',
    en: 'Theme',
  },
  'settings.language': {
    vi: 'Ngôn ngữ',
    en: 'Language',
  },
  'settings.privacy': {
    vi: 'Quyền riêng tư',
    en: 'Privacy',
  },
  'settings.enableNotifications': {
    vi: 'Bật thông báo',
    en: 'Enable Notifications',
  },
  'settings.clockInReminder': {
    vi: 'Nhắc nhở chấm công',
    en: 'Clock In Reminder',
  },
  'settings.attendanceSummary': {
    vi: 'Tóm tắt chấm công',
    en: 'Attendance Summary',
  },
  'settings.light': {
    vi: 'Sáng',
    en: 'Light',
  },
  'settings.dark': {
    vi: 'Tối',
    en: 'Dark',
  },
  'settings.auto': {
    vi: 'Tự động',
    en: 'Auto',
  },
  'settings.vietnamese': {
    vi: 'Tiếng Việt',
    en: 'Vietnamese',
  },
  'settings.english': {
    vi: 'English',
    en: 'English',
  },
  'settings.showEmail': {
    vi: 'Hiển thị email',
    en: 'Show Email',
  },
  'settings.showPhone': {
    vi: 'Hiển thị số điện thoại',
    en: 'Show Phone',
  },
  'settings.reset': {
    vi: 'Đặt lại cài đặt về mặc định',
    en: 'Reset to Default',
  },
};

let currentLanguage: Language = 'vi';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const t = (key: string): string => {
  return translations[key]?.[currentLanguage] || key;
};

export const getLanguage = (): Language => {
  return currentLanguage;
};
