import { useState, useEffect, useMemo } from 'react'
import ParticleBackground from './ParticleBackground'

export type FeatureKey = 'music' | 'video' | 'bilibili' | 'url' | 'webdav' | 'alist'

interface FeatureCard {
  key: FeatureKey
  title: string
  subtitle: string
  gradient: string
  icon: React.ReactNode
  glow: string
}

const features: FeatureCard[] = [
  {
    key: 'music',
    title: '听音乐',
    subtitle: '本地音乐库，沉浸式播放体验',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    glow: 'rgba(139, 92, 246, 0.4)',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        <circle cx="24" cy="24" r="6" fill="currentColor" opacity="0.8" />
        <path d="M24 4v40" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
        <path d="M4 24h40" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
        <path d="M24 4C24 4 26 12 26 16C26 20 24 24 24 24" fill="currentColor" opacity="0.6" />
        <path d="M28 8v20h4V4h-4z" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'video',
    title: '看视频',
    subtitle: '本地视频文件，全屏播放',
    gradient: 'from-rose-600 via-pink-600 to-red-600',
    glow: 'rgba(244, 63, 94, 0.4)',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="4" y="8" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M20 17l10 5.5-10 5.5V17z" fill="currentColor" />
        <line x1="12" y1="42" x2="36" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <line x1="18" y1="42" x2="30" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    ),
  },
  {
    key: 'bilibili',
    title: 'B站',
    subtitle: 'Bilibili 视频在线解析播放',
    gradient: 'from-sky-500 via-cyan-500 to-blue-600',
    glow: 'rgba(14, 165, 233, 0.4)',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M8 12h6l-3-4 3-4h20l3 4-3 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="6" y="12" width="36" height="24" rx="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="24" r="3" fill="currentColor" />
        <circle cx="31" cy="24" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'url',
    title: '链接播放',
    subtitle: '粘贴音视频直链直接播放',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    glow: 'rgba(245, 158, 11, 0.4)',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M20 14a6 6 0 0 1 0-8.5l3-3a6 6 0 0 1 8.5 8.5l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 34a6 6 0 0 1 0 8.5l-3 3a6 6 0 0 1-8.5-8.5l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="32" x2="32" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'webdav',
    title: 'WebDAV',
    subtitle: '接入 NAS / 群晖 / 威联通云盘',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    glow: 'rgba(16, 185, 129, 0.4)',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M8 22a12 12 0 0 1 21-8 12 12 0 0 1 11 16H8a8 8 0 0 1 0-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 32h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 38h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'alist',
    title: 'AList',
    subtitle: '聚合百度网盘 / 阿里云盘 / 123云盘等',
    gradient: 'from-indigo-500 via-blue-600 to-violet-600',
    glow: 'rgba(99, 102, 241, 0.4)',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="6" y="6" width="36" height="36" rx="6" stroke="currentColor" strokeWidth="2" />
        <path d="M14 16h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 24h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 32h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="38" cy="38" r="6" fill="currentColor" opacity="0.6" />
        <path d="M36 38l1.5 1.5 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function HomePage({ onNavigate }: { onNavigate: (key: FeatureKey) => void }) {
  const [mounted, setMounted] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const colors = useMemo(() => ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b'], [])

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#06060f' }}>
      {/* Particle Background */}
      <ParticleBackground colors={colors} isPlaying={true} />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-15 blur-[150px]"
          style={{
            top: '-30%',
            left: '-20%',
            background: 'radial-gradient(circle, #7c3aed, #2563eb)',
            animation: 'orb-float-1 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
          style={{
            bottom: '-20%',
            right: '-10%',
            background: 'radial-gradient(circle, #ec4899, #f59e0b)',
            animation: 'orb-float-2 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
          style={{
            top: '40%',
            left: '50%',
            background: 'radial-gradient(circle, #06b6d4, #8b5cf6)',
            animation: 'orb-float-3 10s ease-in-out infinite',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6">
        {/* Logo + Title */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Animated logo */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 rounded-full opacity-30 blur-xl animated-gradient"
              style={{ background: 'conic-gradient(#7c3aed, #06b6d4, #ec4899, #f59e0b, #7c3aed)' }}
            />
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.8), rgba(6,182,212,0.8))',
                boxShadow: '0 8px 32px rgba(124,58,237,0.3), 0 0 80px rgba(124,58,237,0.15)',
                animation: 'logo-glow 3s ease-in-out infinite',
              }}
            >
              <svg viewBox="0 0 32 32" fill="white" className="w-9 h-9">
                <path d="M16 4C16 4 18 10 18 13C18 16 16 20 16 20" opacity="0.9" />
                <path d="M20 6v16h3V3h-3z" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-pink-400 bg-clip-text text-transparent">
              VibePlayer
            </span>
          </h1>
          <p className="text-white/40 text-base font-light tracking-wide max-w-md mx-auto leading-relaxed">
            多源聚合 · 沉浸体验 · 你的全能播放器
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl w-full">
          {features.map((feature, index) => (
            <button
              key={feature.key}
              onClick={() => onNavigate(feature.key)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`
                group relative rounded-2xl p-5 text-left cursor-pointer
                transition-all duration-500 ease-out
                border border-white/[0.06]
                hover:border-white/[0.15]
                hover:scale-[1.04] active:scale-[0.97]
                backdrop-blur-xl
                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
              `}
              style={{
                background: hoveredIndex === index
                  ? `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`
                  : 'rgba(255,255,255,0.03)',
                transitionDelay: mounted ? `${index * 80 + 200}ms` : '0ms',
                boxShadow: hoveredIndex === index
                  ? `0 0 40px ${feature.glow}, 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
                  : '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              {/* Gradient border glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: hoveredIndex === index
                    ? `linear-gradient(135deg, ${feature.glow}, transparent 60%)`
                    : 'transparent',
                  opacity: hoveredIndex === index ? 0.15 : 0,
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '1px',
                }}
              />

              {/* Icon */}
              <div
                className={`
                  text-white/60 group-hover:text-white transition-all duration-500 mb-3
                  ${hoveredIndex === index ? 'drop-shadow-lg' : ''}
                `}
                style={{
                  filter: hoveredIndex === index
                    ? `drop-shadow(0 0 12px ${feature.glow})`
                    : 'none',
                  transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-white font-semibold text-sm mb-1 tracking-wide">
                {feature.title}
              </h3>

              {/* Subtitle */}
              <p className="text-white/30 text-xs leading-relaxed group-hover:text-white/50 transition-colors duration-300">
                {feature.subtitle}
              </p>

              {/* Hover arrow indicator */}
              <div
                className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center
                  text-white/0 group-hover:text-white/40 transition-all duration-300"
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom hint */}
        <div
          className={`mt-10 text-center transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '900ms' }}
        >
          <p className="text-white/20 text-xs tracking-widest uppercase">
            选择功能开始使用
          </p>
        </div>
      </div>
    </div>
  )
}
