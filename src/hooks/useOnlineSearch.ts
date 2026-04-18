import { useState, useCallback } from 'react'

export interface OnlineTrack {
  id: string
  title: string
  artist: string
  album: string
  albumCover: string
  previewUrl: string
  duration: number // seconds (preview is ~30s)
  genre: string
  releaseDate: string
  source: 'itunes'
}

// iTunes Search API — free, no key needed, provides 30s legal preview clips
async function searchITunes(query: string, limit = 20): Promise<OnlineTrack[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}&country=CN`

  let resp: Response
  // Use Electron main-process fetch if available (bypasses CORS)
  if (window.electronAPI) {
    const r = await window.electronAPI.fetch(url)
    const data = await r.json()
    return parseITunesResults(data)
  } else {
    resp = await fetch(url)
    const data = await resp.json()
    return parseITunesResults(data)
  }
}

function parseITunesResults(data: any): OnlineTrack[] {
  if (!data?.results) return []
  return data.results
    .filter((item: any) => item.kind === 'song' && item.previewUrl)
    .map((item: any) => ({
      id: String(item.trackId),
      title: item.trackName || '未知歌曲',
      artist: item.artistName || '未知艺术家',
      album: item.collectionName || '未知专辑',
      albumCover: (item.artworkUrl100 || '').replace('100x100', '300x300'),
      previewUrl: item.previewUrl || '',
      duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30,
      genre: item.primaryGenreName || '',
      releaseDate: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
      source: 'itunes' as const,
    }))
}

export function useOnlineSearch() {
  const [results, setResults] = useState<OnlineTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [currentTrack, setCurrentTrack] = useState<OnlineTrack | null>(null)

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      setError(null)
      return
    }

    setQuery(trimmed)
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const tracks = await searchITunes(trimmed)
      if (tracks.length === 0) {
        setError(`没有找到与"${trimmed}"相关的歌曲，试试其他关键词`)
      } else {
        setResults(tracks)
      }
    } catch (err: any) {
      setError(`搜索失败：${err.message || '未知错误'}，请检查网络后重试`)
    } finally {
      setLoading(false)
    }
  }, [])

  const selectTrack = useCallback((track: OnlineTrack) => {
    setCurrentTrack(track)
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
    setQuery('')
    setCurrentTrack(null)
  }, [])

  return {
    results,
    loading,
    error,
    query,
    currentTrack,
    search,
    selectTrack,
    clearResults,
  }
}
