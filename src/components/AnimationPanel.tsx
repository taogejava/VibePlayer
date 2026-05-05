import { useAnimation } from '../AnimationContext'
import type { AnimationMode } from '../AnimationContext'
import { useTheme } from '../ThemeContext'

interface AnimationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AnimationPanel({ isOpen, onClose }: AnimationPanelProps) {
  const { settings, setSettings, resetToDefault, applyPreset } = useAnimation()
  const { theme } = useTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--theme-bg-secondary, #15152a)',
          border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--theme-bg-tertiary, #1e1e3a)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
              动效设置
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>
              调整视觉效果以平衡体验和性能
            </p>
          </div>
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

        <div className="px-6 py-4 space-y-6">
          {/* Presets */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
              <span>⚡</span> 预设模式
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'performance', label: '高性能', icon: '🚀', desc: '最佳视觉效果' },
                { mode: 'balanced', label: '均衡', icon: '⚖️', desc: '平衡体验和性能' },
                { mode: 'lightweight', label: '轻量', icon: '💨', desc: '最低资源消耗' }
              ].map(({ mode, label, icon, desc }) => (
                <button
                  key={mode}
                  onClick={() => applyPreset(mode as AnimationMode)}
                  className={`p-3 rounded-xl transition-all duration-200 text-center ${
                    settings.mode === mode ? 'ring-2' : ''
                  }`}
                  style={{
                    backgroundColor: settings.mode === mode 
                      ? 'var(--theme-bg-tertiary, #1e1e3a)'
                      : 'var(--theme-bg-primary, #0a0a1a)',
                    borderColor: theme.colors.primary,
                    borderWidth: settings.mode === mode ? 2 : 1,
                    borderStyle: 'solid',
                  }}
                >
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-sm font-medium" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
                    {label}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>
                    {desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Particles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
              <span>✨</span> 粒子背景
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    粒子数量: {settings.particleCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={settings.particleCount}
                  onChange={(e) => setSettings({ particleCount: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    移动速度: {settings.particleSpeed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.1"
                  value={settings.particleSpeed}
                  onChange={(e) => setSettings({ particleSpeed: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    粒子大小: {settings.particleSize.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.particleSize}
                  onChange={(e) => setSettings({ particleSize: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Spectrum */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
              <span>📊</span> 频谱可视化
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    频谱条数: {settings.spectrumBars}
                  </span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="128"
                  step="8"
                  value={settings.spectrumBars}
                  onChange={(e) => setSettings({ spectrumBars: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    灵敏度: {settings.spectrumSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.spectrumSensitivity}
                  onChange={(e) => setSettings({ spectrumSensitivity: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Vinyl */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
              <span>💿</span> 黑胶唱片
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    旋转速度: {settings.vinylSpeed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.vinylSpeed}
                  onChange={(e) => setSettings({ vinylSpeed: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                  发光效果
                </span>
                <input
                  type="checkbox"
                  checked={settings.vinylGlow}
                  onChange={(e) => setSettings({ vinylGlow: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
              <span>⚙️</span> 性能
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                  帧率上限: {settings.frameRate}fps
                </span>
              </div>
              <input
                type="range"
                min="24"
                max="60"
                step="6"
                value={settings.frameRate}
                onChange={(e) => setSettings({ frameRate: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={resetToDefault}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                color: 'var(--theme-text-secondary, #d1d5db)',
                border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
              }}
            >
              恢复默认
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: theme.colors.primary,
                color: 'var(--theme-bg-primary, #0a0a1a)',
              }}
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
