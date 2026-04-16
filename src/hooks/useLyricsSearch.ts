import { useState, useCallback, useRef } from 'react'

export interface LyricsLine {
  time: number
  text: string
}

interface LyricsSearchResult {
  id: number
  name: string
  artist: string
  album: string
}

interface LyricCacheEntry {
  lines: LyricsLine[]
  source: string
  timestamp: number
}

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

// Parse LRC format: [mm:ss.xx]text or [mm:ss]text
function parseLRC(lrc: string): LyricsLine[] {
  const lines: LyricsLine[] = []
  const regex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(lrc)) !== null) {
    const min = parseInt(match[1], 10)
    const sec = parseInt(match[2], 10)
    const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0
    const time = min * 60 + sec + ms / 1000
    const text = match[4].trim()
    if (text) {
      lines.push({ time, text })
    }
  }

  return lines
}

// Normalize string for matching
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s\-_().&、，,]/g, '')
    .replace(/(正式版|remix|live|acoustic|instrumental|deluxe|explicit|feat\.?.*|ft\.?.*|mv版|专辑版|高清版)/gi, '')
}

export function useLyricsSearch() {
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<LyricsSearchResult[]>([])
  const [lyrics, setLyrics] = useState<LyricsLine[]>([])
  const [lyricsSource, setLyricsSource] = useState<string>('')
  const [isOnline, setIsOnline] = useState(false)
  const [error, setError] = useState<string>('')
  const cacheRef = useRef<Map<string, LyricCacheEntry>>(new Map())
  const lastAutoSearchKeyRef = useRef<string>('')

  const fetchLyricsById = useCallback(async (id: number, _source: string): Promise<LyricsLine[]> => {
    try {
      const resp = await fetch(`https://music.163.com/api/song/lyric?id=${id}&lv=1`)
      if (resp.ok) {
        const data = await resp.json()
        if (data.lrc?.lyric) {
          const lines = parseLRC(data.lrc.lyric)
          if (lines.length > 0) return lines
        }
        if (data.tlyric?.lyric) {
          const lines = parseLRC(data.tlyric.lyric)
          if (lines.length > 0) return lines
        }
      }
    } catch {
      // fallback
    }
    return []
  }, [])

  // Internal search logic, shared by autoSearch and manual searchLyrics
  const doSearch = useCallback(async (
    title: string,
    artist: string,
    options?: { silent?: boolean },
  ): Promise<LyricsLine[]> => {
    if (!title.trim()) return []

    const cacheKey = normalize(`${artist} ${title}`)
    const cached = cacheRef.current.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setLyrics(cached.lines)
      setLyricsSource(cached.source)
      setIsOnline(true)
      return cached.lines
    }

    const silent = options?.silent ?? false
    setLoading(true)
    setError('')
    if (!silent) setSearchResults([])
    setLyrics([])
    setIsOnline(false)

    try {
      const query = artist && artist !== '未知艺术家' ? `${artist} ${title}` : title
      const resp = await fetch(
        `https://music.163.com/api/search/get?s=${encodeURIComponent(query)}&type=1&offset=0&limit=8`
      )

      if (!resp.ok) throw new Error('搜索请求失败')

      const data = await resp.json()
      const songs: LyricsSearchResult[] = (data.result?.songs || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        artist: s.artists?.map((a: any) => a.name).join(' / ') || '',
        album: s.album?.name || '',
      }))

      if (songs.length === 0) {
        if (!silent) setError('未找到匹配的歌词')
        return []
      }

      if (!silent) setSearchResults(songs)

      const best = findBestMatch(songs, title, artist)
      if (best) {
        const lines = await fetchLyricsById(best.id, `${best.artist} - ${best.name}`)
        if (lines.length > 0) {
          setLyrics(lines)
          setLyricsSource(`${best.artist} - ${best.name}`)
          setIsOnline(true)
          cacheRef.current.set(cacheKey, { lines, source: `${best.artist} - ${best.name}`, timestamp: Date.now() })
          return lines
        } else {
          if (!silent) setError('已找到歌曲但暂无歌词文本')
        }
      }
    } catch (err: any) {
      if (!silent) setError(err.message || '歌词搜索失败')
    } finally {
      setLoading(false)
    }
    return []
  }, [fetchLyricsById])

  // Auto-search: called silently when song changes, no UI for search results
  const autoSearch = useCallback((title: string, artist: string) => {
    const key = normalize(`${artist} ${title}`)
    if (key === lastAutoSearchKeyRef.current) return // same song, skip
    lastAutoSearchKeyRef.current = key
    setLyrics([])
    setLyricsSource('')
    setIsOnline(false)
    setSearchResults([])
    setError('')
    doSearch(title, artist, { silent: true })
  }, [doSearch])

  // Manual search (with results UI)
  const searchLyrics = useCallback(async (title: string, artist: string) => {
    return doSearch(title, artist, { silent: false })
  }, [doSearch])

  const selectResult = useCallback(async (result: LyricsSearchResult) => {
    setLoading(true)
    setError('')
    try {
      const lines = await fetchLyricsById(result.id, `${result.artist} - ${result.name}`)
      if (lines.length > 0) {
        setLyrics(lines)
        setLyricsSource(`${result.artist} - ${result.name}`)
        setIsOnline(true)
      } else {
        setError('该歌曲暂无歌词文本')
      }
    } catch {
      setError('获取歌词失败')
    } finally {
      setLoading(false)
    }
  }, [fetchLyricsById])

  const clearLyrics = useCallback(() => {
    setLyrics([])
    setLyricsSource('')
    setIsOnline(false)
    setSearchResults([])
    setError('')
  }, [])

  return {
    loading,
    searchResults,
    lyrics,
    lyricsSource,
    isOnline,
    error,
    autoSearch,
    searchLyrics,
    selectResult,
    clearLyrics,
  }
}

// Find best match from search results
function findBestMatch(
  results: LyricsSearchResult[],
  title: string,
  artist: string,
): LyricsSearchResult | null {
  if (results.length === 0) return null
  if (results.length === 1) return results[0]

  const normTitle = normalize(title)
  const normArtist = normalize(artist)

  let bestScore = -1
  let best: LyricsSearchResult | null = null

  for (const r of results) {
    let score = 0
    const rTitle = normalize(r.name)

    // Title match
    if (rTitle === normTitle) score += 10
    else if (rTitle.includes(normTitle) || normTitle.includes(rTitle)) score += 5

    // Artist match
    if (normArtist && normArtist !== '未知艺术家') {
      const rArtist = normalize(r.artist)
      if (rArtist === normArtist) score += 10
      else if (rArtist.includes(normArtist) || normArtist.includes(rArtist)) score += 5
    }

    if (score > bestScore) {
      bestScore = score
      best = r
    }
  }

  return best || results[0]
}
