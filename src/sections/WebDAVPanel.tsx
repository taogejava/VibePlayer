import { useState } from 'react'
import type { WebDAVConfig, WebDAVFile } from '../hooks/useWebDAV'
import { useTheme } from '../ThemeContext'

const AUDIO_EXTS = new Set(['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'aiff', 'ape'])
const VIDEO_EXTS = new Set(['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v'])

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() || ''
}

function getFileType(file: WebDAVFile): 'audio' | 'video' | 'other' {
  if (file.isDir) return 'other'
  const ext = getExt(file.name)
  if (AUDIO_EXTS.has(ext)) return 'audio'
  if (VIDEO_EXTS.has(ext)) return 'video'
  return 'other'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

interface Props {
  connected: boolean
  currentPath: string
  files: WebDAVFile[]
  loading: boolean
  error: string | null
  histories: WebDAVConfig[]
  onConnect: (config: WebDAVConfig) => Promise<boolean>
  onNavigate: (path: string) => void
  onGoBack: () => void
  onGoUp: () => void
  onDisconnect: () => void
  onPlayFile: (file: WebDAVFile, type: 'audio' | 'video') => void
}

export default function WebDAVPanel({
  connected, currentPath, files, loading, error, histories,
  onConnect, onNavigate, onGoBack, onGoUp, onDisconnect, onPlayFile,
}: Props) {
  const { theme } = useTheme()
  const [serverUrl, setServerUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)

  const primaryColor = theme.colors.primary || '#8b5cf6'

  const handleConnect = async (cfg?: WebDAVConfig) => {
    const config = cfg || { serverUrl, username, password }
    setConnecting(true)
    const ok = await onConnect(config)
    setConnecting(false)
    if (ok && !cfg) {
      setServerUrl('')
      setUsername('')
      setPassword('')
    }
  }

  const playableFiles = files.filter(f => {
    const type = getFileType(f)
    return type === 'audio' || type === 'video'
  })

  return (
    <div className="w-full flex flex-col h-full animate-fade-in">
      {!connected ? (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" style={{ color: primaryColor, opacity: 0.7 }}>
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="currentColor" opacity="0.3"/>
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary, #ffffff)', opacity: 0.8 }}>WebDAV 云盘</h3>
          </div>

          {error && (
            <div className="shrink-0 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          {histories.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>最近连接</span>
              {histories.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleConnect(h)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all group"
                  style={{ backgroundColor: 'var(--theme-bg-secondary, #15152a)' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor, opacity: 0.5 }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-xs truncate flex-1" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>{h.serverUrl}</span>
                  <span className="text-[10px]" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>{h.username}</span>
                </button>
              ))}
            </div>
          )}

          <div className="pt-4" style={{ borderTop: '1px solid var(--theme-bg-tertiary, #1e1e3a)' }}>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>服务器地址</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://dav.example.com"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary, #15152a)',
                    borderColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                    color: 'var(--theme-text-primary, #ffffff)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>用户名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary, #15152a)',
                      borderColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                      color: 'var(--theme-text-primary, #ffffff)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary, #15152a)',
                      borderColor: 'var(--theme-bg-tertiary, #1e1e3a)',
                      color: 'var(--theme-text-primary, #ffffff)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleConnect()}
                disabled={connecting || !serverUrl.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${theme.colors.primaryLight || '#a78bfa'})`,
                  color: 'var(--theme-bg-primary, #0a0a1a)',
                  boxShadow: `0 4px 15px ${primaryColor}40`,
                }}
              >
                {connecting ? '连接中...' : '连接'}
              </button>
            </div>
          </div>

          <div className="text-[10px] leading-relaxed px-2" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.4 }}>
            支持群晖、威联通、NextCloud 等任何 WebDAV 服务
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="shrink-0 flex items-center gap-2 mb-3">
            <button
              onClick={onGoBack}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--theme-text-muted, #9ca3af)' }}
              title="后退"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <button
              onClick={onGoUp}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--theme-text-muted, #9ca3af)' }}
              title="上级目录"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
              </svg>
            </button>
            <div className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono truncate" style={{ backgroundColor: 'var(--theme-bg-secondary, #15152a)', color: 'var(--theme-text-secondary, #d1d5db)' }}>
              {currentPath || '/'}
            </div>
            <button
              onClick={onDisconnect}
              className="px-2 py-1 rounded-lg text-xs transition-all"
              style={{ color: 'rgba(239, 68, 68, 0.6)' }}
            >
              断开
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="shrink-0 mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          {/* File list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl"
            style={{ backgroundColor: 'var(--theme-bg-secondary, #15152a)', borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderWidth: '1px', borderStyle: 'solid' }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: '2px', borderTopColor: primaryColor, borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderStyle: 'solid' }} />
              </div>
            ) : (
              <div className="py-1">
                {files.map((file) => {
                  const fType = getFileType(file)
                  return (
                    <div
                      key={file.path}
                      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all duration-150 group ${
                        fType !== 'other' ? '' : file.isDir ? '' : 'opacity-40'
                      }`}
                      style={{ backgroundColor: fType !== 'other' || file.isDir ? undefined : undefined }}
                      onMouseEnter={(e) => {
                        if (fType !== 'other' || file.isDir) e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary, #1e1e3a)'
                      }}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => {
                        if (file.isDir) {
                          onNavigate(file.path)
                        } else if (fType !== 'other') {
                          onPlayFile(file, fType as 'audio' | 'video')
                        }
                      }}
                    >
                      {file.isDir ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: '#eab308', opacity: 0.7 }}>
                          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                        </svg>
                      ) : fType === 'video' ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: '#60a5fa', opacity: 0.6 }}>
                          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                        </svg>
                      ) : fType === 'audio' ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: '#34d399', opacity: 0.6 }}>
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.3 }}>
                          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                        </svg>
                      )}
                      <span className="text-xs truncate flex-1" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>{file.name}</span>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>{formatSize(file.size)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {playableFiles.length > 0 && (
            <div className="shrink-0 mt-2 px-2 flex flex-wrap gap-1">
              <span className="text-[10px]" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.5 }}>{playableFiles.length} 个可播放文件</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
