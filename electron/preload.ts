import { contextBridge, ipcRenderer } from 'electron'

interface FileSystemEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemEntry[]
}

contextBridge.exposeInMainWorld('electronAPI', {
  fetch: (url: string, options?: { headers?: Record<string, string> }): Promise<{
    ok: boolean
    status: number
    json: () => Promise<unknown>
    text: () => Promise<string>
  }> => {
    return ipcRenderer.invoke('main-fetch', { url, headers: options?.headers })
      .then((result: { ok: boolean; status: number; body: string }) => {
        return {
          ok: result.ok,
          status: result.status,
          json: () => Promise.resolve(JSON.parse(result.body)),
          text: () => Promise.resolve(result.body),
        }
      })
      .catch((err: Error) => {
        throw new Error(err.message || 'Main process fetch failed')
      })
  },
  // Bilibili player - embedded WebContentsView in main window
  showBilibiliPlayer: (url: string, bounds: { x: number; y: number; width: number; height: number }) => {
    return ipcRenderer.invoke('show-bilibili-player', { url, bounds })
  },
  updateBilibiliPlayerBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
    return ipcRenderer.invoke('update-bilibili-player-bounds', bounds)
  },
  hideBilibiliPlayer: () => {
    return ipcRenderer.invoke('hide-bilibili-player')
  },
  // Settings - Persistent storage
  getSettings: (): Promise<Record<string, unknown>> => {
    return ipcRenderer.invoke('settings-get')
  },
  saveSettings: (newSettings: Record<string, unknown>): Promise<boolean> => {
    return ipcRenderer.invoke('settings-save', newSettings)
  },
  getLastMusicPath: (): Promise<string | null> => {
    return ipcRenderer.invoke('settings-get-music-path')
  },
  setLastMusicPath: (path: string): Promise<boolean> => {
    return ipcRenderer.invoke('settings-set-music-path', path)
  },
  getLastVideoPath: (): Promise<string | null> => {
    return ipcRenderer.invoke('settings-get-video-path')
  },
  setLastVideoPath: (path: string): Promise<boolean> => {
    return ipcRenderer.invoke('settings-set-video-path', path)
  },
  getSettingsFilePath: (): Promise<string> => {
    return ipcRenderer.invoke('settings-get-file-path')
  },
  // Native File System API
  openFolderDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke('open-folder-dialog')
  },
  readDirectory: (dirPath: string): Promise<FileSystemEntry[] | null> => {
    return ipcRenderer.invoke('read-directory', dirPath)
  },
  readVideoDirectory: (dirPath: string): Promise<FileSystemEntry[] | null> => {
    return ipcRenderer.invoke('read-video-directory', dirPath)
  },
})
