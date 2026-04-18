import { app, BrowserWindow, shell, session, ipcMain, net } from 'electron'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { readFile } from 'fs/promises'

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

// MIME types for local HTTP server
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

// Start a local HTTP server to serve the built files (avoids file:// origin issues)
function startLocalServer(port: number): Promise<string> {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const urlPath = req.url?.split('?')[0] || '/'
      const decodedPath = decodeURIComponent(urlPath)
      const safePath = decodedPath.replace(/\.\./g, '').replace(/\/+/g, '/')

      let filePath = join(RENDERER_DIST, safePath)

      try {
        let content = await readFile(filePath)
        let contentType = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'

        if (!safePath.includes('.') || contentType === 'application/octet-stream') {
          try {
            content = await readFile(join(RENDERER_DIST, 'index.html'))
            contentType = 'text/html'
          } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('Not Found')
            return
          }
        }

        res.writeHead(200, { 'Content-Type': contentType })
        res.end(content)
      } catch {
        try {
          const indexContent = await readFile(join(RENDERER_DIST, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(indexContent)
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not Found')
        }
      }
    })

    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${port}`
      console.log(`[Main] Local server started at ${url}`)
      resolve(url)
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Main] Port ${port} in use, trying ${port + 1}`)
        resolve(startLocalServer(port + 1))
      } else {
        console.error('[Main] Server error:', err)
        resolve('')
      }
    })
  })
}

// IPC handler: main process HTTP fetch (bypasses CORS in renderer)
ipcMain.handle('main-fetch', (_event, { url, headers }: { url: string; headers?: Record<string, string> }) => {
  return new Promise<{ ok: boolean; status: number; body: string }>((resolve, reject) => {
    const request = net.request({ url, method: 'GET' })

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        request.setHeader(key, value)
      }
    }

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
        resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode, body })
      })
      response.on('error', (err: Error) => reject(new Error(err.message)))
    })
    request.on('error', (err: Error) => reject(new Error(err.message)))
    request.end()
  })
})

// ============ Bilibili Player Window Management ============

let playerWindow: BrowserWindow | null = null

// Open B站 player in a separate dedicated window
ipcMain.handle('open-bilibili-player', (_event, { url, title }: { url: string; title?: string }) => {
  if (!win) return

  // Focus existing player window if it exists
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.loadURL(url)
    playerWindow.focus()
    return
  }

  // Get main window position to center player relative to it
  const mainWindowBounds = win.getBounds()
  const playerWidth = 800
  const playerHeight = Math.round(playerWidth * 9 / 16) + 60 // 16:9 + some padding

  playerWindow = new BrowserWindow({
    width: playerWidth,
    height: playerHeight,
    x: Math.round(mainWindowBounds.x + (mainWindowBounds.width - playerWidth) / 2),
    y: Math.round(mainWindowBounds.y + (mainWindowBounds.height - playerHeight) / 2),
    title: title ? `${title} - Bilibili` : 'Bilibili Player',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  // Set a desktop User-Agent so B站 doesn't redirect to mobile player
  playerWindow.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  // Set referer for all B站 requests (only)
  playerWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('bilibili.com') || details.url.includes('bilivideo.com') || details.url.includes('hdslb.com')) {
      details.requestHeaders = details.requestHeaders || {}
      if (!details.requestHeaders['Referer']) {
        details.requestHeaders['Referer'] = 'https://www.bilibili.com'
      }
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  // For B站 player window: do NOT add CORS headers — the CDN already returns them.
  // Adding them again causes duplicate '*, *' which browsers reject.
  // Only strip X-Frame-Options and CSP for the player page itself.
  playerWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith('http')) {
      callback({})
      return
    }
    const responseHeaders = details.responseHeaders || {}
    // Only modify B站 player.html page headers, NOT CDN resources
    if (details.url.includes('player.bilibili.com/player.html')) {
      responseHeaders['X-Frame-Options'] = []
      responseHeaders['Content-Security-Policy'] = []
    }
    callback({ responseHeaders })
  })

  // Open external links in system browser
  playerWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Debug
  playerWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Bilibili player window loaded successfully')
  })

  playerWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.log('[Main] Bilibili player window failed:', errorCode, errorDescription)
  })

  playerWindow.webContents.on('render-process-gone', (_event, details) => {
    console.log('[Main] Bilibili player render process gone:', details.reason)
  })

  playerWindow.webContents.on('console-message', (_event, level, message) => {
    console.log('[BilibiliPlayer]', message)
  })

  playerWindow.webContents.on('did-navigate', (_event, url) => {
    console.log('[Main] Bilibili player navigated to:', url.substring(0, 120))
  })

  // Log network errors for player window
  playerWindow.webContents.session.webRequest.onErrorOccurred((details) => {
    if (details.url.includes('bilibili.com') || details.url.includes('bilivideo.com') || details.url.includes('hdslb.com')) {
      console.log('[Main] Player request FAILED:', details.error, details.url.substring(0, 120))
    }
  })

  // Clean up when player window closes
  playerWindow.on('closed', () => {
    playerWindow = null
  })

  console.log('[Main] Opening Bilibili player window:', url.substring(0, 120))
  playerWindow.loadURL(url)
})

// Close the player window
ipcMain.handle('close-bilibili-player', () => {
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.close()
    playerWindow = null
  }
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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'VibePlayer',
    titleBarStyle: 'default',
    backgroundColor: '#080812',
    show: false,
  })

  // Allow B站 player iframe to load properly
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('player.bilibili.com') || details.url.includes('bilivideo.com') || details.url.includes('bilibili.com')) {
      details.requestHeaders = details.requestHeaders || {}
      if (!details.requestHeaders['Referer']) {
        details.requestHeaders['Referer'] = 'https://www.bilibili.com'
      }
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  session.defaultSession.webRequest.onErrorOccurred((details) => {
    if (details.url.includes('bilibili.com') || details.url.includes('bilivideo.com')) {
      console.log('[Main] B站 request FAILED:', details.error, details.url.substring(0, 120))
    }
  })

  session.defaultSession.webRequest.onCompleted((details) => {
    if (details.url.includes('player.bilibili.com/player.html')) {
      console.log('[Main] B站 player.html response:', details.statusCode, details.url.substring(0, 120))
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.webContents.on('console-message', (_event, level, message) => {
    if (message.includes('[Bilibili]')) {
      console.log('[Renderer]', message)
    }
  })

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith('http')) {
      callback({})
      return
    }
    const responseHeaders = details.responseHeaders || {}
    // B站 CDN already returns CORS headers; don't duplicate them
    const isBilibiliCdn = details.url.includes('bilibili.com') || details.url.includes('bilivideo.com') || details.url.includes('hdslb.com')
    if (!isBilibiliCdn) {
      responseHeaders['Access-Control-Allow-Origin'] = ['*']
      responseHeaders['Access-Control-Allow-Methods'] = ['GET, PUT, POST, DELETE, PROPFIND, OPTIONS, MKCOL, HEAD']
      responseHeaders['Access-Control-Allow-Headers'] = ['*']
    }
    // Strip X-Frame-Options and CSP for B站 player page
    if (details.url.includes('player.bilibili.com/player.html')) {
      responseHeaders['X-Frame-Options'] = []
      responseHeaders['Content-Security-Policy'] = []
    }
    callback({ responseHeaders })
  })

  win.on('ready-to-show', () => {
    win?.show()
  })

  // Set desktop User-Agent for main window too
  win.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    startLocalServer(18765).then((url) => {
      if (url) {
        win?.loadURL(url)
      } else {
        console.error('[Main] Failed to start local server, falling back to loadFile')
        win?.loadFile(join(RENDERER_DIST, 'index.html'))
      }
    })
  }
}

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
