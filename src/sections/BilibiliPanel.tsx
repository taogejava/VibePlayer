import { useState, useRef, useEffect, useCallback } from 'react'
import type { BilibiliVideo } from '../hooks/useBilibili'

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
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [hasInteracted, setHasInteracted] = useState(false)

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

  // Reset interaction state when video changes
  useEffect(() => {
    setHasInteracted(false)
  }, [currentVideo])

  return (
    <div className="w-full flex flex-col h-full animate-fade-in">
      {/* Input area */}
      <div className="shrink-0 mb-4">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 blur-sm group-focus-within:blur-md transition-all duration-500" />
          <div className="relative flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-pink-400/70 shrink-0">
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
              className="flex-1 bg-transparent text-white/90 text-sm placeholder:text-white/25 outline-none"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="shrink-0 px-2.5 py-1 text-xs text-white/40 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="从剪贴板粘贴"
            >
              粘贴
            </button>
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="shrink-0 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-400 hover:to-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-pink-500/20"
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
        <div className="shrink-0 mb-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-red-400 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-red-300/90 text-xs leading-relaxed whitespace-pre-line">{error}</p>
          </div>
        </div>
      )}

      {/* Current video info + iframe */}
      {currentVideo && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* iframe player - shown first, takes most space */}
          <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 mb-3">
            <iframe
              ref={iframeRef}
              src={getPlayerUrl(currentVideo)}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
              referrerPolicy="no-referrer"
            />
            {/* Click to play hint overlay - shown on initial load */}
            {!hasInteracted && (
              <div
                onClick={() => setHasInteracted(true)}
                className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer z-10 hover:bg-black/40 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-pink-500/80 flex items-center justify-center shadow-lg shadow-pink-500/40 hover:bg-pink-400/90 transition-colors">
                    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-white/70 text-xs">点击播放</span>
                </div>
              </div>
            )}
          </div>

          {/* Video info card */}
          <div className="shrink-0 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
            <div className="flex gap-3">
              <img
                src={currentVideo.cover}
                alt={currentVideo.title}
                className="w-16 h-10 rounded-lg object-cover shrink-0 shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white/90 text-xs font-medium leading-snug line-clamp-1">
                  {currentVideo.title}
                </h4>
                <p className="text-white/40 text-[10px] mt-0.5">
                  {currentVideo.author}
                  {currentVideo.pages.length > 1 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">
                      P{currentVideo.page}/{currentVideo.pages.length}
                    </span>
                  )}
                  <span className="ml-2">{formatDuration(currentVideo.duration)}</span>
                </p>
              </div>
            </div>
            {/* Multi-P selector */}
            {currentVideo.pages.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {currentVideo.pages.map((p) => (
                  <button
                    key={p.page}
                    onClick={() => {
                      const updatedVideo = { ...currentVideo, page: p.page, duration: p.duration }
                      onSelectHistory(updatedVideo)
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded-md transition-all duration-200 ${
                      p.page === currentVideo.page
                        ? 'bg-pink-500/30 text-pink-300 border border-pink-500/30'
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                    }`}
                  >
                    P{p.page} {p.part}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="shrink-0">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-white/30 text-xs flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              播放记录
            </span>
            <button
              onClick={onClearHistory}
              className="text-white/20 hover:text-red-400/60 text-xs transition-colors"
            >
              清空
            </button>
          </div>
          <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
            {history.map((item) => (
              <button
                key={`${item.bvid}-p${item.page}`}
                onClick={() => onSelectHistory(item)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 group ${
                  currentVideo?.bvid === item.bvid && currentVideo?.page === item.page
                    ? 'bg-pink-500/15 border border-pink-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <img
                  src={item.cover}
                  alt=""
                  className="w-8 h-8 rounded object-cover shrink-0 opacity-80"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-xs truncate group-hover:text-white/90 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-white/25 text-[10px] mt-0.5">
                    {item.author} · {formatDuration(item.duration)}
                  </p>
                </div>
                {item.pages.length > 1 && (
                  <span className="text-[10px] text-white/20">P{item.page}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentVideo && !error && !loading && history.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-pink-400/40">
              <rect x="2" y="3" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 10l4-2v6l-4-2z" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
          <div>
            <p className="text-white/30 text-sm mb-1">粘贴B站视频链接</p>
            <p className="text-white/15 text-xs leading-relaxed">
              支持 bilibili.com 视频链接<br />
              BV号、AV号、分P链接
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
