import { useRef, useCallback } from 'react'

/**
 * Shared AudioContext + AnalyserNode singleton.
 * Used by SpectrumVisualizer and EQ to share the same audio pipeline.
 */
let globalAudioContext: AudioContext | null = null
let globalAnalyser: AnalyserNode | null = null
let globalSource: MediaElementAudioSourceNode | null = null
let globalAudioElement: HTMLAudioElement | null = null
let eqFilters: BiquadFilterNode[] = []

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
const EQ_STORAGE_KEY = 'vibeplayer:eq-preset'
const EQ_FILTER_STORAGE_KEY = 'vibeplayer:eq-filters'

export interface EQPreset {
  name: string
  gains: number[] // 10 values, each -12 to +12
}

export const EQ_PRESETS: EQPreset[] = [
  { name: '关闭', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: '流行', gains: [0, 1, 3, 4, 3, 0, -1, -1, 3, 4] },
  { name: '摇滚', gains: [5, 4, 3, 1, -1, -1, 0, 2, 4, 5] },
  { name: '古典', gains: [5, 4, 3, 2, -1, -1, 0, 2, 3, 4] },
  { name: '人声', gains: [-1, 0, 1, 4, 5, 5, 4, 2, 0, -1] },
  { name: '电子', gains: [5, 4, 1, 0, -2, 0, 1, 3, 4, 5] },
  { name: '低音增强', gains: [8, 6, 4, 1, 0, 0, 0, 0, 0, 0] },
  { name: '高音增强', gains: [0, 0, 0, 0, 0, 0, 1, 4, 6, 8] },
]

function getAudioContext(): { ctx: AudioContext; analyser: AnalyserNode } {
  if (globalAudioContext && globalAnalyser) {
    return { ctx: globalAudioContext, analyser: globalAnalyser }
  }
  globalAudioContext = new AudioContext()
  globalAnalyser = globalAudioContext.createAnalyser()
  globalAnalyser.fftSize = 128
  globalAnalyser.smoothingTimeConstant = 0.8

  // Create EQ filter chain
  eqFilters = EQ_FREQUENCIES.map((freq) => {
    const filter = globalAudioContext!.createBiquadFilter()
    filter.type = 'peaking'
    filter.frequency.value = freq
    filter.Q.value = 1.4
    filter.gain.value = 0
    return filter
  })

  // Connect chain: source -> eq[0] -> eq[1] -> ... -> eq[9] -> analyser -> destination
  // Source will be connected later via connectAudioElement()
  for (let i = 0; i < eqFilters.length - 1; i++) {
    eqFilters[i].connect(eqFilters[i + 1])
  }
  eqFilters[eqFilters.length - 1].connect(globalAnalyser)
  globalAnalyser.connect(globalAudioContext.destination)

  // Load saved EQ gains
  try {
    const saved = localStorage.getItem(EQ_FILTER_STORAGE_KEY)
    if (saved) {
      const gains = JSON.parse(saved) as number[]
      if (gains.length === 10) {
        eqFilters.forEach((f, i) => { f.gain.value = gains[i] })
      }
    }
  } catch { /* ignore */ }

  return { ctx: globalAudioContext, analyser: globalAnalyser }
}

export function useAudioContext() {
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const connectedRef = useRef(false)

  const connectAudioElement = useCallback((audio: HTMLAudioElement) => {
    if (audio === globalAudioElement) return // already connected
    globalAudioElement = audio
    connectedRef.current = false
  }, [])

  const ensureConnected = useCallback(() => {
    if (connectedRef.current || !globalAudioElement) return
    const { ctx } = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    if (!globalSource) {
      globalSource = ctx.createMediaElementSource(globalAudioElement)
      globalSource.connect(eqFilters[0])
    }
    connectedRef.current = true
  }, [])

  const getAnalyser = useCallback(() => {
    ensureConnected()
    return getAudioContext().analyser
  }, [ensureConnected])

  const setEQGain = useCallback((index: number, gain: number) => {
    getAudioContext() // ensure initialized
    if (eqFilters[index]) {
      eqFilters[index].gain.value = gain
      // Persist
      try {
        const gains = eqFilters.map(f => f.gain.value)
        localStorage.setItem(EQ_FILTER_STORAGE_KEY, JSON.stringify(gains))
        // Mark as custom since user manually adjusted
        localStorage.setItem(EQ_STORAGE_KEY, 'custom')
      } catch { /* ignore */ }
    }
  }, [])

  const getEQGains = useCallback((): number[] => {
    getAudioContext()
    return eqFilters.map(f => f.gain.value)
  }, [])

  const applyPreset = useCallback((preset: EQPreset) => {
    getAudioContext()
    preset.gains.forEach((g, i) => {
      if (eqFilters[i]) eqFilters[i].gain.value = g
    })
    try {
      localStorage.setItem(EQ_FILTER_STORAGE_KEY, JSON.stringify(preset.gains))
      localStorage.setItem(EQ_STORAGE_KEY, preset.name)
    } catch { /* ignore */ }
  }, [])

  const getCurrentPresetName = useCallback((): string => {
    return localStorage.getItem(EQ_STORAGE_KEY) || '关闭'
  }, [])

  return {
    audioElementRef,
    connectAudioElement,
    ensureConnected,
    getAnalyser,
    setEQGain,
    getEQGains,
    applyPreset,
    getCurrentPresetName,
  }
}

export { getAudioContext, EQ_FREQUENCIES }
