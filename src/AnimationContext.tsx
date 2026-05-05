import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type AnimationMode = 'performance' | 'balanced' | 'lightweight'

export interface AnimationSettings {
  mode: AnimationMode
  particleCount: number
  particleSpeed: number
  particleSize: number
  spectrumBars: number
  spectrumSensitivity: number
  vinylSpeed: number
  vinylGlow: boolean
  frameRate: number
}

const DEFAULT_SETTINGS: AnimationSettings = {
  mode: 'balanced',
  particleCount: 60,
  particleSpeed: 1.0,
  particleSize: 1.0,
  spectrumBars: 64,
  spectrumSensitivity: 1.0,
  vinylSpeed: 1.0,
  vinylGlow: true,
  frameRate: 60
}

const PRESETS: Record<AnimationMode, Partial<AnimationSettings>> = {
  performance: {
    particleCount: 100,
    particleSpeed: 1.5,
    particleSize: 1.2,
    spectrumBars: 80,
    frameRate: 60
  },
  balanced: {
    particleCount: 60,
    particleSpeed: 1.0,
    particleSize: 1.0,
    spectrumBars: 64,
    frameRate: 45
  },
  lightweight: {
    particleCount: 20,
    particleSpeed: 0.5,
    particleSize: 0.8,
    spectrumBars: 32,
    frameRate: 30,
    vinylGlow: false
  }
}

interface AnimationContextType {
  settings: AnimationSettings
  setSettings: (settings: Partial<AnimationSettings>) => void
  resetToDefault: () => void
  applyPreset: (mode: AnimationMode) => void
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AnimationSettings>(() => {
    try {
      const saved = localStorage.getItem('vibeplayer:animations')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('[AnimationContext] Failed to load settings')
    }
    return DEFAULT_SETTINGS
  })

  useEffect(() => {
    localStorage.setItem('vibeplayer:animations', JSON.stringify(settings))
  }, [settings])

  const setSettings = (partial: Partial<AnimationSettings>) => {
    setSettingsState(prev => ({ ...prev, ...partial }))
  }

  const resetToDefault = () => {
    setSettingsState(DEFAULT_SETTINGS)
  }

  const applyPreset = (mode: AnimationMode) => {
    setSettingsState(prev => ({
      ...prev,
      ...PRESETS[mode],
      mode
    }))
  }

  return (
    <AnimationContext.Provider value={{ settings, setSettings, resetToDefault, applyPreset }}>
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider')
  }
  return context
}
