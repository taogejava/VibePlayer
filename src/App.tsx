import { useState } from 'react'
import HomePage from './sections/HomePage'
import MusicPlayer from './sections/MusicPlayer'
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

  if (page === 'home') {
    return (
      <div className="w-screen h-screen overflow-hidden">
        <HomePage onNavigate={handleNavigateToFeature} />
      </div>
    )
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <MusicPlayer initialPanel={initialPanel} onBackToHome={handleBackToHome} />
    </div>
  )
}
