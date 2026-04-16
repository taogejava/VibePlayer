import { useState } from 'react'
import type { AListConfig } from '../hooks/useAList'
import type { AListFile } from '../hooks/useAList'

const AUDIO_EXTS = new Set(['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'aiff', 'ape'])
const VIDEO_EXTS = new Set(['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v'])

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() || ''
}

function getFileType(file: AListFile): 'audio' | 'video' | 'other' {
  if (file.is_dir) return 'other'
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
  files: AListFile[]
  loading: boolean
  error: string | null
  histories: AListConfig[]
  onConnect: (config: AListConfig) => Promise<boolean>
  onNavigate: (path: string) => void
  onGoBack: () => void
  onGoUp: () => void
  onDisconnect: () => void
  onPlayFile: (file: AListFile, type: 'audio' | 'video') => void
}

export default function AListPanel({
  connected, currentPath, files, loading, error, histories,
  onConnect, onNavigate, onGoBack, onGoUp, onDisconnect, onPlayFile,
}: Props) {
  const [serverUrl, setServerUrl] = useState('')
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async (cfg?: AListConfig) => {
    const config = cfg || { serverUrl, token }
    setConnecting(true)
    const ok = await onConnect(config)
    setConnecting(false)
    if (ok && !cfg) {
      setServerUrl('')
      setToken('')
    }
  }

  const playableFiles = files.filter(f => {
    const type = getFileType(f)
    return type === 'audio' || type === 'video'
  })

  return (
    <div className="w-full flex flex-col h-full animate-fade-in">
      {!connected ? (
        /* Login form */
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-orange-400">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 7h8M8 12h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="18" cy="18" r="4" fill="currentColor" opacity="0.3" />
              <path d="M18 16v4M16 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3 className="text-white/80 text-sm font-semibold">AList 网盘聚合</h3>
          </div>

          {/* Supported clouds info */}
          <div className="px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
            <p className="text-white/40 text-[10px] leading-relaxed">
              AList 一次对接，即可访问百度网盘、阿里云盘、123云盘、蓝奏云、夸克网盘等所有已挂载的存储
            </p>
          </div>

          {/* Quick connect history */}
          {histories.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-white/30 text-xs">最近连接</span>
              {histories.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleConnect(h)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-orange-400/50 shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-white/60 text-xs truncate flex-1">{h.serverUrl}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/5 pt-4">
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs mb-1 block">AList 服务器地址</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://your-alist-server:5244"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/90 text-sm placeholder:text-white/20 outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">API Token（可选）</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="AList 后台获取的 Token"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/90 text-sm placeholder:text-white/20 outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <button
                onClick={() => handleConnect()}
                disabled={connecting || !serverUrl.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
              >
                {connecting ? '连接中...' : '连接 AList'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* File browser */
        <>
          {/* Toolbar */}
          <div className="shrink-0 flex items-center gap-2 mb-3">
            <button
              onClick={onGoBack}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="后退"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <button
              onClick={onGoUp}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="上级目录"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
              </svg>
            </button>
            <div className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-mono truncate">
              {currentPath || '/'}
            </div>
            <button
              onClick={onDisconnect}
              className="px-2 py-1 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              断开
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="shrink-0 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-300/90 text-xs">{error}</p>
            </div>
          )}

          {/* File list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-white/10 border-t-orange-500/50 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="py-1">
                {files.map((file) => {
                  const fType = getFileType(file)
                  return (
                    <div
                      key={file.name + file.modified}
                      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all duration-150 group ${
                        fType !== 'other' ? 'hover:bg-white/5' : file.is_dir ? 'hover:bg-white/5 cursor-pointer' : 'opacity-40'
                      }`}
                      onClick={() => {
                        if (file.is_dir) {
                          onNavigate(`${currentPath === '/' ? '' : currentPath}/${file.name}`)
                        } else if (fType !== 'other') {
                          onPlayFile(file, fType as 'audio' | 'video')
                        }
                      }}
                    >
                      {file.is_dir ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500/70 shrink-0">
                          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                        </svg>
                      ) : fType === 'video' ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400/60 shrink-0">
                          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                        </svg>
                      ) : fType === 'audio' ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400/60 shrink-0">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/20 shrink-0">
                          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                        </svg>
                      )}
                      <span className="text-white/70 text-xs truncate flex-1">{file.name}</span>
                      {file.thumb && <img src={file.thumb} className="w-5 h-5 rounded object-cover shrink-0" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />}
                      <span className="text-white/20 text-[10px] shrink-0">{formatSize(file.size)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {playableFiles.length > 0 && (
            <div className="shrink-0 mt-2 px-2 flex flex-wrap gap-1">
              <span className="text-white/20 text-[10px]">{playableFiles.length} 个可播放文件</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
