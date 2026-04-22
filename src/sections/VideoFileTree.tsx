import type { VideoFileNode } from '../hooks/useVideoLibrary'
import { useTheme } from '../ThemeContext'

interface Props {
  tree: VideoFileNode[]
  rootName: string
  loading: boolean
  error: string
  currentFileId: string | null
  isPlaying: boolean
  onToggleExpand: (id: string) => void
  onPlayFile: (node: VideoFileNode) => void
  onOpenFolder: () => void
}

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

const EXT_COLORS: Record<string, string> = {
  mp4: '#3b82f6',
  mkv: '#8b5cf6',
  webm: '#10b981',
  avi: '#f59e0b',
  mov: '#6366f1',
  wmv: '#ef4444',
  flv: '#ec4899',
  m4v: '#0ea5e9',
  ts: '#f97316',
  rmvb: '#84cc16',
  '3gp': '#06b6d4',
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function VideoFileIcon({ name, isActive }: { name: string; isActive: boolean }) {
  const ext = getExt(name)
  const color = isActive ? 'var(--theme-text-primary, #ffffff)' : (EXT_COLORS[ext] ?? 'var(--theme-text-muted, #9ca3af)')
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" style={{ fill: color }}>
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
    </svg>
  )
}

function FolderIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" style={{ fill: '#eab308' }}>
      <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" style={{ fill: '#eab308', opacity: 0.7 }}>
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3 h-3 shrink-0 transition-transform duration-200"
      fill="currentColor"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.3 }}
    >
      <path d="M10 17l5-5-5-5v10z"/>
    </svg>
  )
}

function countVideo(node: VideoFileNode): number {
  if (node.type === 'file') return 1
  return (node.children ?? []).reduce((sum, c) => sum + countVideo(c), 0)
}

function VideoTreeNode({
  node,
  depth,
  currentFileId,
  isPlaying,
  onToggleExpand,
  onPlayFile,
}: {
  node: VideoFileNode
  depth: number
  currentFileId: string | null
  isPlaying: boolean
  onToggleExpand: (id: string) => void
  onPlayFile: (node: VideoFileNode) => void
}) {
  const { theme } = useTheme()
  const primaryColor = theme.colors.primary || '#8b5cf6'
  const isActive = node.id === currentFileId
  const ext = getExt(node.name).toUpperCase()
  const extColor = EXT_COLORS[getExt(node.name)] || primaryColor
  const displayName = node.type === 'file'
    ? node.name.replace(/\.[^/.]+$/, '')
    : node.name

  if (node.type === 'directory') {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors select-none group"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onToggleExpand(node.id)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary, #1e1e3a)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ChevronIcon expanded={!!node.expanded} />
          <FolderIcon expanded={!!node.expanded} />
          <span className="text-xs font-medium truncate" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>
            {node.name}
          </span>
          <span className="ml-auto text-[10px] shrink-0" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.25 }}>
            {countVideo(node)} 个
          </span>
        </div>
        {node.expanded && node.children && (
          <div>
            {node.children.map(child => (
              <VideoTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                currentFileId={currentFileId}
                isPlaying={isPlaying}
                onToggleExpand={onToggleExpand}
                onPlayFile={onPlayFile}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150 group select-none"
      style={{
        paddingLeft: `${8 + depth * 16}px`,
        backgroundColor: isActive ? hexToRgba(primaryColor, 0.35) : undefined,
        borderLeft: isActive ? `2px solid ${extColor}` : '2px solid transparent',
      }}
      onClick={() => onPlayFile(node)}
      title={`点击播放：${node.name}`}
    >
      <VideoFileIcon name={node.name} isActive={isActive} />
      <span
        className="flex-1 text-xs truncate font-medium transition-colors"
        style={{
          color: isActive ? 'var(--theme-text-primary, #ffffff)' : 'var(--theme-text-muted, #9ca3af)'
        }}
      >
        {displayName}
      </span>
      {isActive && (
        <span className="flex items-center gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px]" style={{ color: '#f87171' }}>播放中</span>
        </span>
      )}
      {!isActive && (
        <span
          className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `${extColor}33`, color: extColor }}
        >
          {ext}
        </span>
      )}
    </div>
  )
}

export default function VideoFileTree({
  tree,
  rootName,
  loading,
  error,
  currentFileId,
  isPlaying,
  onToggleExpand,
  onPlayFile,
  onOpenFolder,
}: Props) {
  const { theme } = useTheme()
  const primaryColor = theme.colors.primary || '#8b5cf6'
  const total = tree.reduce((s, n) => s + countVideo(n), 0)

  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--theme-bg-secondary, #15152a)',
        borderColor: 'var(--theme-bg-tertiary, #1e1e3a)',
        borderWidth: '1px',
        borderStyle: 'solid',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--theme-bg-tertiary, #1e1e3a)' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: primaryColor, opacity: 0.8 }}>
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
        <span className="text-xs font-semibold tracking-widest uppercase flex-1 truncate" style={{ color: 'var(--theme-text-secondary, #d1d5db)', opacity: 0.6 }}>
          {rootName || '本地视频库'}
        </span>
        {total > 0 && (
          <span className="text-xs shrink-0" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.35 }}>{total} 个</span>
        )}
        <button
          onClick={onOpenFolder}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-200"
          style={{ color: 'var(--theme-text-muted, #9ca3af)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-text-primary, #fff)'; e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary, #1e1e3a)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-text-muted, #9ca3af)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          title="选择文件夹"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          {tree.length === 0 ? '选择文件夹' : '换文件夹'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
            <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: '2px', borderTopColor: primaryColor, borderColor: 'var(--theme-bg-tertiary, #1e1e3a)', borderStyle: 'solid' }} />
            <span className="text-xs">正在扫描视频文件…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{ color: '#f87171', opacity: 0.6 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span className="text-xs" style={{ color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        {!loading && !error && tree.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{ color: primaryColor, opacity: 0.7 }}>
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--theme-text-secondary, #d1d5db)' }}>从本地选择视频文件夹</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.35 }}>
                支持 MP4 · MKV · WebM · AVI<br/>MOV · WMV · FLV · M4V 等格式
              </p>
            </div>
            <button
              onClick={onOpenFolder}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${theme.colors.primaryLight || '#a78bfa'})`,
                color: 'var(--theme-bg-primary, #0a0a1a)',
                boxShadow: `0 4px 15px ${primaryColor}40`,
              }}
            >
              选择文件夹
            </button>
          </div>
        )}

        {!loading && !error && tree.length > 0 && (
          <div className="px-1">
            {tree.map(node => (
              <VideoTreeNode
                key={node.id}
                node={node}
                depth={0}
                currentFileId={currentFileId}
                isPlaying={isPlaying}
                onToggleExpand={onToggleExpand}
                onPlayFile={onPlayFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Supported formats hint */}
      {tree.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1" style={{ borderTop: '1px solid var(--theme-bg-tertiary, #1e1e3a)' }}>
          {['MP4','MKV','WebM','AVI','MOV','WMV','FLV'].map(f => (
            <span key={f} className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: 'var(--theme-text-muted, #9ca3af)', opacity: 0.25, background: 'var(--theme-bg-secondary, #15152a)' }}>
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
