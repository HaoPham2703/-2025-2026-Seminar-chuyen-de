import { useSettings } from '@/src/contexts/SettingsContext';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  card: string;
  cardSecondary: string;
  border: string;
  accent: string;
  icon: string;
  success: string;
  warning: string;
  error: string;
}

export const useTheme = () => {
  const { currentTheme } = useSettings();

  const isDark = currentTheme === 'dark';

  const colors: ThemeColors = {
    background: isDark ? 'hsl(25, 20%, 10%)' : 'hsl(30, 50%, 97%)',
    backgroundSecondary: isDark ? 'hsl(25, 25%, 15%)' : 'hsl(30, 45%, 95%)',
    text: isDark ? 'hsl(30, 50%, 95%)' : 'hsl(25, 30%, 20%)',
    textSecondary: isDark ? 'hsl(30, 30%, 70%)' : 'hsl(25, 15%, 50%)',
    card: isDark ? 'hsl(25, 25%, 15%)' : 'hsl(30, 40%, 95%)',
    cardSecondary: isDark ? 'hsl(25, 30%, 20%)' : 'hsl(30, 35%, 98%)',
    border: isDark ? 'hsl(30, 20%, 25%)' : 'hsl(30, 25%, 88%)',
    accent: 'hsl(30, 55%, 55%)',
    icon: isDark ? 'hsl(30, 50%, 80%)' : 'hsl(30, 55%, 55%)',
    success: isDark ? 'hsl(120, 50%, 60%)' : 'hsl(120, 50%, 50%)',
    warning: isDark ? 'hsl(40, 70%, 60%)' : 'hsl(40, 70%, 50%)',
    error: isDark ? 'hsl(0, 60%, 60%)' : 'hsl(0, 60%, 50%)',
  };

  return {
    colors,
    isDark,
    currentTheme,
  };
};
