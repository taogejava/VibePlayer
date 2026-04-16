import { type FileNode } from '../hooks/useLocalLibrary'

interface Props {
  tree: FileNode[]
  rootName: string
  loading: boolean
  error: string
  currentFileId: string | null
  isPlaying: boolean
  onToggleExpand: (id: string) => void
  onPlayFile: (node: FileNode) => void
  onOpenFolder: () => void
}

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

const EXT_COLORS: Record<string, string> = {
  mp3: '#f59e0b',
  flac: '#8b5cf6',
  wav: '#06b6d4',
  aac: '#10b981',
  m4a: '#3b82f6',
  ogg: '#ec4899',
  opus: '#f97316',
  wma: '#6366f1',
  aiff: '#84cc16',
  ape: '#ef4444',
}

function FileIcon({ name, isActive }: { name: string; isActive: boolean }) {
  const ext = getExt(name)
  const color = isActive ? '#fff' : (EXT_COLORS[ext] ?? '#94a3b8')
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill={color}>
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  )
}

function FolderIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-yellow-400" fill="currentColor">
      <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-yellow-500/70" fill="currentColor">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3 h-3 shrink-0 text-white/30 transition-transform duration-200"
      fill="currentColor"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <path d="M10 17l5-5-5-5v10z"/>
    </svg>
  )
}

function MiniWave({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-px h-3 ml-1">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="w-0.5 rounded-sm"
          style={{
            background: color,
            animation: `tree-beat ${0.4 + i * 0.12}s ease-in-out infinite alternate`,
            height: '60%',
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes tree-beat {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

function TreeNode({
  node,
  depth,
  currentFileId,
  isPlaying,
  onToggleExpand,
  onPlayFile,
}: {
  node: FileNode
  depth: number
  currentFileId: string | null
  isPlaying: boolean
  onToggleExpand: (id: string) => void
  onPlayFile: (node: FileNode) => void
}) {
  const isActive = node.id === currentFileId
  const ext = getExt(node.name).toUpperCase()
  const extColor = EXT_COLORS[getExt(node.name)] ?? '#94a3b8'
  // strip extension for display
  const displayName = node.type === 'file'
    ? node.name.replace(/\.[^/.]+$/, '')
    : node.name

  if (node.type === 'directory') {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors select-none group"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onToggleExpand(node.id)}
        >
          <ChevronIcon expanded={!!node.expanded} />
          <FolderIcon expanded={!!node.expanded} />
          <span className="text-white/70 text-xs font-medium truncate group-hover:text-white/90">
            {node.name}
          </span>
          <span className="ml-auto text-white/20 text-[10px] shrink-0">
            {countAudio(node)} 首
          </span>
        </div>
        {node.expanded && node.children && (
          <div>
            {node.children.map(child => (
              <TreeNode
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

  // File node
  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150 group select-none"
      style={{
        paddingLeft: `${8 + depth * 16}px`,
        background: isActive ? 'rgba(255,255,255,0.08)' : undefined,
        borderLeft: isActive ? `2px solid ${extColor}` : '2px solid transparent',
      }}
      onDoubleClick={() => onPlayFile(node)}
      onClick={() => onPlayFile(node)}   // single click also works on mobile
      title={`双击播放：${node.name}`}
    >
      <FileIcon name={node.name} isActive={isActive} />
      <span
        className={`flex-1 text-xs truncate transition-colors ${
          isActive ? 'text-white font-medium' : 'text-white/50 group-hover:text-white/80'
        }`}
      >
        {displayName}
      </span>
      {isActive && isPlaying && <MiniWave color={extColor} />}
      {!isActive && (
        <span
          className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: extColor + '33', color: extColor }}
        >
          {ext}
        </span>
      )}
      {isActive && !isPlaying && (
        <svg viewBox="0 0 24 24" fill={extColor} className="w-3 h-3 shrink-0">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      )}
    </div>
  )
}

function countAudio(node: FileNode): number {
  if (node.type === 'file') return 1
  return (node.children ?? []).reduce((sum, c) => sum + countAudio(c), 0)
}

export default function LocalFileTree({
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
  const total = tree.reduce((s, n) => s + countAudio(n), 0)

  return (
    <div className="flex-1 flex flex-col rounded-2xl h-full min-h-0"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 rounded-t-2xl">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400/80 shrink-0">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <span className="text-white/60 text-xs font-semibold tracking-widest uppercase flex-1 truncate">
          {rootName || '本地音乐库'}
        </span>
        {total > 0 && (
          <span className="text-white/30 text-xs shrink-0">{total} 首</span>
        )}
        <button
          onClick={onOpenFolder}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
          title="选择文件夹"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          {tree.length === 0 ? '选择文件夹' : '换文件夹'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-1 min-h-0" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
            <span className="text-xs">正在扫描音乐文件…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-400/60">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span className="text-white/40 text-xs">{error}</span>
          </div>
        )}

        {!loading && !error && tree.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(234,179,8,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-yellow-400/70">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium mb-1">从本地选择音乐文件夹</p>
              <p className="text-white/25 text-xs leading-relaxed">
                支持 MP3 · FLAC · WAV · AAC<br/>M4A · OGG · OPUS · WMA 等格式
              </p>
            </div>
            <button
              onClick={onOpenFolder}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #eab308aa, #f59e0baa)' }}
            >
              选择文件夹
            </button>
          </div>
        )}

        {!loading && !error && tree.length > 0 && (
          <div className="px-1">
            {tree.map(node => (
              <TreeNode
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
        <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-1">
          {['MP3','FLAC','WAV','AAC','M4A','OGG'].map(f => (
            <span key={f} className="text-[9px] px-1.5 py-0.5 rounded text-white/20"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
