import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, setCustomColor, themes, fontId, setFontId, fonts } = useTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'font'>('theme');
  const [customColorInput, setCustomColorInput] = useState(theme.colors.primary);

  if (!isOpen) return null;

  const handleCustomColorChange = (color: string) => {
    setCustomColorInput(color);
    setCustomColor(color);
  };

  // 按分类分组主题
  const lightThemes = themes.filter(t => t.category === 'light');
  const darkThemes = themes.filter(t => t.category === 'dark' && t.id !== 'custom');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 设置面板 */}
      <div 
        className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-bg-secondary, #15152a)',
          border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--theme-bg-tertiary, #1e1e3a)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
            设置
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-muted, #9ca3af)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-text-primary, #ffffff)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex px-6 pt-4 gap-2">
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              backgroundColor: activeTab === 'theme' ? 'var(--theme-primary, #8b5cf6)' : 'transparent',
              color: activeTab === 'theme' ? 'var(--theme-bg-primary, #0a0a1a)' : 'var(--theme-text-muted, #9ca3af)'
            }}
          >
            🎨 主题风格
          </button>
          <button
            onClick={() => setActiveTab('font')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              backgroundColor: activeTab === 'font' ? 'var(--theme-primary, #8b5cf6)' : 'transparent',
              color: activeTab === 'font' ? 'var(--theme-bg-primary, #0a0a1a)' : 'var(--theme-text-muted, #9ca3af)'
            }}
          >
            🔤 字体选择
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-6 pb-6 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* 主题选项卡 */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              
              {/* 浅色系 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  <span>🌞</span> 浅色系
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {lightThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-xl transition-all duration-200 text-left ${
                        theme.id === t.id ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: theme.id === t.id 
                          ? 'var(--theme-bg-tertiary, #1e1e3a)'
                          : 'var(--theme-bg-primary, #0a0a1a)',
                        borderColor: t.colors.primary,
                        borderWidth: theme.id === t.id ? 2 : 1,
                        borderStyle: 'solid',
                        color: 'var(--theme-text-primary, #ffffff)'
                      }}
                    >
                      <div className="flex gap-1.5 mb-2">
                        <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                        <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.colors.secondary }} />
                        <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.colors.gradient1 }} />
                      </div>
                      <span className="text-sm font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 深色系 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  <span>🌙</span> 深色系
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {darkThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-xl transition-all duration-200 text-left ${
                        theme.id === t.id ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: theme.id === t.id 
                          ? 'var(--theme-bg-tertiary, #1e1e3a)'
                          : 'var(--theme-bg-primary, #0a0a1a)',
                        borderColor: t.colors.primary,
                        borderWidth: theme.id === t.id ? 2 : 1,
                        borderStyle: 'solid',
                        color: 'var(--theme-text-primary, #ffffff)'
                      }}
                    >
                      <div className="flex gap-1 mb-2">
                        <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                        <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.colors.gradient2 }} />
                      </div>
                      <span className="text-xs font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义颜色 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  <span>🎨</span> 自定义颜色
                </h3>
                <div 
                  className="p-4 rounded-xl space-y-4"
                  style={{ backgroundColor: 'var(--theme-bg-primary, #0a0a1a)' }}
                >
                  {/* 颜色选择器 */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={customColorInput}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="w-16 h-16 rounded-xl cursor-pointer border-none"
                      style={{ background: 'none', padding: 0 }}
                    />
                    <div className="flex-1">
                      <div className="text-sm mb-2" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                        选择你喜欢的颜色
                      </div>
                      <div className="text-lg font-mono" style={{ color: customColorInput }}>
                        {customColorInput.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => setTheme('custom')}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                      style={{ backgroundColor: customColorInput, color: 'var(--theme-bg-primary, #0a0a1a)' }}
                    >
                      应用
                    </button>
                  </div>

                  {/* 预设颜色快捷选择 */}
                  <div>
                    <div className="text-xs mb-2" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                      快捷选择热门颜色
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['#ff4d4f', '#31c27c', '#ec4141', '#1db954', '#8b5cf6', '#06b6d4', '#ff6b9d', '#00b4d8', '#f59e0b', '#ef4444', '#3b82f6', '#10b981'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleCustomColorChange(color)}
                          className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                          title={color.toUpperCase()}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 字体选项卡 */}
          {activeTab === 'font' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {fonts.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setFontId(font.id)}
                    className={`p-4 rounded-xl transition-all duration-200 text-left ${
                      fontId === font.id ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: fontId === font.id 
                        ? 'var(--theme-bg-tertiary, #1e1e3a)'
                        : 'var(--theme-bg-primary, #0a0a1a)',
                      borderColor: 'var(--theme-primary, #8b5cf6)',
                      borderWidth: fontId === font.id ? 2 : 1,
                      borderStyle: 'solid',
                      fontFamily: font.family,
                      color: 'var(--theme-text-primary, #ffffff)'
                    }}
                  >
                    <div className="text-base mb-1">你好世界</div>
                    <div className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                      {font.name}
                    </div>
                    {fontId === font.id && (
                      <div className="mt-2 text-xs" style={{ color: 'var(--theme-primary-light, #a78bfa)' }}>
                        ✓ 当前使用中
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 字体预览 */}
              <div 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: 'var(--theme-bg-primary, #0a0a1a)' }}
              >
                <div className="text-lg mb-2" style={{ fontFamily: fonts.find(f => f.id === fontId)?.family }}>
                  字体预览效果
                </div>
                <div className="text-sm" style={{ 
                  fontFamily: fonts.find(f => f.id === fontId)?.family,
                  color: 'var(--theme-text-muted, #9ca3af)' 
                }}>
                  The quick brown fox jumps over the lazy dog.
                  <br />
                  敏捷的棕色狐狸跳过了懒惰的狗。
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div 
          className="px-6 py-3 text-center text-xs"
          style={{ 
            borderTop: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
            color: 'var(--theme-text-muted, #9ca3af)',
            opacity: 0.6
          }}
        >
          所有设置会自动保存，下次启动时自动应用
        </div>
      </div>
    </div>
  );
};