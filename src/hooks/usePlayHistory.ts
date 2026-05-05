import { useState, useEffect, useCallback } from 'react'

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
}

const STORAGE_KEY = 'vibeplayer:playHistory'
const MAX_ITEMS = 100

export function usePlayHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])

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

  // Add item to history
  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setHistory(prev => {
      // Remove existing item with same title + artist
      const filtered = prev.filter(h => 
        !(h.title === item.title && h.artist === item.artist)
      )
      
      const newItem: HistoryItem = {
        ...item,
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
    clearHistory
  }
}