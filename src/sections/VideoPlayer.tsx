import { useRef, useEffect, useState, useCallback } from 'react'

interface Props {
  src: string
  title?: string
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onPlayStateChange?: (playing: boolean) => void
  onError?: (msg: string) => void
}

export default function VideoPlayer({
  src,
  title,
  onEnded,
  onTimeUpdate,
  onPlayStateChange,
  onError,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    video.src = src
    video.load()
    setDuration(0)
    setCurrentTime(0)
    setIsPlaying(false)
  }, [src])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
    setDuration(video.duration || 0)
    onTimeUpdate?.(video.currentTime, video.duration)
  }, [onTimeUpdate])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    onPlayStateChange?.(true)
    resetHideTimer()
  }, [onPlayStateChange, resetHideTimer])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    onPlayStateChange?.(false)
    setShowControls(true)
  }, [onPlayStateChange])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    onPlayStateChange?.(false)
    setShowControls(true)
    onEnded?.()
  }, [onEnded, onPlayStateChange])

  const handleError = useCallback(() => {
    onError?.('视频加载失败，请检查文件格式或网络连接')
  }, [onError])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (videoRef.current && duration) {
      videoRef.current.currentTime = pct * duration
    }
  }, [duration])

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const vol = Math.round(pct * 100)
    setVolume(vol)
    if (videoRef.current) videoRef.current.volume = vol / 100
    setIsMuted(vol === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    }
  }, [])

  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const idx = rates.indexOf(playbackRate)
    const next = rates[(idx + 1) % rates.length]
    setPlaybackRate(next)
    if (videoRef.current) videoRef.current.playbackRate = next
  }, [playbackRate])

  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
    }
  }, [duration])

  function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-xl overflow-hidden group"
      style={{ cursor: showControls ? 'default' : 'none' }}
      onMouseMove={resetHideTimer}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName === 'VIDEO') togglePlay()
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        playsInline
        preload="metadata"
      />

      {/* Title overlay */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      )}

      {/* Center play button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          className="h-1 hover:h-1.5 transition-all cursor-pointer group/progress"
          onClick={handleSeek}
        >
          <div className="relative h-full bg-white/20">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 transition-[width] duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors shrink-0">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Skip buttons */}
          <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors shrink-0" title="后退10秒">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12.5 3C7.81 3 4.01 6.54 3.56 11H1l4 4 4-4H6.57c.45-3.27 3.14-5.78 6.45-5.02 2.65.61 4.37 3.12 4.37 5.84 0 3.31-2.69 6-6 6-1.66 0-3.14-.69-4.22-1.78L5.16 18.7C6.72 20.26 8.97 21 11.12 21c4.55 0 8.26-3.69 8.26-8.24 0-4.78-3.8-9.76-8.88-9.76z"/>
            </svg>
          </button>
          <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors shrink-0" title="快进10秒">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M11.5 3c4.69 0 8.49 3.54 8.94 8H23l-4 4-4-4h2.56c-.45-3.27-3.14-5.78-6.45-5.02-2.65.61-4.37 3.12-4.37 5.84 0 3.31 2.69 6 6 6 1.66 0 3.14-.69 4.22-1.78l1.42 1.42C17.28 20.26 15.03 21 12.88 21c-4.55 0-8.26-3.69-8.26-8.24 0-4.78 3.8-9.76 8.88-9.76z"/>
            </svg>
          </button>

          {/* Time */}
          <span className="text-white/70 text-xs font-mono shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Playback rate */}
          <button
            onClick={cyclePlaybackRate}
            className="text-white/60 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-white/10 transition-all shrink-0"
            title="播放速度"
          >
            {playbackRate}x
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>
            <div
              className="relative w-16 h-1 rounded-full bg-white/20 cursor-pointer group/vol"
              onClick={handleVolumeChange}
            >
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-white"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
            </div>
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors shrink-0">
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
