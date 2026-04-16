import { useState, useCallback, useRef } from 'react'

export interface WebDAVFile {
  name: string
  path: string
  isDir: boolean
  size: number
  lastModified: string
  contentType?: string
}

export interface WebDAVConfig {
  serverUrl: string
  username: string
  password: string
}

export interface WebDAVState {
  connected: boolean
  config: WebDAVConfig | null
  currentPath: string
  files: WebDAVFile[]
  loading: boolean
  error: string | null
  histories: WebDAVConfig[]
}

function getAuthHeader(config: WebDAVConfig) {
  return 'Basic ' + btoa(`${config.username}:${config.password}`)
}

async function davRequest(
  config: WebDAVConfig,
  method: string,
  path: string
): Promise<Response> {
  const url = config.serverUrl.replace(/\/+$/, '') + path
  const resp = await fetch(url, {
    method,
    headers: {
      'Authorization': getAuthHeader(config),
      'Depth': '1',
    },
  })
  if (!resp.ok) {
    if (resp.status === 401 || resp.status === 403) throw new Error('认证失败，请检查用户名和密码')
    if (resp.status === 404) throw new Error('路径不存在')
    if (resp.status === 405) throw new Error('服务器不支持该操作')
    throw new Error(`请求失败 (${resp.status})`)
  }
  return resp
}

function parseMultiStatus(xml: string, basePath: string): WebDAVFile[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const responses = doc.querySelectorAll('response')
  const files: WebDAVFile[] = []

  responses.forEach((resp) => {
    const hrefEl = resp.querySelector('href')
    if (!hrefEl) return
    const rawHref = decodeURIComponent(hrefEl.textContent || '')
    // Normalize the href relative to server base
    const href = rawHref.startsWith('http') ? new URL(rawHref).pathname : rawHref
    // Skip the base directory itself
    const normalizedBase = basePath.replace(/\/+$/, '')
    const normalizedHref = href.replace(/\/+$/, '')
    if (normalizedHref === normalizedBase) return

    const isDir = resp.querySelector('resourcetype collection') !== null
    const sizeEl = resp.querySelector('getcontentlength')
    const modifiedEl = resp.querySelector('getlastmodified')
    const contentEl = resp.querySelector('getcontenttype')

    // Extract display name from path
    const name = normalizedHref.replace(/\/+$/, '').split('/').pop() || ''

    files.push({
      name,
      path: href,
      isDir,
      size: sizeEl ? parseInt(sizeEl.textContent || '0') : 0,
      lastModified: modifiedEl?.textContent || '',
      contentType: contentEl?.textContent || '',
    })
  })

  // Sort: directories first, then files alphabetically
  files.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })

  return files
}

export function useWebDAV() {
  const [connected, setConnected] = useState(false)
  const [config, setConfig] = useState<WebDAVConfig | null>(null)
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<WebDAVFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [histories, setHistories] = useState<WebDAVConfig[]>(() => {
    try {
      const saved = localStorage.getItem('webdav-histories')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const pathHistoryRef = useRef<string[]>(['/'])

  const connect = useCallback(async (cfg: WebDAVConfig) => {
    setError(null)
    setLoading(true)
    try {
      await davRequest(cfg, 'PROPFIND', '/')
      setConnected(true)
      setConfig(cfg)
      setCurrentPath('/')
      pathHistoryRef.current = ['/']
      setHistories(prev => {
        const filtered = prev.filter(h => !(h.serverUrl === cfg.serverUrl && h.username === cfg.username))
        const next = [cfg, ...filtered].slice(0, 5)
        localStorage.setItem('webdav-histories', JSON.stringify(next))
        return next
      })
      // Load root directory
      const resp = await davRequest(cfg, 'PROPFIND', '/')
      const xml = await resp.text()
      setFiles(parseMultiStatus(xml, '/'))
      return true
    } catch (err: any) {
      setError(err.message || '连接失败')
      setConnected(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const navigate = useCallback(async (path: string) => {
    if (!config) return
    setError(null)
    setLoading(true)
    try {
      const resp = await davRequest(config, 'PROPFIND', path)
      const xml = await resp.text()
      setFiles(parseMultiStatus(xml, path))
      setCurrentPath(path)
      pathHistoryRef.current.push(path)
    } catch (err: any) {
      setError(err.message || '无法加载目录')
    } finally {
      setLoading(false)
    }
  }, [config])

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

  // Build a file URL for playing (GET request with auth)
  const getFileUrl = useCallback((filePath: string) => {
    if (!config) return ''
    const url = config.serverUrl.replace(/\/+$/, '') + filePath
    return url
  }, [config])

  // Get download URL as a blob URL (for CORS cases)
  const getFileBlobUrl = useCallback(async (filePath: string): Promise<string> => {
    if (!config) throw new Error('未连接')
    const url = config.serverUrl.replace(/\/+$/, '') + filePath
    const resp = await fetch(url, {
      headers: { 'Authorization': getAuthHeader(config) },
    })
    if (!resp.ok) throw new Error('下载文件失败')
    const blob = await resp.blob()
    return URL.createObjectURL(blob)
  }, [config])

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
    getFileBlobUrl,
  }
}
