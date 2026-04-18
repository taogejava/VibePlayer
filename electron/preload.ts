import { contextBridge, ipcRenderer, net } from 'electron'

// Expose a safe HTTP fetch API through the main process
// This bypasses CORS restrictions in the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  fetch: (url: string, options?: { headers?: Record<string, string> }): Promise<{
    ok: boolean
    status: number
    json: () => Promise<any>
    text: () => Promise<string>
  }> => {
    return new Promise((resolve, reject) => {
      const request = net.request({
        url,
        method: options?.headers ? 'GET' : 'GET',
      })

      // Set headers
      if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          request.setHeader(key, value)
        }
      }

      // Default headers
      if (!options?.headers?.['User-Agent']) {
        request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      }
      if (!options?.headers?.['Referer'] && url.includes('bilibili.com')) {
        request.setHeader('Referer', 'https://www.bilibili.com')
      }

      let dataChunks: Buffer[] = []

      request.on('response', (response) => {
        response.on('data', (chunk: Buffer) => {
          dataChunks.push(chunk)
        })

        response.on('end', () => {
          const body = Buffer.concat(dataChunks).toString('utf-8')
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            json: () => Promise.resolve(JSON.parse(body)),
            text: () => Promise.resolve(body),
          })
        })

        response.on('error', (err: Error) => {
          reject(new Error(err.message))
        })
      })

      request.on('error', (err: Error) => {
        reject(new Error(err.message))
      })

      request.end()
    })
  },
})

console.log('VibePlayer preload script loaded')
