import { useState, useCallback, useRef } from 'react'

export interface BilibiliVideo {
  bvid: string
  title: string
  author: string
  cover: string
  duration: number // seconds
  page: number // 分P索引, 1-based
  pages: { page: number; part: string; duration: number }[]
}

function parseBilibiliUrl(url: string): { type: 'bvid' | 'aid' | 'season' | 'episode'; id: string; page?: number } | null {
  url = url.trim()

  // BV号直接输入
  if (/^BV[A-Za-z0-9]+$/i.test(url)) {
    return { type: 'bvid', id: url.toUpperCase() }
  }

  // AV号直接输入
  if (/^av?\d+$/i.test(url)) {
    return { type: 'aid', id: url.replace(/^av?/i, '') }
  }

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, '')

    // b23.tv 短链接 - 无法在客户端解析，提示用户
    if (hostname === 'b23.tv') {
      return null
    }

    // bilibili.com 或 m.bilibili.com
    if (hostname.endsWith('bilibili.com')) {
      const pathname = parsed.pathname

      // BV号格式: /video/BVxxxxxxx
      const bvMatch = pathname.match(/\/video\/(BV[A-Za-z0-9]+)/i)
      if (bvMatch) {
        const p = parsed.searchParams.get('p')
        return { type: 'bvid', id: bvMatch[1].toUpperCase(), page: p ? parseInt(p) : undefined }
      }

      // AV号格式: /video/av12345
      const avMatch = pathname.match(/\/video\/av(\d+)/i)
      if (avMatch) {
        const p = parsed.searchParams.get('p')
        return { type: 'aid', id: avMatch[1], page: p ? parseInt(p) : undefined }
      }

      // bangumi格式: /bangumi/play/ep12345
      const epMatch = pathname.match(/\/bangumi\/play\/ep(\d+)/i)
      if (epMatch) {
        return { type: 'episode', id: epMatch[1] }
      }

      // bangumi season: /bangumi/play/ss12345
      const ssMatch = pathname.match(/\/bangumi\/play\/ss(\d+)/i)
      if (ssMatch) {
        return { type: 'season', id: ssMatch[1] }
      }
    }
  } catch {
    // not a valid URL
  }

  return null
}

async function fetchVideoInfo(parsed: { type: string; id: string; page?: number }): Promise<BilibiliVideo | null> {
  try {
    let apiUrl: string

    if (parsed.type === 'bvid') {
      apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${parsed.id}`
    } else if (parsed.type === 'aid') {
      apiUrl = `https://api.bilibili.com/x/web-interface/view?aid=${parsed.id}`
    } else {
      return null
    }

    const resp = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      credentials: 'include',
    })

    const json = await resp.json()
    if (json.code !== 0) {
      throw new Error(json.message || '获取视频信息失败')
    }

    const data = json.data
    const pages = (data.pages || []).map((p: any) => ({
      page: p.page,
      part: p.part,
      duration: p.duration || 0,
    }))

    const page = parsed.page && parsed.page <= pages.length ? parsed.page : 1
    const currentPageInfo = pages.find((p: any) => p.page === page) || pages[0]

    return {
      bvid: data.bvid,
      title: data.title || '未知标题',
      author: data.owner?.name || '未知UP主',
      cover: data.pic ? data.pic.replace(/^\/\//, 'https://') : '',
      duration: currentPageInfo?.duration || data.duration || 0,
      page,
      pages,
    }
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new Error('网络请求失败，B站API可能因跨域限制无法访问。请尝试直接在B站打开链接。')
    }
    throw err
  }
}

export function useBilibili() {
  const [currentVideo, setCurrentVideo] = useState<BilibiliVideo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<BilibiliVideo[]>([])
  const historyIdRef = useRef(0)

  const parseUrl = useCallback((url: string) => {
    return parseBilibiliUrl(url)
  }, [])

  const resolveUrl = useCallback(async (url: string) => {
    setError(null)
    setLoading(true)
    setCurrentVideo(null)

    try {
      const parsed = parseBilibiliUrl(url)
      if (!parsed) {
        throw new Error(
          '无法识别的链接格式。\n\n支持格式：\n' +
          '• B站视频链接 (bilibili.com/video/BVxxx)\n' +
          '• BV号 (BV1xxxxxxxxx)\n' +
          '• AV号 (av12345)\n' +
          '• 分P链接 (.../BVxxx?p=2)\n\n' +
          '注意：b23.tv 短链接暂不支持，请展开为完整链接后使用。'
        )
      }

      if (parsed.type === 'season' || parsed.type === 'episode') {
        throw new Error('番剧/影视内容暂不支持，请使用UGC视频链接。')
      }

      const video = await fetchVideoInfo(parsed)

      if (!video) {
        throw new Error('无法获取视频信息，请检查链接是否正确。')
      }

      setCurrentVideo(video)
      setHistory(prev => {
        const filtered = prev.filter(h => !(h.bvid === video.bvid && h.page === video.page))
        return [{ ...video, _uid: ++historyIdRef.current }, ...filtered].slice(0, 20) as any[]
      })

      return video
    } catch (err: any) {
      const msg = err.message || '解析失败'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const selectHistoryItem = useCallback((video: BilibiliVideo) => {
    setCurrentVideo(video)
    setError(null)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const getPlayerUrl = useCallback((video: BilibiliVideo) => {
    const params = new URLSearchParams({
      bvid: video.bvid,
      p: String(video.page),
      high_quality: '1',
      danmaku: '1',
      autoplay: '0',
    })
    return `https://player.bilibili.com/player.html?${params.toString()}`
  }, [])

  return {
    currentVideo,
    loading,
    error,
    history,
    parseUrl,
    resolveUrl,
    selectHistoryItem,
    clearHistory,
    getPlayerUrl,
  }
}
