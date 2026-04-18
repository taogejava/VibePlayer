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
}

interface Window {
  electronAPI?: ElectronAPI
}
