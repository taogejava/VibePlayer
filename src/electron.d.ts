interface ElectronFetchResponse {
  ok: boolean
  status: number
  json: () => Promise<any>
  text: () => Promise<string>
}

interface FileSystemEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemEntry[]
}

interface ElectronAPI {
  fetch: (
    url: string,
    options?: { headers?: Record<string, string> }
  ) => Promise<ElectronFetchResponse>
  showBilibiliPlayer: (url: string, bounds: { x: number; y: number; width: number; height: number }) => Promise<void>
  updateBilibiliPlayerBounds: (bounds: { x: number; y: number; width: number; height: number }) => Promise<void>
  hideBilibiliPlayer: () => Promise<void>
  // Settings - Persistent storage
  getSettings: () => Promise<any>
  saveSettings: (newSettings: Record<string, any>) => Promise<boolean>
  getLastMusicPath: () => Promise<string | null>
  setLastMusicPath: (path: string) => Promise<boolean>
  getLastVideoPath: () => Promise<string | null>
  setLastVideoPath: (path: string) => Promise<boolean>
  getSettingsFilePath: () => Promise<string>
  // Native File System API
  openFolderDialog: () => Promise<string | null>
  readDirectory: (dirPath: string) => Promise<FileSystemEntry[] | null>
  readVideoDirectory: (dirPath: string) => Promise<FileSystemEntry[] | null>
}

interface Window {
  electronAPI?: ElectronAPI
}
