import { useState } from 'react'
import HomePage from './sections/HomePage'
import MusicPlayer from './sections/MusicPlayer'
import { ThemeProvider } from './ThemeContext'
import { AnimationProvider } from './AnimationContext'
import { PlayerProvider, usePlayer } from './PlayerContext'
import type { FeatureKey } from './sections/HomePage'

type Page = 'home' | FeatureKey

// Map feature keys to MusicPlayer panel keys
const featureToPanel: Record<FeatureKey, string> = {
  music: 'library',
  video: 'video',
  bilibili: 'bilibili',
  url: 'url',
  webdav: 'webdav',
  alist: 'alist',
  online: 'online',
}

function AppContent() {
  const [page, setPage] = useState<Page>('home')
  const [initialPanel, setInitialPanel] = useState<string | null>(null)
  const [isPlayerVisible, setIsPlayerVisible] = useState(false)
  const { updateState } = usePlayer()

  const handleNavigateToFeature = (key: FeatureKey) => {
    setInitialPanel(featureToPanel[key])
    setPage(key)
    setIsPlayerVisible(true)
    updateState({ currentFeature: key })
  }

  const handleBackToHome = () => {
    setPage('home')
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <HomePage onNavigate={handleNavigateToFeature} />
      {isPlayerVisible && (
        <div 
          className="absolute inset-0 z-50"
          style={{ 
            display: page === 'home' ? 'none' : 'block',
            visibility: page === 'home' ? 'hidden' : 'visible'
          }}
        >
          <MusicPlayer initialPanel={initialPanel} onBackToHome={handleBackToHome} />
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AnimationProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AnimationProvider>
    </ThemeProvider>
  )
}
