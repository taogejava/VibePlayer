// 主题配置 - 颜色驱动 + 模式切换

export type ThemeMode = 'light' | 'dark' | 'auto' | 'scheduled'

export interface ThemeColors {
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight: string
  gradient1: string
  gradient2: string
  gradient3: string
  accent1: string
  accent2: string
  accent3: string
  glow: string
  particleColors: string[]
}

export interface Theme {
  id: string
  name: string
  mode: 'light' | 'dark'
  colors: ThemeColors
  font?: string
}

export const fonts = [
  { id: 'system', name: '系统默认', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { id: 'pingfang', name: '苹方', family: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  { id: 'noto', name: 'Noto Sans SC', family: '"Noto Sans SC", sans-serif' },
  { id: 'source-han', name: '思源黑体', family: '"Source Han Sans SC", sans-serif' },
  { id: 'zcool', name: '站酷快乐体', family: '"ZCOOL KuaiLe", cursive, sans-serif' },
  { id: 'ma-shan-zheng', name: '马善政楷体', family: '"Ma Shan Zheng", cursive, sans-serif' },
]

// 预设颜色（6 种精选主色调）
export const presetColors = [
  { id: 'emerald', name: '翡翠绿', color: '#10B981' },
  { id: 'sky', name: '天空蓝', color: '#3B82F6' },
  { id: 'sakura', name: '樱花粉', color: '#EC4899' },
  { id: 'lavender', name: '薰衣草', color: '#8B5CF6' },
  { id: 'amber', name: '琥珀橙', color: '#F59E0B' },
  { id: 'rose', name: '玫瑰红', color: '#EF4444' },
  { id: 'cyan', name: '青碧', color: '#06B6D4' },
  { id: 'indigo', name: '靛蓝', color: '#6366F1' },
]

// 工具函数
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const lighten = (hex: string, percent: number) => {
  const num = parseInt(hex.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
  const B = Math.min(255, (num & 0x0000FF) + amt)
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
}

const darken = (hex: string, percent: number) => {
  const num = parseInt(hex.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, (num >> 16) - amt)
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
  const B = Math.max(0, (num & 0x0000FF) - amt)
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
}

// 从主色调 + 模式生成完整主题
export function createTheme(primaryColor: string, mode: 'light' | 'dark'): Theme {
  if (mode === 'dark') {
    return {
      id: `dark-${primaryColor}`,
      name: '深色模式',
      mode: 'dark',
      colors: {
        bgPrimary: '#0a0a1a',
        bgSecondary: '#12121f',
        bgTertiary: '#1a1a2e',
        textPrimary: '#f0f0f5',
        textSecondary: '#b0b0c0',
        textMuted: '#6a6a80',
        primary: primaryColor,
        primaryLight: lighten(primaryColor, 15),
        primaryDark: darken(primaryColor, 10),
        secondary: lighten(primaryColor, 25),
        secondaryLight: lighten(primaryColor, 35),
        gradient1: primaryColor,
        gradient2: lighten(primaryColor, 25),
        gradient3: lighten(primaryColor, 45),
        accent1: '#f59e0b',
        accent2: '#10b981',
        accent3: '#3b82f6',
        glow: hexToRgba(primaryColor, 0.35),
        particleColors: [primaryColor, lighten(primaryColor, 20), lighten(primaryColor, 40), '#f59e0b'],
      },
    }
  }

  // Light mode
  // 根据主色调色相推导浅色背景色
  const hue = getHue(primaryColor)
  return {
    id: `light-${primaryColor}`,
    name: '浅色模式',
    mode: 'light',
    colors: {
      bgPrimary: `hsl(${hue}, 20%, 97%)`,
      bgSecondary: `hsl(${hue}, 18%, 94%)`,
      bgTertiary: `hsl(${hue}, 15%, 90%)`,
      textPrimary: `hsl(${hue}, 30%, 12%)`,
      textSecondary: `hsl(${hue}, 20%, 35%)`,
      textMuted: `hsl(${hue}, 12%, 55%)`,
      primary: primaryColor,
      primaryLight: lighten(primaryColor, 15),
      primaryDark: darken(primaryColor, 10),
      secondary: lighten(primaryColor, 30),
      secondaryLight: lighten(primaryColor, 45),
      gradient1: primaryColor,
      gradient2: lighten(primaryColor, 20),
      gradient3: lighten(primaryColor, 40),
      accent1: '#f59e0b',
      accent2: '#10b981',
      accent3: '#3b82f6',
      glow: hexToRgba(primaryColor, 0.2),
      particleColors: [primaryColor, lighten(primaryColor, 20), lighten(primaryColor, 40), darken(primaryColor, 10)],
    },
  }
}

function getHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0
  if (max !== min) {
    const d = max - min
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return Math.round(h * 360)
}

// 定时切换时间配置
export interface ScheduleConfig {
  enabled: boolean
  darkStart: string // e.g. "18:00"
  darkEnd: string   // e.g. "07:00"
}

export const defaultSchedule: ScheduleConfig = {
  enabled: false,
  darkStart: '18:00',
  darkEnd: '07:00',
}

// 判断当前是否应该用深色模式
export function shouldUseDarkMode(mode: ThemeMode, schedule: ScheduleConfig): boolean {
  if (mode === 'light') return false
  if (mode === 'dark') return true
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  if (mode === 'scheduled' && schedule.enabled) {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const [dH, dM] = schedule.darkStart.split(':').map(Number)
    const [lH, lM] = schedule.darkEnd.split(':').map(Number)
    const darkStartMin = dH * 60 + dM
    const darkEndMin = lH * 60 + lM
    if (darkStartMin > darkEndMin) {
      // 跨午夜 e.g. 18:00 → 07:00
      return currentMinutes >= darkStartMin || currentMinutes < darkEndMin
    } else {
      return currentMinutes >= darkStartMin && currentMinutes < darkEndMin
    }
  }
  return false
}

// 向后兼容：旧 ID 映射到颜色
const legacyThemeMap: Record<string, string> = {
  'light-emerald': '#10B981',
  'light-sky': '#3B82F6',
  'light-sakura': '#EC4899',
  'light-lavender': '#8B5CF6',
  'light-amber': '#F59E0B',
  'light-rose': '#EF4444',
  'dark-midnight': '#3B82F6',
  'dark-wine': '#EF4444',
  'dark-golden': '#F59E0B',
  'dark-obsidian': '#E5E5E5',
  'dark-cyber': '#8B5CF6',
  'dark-emerald': '#10B981',
  'custom': '#8b5cf6',
}

export function migrateLegacyTheme(savedId: string): string | null {
  return legacyThemeMap[savedId] || null
}
