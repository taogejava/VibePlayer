import { useMemo, useState } from 'react'
import { useTheme } from '../ThemeContext'
import { usePlayHistory, type HistoryItem } from '../hooks/usePlayHistory'

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  onPlayItem: (item: HistoryItem) => void
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  // Less than 1 minute
  if (diff < 60000) return '刚刚'
  // Less than 1 hour
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  // Less than 1 day
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  // Less than 7 days
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  
  // Format as date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function HistoryPanel({ isOpen, onClose, onPlayItem }: HistoryPanelProps) {
  useTheme()  // Just for context, don't need the return value
  const { history, removeFromHistory, clearHistory } = usePlayHistory()
  const [search, setSearch] = useState('')

  const filteredHistory = useMemo(() => {
    if (!search) return history
    const searchLower = search.toLowerCase()
    return history.filter(h => 
      h.title.toLowerCase().includes(searchLower) ||
      h.artist.toLowerCase().includes(searchLower) ||
      h.album.toLowerCase().includes(searchLower)
    )
  }, [history, search])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        style={{
          backgroundColor: 'var(--theme-bg-secondary, #15152a)',
          border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-bg-tertiary, #1e1e3a)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
              播放历史
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>
              {history.length} 首
            </p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                  color: 'var(--theme-text-muted, #9ca3af)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'}
                title="清空历史"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m10 0H4" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                color: 'var(--theme-text-muted, #9ca3af)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-text-primary, #ffffff)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-6 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索历史..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-transparent text-sm"
              style={{
                backgroundColor: 'var(--theme-bg-primary, #0a0a1a)',
                color: 'var(--theme-text-primary, #ffffff)',
                border: '1px solid var(--theme-bg-tertiary, #1e1e3a)',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mb-4" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.3 }}>
                <path d="M10 4v8.5c-.3-.1-.6-.3-.9-.3-1.3-.5-2.8.2-3.3 1.4-.5 1.3.2 2.6 1.4 3.1 1.3.5 2.8-.2 3.3-1.4.1-.2.1-.5.1-.7V7.5h4v7.5c-.3-.1-.6-.3-.9-.3-1.3-.5-2.8.2-3.3 1.4-.5 1.3.2 2.6 1.4 3.1 1.3.5 2.8-.2 3.3-1.4.1-.2.1-.5.1-.7V4h-5.2z"/>
              </svg>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                {search ? '没有找到匹配的结果' : '还没有播放历史'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                  onClick={() => onPlayItem(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary, #1e1e3a)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {/* Mini album art */}
                  <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <radialGradient id={`history-grad-${item.id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={item.color[0]} />
                          <stop offset="100%" stopColor={item.color[2]} />
                        </radialGradient>
                      </defs>
                      <rect width="100" height="100" fill={`url(#history-grad-${item.id})`} />
                      <text x="50" y="58" textAnchor="middle" fontSize="30" fill="white" opacity="0.8" fontWeight="bold">
                        {item.title.charAt(0)}
                      </text>
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary, #ffffff)' }}>
                      {item.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.7 }}>
                      {item.artist}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.isVideo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-primary, #8b5cf6)', color: 'var(--theme-bg-primary, #0a0a1a)' }}>
                        视频
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-xs font-mono" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>
                        {item.duration > 0 ? formatDuration(item.duration) : ''}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.4 }}>
                        {formatTime(item.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.id)
                      }}
                      className="p-1.5 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'
                      }}
                      style={{
                        color: 'var(--theme-text-muted, #9ca3af)',
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}