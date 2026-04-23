import { app, BrowserWindow, shell, session, ipcMain, net, WebContentsView, dialog } from 'electron'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import * as settings from './settings.js'

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
  '.otf': 'application/vnd.ms-font-object',
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

      const filePath = join(RENDERER_DIST, safePath)

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

    const dataChunks: Buffer[] = []

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

// ============ Bilibili Player - Embedded WebContentsView ============

let playerView: WebContentsView | null = null

// Show B站 player as an embedded view overlaid on the main window
// bounds are from getBoundingClientRect() — relative to viewport, which maps to contentView coords
ipcMain.handle('show-bilibili-player', (_event, { url, bounds }: { url: string; bounds: { x: number; y: number; width: number; height: number } }) => {
  if (!win) return

  // If player view exists, just update URL and position
  if (playerView) {
    playerView.setBounds({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    })
    playerView.webContents.loadURL(url)
    return
  }

  // Create new WebContentsView for Bilibili player
  playerView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Set desktop User-Agent
  playerView.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  // Set referer for B站 requests
  playerView.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('bilibili.com') || details.url.includes('bilivideo.com') || details.url.includes('hdslb.com')) {
      details.requestHeaders = details.requestHeaders || {}
      if (!details.requestHeaders['Referer']) {
        details.requestHeaders['Referer'] = 'https://www.bilibili.com'
      }
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  // Do NOT add CORS headers for B站 CDN (they already have them; duplicating causes '*, *' error)
  playerView.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith('http')) {
      callback({})
      return
    }
    const responseHeaders = details.responseHeaders || {}
    if (details.url.includes('player.bilibili.com/player.html')) {
      responseHeaders['X-Frame-Options'] = []
      responseHeaders['Content-Security-Policy'] = []
    }
    callback({ responseHeaders })
  })

  // External links → system browser
  playerView.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Debug logging
  playerView.webContents.on('did-finish-load', () => {
    console.log('[Main] Bilibili player view loaded successfully')
  })

  playerView.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.log('[Main] Bilibili player view failed:', errorCode, errorDescription)
  })

  playerView.webContents.on('console-message', (_event, level, message) => {
    console.log('[BilibiliPlayer]', message)
  })

  // Position the view — bounds are relative to the contentView area
  playerView.setBounds({
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
  })

  // Add to main window's contentView — this is the correct API for Electron 35
  win.contentView.addChildView(playerView)

  console.log('[Main] Showing Bilibili player view at bounds:', bounds)
  playerView.webContents.loadURL(url)
})

// Update player position/size
ipcMain.handle('update-bilibili-player-bounds', (_event, bounds: { x: number; y: number; width: number; height: number }) => {
  if (playerView && win) {
    playerView.setBounds({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    })
  }
})

// Hide/remove the player view
ipcMain.handle('hide-bilibili-player', () => {
  if (playerView && win) {
    win.contentView.removeChildView(playerView)
    playerView.webContents.close()
    playerView = null
    console.log('[Main] Bilibili player view removed')
  }
})

// ============ Settings - Persistent Storage ============

// Get all settings
ipcMain.handle('settings-get', () => {
  return settings.loadSettings()
})

// Save settings
ipcMain.handle('settings-save', (_event, newSettings: Record<string, unknown>) => {
  settings.saveSettings(newSettings)
  return true
})

// Get last music path
ipcMain.handle('settings-get-music-path', () => {
  return settings.getLastMusicPath()
})

// Set last music path
ipcMain.handle('settings-set-music-path', (_event, path: string) => {
  settings.setLastMusicPath(path)
  return true
})

// Get last video path
ipcMain.handle('settings-get-video-path', () => {
  return settings.getLastVideoPath()
})

// Set last video path
ipcMain.handle('settings-set-video-path', (_event, path: string) => {
  settings.setLastVideoPath(path)
  return true
})

// Get settings file path (for debugging)
ipcMain.handle('settings-get-file-path', () => {
  return settings.getSettingsFilePathPublic()
})

// ============ Native File System API ============

// Open folder dialog and return path
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory'],
    title: '选择文件夹',
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  return result.filePaths[0]
})

// Read directory recursively using Node.js fs
import * as fs from 'fs'
import * as path from 'path'

interface FileSystemEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemEntry[]
}

const AUDIO_EXTENSIONS = new Set(['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'aiff', 'ape'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'ts', 'rmvb', '3gp'])

function readDirRecursive(dirPath: string, extensions?: Set<string>): FileSystemEntry[] {
  const entries: FileSystemEntry[] = []
  
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      if (item.name.startsWith('.')) continue
      
      const fullPath = path.join(dirPath, item.name)
      
      if (item.isDirectory()) {
        try {
          const children = readDirRecursive(fullPath, extensions)
          // Only include directories that have matching files (recursively)
          const hasFiles = hasMatchingFiles(children)
          if (hasFiles) {
            entries.push({
              name: item.name,
              path: fullPath,
              isDirectory: true,
              children: children
            })
          }
        } catch {
          // Skip directories we can't read
        }
      } else if (item.isFile()) {
        const ext = item.name.split('.').pop()?.toLowerCase()
        if (!extensions || (ext && extensions.has(ext))) {
          entries.push({
            name: item.name,
            path: fullPath,
            isDirectory: false
          })
        }
      }
    }
  } catch (e) {
    console.error('[Main] Error reading directory:', dirPath, e)
  }
  
  // Sort: directories first, then files, both alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })
  
  return entries
}

function hasMatchingFiles(entries: FileSystemEntry[]): boolean {
  for (const entry of entries) {
    if (!entry.isDirectory) return true
    if (entry.children && hasMatchingFiles(entry.children)) return true
  }
  return false
}

// Read music directory
ipcMain.handle('read-directory', (_event, dirPath: string): FileSystemEntry[] | null => {
  try {
    if (!fs.existsSync(dirPath)) {
      console.error('[Main] Directory does not exist:', dirPath)
      return null
    }
    
    const stats = fs.statSync(dirPath)
    if (!stats.isDirectory()) {
      console.error('[Main] Path is not a directory:', dirPath)
      return null
    }
    
    return readDirRecursive(dirPath, AUDIO_EXTENSIONS)
  } catch (e) {
    console.error('[Main] Failed to read directory:', e)
    return null
  }
})

// Read video directory
ipcMain.handle('read-video-directory', (_event, dirPath: string): FileSystemEntry[] | null => {
  try {
    if (!fs.existsSync(dirPath)) {
      return null
    }
    
    const stats = fs.statSync(dirPath)
    if (!stats.isDirectory()) {
      return null
    }
    
    return readDirRecursive(dirPath, VIDEO_EXTENSIONS)
  } catch (e) {
    console.error('[Main] Failed to read video directory:', e)
    return null
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
