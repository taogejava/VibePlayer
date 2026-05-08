import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../ThemeContext'
import { useAudioContext, EQ_PRESETS, type EQPreset } from '../hooks/useAudioContext'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const FREQ_LABELS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k']

export default function EQPanel({ isOpen, onClose }: Props) {
  const { theme } = useTheme()
  const { getEQGains, setEQGain, applyPreset, getCurrentPresetName } = useAudioContext()
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0))
  const [activePreset, setActivePreset] = useState<string>('关闭')
  const [isOpen_, setIsOpen] = useState(false)

  // Sync gains from audio engine
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setGains(getEQGains())
      setActivePreset(getCurrentPresetName())
    }, 300)
    return () => clearInterval(interval)
  }, [isOpen, getEQGains, getCurrentPresetName])

  const handleGainChange = useCallback((index: number, value: number) => {
    const gain = Math.round(value * 12) / 12 // snap to 0.5 steps
    setEQGain(index, gain)
    setGains(prev => {
      const next = [...prev]
      next[index] = gain
      return next
    })
    setActivePreset('自定义')
  }, [setEQGain])

  const handlePreset = useCallback((preset: EQPreset) => {
    applyPreset(preset)
    setGains([...preset.gains])
    setActivePreset(preset.name)
  }, [applyPreset])

  const handleReset = useCallback(() => {
    const offPreset = EQ_PRESETS[0]
    applyPreset(offPreset)
    setGains(new Array(10).fill(0))
    setActivePreset('关闭')
  }, [applyPreset])

  // Toggle open animation
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsOpen(true))
    } else {
      setIsOpen(false)
    }
  }, [isOpen])

  if (!isOpen && !isOpen_) return null

  const primaryColor = theme.colors.primary || '#8b5cf6'
  const bgSecondary = theme.colors.bgSecondary || '#15152a'
  const bgTertiary = theme.colors.bgTertiary || '#1e1e3a'
  const textPrimary = theme.colors.textPrimary || '#ffffff'
  const textMuted = theme.colors.textMuted || '#9ca3af'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ transition: 'opacity 0.2s', opacity: isOpen_ ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-t-2xl overflow-hidden"
        style={{
          backgroundColor: bgSecondary,
          border: `1px solid ${bgTertiary}`,
          borderBottom: 'none',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          transform: isOpen_ ? 'translateY(0)' : 'translateY(100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: bgTertiary }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="text-sm font-medium" style={{ color: textPrimary }}>均衡器</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              backgroundColor: `${primaryColor}22`,
              color: primaryColor
            }}>{activePreset}</span>
            <button
              onClick={handleReset}
              className="text-xs px-2 py-0.5 rounded-full transition-colors"
              style={{
                backgroundColor: bgTertiary,
                color: textMuted
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = textPrimary }}
              onMouseLeave={(e) => { e.currentTarget.style.color = textMuted }}
            >
              重置
            </button>
          </div>
        </div>

        {/* EQ Sliders */}
        <div className="px-5 pb-4">
          <div className="flex items-end justify-between gap-1" style={{ height: 160 }}>
            {gains.map((gain, i) => {
              const pct = ((gain + 12) / 24) * 100
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  {/* dB label */}
                  <span className="text-[10px] tabular-nums" style={{
                    color: gain === 0 ? textMuted : primaryColor,
                    fontWeight: gain === 0 ? 400 : 500
                  }}>
                    {gain > 0 ? '+' : ''}{gain.toFixed(0)}
                  </span>
                  {/* Slider track */}
                  <div
                    className="relative flex-1 w-6 rounded-full cursor-pointer group"
                    style={{ backgroundColor: `${bgTertiary}` }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const y = 1 - (e.clientY - rect.top) / rect.height // 0 (top=+12dB) to 1 (bottom=-12dB)
                      const val = (y * 24) - 12
                      handleGainChange(i, Math.max(-12, Math.min(12, val)))
                    }}
                  >
                    {/* Fill from center */}
                    <div
                      className="absolute left-0 right-0 rounded-full transition-all duration-100"
                      style={{
                        backgroundColor: `${primaryColor}44`,
                        bottom: 0,
                        height: `${Math.max(pct, 0)}%`,
                      }}
                    />
                    {/* Center line (0 dB) */}
                    <div
                      className="absolute left-0 right-0"
                      style={{
                        top: '50%',
                        height: '1px',
                        backgroundColor: `${textMuted}33`,
                      }}
                    />
                    {/* Thumb */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg transition-all duration-100 group-hover:scale-125"
                      style={{
                        bottom: `calc(${pct}% - 8px)`,
                        backgroundColor: gain === 0 ? textMuted : primaryColor,
                        boxShadow: gain === 0 ? 'none' : `0 0 8px ${primaryColor}66`,
                      }}
                    />
                  </div>
                  {/* Freq label */}
                  <span className="text-[10px]" style={{ color: textMuted }}>
                    {FREQ_LABELS[i]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* dB scale labels */}
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-[9px]" style={{ color: textMuted }}>+12dB</span>
            <span className="text-[9px]" style={{ color: textMuted }}>0dB</span>
            <span className="text-[9px]" style={{ color: textMuted }}>-12dB</span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            {EQ_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePreset(preset)}
                className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                style={{
                  backgroundColor: activePreset === preset.name ? `${primaryColor}22` : bgTertiary,
                  color: activePreset === preset.name ? primaryColor : textMuted,
                  border: `1px solid ${activePreset === preset.name ? `${primaryColor}44` : 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  if (activePreset !== preset.name) e.currentTarget.style.color = textPrimary
                }}
                onMouseLeave={(e) => {
                  if (activePreset !== preset.name) e.currentTarget.style.color = textMuted
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
