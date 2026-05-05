import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { FeatureKey } from './sections/HomePage'

interface PlayerState {
  isPlaying: boolean
  isVideoPlaying: boolean
  currentFeature: FeatureKey | null
}

interface PlayerContextType {
  state: PlayerState
  updateState: (newState: Partial<PlayerState>) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isVideoPlaying: false,
    currentFeature: null
  })

  const updateState = (newState: Partial<PlayerState>) => {
    setState(prev => ({ ...prev, ...newState }))
  }

  return (
    <PlayerContext.Provider value={{ state, updateState }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within PlayerProvider')
  return context
}
