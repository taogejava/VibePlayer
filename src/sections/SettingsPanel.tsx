import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../ThemeContext';
import { presetColors } from '../theme';
import type { ThemeMode } from '../theme';
import { useAudioContext, EQ_PRESETS, type EQPreset } from '../hooks/useAudioContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREQ_LABELS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

type TabId = 'theme' | 'display' | 'font' | 'eq';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { mode, setMode, primaryColor, setPrimaryColor, schedule, setSchedule, fontId, setFontId, fonts, isDark } = useTheme();
  const { getEQGains, setEQGain, applyPreset: applyEQPreset, getCurrentPresetName } = useAudioContext();

  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const [customColorInput, setCustomColorInput] = useState(primaryColor);
  const [eqGains, setEqGains] = useState<number[]>(new Array(10).fill(0));
  const [activeEQPreset, setActiveEQPreset] = useState<string>('关闭');

  // Sync EQ gains from audio engine
  useEffect(() => {
    if (!isOpen || activeTab !== 'eq') return
    const interval = setInterval(() => {
      setEqGains(getEQGains())
      setActiveEQPreset(getCurrentPresetName())
    }, 300)
    return () => clearInterval(interval)
  }, [isOpen, activeTab, getEQGains, getCurrentPresetName])

  const handleCustomColorChange = (color: string) => {
    setCustomColorInput(color);
    setPrimaryColor(color);
  };

  const handleGainChange = useCallback((index: number, value: number) => {
    const gain = Math.round(value * 12) / 12
    setEQGain(index, gain)
    setEqGains(prev => {
      const next = [...prev]
      next[index] = gain
      return next
    })
    setActiveEQPreset('自定义')
  }, [setEQGain])

  const handleEQPreset = useCallback((preset: EQPreset) => {
    applyEQPreset(preset)
    setEqGains([...preset.gains])
    setActiveEQPreset(preset.name)
  }, [applyEQPreset])

  const handleEQReset = useCallback(() => {
    const offPreset = EQ_PRESETS[0]
    applyEQPreset(offPreset)
    setEqGains(new Array(10).fill(0))
    setActiveEQPreset('关闭')
  }, [applyEQPreset])

  if (!isOpen) return null;

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'theme', icon: '🎨', label: '颜色' },
    { id: 'display', icon: isDark ? '🌙' : '☀️', label: '显示' },
    { id: 'font', icon: '🔤', label: '字体' },
    { id: 'eq', icon: '🎚️', label: '音效' },
  ];

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
          <div className="flex items-center gap-3">
            {/* 快速切换深浅色 */}
            <button
              onClick={() => setMode(isDark ? 'light' : 'dark')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                color: 'var(--theme-text-secondary, #d1d5db)',
                border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
              }}
              title={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              <span>{isDark ? '☀️' : '🌙'}</span>
              <span className="text-xs">{isDark ? '浅色' : '深色'}</span>
            </button>
            {/* 关闭按钮 */}
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
        </div>

        {/* Tab 切换 */}
        <div className="flex px-4 pt-3 gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--theme-primary, #8b5cf6)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--theme-text-muted, #9ca3af)'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="px-6 pb-6 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* ========== 颜色 tab ========== */}
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

          {/* ========== 显示 tab ========== */}
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

          {/* ========== 字体 tab ========== */}
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

          {/* ========== 音效 tab (EQ) ========== */}
          {activeTab === 'eq' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 4v16m-8-8h16" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  均衡器
                </h3>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs px-3 py-1 rounded-full font-medium" 
                    style={{
                      background: 'linear-gradient(135deg, var(--theme-primary-alpha-20, rgba(139,92,246,0.2)), var(--theme-primary-alpha-5, rgba(139,92,246,0.05)))',
                      color: 'var(--theme-primary, #8b5cf6)',
                      border: '1px solid var(--theme-primary-alpha-25, rgba(139,92,246,0.25))'
                    }}
                  >
                    {activeEQPreset}
                  </span>
                  <button
                    onClick={handleEQReset}
                    className="text-xs px-3 py-1 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                      color: 'var(--theme-text-muted, #9ca3af)'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.color = 'var(--theme-text-primary, #ffffff)'
                      e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary-hover, #252545)'
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'
                      e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary, #1e1e3a)'
                    }}
                  >
                    重置
                  </button>
                </div>
              </div>

              {/* EQ Container */}
              <div 
                className="rounded-2xl p-4"
                style={{ 
                  background: 'linear-gradient(180deg, var(--theme-bg-tertiary, #1e1e3a) 0%, var(--theme-bg-primary, #0a0a1a) 100%)',
                  border: '1px solid var(--theme-bg-tertiary, #1e1e3a)'
                }}
              >
                {/* EQ Sliders */}
                <div className="flex items-end justify-between gap-0.5" style={{ height: 160 }}>
                  {eqGains.map((gain, i) => {
                    const pct = ((gain + 12) / 24) * 100
                    const isActive = gain !== 0
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                        {/* dB label */}
                        <span 
                          className="text-[10px] tabular-nums font-medium transition-all duration-200" 
                          style={{
                            color: isActive ? 'var(--theme-primary, #8b5cf6)' : 'var(--theme-text-muted, #9ca3af)',
                            opacity: isActive ? 1 : 0.5
                          }}
                        >
                          {gain > 0 ? '+' : ''}{gain.toFixed(0)}
                        </span>
                        {/* Slider track container */}
                        <div className="relative flex-1 w-5 flex items-center justify-center">
                          {/* Vertical bar */}
                          <div
                            className="relative w-2 h-full rounded-full overflow-hidden cursor-pointer group"
                            style={{ 
                              backgroundColor: 'var(--theme-bg-primary, #0a0a1a)',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const y = 1 - (e.clientY - rect.top) / rect.height
                              const val = (y * 24) - 12
                              handleGainChange(i, Math.max(-12, Math.min(12, val)))
                            }}
                          >
                            {/* Active fill */}
                            <div
                              className="absolute left-0 right-0 rounded-full transition-all duration-100 ease-out"
                              style={{
                                background: isActive 
                                  ? 'linear-gradient(180deg, var(--theme-primary, #8b5cf6) 0%, var(--theme-secondary, #06b6d4) 100%)'
                                  : 'transparent',
                                bottom: 0,
                                height: `${Math.max(pct, 0)}%`,
                                opacity: isActive ? 0.8 : 0.3
                              }}
                            />
                            {/* Glow effect */}
                            {isActive && (
                              <div
                                className="absolute left-0 right-0 rounded-full transition-all duration-100"
                                style={{
                                  background: 'var(--theme-primary, #8b5cf6)',
                                  bottom: `calc(${pct}% - 6px)`,
                                  height: '12px',
                                  filter: 'blur(8px)',
                                  opacity: 0.5
                                }}
                              />
                            )}
                            {/* Center line (0 dB) */}
                            <div
                              className="absolute left-0 right-0"
                              style={{
                                top: '50%',
                                height: '1px',
                                backgroundColor: 'var(--theme-text-muted, #9ca3af)',
                                opacity: 0.15,
                                transform: 'translateY(-50%)'
                              }}
                            />
                            {/* Thumb */}
                            <div
                              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-all duration-100"
                              style={{
                                bottom: `calc(${pct}% - 6px)`,
                                backgroundColor: isActive ? 'var(--theme-primary, #8b5cf6)' : 'var(--theme-text-muted, #9ca3af)',
                                boxShadow: isActive 
                                  ? '0 0 12px var(--theme-glow, rgba(139,92,246,0.6)), 0 2px 4px rgba(0,0,0,0.3)' 
                                  : '0 2px 4px rgba(0,0,0,0.3)',
                                transform: `translateX(-50%) ${isActive ? 'scale(1)' : 'scale(0.8)'}`
                              }}
                            />
                          </div>
                        </div>
                        {/* Freq label */}
                        <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.7 }}>
                          {FREQ_LABELS[i]}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* dB scale labels */}
                <div className="flex justify-between mt-3 px-2">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>+12dB</span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.3 }}>0dB</span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>-12dB</span>
                </div>
              </div>

              {/* Preset buttons */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 3v18M7 12h10" strokeLinecap="round"/>
                  </svg>
                  音效预设
                </h3>
                <div className="flex flex-wrap gap-2">
                  {EQ_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleEQPreset(preset)}
                      className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                      style={{
                        background: activeEQPreset === preset.name 
                          ? 'linear-gradient(135deg, var(--theme-primary-alpha-20, rgba(139,92,246,0.2)), var(--theme-primary-alpha-5, rgba(139,92,246,0.05)))'
                          : 'var(--theme-bg-tertiary, #1e1e3a)',
                        color: activeEQPreset === preset.name ? 'var(--theme-primary, #8b5cf6)' : 'var(--theme-text-muted, #9ca3af)',
                        border: `1px solid ${activeEQPreset === preset.name ? 'var(--theme-primary-alpha-30, rgba(139,92,246,0.3))' : 'transparent'}`,
                        boxShadow: activeEQPreset === preset.name ? '0 4px 16px var(--theme-primary-alpha-10, rgba(139,92,246,0.1))' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (activeEQPreset !== preset.name) {
                          e.currentTarget.style.color = 'var(--theme-text-primary, #ffffff)'
                          e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary-hover, #252545)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeEQPreset !== preset.name) {
                          e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'
                          e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary, #1e1e3a)'
                        }
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
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
