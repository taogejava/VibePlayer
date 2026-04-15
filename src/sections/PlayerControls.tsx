import type { Song } from './MusicPlayer'

interface Props {
  song: Song
  isPlaying: boolean
  progress: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'none' | 'one' | 'all'
  onPlayPause: () => void
  onNext: () => void
  onPrev: () => void
  onSeek: (v: number) => void
  onVolume: (v: number) => void
  onMute: () => void
  onShuffle: () => void
  onRepeat: () => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlayerControls({
  song, isPlaying, progress, volume, isMuted, isShuffled, repeatMode,
  onPlayPause, onNext, onPrev, onSeek, onVolume, onMute, onShuffle, onRepeat
}: Props) {
  const progressPct = (progress / song.duration) * 100

  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="relative h-1.5 rounded-full bg-white/10 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            onSeek(pct * song.duration)
          }}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${song.color[0]}, ${song.color[1]}, ${song.color[2]})`,
              boxShadow: `0 0 8px ${song.color[0]}cc`,
            }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              left: `calc(${progressPct}% - 6px)`,
              boxShadow: `0 0 6px ${song.color[0]}`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/30 font-mono">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(song.duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Shuffle */}
        <button
          onClick={onShuffle}
          className={`transition-all duration-200 ${isShuffled ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
        </button>

        {/* Prev */}
        <button
          onClick={onPrev}
          className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 relative"
          style={{
            background: `linear-gradient(135deg, ${song.color[0]}, ${song.color[1]})`,
            boxShadow: `0 0 20px ${song.color[0]}88, 0 0 40px ${song.color[1]}44`,
          }}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
          {/* Pulse ring when playing */}
          {isPlaying && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                background: `${song.color[0]}44`,
              }}
            />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>

        {/* Repeat */}
        <button
          onClick={onRepeat}
          className={`transition-all duration-200 ${repeatMode !== 'none' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}
        >
          {repeatMode === 'one' ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-2">
        <button onClick={onMute} className="text-white/40 hover:text-white/70 transition-colors shrink-0">
          {isMuted || volume === 0 ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : volume < 50 ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
        <div
          className="relative flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            onVolume(Math.round(pct * 100))
          }}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all"
            style={{
              width: `${isMuted ? 0 : volume}%`,
              background: `linear-gradient(90deg, ${song.color[0]}, ${song.color[1]})`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${isMuted ? 0 : volume}% - 5px)` }}
          />
        </div>
        <span className="text-white/30 text-xs font-mono w-7 text-right shrink-0">
          {isMuted ? '0' : volume}
        </span>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
