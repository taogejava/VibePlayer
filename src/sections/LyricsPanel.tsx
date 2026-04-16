import { useMemo, useRef, useEffect } from 'react'
import type { Song } from './MusicPlayer'
import type { LyricsLine } from '../hooks/useLyricsSearch'

interface Props {
  song: Song
  progress: number
  colors: string[]
  fullscreen?: boolean
  /** External lyrics lines (e.g. from network search) */
  externalLyrics?: LyricsLine[]
  /** Whether lyrics are currently being searched */
  searching?: boolean
  /** Whether the lyrics are from online search */
  isOnlineLyrics?: boolean
  /** Source info for the fetched lyrics */
  lyricsSource?: string
  /** Error message from search */
  searchError?: string
}

const DEMO_LYRICS: Record<number, LyricsLine[]> = {
  1: [
    { time: 0, text: '✦ Neon Dreams ✦' },
    { time: 10, text: 'Lights are fading in the night' },
    { time: 20, text: 'Neon signs are burning bright' },
    { time: 30, text: 'City streets are electric now' },
    { time: 40, text: 'Feel the pulse beneath my skin' },
    { time: 50, text: 'Synthetic beats begin to spin' },
    { time: 60, text: 'Lost in digital euphoria' },
    { time: 75, text: 'We are dreaming in neon light' },
    { time: 90, text: 'Dancing through the endless night' },
    { time: 105, text: 'Every moment feels so right' },
    { time: 120, text: 'Neon dreams... carry me away' },
    { time: 135, text: 'Through the haze of yesterday' },
    { time: 150, text: 'Synthesizers fill the air' },
    { time: 165, text: 'Electric love beyond compare' },
    { time: 180, text: 'We are dreaming in neon light' },
    { time: 195, text: 'Dancing through the endless night' },
    { time: 210, text: 'Every moment feels so right' },
    { time: 225, text: '✦ fade out ✦' },
  ],
  2: [
    { time: 0, text: '✦ Stellar Drift ✦' },
    { time: 12, text: 'Stars are calling out my name' },
    { time: 24, text: 'Floating free without a frame' },
    { time: 36, text: 'Cosmic winds begin to blow' },
    { time: 48, text: 'Across the universe we go' },
    { time: 60, text: 'Stellar drift... take me high' },
    { time: 72, text: 'Through the nebulas we fly' },
    { time: 84, text: 'Gravity is just a memory' },
    { time: 96, text: 'Out here we float so free' },
    { time: 110, text: 'Purple haze and indigo' },
    { time: 124, text: 'Watch the shooting stars below' },
    { time: 138, text: 'Stellar drift... carry me' },
    { time: 152, text: 'To the place I need to be' },
    { time: 166, text: 'In the space between the stars' },
    { time: 180, text: '✦ infinite ✦' },
  ],
  3: [
    { time: 0, text: '✦ Crystal Rain ✦' },
    { time: 11, text: 'Drops of crystal falling down' },
    { time: 22, text: 'Washing clean this endless town' },
    { time: 33, text: 'Teal and sapphire fill the sky' },
    { time: 44, text: 'Watch the rainbows as they fly' },
    { time: 55, text: 'Crystal rain... on my face' },
    { time: 66, text: 'Taking me to another place' },
    { time: 77, text: 'Where the rivers run with light' },
    { time: 88, text: 'Everything feels infinite and right' },
    { time: 100, text: 'Prisms dancing in the air' },
    { time: 112, text: 'Magic colors everywhere' },
    { time: 124, text: 'Crystal rain... wash it clean' },
    { time: 136, text: 'The most beautiful I\'ve ever seen' },
    { time: 150, text: 'Let the crystal rain fall down' },
    { time: 165, text: 'Wash away... wash away' },
    { time: 180, text: '✦ serenity ✦' },
  ],
  4: [
    { time: 0, text: '✦ Electric Soul ✦' },
    { time: 13, text: 'Voltage running through my veins' },
    { time: 26, text: 'Power surging through the flames' },
    { time: 39, text: 'Red and amber fill my eyes' },
    { time: 52, text: 'Electric soul begins to rise' },
    { time: 65, text: 'Feel the fire feel the heat' },
    { time: 78, text: 'Every single heartbeat beat' },
    { time: 91, text: 'Electric soul... cannot be tamed' },
    { time: 104, text: 'Burning bright like an open flame' },
    { time: 117, text: 'Sparks are flying through the night' },
    { time: 130, text: 'Nothing can contain this light' },
    { time: 143, text: 'Electric soul... set it free' },
    { time: 156, text: 'This is who I\'m meant to be' },
    { time: 169, text: 'Voltage... voltage... free' },
    { time: 182, text: '✦ ignition ✦' },
  ],
  5: [
    { time: 0, text: '✦ Lunar Tides ✦' },
    { time: 10, text: 'Moon is pulling at the sea' },
    { time: 20, text: 'Ancient rhythms flowing free' },
    { time: 30, text: 'Blue and silver fill the night' },
    { time: 40, text: 'Moonbeams casting silver light' },
    { time: 50, text: 'Lunar tides... in my soul' },
    { time: 60, text: 'Let the ocean make me whole' },
    { time: 70, text: 'Waves are crashing on the shore' },
    { time: 80, text: 'Calling me to something more' },
    { time: 90, text: 'In the depths of midnight blue' },
    { time: 100, text: 'I find something pure and true' },
    { time: 110, text: 'Lunar tides... pull me in' },
    { time: 120, text: 'Let the journey now begin' },
    { time: 130, text: 'Oceanic dreams await' },
    { time: 140, text: 'Carried by the lunar gate' },
    { time: 150, text: '✦ ebb and flow ✦' },
  ],
}

export default function LyricsPanel({
  song,
  progress,
  colors,
  fullscreen = false,
  externalLyrics,
  searching = false,
  isOnlineLyrics = false,
  lyricsSource: lyricsSrc,
  searchError: searchErr,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  const isLocalFile = !!song.fileUrl

  // Determine which lyrics to use: external > demo
  const lyrics = useMemo(() => {
    if (externalLyrics && externalLyrics.length > 0) return externalLyrics
    return DEMO_LYRICS[song.id] || []
  }, [externalLyrics, song.id])

  const currentIdx = useMemo(() => {
    let idx = 0
    for (let i = 0; i < lyrics.length; i++) {
      if (progress >= lyrics[i].time) idx = i
    }
    return idx
  }, [progress, lyrics])

  // Auto-scroll current line to center
  useEffect(() => {
    if (!scrollRef.current || lyrics.length === 0) return
    const container = scrollRef.current
    const lineEl = lineRefs.current[currentIdx]
    if (!lineEl) return
    const containerH = container.clientHeight
    const lineTop = lineEl.offsetTop
    const lineH = lineEl.clientHeight
    const target = lineTop - containerH / 2 + lineH / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [currentIdx, lyrics.length])

  // For local files with no lyrics, show placeholder
  if (isLocalFile && lyrics.length === 0 && !searching) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-10">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <p className="text-white/20 text-sm">{song.title}</p>
        <p className="text-white/10 text-xs">{song.artist}</p>
        {searchErr ? (
          <p className="text-white/10 text-xs mt-2">{searchErr}</p>
        ) : (
          <p className="text-white/10 text-xs mt-2">暂无歌词</p>
        )}
      </div>
    )
  }

  const wrapper = fullscreen
    ? 'flex-1 flex flex-col h-full overflow-hidden'
    : 'flex-1 flex flex-col rounded-2xl overflow-hidden'
  const wrapperStyle = fullscreen
    ? {}
    : {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }

  return (
    <div className={wrapper} style={wrapperStyle}>
      {!fullscreen && (
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase">歌词</h3>
        </div>
      )}

      {/* Online lyrics source indicator */}
      {isOnlineLyrics && externalLyrics && externalLyrics.length > 0 && (
        <div className="shrink-0 px-4 py-1.5 border-b border-white/5 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-white/20">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="text-white/20 text-[10px]">歌词来源于网络</span>
          {lyricsSrc && (
            <span className="text-white/15 text-[10px]">· {lyricsSrc}</span>
          )}
        </div>
      )}

      {/* Lyrics body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth min-h-0"
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding: fullscreen ? '1rem 1.25rem' : '1rem 1.25rem',
          maskImage: fullscreen
            ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
            : undefined,
          WebkitMaskImage: fullscreen
            ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
            : undefined,
        }}
      >
        <div className="flex flex-col gap-3">
          {lyrics.map((line, i) => {
            const isActive = i === currentIdx
            const isPast = i < currentIdx

            return (
              <div
                key={i}
                ref={el => { lineRefs.current[i] = el }}
                className={`text-center transition-all duration-500 select-none ${
                  isActive ? 'lyric-active' : ''
                }`}
                style={{
                  fontSize: fullscreen
                    ? isActive ? '1.35rem' : '1rem'
                    : isActive ? '1.1rem' : '0.9rem',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive
                    ? 'white'
                    : isPast
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.45)',
                  textShadow: isActive
                    ? `0 0 20px ${colors[0]}, 0 0 40px ${colors[1]}`
                    : 'none',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  lineHeight: 1.8,
                  padding: '6px 8px',
                }}
              >
                {line.text}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
