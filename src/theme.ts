// 主题配置 - 浅色系 & 深色系

export interface Theme {
  id: string
  name: string
  type: 'preset' | 'custom'
  category: 'light' | 'dark'
  colors: {
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

export const themes: Theme[] = [
  // ════════════════════════════════════════════
  // 🌞 浅色系 (白色背景)
  // ════════════════════════════════════════════

  // ── 翡翠绿 · 清新自然 ──
  {
    id: 'light-emerald',
    name: '翡翠绿',
    type: 'preset',
    category: 'light',
    colors: {
      bgPrimary: '#fafbfc',
      bgSecondary: '#f0f4f3',
      bgTertiary: '#e6eeea',
      textPrimary: '#1a2f2a',
      textSecondary: '#3d5c52',
      textMuted: '#7a9488',
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#059669',
      secondary: '#6EE7B7',
      secondaryLight: '#A7F3D0',
      gradient1: '#10B981',
      gradient2: '#34D399',
      gradient3: '#6EE7B7',
      accent1: '#F59E0B',
      accent2: '#3B82F6',
      accent3: '#EC4899',
      glow: 'rgba(16, 185, 129, 0.25)',
      particleColors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
    }
  },

  // ── 天空蓝 · 清新宁静 ──
  {
    id: 'light-sky',
    name: '天空蓝',
    type: 'preset',
    category: 'light',
    colors: {
      bgPrimary: '#f8fbff',
      bgSecondary: '#eff4fc',
      bgTertiary: '#e4ecf8',
      textPrimary: '#1a2540',
      textSecondary: '#3d4d6b',
      textMuted: '#7a8ca8',
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#2563EB',
      secondary: '#93C5FD',
      secondaryLight: '#BFDBFE',
      gradient1: '#3B82F6',
      gradient2: '#60A5FA',
      gradient3: '#93C5FD',
      accent1: '#10B981',
      accent2: '#F59E0B',
      accent3: '#EF4444',
      glow: 'rgba(59, 130, 246, 0.25)',
      particleColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']
    }
  },

  // ── 樱花粉 · 温柔浪漫 ──
  {
    id: 'light-sakura',
    name: '樱花粉',
    type: 'preset',
    category: 'light',
    colors: {
      bgPrimary: '#fdf8fa',
      bgSecondary: '#f9eef2',
      bgTertiary: '#f3dde6',
      textPrimary: '#2a1520',
      textSecondary: '#5c334a',
      textMuted: '#98687a',
      primary: '#EC4899',
      primaryLight: '#F472B6',
      primaryDark: '#DB2777',
      secondary: '#F9A8D4',
      secondaryLight: '#FBCFE8',
      gradient1: '#EC4899',
      gradient2: '#F472B6',
      gradient3: '#F9A8D4',
      accent1: '#F59E0B',
      accent2: '#10B981',
      accent3: '#8B5CF6',
      glow: 'rgba(236, 72, 153, 0.22)',
      particleColors: ['#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8']
    }
  },

  // ── 薰衣草 · 优雅神秘 ──
  {
    id: 'light-lavender',
    name: '薰衣草',
    type: 'preset',
    category: 'light',
    colors: {
      bgPrimary: '#faf8ff',
      bgSecondary: '#f2edfd',
      bgTertiary: '#e8dff9',
      textPrimary: '#201840',
      textSecondary: '#44366b',
      textMuted: '#8070a8',
      primary: '#8B5CF6',
      primaryLight: '#A78BFA',
      primaryDark: '#7C3AED',
      secondary: '#C4B5FD',
      secondaryLight: '#DDD6FE',
      gradient1: '#8B5CF6',
      gradient2: '#A78BFA',
      gradient3: '#C4B5FD',
      accent1: '#EC4899',
      accent2: '#06B6D4',
      accent3: '#F59E0B',
      glow: 'rgba(139, 92, 246, 0.22)',
      particleColors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']
    }
  },

  // ── 琥珀橙 · 温暖活力 ──
  {
    id: 'light-amber',
    name: '琥珀橙',
    type: 'preset',
    category: 'light',
    colors: {
      bgPrimary: '#fefdf8',
      bgSecondary: '#fcf7ef',
      bgTertiary: '#f9eedf',
      textPrimary: '#2a2008',
      textSecondary: '#5c4518',
      textMuted: '#988055',
      primary: '#F59E0B',
      primaryLight: '#FBBF24',
      primaryDark: '#D97706',
      secondary: '#FCD34D',
      secondaryLight: '#FDE68A',
      gradient1: '#F59E0B',
      gradient2: '#FBBF24',
      gradient3: '#FCD34D',
      accent1: '#EF4444',
      accent2: '#10B981',
      accent3: '#3B82F6',
      glow: 'rgba(245, 158, 11, 0.22)',
      particleColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']
    }
  },

  // ─· 玫瑰红 · 热情奔放 ──
  {
    id: 'light-rose',
    name: '玫瑰红',
    type: 'preset',
    category: 'light',
    colors: {
      bgPrimary: '#fffaf9',
      bgSecondary: '#ffefeb',
      bgTertiary: '#ffe0da',
      textPrimary: '#301008',
      textSecondary: '#602818',
      textMuted: '#985550',
      primary: '#EF4444',
      primaryLight: '#F87171',
      primaryDark: '#DC2626',
      secondary: '#FCA5A5',
      secondaryLight: '#FECACA',
      gradient1: '#EF4444',
      gradient2: '#F87171',
      gradient3: '#FCA5A5',
      accent1: '#F59E0B',
      accent2: '#10B981',
      accent3: '#8B5CF6',
      glow: 'rgba(239, 68, 68, 0.20)',
      particleColors: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA']
    }
  },

  // ════════════════════════════════════════════
  // 🌙 深色系 (深色背景)
  // ════════════════════════════════════════════

  // ── 午夜蓝 · 深邃宁静 ──
  {
    id: 'dark-midnight',
    name: '午夜蓝',
    type: 'preset',
    category: 'dark',
    colors: {
      bgPrimary: '#070d1a',
      bgSecondary: '#0c1628',
      bgTertiary: '#142038',
      textPrimary: '#e8f0fc',
      textSecondary: '#a8c0e0',
      textMuted: '#5a78a0',
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#2563EB',
      secondary: '#1D4ED8',
      secondaryLight: '#3B82F6',
      gradient1: '#3B82F6',
      gradient2: '#60A5FA',
      gradient3: '#93C5FD',
      accent1: '#FBBF24',
      accent2: '#10B981',
      accent3: '#EC4899',
      glow: 'rgba(59, 130, 246, 0.35)',
      particleColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#FBBF24']
    }
  },

  // ── 酒红夜 · 热情浪漫 ──
  {
    id: 'dark-wine',
    name: '酒红夜',
    type: 'preset',
    category: 'dark',
    colors: {
      bgPrimary: '#14080e',
      bgSecondary: '#1e1018',
      bgTertiary: '#2a1822',
      textPrimary: '#fce8f0',
      textSecondary: '#e0a8bc',
      textMuted: '#906078',
      primary: '#EF4444',
      primaryLight: '#F87171',
      primaryDark: '#DC2626',
      secondary: '#DC2626',
      secondaryLight: '#EF4444',
      gradient1: '#EF4444',
      gradient2: '#F97316',
      gradient3: '#FBBF24',
      accent1: '#FBBF24',
      accent2: '#10B981',
      accent3: '#8B5CF6',
      glow: 'rgba(239, 68, 68, 0.35)',
      particleColors: ['#EF4444', '#F97316', '#FBBF24', '#F87171']
    }
  },

  // ── 琥珀金 · 温暖复古 ──
  {
    id: 'dark-golden',
    name: '琥珀金',
    type: 'preset',
    category: 'dark',
    colors: {
      bgPrimary: '#12100a',
      bgSecondary: '#1c1810',
      bgTertiary: '#282218',
      textPrimary: '#fcf4e0',
      textSecondary: '#dcc8a0',
      textMuted: '#908058',
      primary: '#F59E0B',
      primaryLight: '#FBBF24',
      primaryDark: '#D97706',
      secondary: '#D97706',
      secondaryLight: '#F59E0B',
      gradient1: '#F59E0B',
      gradient2: '#FBBF24',
      gradient3: '#FCD34D',
      accent1: '#EF4444',
      accent2: '#10B981',
      accent3: '#3B82F6',
      glow: 'rgba(245, 158, 11, 0.35)',
      particleColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#EF4444']
    }
  },

  // ── 极夜黑 · 简约高级 ──
  {
    id: 'dark-obsidian',
    name: '极夜黑',
    type: 'preset',
    category: 'dark',
    colors: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#141414',
      bgTertiary: '#202020',
      textPrimary: '#f0f0f0',
      textSecondary: '#a8a8a8',
      textMuted: '#606060',
      primary: '#E5E5E5',
      primaryLight: '#FFFFFF',
      primaryDark: '#CCCCCC',
      secondary: '#888888',
      secondaryLight: '#AAAAAA',
      gradient1: '#E5E5E5',
      gradient2: '#AAAAAA',
      gradient3: '#777777',
      accent1: '#FF4444',
      accent2: '#44CC44',
      accent3: '#4488FF',
      glow: 'rgba(229, 229, 229, 0.18)',
      particleColors: ['#E5E5E5', '#AAAAAA', '#FF4444', '#4488FF']
    }
  },

  // ── 赛博紫 · 科技未来 ──
  {
    id: 'dark-cyber',
    name: '赛博紫',
    type: 'preset',
    category: 'dark',
    colors: {
      bgPrimary: '#0a0818',
      bgSecondary: '#120e28',
      bgTertiary: '#1c1638',
      textPrimary: '#e8e0ff',
      textSecondary: '#b8a8e0',
      textMuted: '#7060a0',
      primary: '#8B5CF6',
      primaryLight: '#A78BFA',
      primaryDark: '#7C3AED',
      secondary: '#6366F1',
      secondaryLight: '#818CF8',
      gradient1: '#8B5CF6',
      gradient2: '#6366F1',
      gradient3: '#EC4899',
      accent1: '#06B6D4',
      accent2: '#10B981',
      accent3: '#F59E0B',
      glow: 'rgba(139, 92, 246, 0.35)',
      particleColors: ['#8B5CF6', '#6366F1', '#EC4899', '#06B6D4']
    }
  },

  // ── 翡翠暗 · 自然深沉 ──
  {
    id: 'dark-emerald',
    name: '翡翠暗',
    type: 'preset',
    category: 'dark',
    colors: {
      bgPrimary: '#081210',
      bgSecondary: '#0e1c18',
      bgTertiary: '#162822',
      textPrimary: '#e0f8f0',
      textSecondary: '#98d8be',
      textMuted: '#589078',
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#059669',
      secondary: '#059669',
      secondaryLight: '#10B981',
      gradient1: '#10B981',
      gradient2: '#34D399',
      gradient3: '#6EE7B7',
      accent1: '#F59E0B',
      accent2: '#3B82F6',
      accent3: '#EC4899',
      glow: 'rgba(16, 185, 129, 0.35)',
      particleColors: ['#10B981', '#34D399', '#6EE7B7', '#F59E0B']
    }
  },

  // ════════════════════════════════════════════
  // 🎨 自定义主题（默认）
  // ════════════════════════════════════════════
  {
    id: 'custom',
    name: '自定义主题',
    type: 'custom',
    category: 'dark',
    colors: {
      bgPrimary: '#0a0a1a',
      bgSecondary: '#15152a',
      bgTertiary: '#1e1e3a',
      textPrimary: '#ffffff',
      textSecondary: '#d1d5db',
      textMuted: '#9ca3af',
      primary: '#8b5cf6',
      primaryLight: '#a78bfa',
      primaryDark: '#7c3aed',
      secondary: '#06b6d4',
      secondaryLight: '#22d3ee',
      gradient1: '#8b5cf6',
      gradient2: '#06b6d4',
      gradient3: '#ec4899',
      accent1: '#f59e0b',
      accent2: '#10b981',
      accent3: '#3b82f6',
      glow: 'rgba(139, 92, 246, 0.4)',
      particleColors: ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b']
    }
  }
]

export const defaultTheme = themes[themes.findIndex(t => t.id === 'light-emerald') >= 0 ? themes.findIndex(t => t.id === 'light-emerald') : 0]

export const getThemeById = (id: string): Theme => {
  return themes.find(theme => theme.id === id) || defaultTheme
}

export const createCustomTheme = (primaryColor: string): Theme => {
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

  return {
    id: 'custom',
    name: '自定义主题',
    type: 'custom' as const,
    category: 'dark' as const,
    colors: {
      bgPrimary: '#0a0a1a',
      bgSecondary: '#15152a',
      bgTertiary: '#1e1e3a',
      textPrimary: '#ffffff',
      textSecondary: '#d1d5db',
      textMuted: '#9ca3af',
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
      glow: hexToRgba(primaryColor, 0.4),
      particleColors: [primaryColor, lighten(primaryColor, 20), lighten(primaryColor, 40), '#f59e0b']
    }
  }
}
