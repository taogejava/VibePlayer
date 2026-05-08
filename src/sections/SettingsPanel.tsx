import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { presetColors } from '../theme';
import type { ThemeMode } from '../theme';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { mode, setMode, primaryColor, setPrimaryColor, schedule, setSchedule, fontId, setFontId, fonts, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'display' | 'font'>('theme');
  const [customColorInput, setCustomColorInput] = useState(primaryColor);

  if (!isOpen) return null;

  const handleCustomColorChange = (color: string) => {
    setCustomColorInput(color);
    setPrimaryColor(color);
  };

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
              color: activeTab === 'theme' ? '#fff' : 'var(--theme-text-muted, #9ca3af)'
            }}
          >
            🎨 颜色
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              backgroundColor: activeTab === 'display' ? 'var(--theme-primary, #8b5cf6)' : 'transparent',
              color: activeTab === 'display' ? '#fff' : 'var(--theme-text-muted, #9ca3af)'
            }}
          >
            {isDark ? '🌙' : '☀️'} 显示
          </button>
          <button
            onClick={() => setActiveTab('font')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              backgroundColor: activeTab === 'font' ? 'var(--theme-primary, #8b5cf6)' : 'transparent',
              color: activeTab === 'font' ? '#fff' : 'var(--theme-text-muted, #9ca3af)'
            }}
          >
            🔤 字体
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-6 pb-6 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* 颜色选项卡 */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              {/* 预设颜色 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  🎨 选择主色调
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setPrimaryColor(preset.color);
                        setCustomColorInput(preset.color);
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: primaryColor === preset.color 
                          ? 'var(--theme-bg-tertiary, #1e1e3a)' 
                          : 'transparent',
                        border: primaryColor === preset.color 
                          ? `2px solid ${preset.color}` 
                          : '2px solid transparent',
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl transition-transform hover:scale-110"
                        style={{ 
                          backgroundColor: preset.color,
                          boxShadow: primaryColor === preset.color ? `0 4px 16px ${preset.color}60` : 'none',
                        }}
                      />
                      <span className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义颜色 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  ✨ 自定义颜色
                </h3>
                <div 
                  className="p-4 rounded-xl space-y-4"
                  style={{ backgroundColor: 'var(--theme-bg-primary, #0a0a1a)' }}
                >
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
                  </div>

                  {/* 快捷颜色 */}
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
          )}

          {/* 显示模式选项卡 */}
          {activeTab === 'display' && (
            <div className="space-y-5">
              {/* 模式选择 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  🌓 显示模式
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'light' as ThemeMode, icon: '☀️', name: '浅色模式', desc: '始终使用浅色背景' },
                    { id: 'dark' as ThemeMode, icon: '🌙', name: '深色模式', desc: '始终使用深色背景' },
                    { id: 'auto' as ThemeMode, icon: '💻', name: '跟随系统', desc: '自动匹配系统深浅色设置' },
                    { id: 'scheduled' as ThemeMode, icon: '🕐', name: '定时切换', desc: '日落后自动切换深色' },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setMode(opt.id)}
                      className="p-4 rounded-xl transition-all duration-200 text-left"
                      style={{
                        backgroundColor: mode === opt.id 
                          ? 'var(--theme-bg-tertiary, #1e1e3a)' 
                          : 'var(--theme-bg-primary, #0a0a1a)',
                        border: mode === opt.id 
                          ? `2px solid var(--theme-primary, #8b5cf6)` 
                          : '1px solid var(--theme-bg-tertiary, #1e1e3a)',
                      }}
                    >
                      <div className="text-2xl mb-2">{opt.icon}</div>
                      <div className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
                        {opt.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 定时配置 */}
              {mode === 'scheduled' && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                    🕐 定时设置
                  </h3>
                  <div 
                    className="p-4 rounded-xl space-y-4"
                    style={{ backgroundColor: 'var(--theme-bg-primary, #0a0a1a)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                        启用定时切换
                      </span>
                      <button
                        onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
                        className="relative w-12 h-6 rounded-full transition-colors duration-200"
                        style={{ backgroundColor: schedule.enabled ? 'var(--theme-primary, #8b5cf6)' : 'var(--theme-bg-tertiary, #1e1e3a)' }}
                      >
                        <div 
                          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                          style={{ left: schedule.enabled ? '26px' : '4px' }}
                        />
                      </button>
                    </div>
                    {schedule.enabled && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-xs block mb-1" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                            深色开始
                          </label>
                          <input
                            type="time"
                            value={schedule.darkStart}
                            onChange={(e) => setSchedule({ ...schedule, darkStart: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{
                              backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                              color: 'var(--theme-text-primary, #ffffff)',
                              border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
                            }}
                          />
                        </div>
                        <div className="flex items-center pt-4" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>→</div>
                        <div className="flex-1">
                          <label className="text-xs block mb-1" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                            深色结束
                          </label>
                          <input
                            type="time"
                            value={schedule.darkEnd}
                            onChange={(e) => setSchedule({ ...schedule, darkEnd: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{
                              backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                              color: 'var(--theme-text-primary, #ffffff)',
                              border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 快捷切换 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  ⚡ 快捷切换
                </h3>
                <button
                  onClick={() => setMode(isDark ? 'light' : 'dark')}
                  className="w-full p-4 rounded-xl flex items-center justify-between transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, var(--theme-bg-primary, #0a0a1a), var(--theme-bg-tertiary, #1e1e3a))`,
                    border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{isDark ? '☀️' : '🌙'}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
                        切换到{isDark ? '浅色' : '深色'}模式
                      </div>
                      <div className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                        当前: {isDark ? '深色模式' : '浅色模式'}
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
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
