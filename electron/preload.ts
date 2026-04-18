import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  fetch: (url: string, options?: { headers?: Record<string, string> }): Promise<{
    ok: boolean
    status: number
    json: () => Promise<any>
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
      .catch((err: any) => {
        throw new Error(err.message || 'Main process fetch failed')
      })
  },
})
