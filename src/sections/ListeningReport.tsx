import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTheme } from '../ThemeContext'
import type { HistoryItem } from '../hooks/usePlayHistory'

interface Props {
  history: HistoryItem[]
  isOpen: boolean
  onClose: () => void
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0分钟'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}小时${m > 0 ? m + '分' : ''}`
  return `${m}分钟`
}

export default function ListeningReport({ history, isOpen, onClose }: Props) {
  const { theme } = useTheme()

  // Compute all stats
  const stats = useMemo(() => {
    if (history.length === 0) return null

    // Aggregate by song (title + artist as key)
    const songMap = new Map<string, { item: HistoryItem; playCount: number; totalSeconds: number }>()
    for (const h of history) {
      const key = `${h.title}|${h.artist}`
      const existing = songMap.get(key)
      if (existing) {
        existing.playCount++
        existing.totalSeconds += h.playedDuration || 0
      } else {
        songMap.set(key, { item: h, playCount: 1, totalSeconds: h.playedDuration || 0 })
      }
    }

    // Top songs by play duration
    const topSongs = Array.from(songMap.values())
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 10)

    // Total stats
    let totalSeconds = 0
    const artistSet = new Set<string>()
    for (const [, v] of songMap) {
      totalSeconds += v.totalSeconds
      artistSet.add(v.item.artist)
    }

    // Most played artist
    const artistPlayMap = new Map<string, { name: string; seconds: number; count: number }>()
    for (const [, v] of songMap) {
      const existing = artistPlayMap.get(v.item.artist)
      if (existing) {
        existing.seconds += v.totalSeconds
        existing.count += v.playCount
      } else {
        artistPlayMap.set(v.item.artist, { name: v.item.artist, seconds: v.totalSeconds, count: v.playCount })
      }
    }
    const topArtists = Array.from(artistPlayMap.values())
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 6)

    // Daily heatmap data — last 28 days
    const days: { date: string; dayLabel: string; count: number; seconds: number }[] = []
    const now = new Date()
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayStart = d.getTime()
      const dayEnd = dayStart + 86400000
      let daySec = 0
      let dayCount = 0
      for (const h of history) {
        if (h.timestamp >= dayStart && h.timestamp < dayEnd) {
          daySec += h.playedDuration || 0
          dayCount++
        }
      }
      days.push({
        date: dateStr,
        dayLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        count: dayCount,
        seconds: daySec,
      })
    }

    // Last listened
    const lastListened = history.length > 0 ? history[0] : null

    return { topSongs, totalSeconds, totalSongs: songMap.size, totalArtists: artistSet.size, topArtists, days, lastListened }
  }, [history])

  const primaryColor = theme.colors.primary || '#8b5cf6'
  const bgSecondary = theme.colors.bgSecondary || '#15152a'
  const bgTertiary = theme.colors.bgTertiary || '#1e1e3a'
  const textPrimary = theme.colors.textPrimary || '#ffffff'
  const textMuted = theme.colors.textMuted || '#9ca3af'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          backgroundColor: bgSecondary,
          border: `1px solid ${bgTertiary}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
             style={{ borderBottom: `1px solid ${bgTertiary}`, backgroundColor: bgSecondary }}>
          <div>
            <h2 className="text-lg font-medium" style={{ color: textPrimary }}>听歌报告</h2>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              基于本地播放记录 · 离线数据
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: bgTertiary, color: textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.color = textPrimary}
            onMouseLeave={(e) => e.currentTarget.style.color = textMuted}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {!stats || stats.totalSongs === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <svg viewBox="0 0 64 64" className="w-16 h-16 mb-4 opacity-30" fill={textMuted}>
              <path d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8zm0 42c-9.9 0-18-8.1-18-18S22.1 14 32 14s18 8.1 18 18-8.1 18-18 18z" opacity="0.3"/>
              <path d="M26 20v12l10 6V26l-10-6zm0 0l10 6-10 6z"/>
            </svg>
            <p className="text-sm" style={{ color: textMuted }}>还没有播放记录</p>
            <p className="text-xs mt-1" style={{ color: textMuted, opacity: 0.6 }}>播放几首歌曲后，这里会生成你的听歌报告</p>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '总时长', value: formatDuration(stats.totalSeconds), icon: '⏱' },
                { label: '总曲目', value: `${stats.totalSongs} 首`, icon: '🎵' },
                { label: '艺术家', value: `${stats.totalArtists} 位`, icon: '🎤' },
              ].map((card) => (
                <div key={card.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: bgTertiary }}>
                  <div className="text-xl font-semibold tabular-nums" style={{ color: primaryColor }}>{card.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: textMuted }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Last listened */}
            {stats.lastListened && (
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: bgTertiary }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `linear-gradient(135deg, ${stats.lastListened.color?.[0] || primaryColor}, ${stats.lastListened.color?.[1] || primaryColor})` }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M8.5 3v10.5c-.3-.2-.7-.3-1-.5-1.7-.6-3.6.2-4.2 1.7s.2 3.2 1.7 3.8c1.7.6 3.6-.2 4.2-1.7.1-.3.2-.6.2-.9V8h5v7.5c-.3-.2-.7-.3-1-.5-1.7-.6-3.6.2-4.2 1.7s.2 3.2 1.7 3.8c1.7.6 3.6-.2 4.2-1.7.1-.3.2-.6.2-.9V3h-6.8z" transform="scale(0.85) translate(2,1)"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" style={{ color: textPrimary }}>{stats.lastListened.title}</div>
                  <div className="text-xs truncate" style={{ color: textMuted }}>{stats.lastListened.artist}</div>
                </div>
                <div className="text-xs shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}>
                  最近播放
                </div>
              </div>
            )}

            {/* Top 10 Songs Bar Chart */}
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: textPrimary }}>最爱 Top 10</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topSongs.map(s => ({
                    name: s.item.title.length > 12 ? s.item.title.slice(0, 11) + '..' : s.item.title,
                    fullName: s.item.title,
                    artist: s.item.artist,
                    duration: Math.round(s.totalSeconds / 60),
                    plays: s.playCount,
                  }))} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: textMuted }}
                           axisLine={false} tickLine={false}
                           label={{ value: '分钟', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: textMuted }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: textMuted }}
                           axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: bgTertiary,
                        border: `1px solid ${bgTertiary}`,
                        borderRadius: 8,
                        color: textPrimary,
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'duration') return [`${value} 分钟`, '收听时长']
                        return [value, name]
                      }}
                      labelFormatter={(label: string, payload: any[]) => {
                        if (payload && payload[0]) return `${payload[0].payload.fullName} - ${payload[0].payload.artist}`
                        return label
                      }}
                    />
                    <Bar dataKey="duration" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {stats.topSongs.map((_, idx) => (
                        <Cell key={idx} fill={idx === 0 ? primaryColor : `${primaryColor}${Math.max(30, 80 - idx * 6).toString(16).padStart(2, '0')}`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Artists */}
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: textPrimary }}>常听艺术家</h3>
              <div className="space-y-2">
                {stats.topArtists.map((artist, idx) => (
                  <div key={artist.name} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: bgTertiary }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: idx === 0 ? `${primaryColor}33` : 'transparent',
                            color: idx === 0 ? primaryColor : textMuted,
                            border: `1px solid ${idx === 0 ? `${primaryColor}44` : `${bgSecondary}`}`,
                          }}>
                      {idx + 1}
                    </span>
                    <span className="text-sm flex-1 truncate" style={{ color: textPrimary }}>{artist.name}</span>
                    <span className="text-xs tabular-nums mr-2" style={{ color: textMuted }}>{formatDuration(artist.seconds)}</span>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${primaryColor}22` }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, (artist.seconds / (stats.topArtists[0]?.seconds || 1)) * 100)}%`,
                        backgroundColor: primaryColor
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 28-day heatmap */}
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: textPrimary }}>近 28 天活跃度</h3>
              <div className="grid grid-cols-7 gap-1">
                {['一','二','三','四','五','六','日'].map(d => (
                  <div key={d} className="text-[10px] text-center py-1" style={{ color: textMuted }}>{d}</div>
                ))}
                {(() => {
                  // Pre-calculate for heatmap intensity
                  let maxDayCount = 1
                  stats.days.forEach(d => { if (d.count > maxDayCount) maxDayCount = d.count })
                  return stats.days.map((day) => {
                    const intensity = day.count > 0
                      ? Math.min(4, Math.max(1, Math.ceil(day.count * 4 / maxDayCount)))
                      : 0
                    const colors = ['transparent', `${primaryColor}15`, `${primaryColor}33`, `${primaryColor}55`, `${primaryColor}88`]

                  return (
                    <div key={day.date}
                         title={`${day.date}: ${day.count} 首歌, ${formatDuration(day.seconds)}`}
                         className="aspect-square rounded-sm flex items-center justify-center text-[9px]"
                         style={{
                           backgroundColor: colors[intensity],
                           color: intensity > 2 ? textPrimary : textMuted,
                         }}>
                      {day.dayLabel.split('/')[1]}
                    </div>
                  )
                })
                })()}
              </div>
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className="text-[9px]" style={{ color: textMuted }}>少</span>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-2.5 h-2.5 rounded-sm"
                       style={{ backgroundColor: i === 0 ? 'transparent' : `${primaryColor}${[25, 40, 65, 90][i-1]}` }} />
                ))}
                <span className="text-[9px]" style={{ color: textMuted }}>多</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
