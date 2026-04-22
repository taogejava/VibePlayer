import React, { createContext, useContext, useState, useEffect } from 'react';
import { defaultTheme, getThemeById, themes, fonts, createCustomTheme } from './theme';
import type { Theme } from './theme';

interface ThemeContextType {
  theme: Theme
  setTheme: (themeId: string) => void
  setCustomColor: (color: string) => void
  themes: Theme[]
  fontId: string
  setFontId: (fontId: string) => void
  fonts: typeof fonts
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
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem('theme');
    return savedThemeId ? getThemeById(savedThemeId) : defaultTheme;
  });

  const [customColor, setCustomColorState] = useState<string>(() => {
    return localStorage.getItem('custom-color') || '#8b5cf6';
  });

  const [fontId, setFontIdState] = useState<string>(() => {
    return localStorage.getItem('font') || 'system';
  });

  const applyThemeToDocument = (theme: Theme, fontId: string) => {
    const root = document.documentElement;
    
    // 设置主题属性
    root.setAttribute('data-theme', theme.id);
    
    // 应用CSS变量
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

    // 应用字体
    const font = fonts.find(f => f.id === fontId) || fonts[0];
    root.style.setProperty('--theme-font-family', font.family);
    document.body.style.fontFamily = font.family;
  };

  const setTheme = (themeId: string) => {
    let newTheme: Theme;
    
    if (themeId === 'custom') {
      newTheme = createCustomTheme(customColor);
    } else {
      newTheme = getThemeById(themeId);
    }
    
    setThemeState(newTheme);
    localStorage.setItem('theme', themeId);
    applyThemeToDocument(newTheme, fontId);
  };

  const setCustomColor = (color: string) => {
    setCustomColorState(color);
    localStorage.setItem('custom-color', color);
    
    if (theme.id === 'custom') {
      const newTheme = createCustomTheme(color);
      setThemeState(newTheme);
      applyThemeToDocument(newTheme, fontId);
    }
  };

  const setFontId = (newFontId: string) => {
    setFontIdState(newFontId);
    localStorage.setItem('font', newFontId);
    applyThemeToDocument(theme, newFontId);
  };

  useEffect(() => {
    // 初始化主题
    applyThemeToDocument(theme, fontId);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      setCustomColor,
      themes,
      fontId,
      setFontId,
      fonts 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};