import { useState, useEffect, useRef, useCallback } from 'react'
import ParticleBackground from './ParticleBackground'
import SpectrumVisualizer from './SpectrumVisualizer'
import LyricsPanel from './LyricsPanel'
import PlaylistPanel from './PlaylistPanel'
import PlayerControls from './PlayerControls'
import LocalFileTree from './LocalFileTree'
import BilibiliPanel from './BilibiliPanel'
import { useLocalLibrary, type FileNode } from '../hooks/useLocalLibrary'
import { useBilibili } from '../hooks/useBilibili'

export interface Song {
  id: number
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  color: string[]
  // local file
  fileUrl?: string
  fileNode?: FileNode
}

export const DEMO_SONGS: Song[] = [
  {
    id: 1,
    title: 'Neon Dreams',
    artist: 'Synthwave Collective',
    album: 'Midnight City',
    duration: 245,
    cover: '',
    color: ['#7c3aed', '#2563eb', '#0ea5e9'],
  },
  {
    id: 2,
    title: 'Stellar Drift',
    artist: 'Cosmic Waves',
    album: 'Deep Space',
    duration: 198,
    cover: '',
    color: ['#db2777', '#7c3aed', '#6366f1'],
  },
  {
    id: 3,
    title: 'Crystal Rain',
    artist: 'Aurora Sound',
    album: 'Ethereal',
    duration: 221,
    cover: '',
    color: ['#0d9488', '#0ea5e9', '#6366f1'],
  },
  {
    id: 4,
    title: 'Electric Soul',
    artist: 'Pulse Nation',
    album: 'Voltage',
    duration: 263,
    cover: '',
    color: ['#dc2626', '#ea580c', '#d97706'],
  },
  {
    id: 5,
    title: 'Lunar Tides',
    artist: 'Moon Garden',
    album: 'Oceanic',
    duration: 187,
    cover: '',
    color: ['#0369a1', '#0891b2', '#6366f1'],
  },
]

// Generate a deterministic color palette from a string
function stringToColors(str: string): string[] {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 90) % 360
  const h3 = (h1 + 210) % 360
  return [
    `hsl(${h1},70%,55%)`,
    `hsl(${h2},65%,50%)`,
    `hsl(${h3},75%,60%)`,
  ]
}

let localIdCounter = 1000

function fileNodeToSong(node: FileNode): Song {
  const name = node.name.replace(/\.[^/.]+$/, '')
  // try to parse "Artist - Title"
  const parts = name.split(' - ')
  const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : name
  const artist = parts.length >= 2 ? parts[0].trim() : '未知艺术家'
  const url = node.url ?? URL.createObjectURL(node.fileHandle!)
  node.url = url
  return {
    id: ++localIdCounter,
    title,
    artist,
    album: '本地音乐',
    duration: node.duration ?? 0,
    cover: '',
    color: stringToColors(name),
    fileUrl: url,
    fileNode: node,
  }
}

type Panel = 'lyrics' | 'playlist' | 'library' | 'bilibili'

export default function MusicPlayer() {
  // ---------- Demo / library state ----------
  const [songs, setSongs] = useState<Song[]>(DEMO_SONGS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('all')
  const [panel, setPanel] = useState<Panel>('lyrics')
  const [liked, setLiked] = useState<Set<number>>(new Set([1, 3]))

  // ---------- Audio element ----------
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const song = songs[currentIndex] ?? DEMO_SONGS[0]

  // ---------- Local library ----------
  const { tree, loading, rootName, error, openFolder, toggleExpand } = useLocalLibrary()
  const [currentLocalFileId, setCurrentLocalFileId] = useState<string | null>(null)

  // ---------- Bilibili ----------
  const bilibili = useBilibili()

  // ---------- Audio helpers ----------
  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const playAudio = useCallback((url: string) => {
    clearTimer()
    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current
    // Update volume
    audio.volume = isMuted ? 0 : volume / 100

    if (audio.src !== url) {
      audio.src = url
      audio.load()
    }
    audio.play().catch(() => {})
    setIsPlaying(true)

    // Sync duration once loaded
    audio.onloadedmetadata = () => {
      setDuration(audio.duration)
      setSongs(prev => prev.map((s, i) => {
        if (i === currentIndex && s.fileUrl === url) {
          return { ...s, duration: Math.round(audio.duration) }
        }
        return s
      }))
    }

    // Tick
    timerRef.current = setInterval(() => {
      if (audio.ended) {
        clearTimer()
        setProgress(0)
        setIsPlaying(false)
      } else {
        setProgress(audio.currentTime)
        setDuration(audio.duration || 0)
      }
    }, 300)
  }, [isMuted, volume, currentIndex])

  const pauseAudio = useCallback(() => {
    clearTimer()
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  // Sync volume / mute to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // When current index changes AND it's a local file, play it
  useEffect(() => {
    const s = songs[currentIndex]
    if (s?.fileUrl) {
      playAudio(s.fileUrl)
    } else {
      // Demo song: use simulated timer
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      clearTimer()
      if (isPlaying) {
        timerRef.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= s.duration) {
              handleNext()
              return 0
            }
            return prev + 0.5
          })
        }, 500)
      }
    }
    setProgress(0)
    setDuration(s?.duration ?? 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // Demo song play/pause toggle
  useEffect(() => {
    const s = songs[currentIndex]
    if (s?.fileUrl) return  // handled by audio element
    clearTimer()
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= s.duration) {
            handleNext()
            return 0
          }
          return prev + 0.5
        })
      }, 500)
    }
    return clearTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentIndex])

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimer()
    audioRef.current?.pause()
  }, [])

  const handleNext = useCallback(() => {
    setProgress(0)
    if (isShuffled) {
      setCurrentIndex(Math.floor(Math.random() * songs.length))
    } else {
      setCurrentIndex(i => (i + 1) % songs.length)
    }
  }, [isShuffled, songs.length])

  const handlePrev = useCallback(() => {
    if (progress > 3 && audioRef.current) {
      audioRef.current.currentTime = 0
      setProgress(0)
    } else if (progress > 3) {
      setProgress(0)
    } else {
      setCurrentIndex(i => (i - 1 + songs.length) % songs.length)
      setProgress(0)
    }
  }, [progress, songs.length])

  const handlePlayPause = () => {
    const s = songs[currentIndex]
    if (s?.fileUrl && audioRef.current) {
      if (isPlaying) {
        pauseAudio()
      } else {
        playAudio(s.fileUrl)
      }
    } else {
      setIsPlaying(p => !p)
    }
  }

  const handleSeek = (v: number) => {
    setProgress(v)
    if (audioRef.current && songs[currentIndex]?.fileUrl) {
      audioRef.current.currentTime = v
    }
  }

  const handleSelectSong = (index: number) => {
    setCurrentIndex(index)
    setProgress(0)
    setIsPlaying(true)
    const s = songs[index]
    if (s?.fileUrl) {
      // Will be triggered by useEffect above
    }
  }

  // Play from local file tree
  const handlePlayLocalFile = useCallback((node: FileNode) => {
    if (!node.fileHandle) return
    const newSong = fileNodeToSong(node)
    setCurrentLocalFileId(node.id)

    // Check if already in list
    setSongs(prev => {
      const existingIdx = prev.findIndex(s => s.fileNode?.id === node.id)
      if (existingIdx >= 0) {
        setCurrentIndex(existingIdx)
        setProgress(0)
        playAudio(prev[existingIdx].fileUrl!)
        return prev
      }
      // Otherwise add to list
      const next = [...prev, newSong]
      const idx = next.length - 1
      setCurrentIndex(idx)
      setProgress(0)
      playAudio(newSong.fileUrl!)
      return next
    })
  }, [playAudio])

  const toggleLike = () => {
    setLiked(prev => {
      const next = new Set(prev)
      if (next.has(song.id)) next.delete(song.id)
      else next.add(song.id)
      return next
    })
  }

  const effectiveDuration = song.fileUrl ? duration : song.duration

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden transition-all duration-1000"
      style={{
        background: `radial-gradient(ellipse at 30% 30%, ${song.color[0]}33 0%, transparent 60%),
                     radial-gradient(ellipse at 70% 70%, ${song.color[2]}33 0%, transparent 60%),
                     #080812`,
      }}
    >
      <ParticleBackground colors={song.color} isPlaying={isPlaying} />

      {/* Ambient blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-20 blur-[120px] pointer-events-none transition-all duration-2000 animated-gradient"
        style={{ background: `radial-gradient(circle, ${song.color[0]} 0%, ${song.color[1]} 100%)` }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-20 blur-[100px] pointer-events-none transition-all duration-2000 animated-gradient"
        style={{ background: `radial-gradient(circle, ${song.color[2]} 0%, ${song.color[1]} 100%)` }}
      />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${song.color[0]}, ${song.color[1]})` }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <span className="text-white/80 font-semibold text-sm tracking-widest uppercase">VibePlayer</span>
          </div>
          <div className="flex items-center gap-1.5">
            {(['lyrics', 'playlist', 'library', 'bilibili'] as Panel[]).map(p => {
              const labels: Record<Panel, string> = { lyrics: '歌词', playlist: '列表', library: '本地', bilibili: 'B站' }
              const active = panel === p
              return (
                <button
                  key={p}
                  onClick={() => setPanel(active ? 'lyrics' : p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
                    active ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {p === 'library' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                  )}
                  {p === 'bilibili' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
                    </svg>
                  )}
                  {labels[p]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left: Album + Info + Controls */}
          <div className={`flex flex-col items-center justify-between transition-all duration-500 ${panel !== 'lyrics' ? 'w-[300px] shrink-0' : 'w-full'}`}>
            {/* Album Cover */}
            <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
              <div
                className="absolute inset-0 rounded-full opacity-60 blur-lg transition-all duration-1000"
                style={{ background: `conic-gradient(${song.color[0]}, ${song.color[1]}, ${song.color[2]}, ${song.color[0]})` }}
              />
              <div
                className={`relative w-48 h-48 rounded-full ${isPlaying ? 'vinyl-spin' : 'vinyl-paused'} transition-all duration-500`}
                style={{ animationDuration: isPlaying ? '8s' : '0s' }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(
                      ${song.color[0]}cc 0deg, ${song.color[1]}cc 120deg,
                      ${song.color[2]}cc 240deg, ${song.color[0]}cc 360deg
                    )`,
                    boxShadow: `0 0 30px ${song.color[0]}88, 0 0 60px ${song.color[1]}44`,
                  }}
                />
                {[30, 50, 70, 90, 110].map(r => (
                  <div key={r} className="absolute rounded-full border border-black/20"
                    style={{
                      top: `calc(50% - ${r / 2 * (192 / 110)}px)`,
                      left: `calc(50% - ${r / 2 * (192 / 110)}px)`,
                      width: r * (192 / 110), height: r * (192 / 110),
                    }}
                  />
                ))}
                <AlbumArt song={song} />
                <div className="absolute w-6 h-6 rounded-full bg-[#080812] border-2 border-white/10"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              </div>
            </div>

            {/* Song info */}
            <div className="text-center mt-4 w-full px-2">
              <div className="flex items-center justify-center gap-3 mb-1">
                <h2 className="text-white text-xl font-bold truncate max-w-[200px] shimmer-text">
                  {song.title}
                </h2>
                <button onClick={toggleLike} className="shrink-0 transition-transform active:scale-125">
                  {liked.has(song.id) ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-pink-500">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-white/40 hover:text-pink-400 transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-white/60 text-sm">{song.artist}</p>
              <p className="text-white/30 text-xs mt-0.5">{song.album}</p>
            </div>

            <div className="w-full mt-3">
              <SpectrumVisualizer isPlaying={isPlaying} colors={song.color} />
            </div>

            <div className="w-full mt-2">
              <PlayerControls
                song={{ ...song, duration: effectiveDuration || song.duration }}
                isPlaying={isPlaying}
                progress={progress}
                volume={volume}
                isMuted={isMuted}
                isShuffled={isShuffled}
                repeatMode={repeatMode}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrev={handlePrev}
                onSeek={handleSeek}
                onVolume={setVolume}
                onMute={() => setIsMuted(!isMuted)}
                onShuffle={() => setIsShuffled(!isShuffled)}
                onRepeat={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')}
              />
            </div>
          </div>

          {/* Right panels */}
          {panel === 'lyrics' && (
            <LyricsPanel song={song} progress={progress} colors={song.color} />
          )}
          {panel === 'playlist' && (
            <PlaylistPanel
              songs={songs}
              currentIndex={currentIndex}
              liked={liked}
              isPlaying={isPlaying}
              onSelect={handleSelectSong}
              onToggleLike={(id) => setLiked(prev => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })}
            />
          )}
          {panel === 'library' && (
            <LocalFileTree
              tree={tree}
              rootName={rootName}
              loading={loading}
              error={error}
              currentFileId={currentLocalFileId}
              isPlaying={isPlaying}
              onToggleExpand={toggleExpand}
              onPlayFile={handlePlayLocalFile}
              onOpenFolder={openFolder}
            />
          )}
          {panel === 'bilibili' && (
            <BilibiliPanel
              currentVideo={bilibili.currentVideo}
              loading={bilibili.loading}
              error={bilibili.error}
              history={bilibili.history}
              getPlayerUrl={bilibili.getPlayerUrl}
              onResolve={bilibili.resolveUrl}
              onSelectHistory={bilibili.selectHistoryItem}
              onClearHistory={bilibili.clearHistory}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function AlbumArt({ song }: { song: Song }) {
  const seed = song.id % 100
  const shapes = Array.from({ length: 6 }, (_, i) => ({
    cx: 50 + Math.sin((i * 60 + seed * 30) * Math.PI / 180) * 25,
    cy: 50 + Math.cos((i * 60 + seed * 20) * Math.PI / 180) * 25,
    r: 15 + (i % 3) * 8,
    opacity: 0.4 + (i % 3) * 0.15,
  }))
  return (
    <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center" style={{ margin: '15%' }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id={`grad-${song.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={song.color[0]} stopOpacity="0.9" />
            <stop offset="60%" stopColor={song.color[1]} stopOpacity="0.7" />
            <stop offset="100%" stopColor={song.color[2]} stopOpacity="0.9" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#grad-${song.id})`} />
        {shapes.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r}
            fill="white" opacity={s.opacity} style={{ mixBlendMode: 'overlay' }} />
        ))}
        <text x="50" y="55" textAnchor="middle" fontSize="18" fill="white" opacity="0.9" fontWeight="bold">
          {song.title.charAt(0)}
        </text>
      </svg>
    </div>
  )
}
