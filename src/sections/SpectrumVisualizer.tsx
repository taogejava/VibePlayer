import { useEffect, useRef } from 'react'
import { useTheme } from '../ThemeContext'

interface Props {
  isPlaying: boolean
  colors?: string[]
  audioElement?: HTMLAudioElement | null
}

function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return hsl

  const h = parseInt(match[1]) / 360
  const s = parseInt(match[2]) / 100
  const l = parseInt(match[3]) / 100

  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export default function SpectrumVisualizer({ isPlaying, colors: propsColors, audioElement }: Props) {
  const { theme } = useTheme()
  const bars = 48
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const heightsRef = useRef<Float32Array>(new Float32Array(bars).fill(0.05))
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  useEffect(() => {
    if (!audioElement) return

    const initAudioAnalyser = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext()
          analyserRef.current = audioContextRef.current.createAnalyser()
          analyserRef.current.fftSize = 128
          analyserRef.current.smoothingTimeConstant = 0.8
          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)

          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement)
          sourceRef.current.connect(analyserRef.current)
          analyserRef.current.connect(audioContextRef.current.destination)
        }
      } catch (e) {
        console.warn('Audio analyser init failed:', e)
      }
    }

    if (isPlaying && audioElement.src) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
      if (!analyserRef.current) {
        initAudioAnalyser()
      }
    }

    return () => {}
  }, [audioElement, isPlaying])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const barEls = container.querySelectorAll<HTMLDivElement>('.spectrum-bar')
    if (barEls.length === 0) return

    let lastTime = performance.now()
    const targetFPS = 30
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastTime

      if (elapsed >= frameInterval) {
        lastTime = currentTime - (elapsed % frameInterval)

        const heights = heightsRef.current
        const analyser = analyserRef.current
        const dataArray = dataArrayRef.current

        if (isPlaying && analyser && dataArray) {
          try {
            analyser.getByteFrequencyData(dataArray)
            const step = Math.floor(dataArray.length / bars)
            for (let i = 0; i < bars; i++) {
              const dataIndex = Math.min(i * step, dataArray.length - 1)
              heights[i] = Math.max(0.05, (dataArray[dataIndex] / 255) * 1.2)
            }
          } catch (e) {
            for (let i = 0; i < bars; i++) {
              let h = heights[i]
              const target = Math.random() * 0.7 + 0.1
              h += (target - h) * (0.15 + Math.random() * 0.1)
              heights[i] = Math.max(0.05, Math.min(1, h))
            }
          }
        } else {
          for (let i = 0; i < bars; i++) {
            let h = heights[i]
            if (isPlaying) {
              const target = Math.random() * 0.7 + 0.1
              h += (target - h) * (0.15 + Math.random() * 0.1)
              heights[i] = Math.max(0.05, Math.min(1, h))
            } else {
              h += (0.05 - h) * 0.08
              heights[i] = Math.max(0.03, h)
            }
          }
        }

        for (let i = 0; i < barEls.length && i < bars; i++) {
          barEls[i].style.transform = `scaleY(${heights[i]})`
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying])

  const rawColors = propsColors && propsColors.length > 0
    ? propsColors
    : (theme.colors.particleColors?.length > 0
      ? theme.colors.particleColors
      : [theme.colors.primary || '#8b5cf6', theme.colors.secondary || '#06b6d4', theme.colors.gradient1 || '#ec4899'])

  const colors = rawColors.map(c => c.startsWith('hsl') ? hslToHex(c) : c)

  return (
    <div
      ref={containerRef}
      className="flex items-end justify-between gap-[2px] w-full"
      style={{ height: 36 }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const colorPct = i / (bars - 1)
        const colorIdx = colorPct * (colors.length - 1)
        const lowerIdx = Math.floor(colorIdx)
        const upperIdx = Math.min(lowerIdx + 1, colors.length - 1)

        return (
          <div
            key={i}
            className="spectrum-bar origin-bottom flex-1"
            style={{
              borderRadius: '1.5px',
              background: `linear-gradient(to top, ${colors[lowerIdx]}, ${colors[upperIdx]})`,
              height: '100%',
              transform: 'scaleY(0.03)',
              opacity: 0.9,
              willChange: 'transform',
              boxShadow: `0 0 6px ${colors[lowerIdx]}55`,
            }}
          />
        )
      })}
    </div>
  )
}
