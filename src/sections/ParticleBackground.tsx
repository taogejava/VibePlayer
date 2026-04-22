import { useEffect, useRef } from 'react'
import { useTheme } from '../ThemeContext'

interface Props {
  colors?: string[]
  isPlaying: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  opacity: number
  color: string
  life: number
  maxLife: number
}

export default function ParticleBackground({ colors: propsColors, isPlaying }: Props) {
  const { theme } = useTheme()
  const colors = propsColors || theme.colors.particleColors
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number | undefined>(undefined)
  const isPlayingRef = useRef(isPlaying)
  const colorsRef = useRef(colors)

  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { colorsRef.current = colors }, [colors, theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize static particles
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push(createParticle(canvas.width, canvas.height, colorsRef.current, true))
    }

    const spawn = () => {
      if (isPlayingRef.current && particlesRef.current.length < 120) {
        const count = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < count; j++) {
          particlesRef.current.push(createParticle(canvas.width, canvas.height, colorsRef.current, false))
        }
      }
    }
    const spawnInterval = setInterval(spawn, 200)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current = particlesRef.current.filter(p => p.life > 0)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.life -= 1
        p.opacity = Math.min(1, p.life / (p.maxLife * 0.3)) * Math.min(1, p.life / p.maxLife * 3) * 0.7

        if (p.life <= 0) continue

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()

        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2)
        gradient.addColorStop(0, p.color + Math.floor(p.opacity * 0.4 * 255).toString(16).padStart(2, '0'))
        gradient.addColorStop(1, p.color + '00')
        ctx.fillStyle = gradient
        ctx.fill()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(spawnInterval)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}

function createParticle(w: number, h: number, colors: string[], isStatic: boolean): Particle {
  const angle = Math.random() * Math.PI * 2
  const speed = isStatic ? 0.2 + Math.random() * 0.3 : 0.5 + Math.random() * 1.5
  const maxLife = isStatic ? 300 + Math.random() * 200 : 80 + Math.random() * 120

  return {
    x: Math.random() * w,
    y: isStatic ? Math.random() * h : h * 0.7 + Math.random() * h * 0.3,
    vx: Math.cos(angle) * speed * (isStatic ? 0.5 : 1),
    vy: isStatic ? -0.1 - Math.random() * 0.2 : -speed * 0.8 - Math.random() * 1,
    r: isStatic ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
    opacity: 0,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: maxLife,
    maxLife,
  }
}
