import { useState, useRef, useEffect, useCallback } from 'react'
import type { OnlineTrack } from '../hooks/useOnlineSearch'
import { useTheme } from '../ThemeContext'

interface Props {
  results: OnlineTrack[]
  loading: boolean
  error: string | null
  query: string
  currentTrack: OnlineTrack | null
  isPlaying: boolean
  onSearch: (query: string) => void
  onSelectTrack: (track: OnlineTrack) => void
  onTogglePlay: () => void
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function OnlineSearchPanel({
  results,
  loading,
  error,
  query,
  currentTrack,
  isPlaying,
  onSearch,
  onSelectTrack,
  onTogglePlay,
}: Props) {
  const { theme } = useTheme()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (q) onSearch(q)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const q = inputValue.trim()
      if (q) onSearch(q)
    }
  }

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(text => {
      setInputValue(text)
      if (text.trim()) onSearch(text.trim())
    }).catch(() => inputRef.current?.focus())
  }, [onSearch])

  const suggestions = ['流行', '民谣', 'jazz', 'lofi', 'classical', 'pop', 'rock', 'hip hop']
  const primaryColor = theme.colors.primary || '#8b5cf6'
  const primaryLight = theme.colors.primaryLight || '#a78bfa'

  return (
    <div className="flex flex-col h-full min-h-0 px-4 py-3 gap-3">

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex-shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入歌曲名称、歌手名..."
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                borderColor: 'var(--theme-bg-secondary, #15152a)',
                color: 'var(--theme-text-primary, #ffffff)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium rounded-xl transition-colors flex-shrink-0"
            style={{
              backgroundColor: primaryColor,
              color: 'var(--theme-bg-primary, #0a0a1a)',
            }}
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : '搜索'}
          </button>
          <button
            type="button"
            onClick={handlePaste}
            title="粘贴"
            className="px-3 py-2.5 text-xs rounded-xl transition-colors flex-shrink-0"
            style={{
              backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
              color: 'var(--theme-text-muted, #9ca3af)',
            }}
          >
            粘贴
          </button>
        </div>

        {/* Quick suggestions */}
        {results.length === 0 && !loading && !error && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setInputValue(s); onSearch(s) }}
                className="px-2.5 py-1 text-xs rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                  color: 'var(--theme-text-muted, #9ca3af)',
                  borderColor: 'var(--theme-bg-secondary, #15152a)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Source note */}
      <div className="flex-shrink-0 flex items-center gap-1.5 text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 flex-shrink-0">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span>数据来自 iTunes · 每首提供 30 秒合法预览 · 仅供试听</span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: '1px', borderStyle: 'solid', color: '#fca5a5' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto space-y-1 scrollbar-thin">
          <div className="text-xs px-1 pb-1" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
            找到 {results.length} 首与「{query}」相关的歌曲
          </div>
          {results.map((track, idx) => {
            const isActive = currentTrack?.id === track.id
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                style={{
                  backgroundColor: isActive ? `${primaryColor}25` : undefined,
                  borderColor: isActive ? `${primaryLight}50` : 'transparent',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                {/* Index / Playing indicator */}
                <div className="w-6 flex-shrink-0 text-center">
                  {isActive && isPlaying ? (
                    <div className="flex items-end justify-center gap-0.5 h-4">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="w-1 rounded-full animate-pulse"
                          style={{
                            backgroundColor: primaryLight,
                            height: `${[60, 100, 70][i - 1]}%`,
                            animationDelay: `${(i - 1) * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: isActive ? primaryLight : 'var(--theme-text-muted, #9ca3af)' }}>
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Cover */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)' }}>
                  {track.albumCover ? (
                    <img src={track.albumCover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: isActive ? primaryLight : 'var(--theme-text-primary, #ffffff)' }}>
                    {track.title}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    {track.artist}
                    {track.album && track.album !== track.title && (
                      <span className="opacity-60"> · {track.album}</span>
                    )}
                  </div>
                </div>

                {/* Genre & Duration */}
                <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                  {track.genre && (
                    <span className="text-xs truncate max-w-16" style={{ color: 'var(--theme-bg-secondary, #6b7280)' }}>{track.genre}</span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    {formatDuration(Math.min(track.duration, 30))}
                  </span>
                </div>

                {/* Play button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive && isPlaying) {
                      onTogglePlay();
                    } else {
                      onSelectTrack(track);
                    }
                  }}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isActive ? primaryColor : 'var(--theme-bg-tertiary, #1e1e3a)',
                    color: isActive ? 'var(--theme-bg-primary, #0a0a1a)' : 'var(--theme-text-primary, #ffffff)',
                    opacity: isActive ? 1 : 0,
                  }}
                >
                  {isActive && isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-0.5">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && results.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
          <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 opacity-40">
            <circle cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="2" />
            <path d="M42 42l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 25h12M22 31h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="text-center">
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>搜索在线音乐</div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
              输入歌曲名、歌手名搜索<br />
              每首提供 30 秒合法预览片段
            </div>
          </div>
        </div>
      )}

      {/* Now playing bar */}
      {currentTrack && (
        <div className="flex-shrink-0 rounded-xl p-4" style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryLight}40`, borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="flex items-center gap-4">
            {currentTrack.albumCover && (
              <img
                src={currentTrack.albumCover}
                alt=""
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>{currentTrack.title}</div>
              <div className="text-xs truncate" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>{currentTrack.artist} · 30s 预览</div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3">
              <button
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white ml-0.5">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
