import { useEffect, useRef } from 'react'

interface Props {
  isPlaying: boolean
  colors: string[]
}

export default function SpectrumVisualizer({ isPlaying, colors }: Props) {
  const bars = 32
  const heightsRef = useRef<number[]>(Array.from({ length: bars }, () => Math.random() * 0.3 + 0.1))
  const frameRef = useRef<number | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const barEls = container.querySelectorAll<HTMLDivElement>('.spectrum-bar')

    const animate = () => {
      heightsRef.current = heightsRef.current.map((h) => {
        if (isPlaying) {
          const target = Math.random() * 0.85 + 0.08
          const speed = 0.08 + Math.random() * 0.12
          return h + (target - h) * speed
        } else {
          return h + (0.05 - h) * 0.1
        }
      })

      barEls.forEach((el, i) => {
        const h = heightsRef.current[i]
        el.style.transform = `scaleY(${h})`
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [isPlaying])

  return (
    <div
      ref={containerRef}
      className="flex items-end justify-center gap-0.5 h-10 w-full px-2"
      style={{ height: 40 }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const colorPct = i / bars
        const colorIdx = colorPct * (colors.length - 1)
        const lowerIdx = Math.floor(colorIdx)
        const upperIdx = Math.min(lowerIdx + 1, colors.length - 1)

        return (
          <div
            key={i}
            className="spectrum-bar flex-1 rounded-sm origin-bottom transition-none"
            style={{
              background: `linear-gradient(to top, ${colors[lowerIdx]}, ${colors[upperIdx]})`,
              height: '100%',
              transform: 'scaleY(0.1)',
              opacity: 0.85,
              boxShadow: `0 0 4px ${colors[lowerIdx]}88`,
            }}
          />
        )
      })}
    </div>
  )
}
