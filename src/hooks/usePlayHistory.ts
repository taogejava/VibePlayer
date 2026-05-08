import { useState, useEffect, useCallback, useRef } from 'react'

export interface HistoryItem {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  timestamp: number
  color: string[]
  cover?: string
  // Local file info
  fileUrl?: string
  filePath?: string
  // Online info
  isOnline?: boolean
  // Video info
  isVideo?: boolean
  videoPath?: string
  // Accumulated play time in seconds
  playedDuration?: number
}

const STORAGE_KEY = 'vibeplayer:playHistory'
const MAX_ITEMS = 100

export function usePlayHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const currentSongKeyRef = useRef<string | null>(null)
  const lastRecordTimeRef = useRef<number>(Date.now())

  // Load history from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('[PlayHistory] Failed to load history:', e)
    }
  }, [])

  // Save history to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (e) {
      console.warn('[PlayHistory] Failed to save history:', e)
    }
  }, [history])

  // Record play duration for currently playing song (call this every second while playing)
  const recordPlayTime = useCallback((songKey: string) => {
    if (songKey !== currentSongKeyRef.current) {
      // Song changed — update ref and reset timer
      currentSongKeyRef.current = songKey
      lastRecordTimeRef.current = Date.now()
      return
    }
    const now = Date.now()
    const elapsedSec = (now - lastRecordTimeRef.current) / 1000
    if (elapsedSec < 2) return // only record every ~2 seconds to reduce writes
    lastRecordTimeRef.current = now

    setHistory(prev => prev.map(h => {
      if (`${h.title}|${h.artist}` === songKey) {
        return { ...h, playedDuration: (h.playedDuration || 0) + elapsedSec }
      }
      return h
    }))
  }, [])

  // Add item to history
  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setHistory(prev => {
      // Remove existing item with same title + artist
      const filtered = prev.filter(h =>
        !(h.title === item.title && h.artist === item.artist)
      )

      const newItem: HistoryItem = {
        ...item,
        playedDuration: 0,
        id: Date.now().toString(),
        timestamp: Date.now()
      }

      // Add to front and trim
      const newHistory = [newItem, ...filtered].slice(0, MAX_ITEMS)
      return newHistory
    })
  }, [])

  // Remove item
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    recordPlayTime
  }
}