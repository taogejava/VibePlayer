import { useState, useRef, useCallback } from 'react'

interface UrlItem {
  id: number
  url: string
  title: string
  type: 'audio' | 'video'
}

const AUDIO_EXTS = new Set(['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'aiff', 'ape', 'webm'])
const VIDEO_EXTS = new Set(['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'ts', 'rmvb', '3gp'])

function detectType(url: string): 'audio' | 'video' {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const ext = pathname.split('.').pop() || ''
    if (AUDIO_EXTS.has(ext)) return 'audio'
    if (VIDEO_EXTS.has(ext)) return 'video'
  } catch {}
  // Default to audio for unknown
  return 'audio'
}

function extractTitle(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const name = pathname.split('/').pop() || ''
    return decodeURIComponent(name).replace(/\.[^/.]+$/, '') || url
  } catch {
    return url
  }
}

interface Props {
  currentUrl: string | null
  currentType: 'audio' | 'video' | null
  onPlayUrl: (url: string, type: 'audio' | 'video') => void
}

let idCounter = 0

export default function UrlPlayPanel({ currentUrl, currentType, onPlayUrl }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [history, setHistory] = useState<UrlItem[]>(() => {
    try {
      const saved = localStorage.getItem('url-play-history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const url = inputValue.trim()
    if (!url) return
    const type = detectType(url)
    const title = extractTitle(url)
    onPlayUrl(url, type)
    setHistory(prev => {
      const filtered = prev.filter(h => h.url !== url)
      const next = [{ id: ++idCounter, url, title, type }, ...filtered].slice(0, 30)
      localStorage.setItem('url-play-history', JSON.stringify(next))
      return next
    })
    setInputValue('')
  }

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(text => {
      setInputValue(text)
      if (text.trim()) {
        const type = detectType(text)
        const title = extractTitle(text)
        onPlayUrl(text, type)
        setHistory(prev => {
          const filtered = prev.filter(h => h.url !== text)
          const next = [{ id: ++idCounter, url: text, title, type }, ...filtered].slice(0, 30)
          localStorage.setItem('url-play-history', JSON.stringify(next))
          return next
        })
        setInputValue('')
      }
    }).catch(() => {
      inputRef.current?.focus()
    })
  }, [onPlayUrl])

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem('url-play-history')
  }

  return (
    <div className="w-full flex flex-col h-full animate-fade-in">
      {/* Input area */}
      <div className="shrink-0 mb-4">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 blur-sm group-focus-within:blur-md transition-all duration-500" />
          <div className="relative flex items-center gap-2 backdrop-blur-xl rounded-xl px-3 py-2.5"
            style={{
              backgroundColor: 'var(--theme-bg-secondary, #15152a)',
              borderColor: 'var(--theme-bg-tertiary, #1e1e3a)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary, #8b5cf6)', opacity: 0.7 }}>
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="currentColor"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="粘贴音频/视频直链 URL..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--theme-text-primary, #ffffff)' }}
            />
            <button
              type="button"
              onClick={handlePaste}
              className="shrink-0 px-2.5 py-1 text-xs rounded-lg transition-all duration-200"
              style={{ color: 'var(--theme-text-muted, #9ca3af)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-text-secondary, #d1d5db)'; e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary, #1e1e3a)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'; e.currentTarget.style.backgroundColor = 'transparent' }}
              title="从剪贴板粘贴"
            >
              粘贴
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary, #8b5cf6), var(--theme-secondary, #06b6d4))`,
                color: 'var(--theme-bg-primary, #0a0a1a)',
                boxShadow: `0 4px 15px var(--theme-primary, #8b5cf6)40`,
              }}
            >
              播放
            </button>
          </div>
        </form>
      </div>

      {/* Current playing info */}
      {currentUrl && (
        <div className="shrink-0 mb-3 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-2">
            <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${
              currentType === 'video' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
            }`}>
              {currentType === 'video' ? 'VIDEO' : 'AUDIO'}
            </span>
            <p className="text-white/70 text-xs truncate flex-1">{extractTitle(currentUrl)}</p>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-1 mb-2 shrink-0">
            <span className="text-white/30 text-xs flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              播放记录
            </span>
            <button
              onClick={handleClearHistory}
              className="text-white/20 hover:text-red-400/60 text-xs transition-colors"
            >
              清空
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onPlayUrl(item.url, item.type)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 group ${
                  currentUrl === item.url
                    ? 'bg-green-500/15 border border-green-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                  item.type === 'video' ? 'bg-blue-500/10' : 'bg-green-500/10'
                }`}>
                  {item.type === 'video' ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400/60">
                      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400/60">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate transition-colors" style={{ color: 'var(--theme-text-secondary, #d1d5db)', opacity: 0.7 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-text-primary, #ffffff)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-secondary, #d1d5db)'}>
                    {item.title}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.2 }}>{item.url}</p>
                </div>
                {currentUrl === item.url && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentUrl && history.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--theme-primary, #8b5cf6)', opacity: 0.1, borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderWidth: '1px', borderStyle: 'solid' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" style={{ color: 'var(--theme-primary, #8b5cf6)', opacity: 0.4 }}>
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary, #d1d5db)', opacity: 0.35 }}>粘贴音视频直链</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.18 }}>
              支持任意音频/视频文件直链<br />
              MP3 / FLAC / MP4 / MKV 等
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
