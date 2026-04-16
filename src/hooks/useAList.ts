import { useState, useCallback, useRef } from 'react'

export interface AListFile {
  name: string
  is_dir: boolean
  size: number
  modified: string
  created: string
  sign?: string
  thumb?: string
  type: number // file type: 1=folder, etc
}

export interface AListConfig {
  serverUrl: string
  token: string
}

interface AListResponse<T> {
  code: number
  message: string
  data: T
}

export interface AListState {
  connected: boolean
  config: AListConfig | null
  currentPath: string
  files: AListFile[]
  loading: boolean
  error: string | null
  histories: AListConfig[]
}

export function useAList() {
  const [connected, setConnected] = useState(false)
  const [config, setConfig] = useState<AListConfig | null>(null)
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<AListFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [histories, setHistories] = useState<AListConfig[]>(() => {
    try {
      const saved = localStorage.getItem('alist-histories')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const pathHistoryRef = useRef<string[]>(['/'])

  const apiRequest = useCallback(async <T>(path: string, method = 'GET', body?: any): Promise<AListResponse<T>> => {
    if (!config) throw new Error('未连接')
    const url = config.serverUrl.replace(/\/+$/, '') + '/api' + path
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (config.token) {
      headers['Authorization'] = config.token
    }
    const resp = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const json = await resp.json()
    if (json.code !== 200) {
      throw new Error(json.message || '请求失败')
    }
    return json
  }, [config])

  const connect = useCallback(async (cfg: AListConfig) => {
    setError(null)
    setLoading(true)
    try {
      // Verify connection by listing root
      await apiRequest<{ content: AListFile[]; total: number }>('/fs/list', 'POST', {
        path: '/',
        page: 1,
        per_page: 0,
      })
      setConnected(true)
      setConfig(cfg)
      setCurrentPath('/')
      pathHistoryRef.current = ['/']
      setHistories(prev => {
        const filtered = prev.filter(h => h.serverUrl !== cfg.serverUrl)
        const next = [cfg, ...filtered].slice(0, 5)
        localStorage.setItem('alist-histories', JSON.stringify(next))
        return next
      })
      // Load root
      const result = await apiRequest<{ content: AListFile[]; total: number }>('/fs/list', 'POST', {
        path: '/',
        page: 1,
        per_page: 0,
      })
      setFiles(result.data.content || [])
      return true
    } catch (err: any) {
      setError(err.message || '连接失败，请检查服务器地址和 Token')
      setConnected(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [apiRequest])

  const navigate = useCallback(async (path: string) => {
    setError(null)
    setLoading(true)
    try {
      const result = await apiRequest<{ content: AListFile[]; total: number }>('/fs/list', 'POST', {
        path,
        page: 1,
        per_page: 0,
      })
      setFiles(result.data.content || [])
      setCurrentPath(path)
      pathHistoryRef.current.push(path)
    } catch (err: any) {
      setError(err.message || '无法加载目录')
    } finally {
      setLoading(false)
    }
  }, [apiRequest])

  const goBack = useCallback(() => {
    if (pathHistoryRef.current.length > 1) {
      pathHistoryRef.current.pop()
      const prev = pathHistoryRef.current[pathHistoryRef.current.length - 1]
      navigate(prev)
    }
  }, [navigate])

  const goUp = useCallback(() => {
    if (currentPath === '/') return
    const parts = currentPath.replace(/\/+$/, '').split('/')
    parts.pop()
    const parent = parts.join('/') || '/'
    navigate(parent)
  }, [currentPath, navigate])

  const disconnect = useCallback(() => {
    setConnected(false)
    setConfig(null)
    setCurrentPath('/')
    setFiles([])
    setError(null)
  }, [])

  // Get the download/stream URL for a file
  const getFileUrl = useCallback(async (filePath: string): Promise<string> => {
    if (!config) throw new Error('未连接')
    const result = await apiRequest<{ raw_url: string; url: string }>('/fs/get', 'POST', {
      path: filePath,
    })
    // Prefer raw_url for direct streaming
    return result.data.raw_url || result.data.url
  }, [apiRequest])

  return {
    connected,
    config,
    currentPath,
    files,
    loading,
    error,
    histories,
    connect,
    navigate,
    goBack,
    goUp,
    disconnect,
    getFileUrl,
  }
}
