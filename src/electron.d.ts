interface ElectronFetchResponse {
  ok: boolean
  status: number
  json: () => Promise<any>
  text: () => Promise<string>
}

interface ElectronAPI {
  fetch: (
    url: string,
    options?: { headers?: Record<string, string> }
  ) => Promise<ElectronFetchResponse>
  showBilibiliPlayer: (url: string, bounds: { x: number; y: number; width: number; height: number }) => Promise<void>
  updateBilibiliPlayerBounds: (bounds: { x: number; y: number; width: number; height: number }) => Promise<void>
  hideBilibiliPlayer: () => Promise<void>
}

interface Window {
  electronAPI?: ElectronAPI
}
