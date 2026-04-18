import { app, BrowserWindow, shell, session, ipcMain, net } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─ dist
// │ ├─┬─ electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │ ├─┬─ dist (Vite output)
// │ │ └── index.html
// │ └─ package.json
process.env.APP_ROOT = join(__dirname, '..')

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = join(__dirname, '../dist')

const VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? join(__dirname, '../public')
  : RENDERER_DIST

// IPC handler: main process HTTP fetch (bypasses CORS in renderer)
ipcMain.handle('main-fetch', (_event, { url, headers }: { url: string; headers?: Record<string, string> }) => {
  return new Promise<{ ok: boolean; status: number; body: string }>((resolve, reject) => {
    const request = net.request({ url, method: 'GET' })

    // Set custom headers
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        request.setHeader(key, value)
      }
    }

    // Default headers
    if (!headers?.['User-Agent']) {
      request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    }
    if (!headers?.['Referer'] && url.includes('bilibili.com')) {
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
          body,
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
})

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: join(VITE_PUBLIC, 'icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      // Security: enable context isolation
      contextIsolation: true,
      nodeIntegration: false,
      // Enable File System Access API (Chromium feature, works out of the box in Electron)
      sandbox: false,
    },
    title: 'VibePlayer',
    // Show a simple frame with title bar
    titleBarStyle: 'default',
    backgroundColor: '#080812',
    show: false, // Show when ready to prevent white flash
  })

  // Allow B站 player iframe to load properly
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // Set Referer for B站 player requests so the player doesn't refuse to load
    if (details.url.includes('player.bilibili.com') || details.url.includes('bilivideo.com') || details.url.includes('bilibili.com')) {
      details.requestHeaders = details.requestHeaders || {}
      if (!details.requestHeaders['Referer']) {
        details.requestHeaders['Referer'] = 'https://www.bilibili.com'
      }
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Bypass CORS for WebDAV/AList requests
  // WebDAV servers typically don't set CORS headers, so we inject them here
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Only modify external http(s) requests, not local file://
    if (!details.url.startsWith('http')) {
      callback({})
      return
    }
    const responseHeaders = details.responseHeaders || {}
    responseHeaders['Access-Control-Allow-Origin'] = ['*']
    responseHeaders['Access-Control-Allow-Methods'] = ['GET, PUT, POST, DELETE, PROPFIND, OPTIONS, MKCOL, HEAD']
    responseHeaders['Access-Control-Allow-Headers'] = ['*']
    callback({ responseHeaders })
  })

  // Show window when ready to prevent white flash on startup
  win.on('ready-to-show', () => {
    win?.show()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open DevTools in development
    // win.webContents.openDevTools()
  } else {
    win.loadFile(join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
