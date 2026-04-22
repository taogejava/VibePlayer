import { useState, useRef, useCallback, useEffect } from 'react'
import type { BilibiliVideo } from '../hooks/useBilibili'
import { useTheme } from '../ThemeContext'

interface Props {
  currentVideo: BilibiliVideo | null
  loading: boolean
  error: string | null
  history: BilibiliVideo[]
  getPlayerUrl: (video: BilibiliVideo) => string
  onResolve: (url: string) => Promise<BilibiliVideo | void>
  onSelectHistory: (video: BilibiliVideo) => void
  onClearHistory: () => void
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function BilibiliPanel({
  currentVideo,
  loading,
  error,
  history,
  getPlayerUrl,
  onResolve,
  onSelectHistory,
  onClearHistory,
}: Props) {
  const { theme } = useTheme()
  const [inputValue, setInputValue] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  const primaryColor = theme.colors.primary || '#8b5cf6'

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(text => {
      setInputValue(text)
      if (text.trim()) {
        onResolve(text)
      }
    }).catch(() => {
      inputRef.current?.focus()
    })
  }, [onResolve])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const url = inputValue.trim()
    if (url) {
      onResolve(url)
    }
  }

  const handlePlay = useCallback(() => {
    if (!currentVideo || !playerContainerRef.current) return
    const baseUrl = getPlayerUrl(currentVideo)
    const url = baseUrl.replace('autoplay=0', 'autoplay=1')
    const rect = playerContainerRef.current.getBoundingClientRect()
    const bounds = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }
    console.log('[Bilibili] Showing player at bounds:', bounds.x, bounds.y, bounds.width, bounds.height)
    window.electronAPI?.showBilibiliPlayer(url, bounds)
    setIsPlaying(true)
  }, [currentVideo, getPlayerUrl])

  const handleStop = useCallback(() => {
    window.electronAPI?.hideBilibiliPlayer()
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      window.electronAPI?.hideBilibiliPlayer()
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const updateBounds = () => {
      if (!playerContainerRef.current) return
      const rect = playerContainerRef.current.getBoundingClientRect()
      window.electronAPI?.updateBilibiliPlayerBounds({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      })
    }
    window.addEventListener('resize', updateBounds)
    const observer = new ResizeObserver(updateBounds)
    if (playerContainerRef.current) {
      observer.observe(playerContainerRef.current)
    }
    return () => {
      window.removeEventListener('resize', updateBounds)
      observer.disconnect()
    }
  }, [isPlaying])

  return (
    <div className="w-full flex flex-col h-full animate-fade-in">
      {/* Input area */}
      <div className="shrink-0 mb-4">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="relative flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'var(--theme-bg-secondary, #15152a)', borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderWidth: '1px', borderStyle: 'solid' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0" style={{ color: primaryColor, opacity: 0.7 }}>
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 2v4M17 2v4M2 9h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="15" r="2" fill="currentColor" opacity="0.5" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="粘贴 B站视频链接、BV号 或 AV号..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--theme-text-primary, #ffffff)' }}
            />
            <button
              type="button"
              onClick={handlePaste}
              className="shrink-0 px-2.5 py-1 text-xs rounded-lg transition-all duration-200"
              style={{ color: 'var(--theme-text-muted, #9ca3af)' }}
              title="从剪贴板粘贴"
            >
              粘贴
            </button>
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${theme.colors.primaryLight || '#a78bfa'})`,
                color: 'var(--theme-bg-primary, #0a0a1a)',
                boxShadow: `0 4px 15px ${primaryColor}40`,
              }}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  解析中
                </span>
              ) : '解析'}
            </button>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="shrink-0 mb-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="flex items-start gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Video content */}
      {currentVideo && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <div
              ref={playerContainerRef}
              className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-black"
            >
              {isPlaying ? (
                <>
                  <button
                    onClick={handleStop}
                    className="absolute top-2 right-2 z-50 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'rgba(255, 255, 255, 0.8)' }}
                    title="关闭播放器"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <img
                    src={currentVideo.cover}
                    alt={currentVideo.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div
                    onClick={handlePlay}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: primaryColor + 'e6', boxShadow: `0 8px 32px ${primaryColor}80` }}>
                      <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 rounded text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {formatDuration(currentVideo.duration)}
                  </div>
                  {currentVideo.pages.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: primaryColor + 'cc', color: 'var(--theme-bg-primary, #0a0a1a)' }}>
                      P{currentVideo.page}/{currentVideo.pages.length}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="shrink-0 p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary, #15152a)', borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderWidth: '1px', borderStyle: 'solid' }}>
              <h4 className="text-sm font-medium leading-snug line-clamp-2 mb-1.5" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
                {currentVideo.title}
              </h4>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>{currentVideo.author}</p>
                {!isPlaying && (
                  <button
                    onClick={handlePlay}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${theme.colors.primaryLight || '#a78bfa'})`,
                      color: 'var(--theme-bg-primary, #0a0a1a)',
                      boxShadow: `0 4px 15px ${primaryColor}40`,
                    }}
                  >
                    播放视频
                  </button>
                )}
              </div>
              {currentVideo.pages.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentVideo.pages.map((p) => (
                    <button
                      key={p.page}
                      onClick={() => {
                        const updatedVideo = { ...currentVideo, page: p.page, duration: p.duration }
                        onSelectHistory(updatedVideo)
                      }}
                      className="px-2 py-0.5 text-[10px] rounded-md transition-all duration-200"
                      style={{
                        backgroundColor: p.page === currentVideo.page ? `${primaryColor}30` : 'var(--theme-bg-tertiary, #1e1e3a)',
                        color: p.page === currentVideo.page ? primaryColor : 'var(--theme-text-muted, #9ca3af)',
                        borderColor: p.page === currentVideo.page ? `${primaryColor}50` : 'transparent',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      }}
                    >
                      P{p.page} {p.part}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="shrink-0">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              播放记录
            </span>
            <button
              onClick={onClearHistory}
              className="text-xs transition-colors"
              style={{ color: 'rgba(239, 68, 68, 0.6)' }}
            >
              清空
            </button>
          </div>
          <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
            {history.map((item) => (
              <button
                key={`${item.bvid}-p${item.page}`}
                onClick={() => onSelectHistory(item)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 group"
                style={{
                  backgroundColor: currentVideo?.bvid === item.bvid && currentVideo?.page === item.page ? `${primaryColor}15` : undefined,
                  borderColor: currentVideo?.bvid === item.bvid && currentVideo?.page === item.page ? `${primaryColor}25` : undefined,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                <img
                  src={item.cover}
                  alt=""
                  className="w-8 h-8 rounded object-cover shrink-0 opacity-80"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate transition-colors" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
                    {item.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                    {item.author} · {formatDuration(item.duration)}
                  </p>
                </div>
                {item.pages.length > 1 && (
                  <span className="text-[10px]" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>P{item.page}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentVideo && !error && !loading && history.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-secondary, #15152a)', borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderWidth: '1px', borderStyle: 'solid' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" style={{ color: primaryColor, opacity: 0.4 }}>
              <rect x="2" y="3" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 10l4-2v6l-4-2z" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>粘贴B站视频链接</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.6 }}>
              支持 bilibili.com 视频链接<br />
              BV号、AV号、分P链接
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
