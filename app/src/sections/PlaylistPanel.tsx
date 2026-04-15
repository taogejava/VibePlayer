import type { Song } from './MusicPlayer'

interface Props {
  songs: Song[]
  currentIndex: number
  liked: Set<number>
  isPlaying: boolean
  onSelect: (index: number) => void
  onToggleLike: (id: number) => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlaylistPanel({ songs, currentIndex, liked, isPlaying, onSelect, onToggleLike }: Props) {
  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}>
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase">播放列表</h3>
        <span className="text-white/30 text-xs">{songs.length} 首</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {songs.map((song, i) => {
          const isActive = i === currentIndex
          return (
            <div
              key={song.id}
              onClick={() => onSelect(i)}
              className="group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-white/5"
              style={{
                background: isActive ? `linear-gradient(135deg, ${song.color[0]}22, ${song.color[1]}11)` : undefined,
                borderLeft: isActive ? `3px solid ${song.color[0]}` : '3px solid transparent',
              }}
            >
              {/* Index / Playing indicator */}
              <div className="w-7 flex items-center justify-center shrink-0">
                {isActive && isPlaying ? (
                  <MiniVisualizer colors={song.color} />
                ) : (
                  <span className={`text-xs font-mono ${isActive ? 'text-white/80' : 'text-white/30'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Mini album art */}
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <radialGradient id={`pl-grad-${song.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={song.color[0]} />
                      <stop offset="100%" stopColor={song.color[2]} />
                    </radialGradient>
                  </defs>
                  <rect width="100" height="100" fill={`url(#pl-grad-${song.id})`} />
                  <text x="50" y="60" textAnchor="middle" fontSize="40" fill="white" opacity="0.8">
                    {song.title.charAt(0)}
                  </text>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                  {song.title}
                </p>
                <p className="text-xs text-white/40 truncate">{song.artist}</p>
              </div>

              {/* Duration + Like */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLike(song.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {liked.has(song.id) ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-500">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-white/30 hover:text-pink-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  )}
                </button>
                <span className="text-xs text-white/30 font-mono">{formatTime(song.duration)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniVisualizer({ colors }: { colors: string[] }) {
  const bars = 4
  return (
    <div className="flex items-end gap-0.5 h-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-sm"
          style={{
            background: colors[i % colors.length],
            animation: `bar-beat ${0.4 + i * 0.15}s ease-in-out infinite alternate`,
            height: '60%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bar-beat {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
