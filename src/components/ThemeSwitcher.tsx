import React from 'react'
import { useTheme } from '../ThemeContext'

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="backdrop-blur-md rounded-lg p-3" style={{ backgroundColor: 'var(--theme-bg-secondary, #0f0f19)', borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderWidth: '1px', borderStyle: 'solid' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>选择主题</h3>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="px-3 py-2 rounded-md text-sm transition-all duration-200"
              style={{
                backgroundColor: theme.id === t.id ? `${t.colors.primary}33` : 'var(--theme-bg-tertiary, #1e1e3a)',
                color: theme.id === t.id ? 'var(--theme-text-primary, #ffffff)' : 'var(--theme-text-muted, #9ca3af)',
                borderColor: theme.id === t.id ? `${t.colors.primary}66` : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
