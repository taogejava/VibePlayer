import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createTheme, shouldUseDarkMode, defaultSchedule, migrateLegacyTheme, fonts } from './theme';
import type { Theme, ThemeMode, ScheduleConfig } from './theme';

interface ThemeContextType {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  primaryColor: string
  setPrimaryColor: (color: string) => void
  schedule: ScheduleConfig
  setSchedule: (schedule: ScheduleConfig) => void
  fontId: string
  setFontId: (fontId: string) => void
  fonts: typeof fonts
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 主色调
  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    const saved = localStorage.getItem('theme-primary-color');
    if (saved) return saved;
    // 迁移旧版主题 ID
    const legacyId = localStorage.getItem('theme');
    if (legacyId) {
      const migrated = migrateLegacyTheme(legacyId);
      if (migrated) return migrated;
    }
    const customColor = localStorage.getItem('custom-color');
    if (customColor) return customColor;
    return '#8B5CF6'; // 默认薰衣草紫
  });

  // 显示模式
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme-mode') as ThemeMode) || 'dark';
  });

  // 定时配置
  const [schedule, setScheduleState] = useState<ScheduleConfig>(() => {
    const saved = localStorage.getItem('theme-schedule');
    if (saved) {
      try { return { ...defaultSchedule, ...JSON.parse(saved) }; } catch { /* ignore */ }
    }
    return defaultSchedule;
  });

  // 字体
  const [fontId, setFontIdState] = useState<string>(() => {
    return localStorage.getItem('font') || 'system';
  });

  // 计算当前是否深色
  const [isDark, setIsDark] = useState(() => shouldUseDarkMode(mode, schedule));

  // 生成当前主题
  const [theme, setTheme] = useState<Theme>(() => 
    createTheme(primaryColor, isDark ? 'dark' : 'light')
  );

  // 应用主题到 DOM
  const applyThemeToDocument = useCallback((theme: Theme, fontId: string) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);

    root.style.setProperty('--theme-bg-primary', theme.colors.bgPrimary);
    root.style.setProperty('--theme-bg-secondary', theme.colors.bgSecondary);
    root.style.setProperty('--theme-bg-tertiary', theme.colors.bgTertiary);

    root.style.setProperty('--theme-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--theme-text-muted', theme.colors.textMuted);

    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--theme-primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-secondary-light', theme.colors.secondaryLight);

    root.style.setProperty('--theme-gradient-1', theme.colors.gradient1);
    root.style.setProperty('--theme-gradient-2', theme.colors.gradient2);
    root.style.setProperty('--theme-gradient-3', theme.colors.gradient3);

    root.style.setProperty('--theme-accent-1', theme.colors.accent1);
    root.style.setProperty('--theme-accent-2', theme.colors.accent2);
    root.style.setProperty('--theme-accent-3', theme.colors.accent3);

    root.style.setProperty('--theme-glow', theme.colors.glow);

    const font = fonts.find(f => f.id === fontId) || fonts[0];
    root.style.setProperty('--theme-font-family', font.family);
    document.body.style.fontFamily = font.family;
  }, []);

  // 当 isDark 或 primaryColor 变化时，重新生成主题
  useEffect(() => {
    const effectiveMode = isDark ? 'dark' : 'light';
    const newTheme = createTheme(primaryColor, effectiveMode);
    setTheme(newTheme);
    applyThemeToDocument(newTheme, fontId);
  }, [isDark, primaryColor, fontId, applyThemeToDocument]);

  // 监听系统主题变化（auto 模式）
  useEffect(() => {
    if (mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDark(shouldUseDarkMode(mode, schedule));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, schedule]);

  // 定时检查（scheduled 模式），每分钟检查一次
  useEffect(() => {
    if (mode !== 'scheduled' || !schedule.enabled) return;
    const timer = setInterval(() => {
      const newDark = shouldUseDarkMode(mode, schedule);
      if (newDark !== isDark) setIsDark(newDark);
    }, 60000);
    return () => clearInterval(timer);
  }, [mode, schedule, isDark]);

  // 模式变化时重新计算
  useEffect(() => {
    setIsDark(shouldUseDarkMode(mode, schedule));
  }, [mode, schedule]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    localStorage.setItem('theme-primary-color', color);
  };

  const setSchedule = (s: ScheduleConfig) => {
    setScheduleState(s);
    localStorage.setItem('theme-schedule', JSON.stringify(s));
  };

  const setFontId = (newFontId: string) => {
    setFontIdState(newFontId);
    localStorage.setItem('font', newFontId);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      mode,
      setMode,
      primaryColor,
      setPrimaryColor,
      schedule,
      setSchedule,
      fontId,
      setFontId,
      fonts,
      isDark,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
