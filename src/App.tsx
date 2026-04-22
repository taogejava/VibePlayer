import { useState } from 'react'
import HomePage from './sections/HomePage'
import MusicPlayer from './sections/MusicPlayer'
import { ThemeProvider } from './ThemeContext'
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

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [initialPanel, setInitialPanel] = useState<string | null>(null)

  const handleNavigateToFeature = (key: FeatureKey) => {
    setInitialPanel(featureToPanel[key])
    setPage(key)
  }

  const handleBackToHome = () => {
    setPage('home')
    setInitialPanel(null)
  }

  return (
    <ThemeProvider>
      <div className="w-screen h-screen overflow-hidden">
        {page === 'home' ? (
          <HomePage onNavigate={handleNavigateToFeature} />
        ) : (
          <MusicPlayer initialPanel={initialPanel} onBackToHome={handleBackToHome} />
        )}
      </div>
    </ThemeProvider>
  )
}
