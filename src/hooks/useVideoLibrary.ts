import { useState, useCallback, useRef } from 'react'

export const VIDEO_EXTENSIONS = new Set([
  'mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'ts', 'rmvb', '3gp'
])

export interface VideoFileNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  children?: VideoFileNode[]
  fileHandle?: File
  url?: string
  duration?: number
  expanded?: boolean
}

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isVideo(name: string) {
  return VIDEO_EXTENSIONS.has(getExt(name))
}

let idCounter = 10000
function nextId() { return String(++idCounter) }

// ── LocalStorage Fallback (works in both Electron and browser) ──
const LS_VIDEO_PATH_KEY = 'vibeplayer-last-video-path'

function saveToLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
    console.log(`[useVideoLibrary] Saved to localStorage: ${key} = ${value}`)
  } catch (e) {
    console.error('[useVideoLibrary] Failed to save to localStorage:', e)
  }
}

function loadFromLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (e) {
    console.error('[useVideoLibrary] Failed to load from localStorage:', e)
    return null
  }
}

// ── Electron native filesystem (using IPC to main process) ──
async function openFolderNative(): Promise<string | null> {
  try {
    if (window.electronAPI?.openFolderDialog) {
      return await window.electronAPI.openFolderDialog()
    }
  } catch (e) {
    console.error('[useVideoLibrary] Failed to open folder dialog:', e)
  }
  return null
}

// ── Read directory using Node.js fs via IPC ──
async function readDirectoryNative(dirPath: string): Promise<any[]> {
  try {
    if (window.electronAPI?.readVideoDirectory) {
      const result = await window.electronAPI.readVideoDirectory(dirPath)
      if (result && Array.isArray(result)) {
        return result.map((item: any, idx: number) => ({
          id: `native-video-${idx}-${item.name}`,
          name: item.name,
          type: item.isDirectory ? 'directory' : 'file',
          path: item.path,
          children: item.children || undefined,
        }))
      }
    }
  } catch (e) {
    console.error('[useVideoLibrary] Failed to read directory:', e)
  }
  return []
}

// ── Save path using both Electron IPC and localStorage ──
async function saveVideoPath(path: string): Promise<void> {
  try {
    if (window.electronAPI?.setLastVideoPath) {
      await window.electronAPI.setLastVideoPath(path)
      console.log('[useVideoLibrary] Saved via IPC:', path)
    }
  } catch (e) {
    console.error('[useVideoLibrary] IPC save failed:', e)
  }
  saveToLocalStorage(LS_VIDEO_PATH_KEY, path)
}

// ── Fallback: File System Access API with IndexedDB ──
const DB_NAME = 'vibeplayer-fs'
const DB_VERSION = 1
const STORE_NAME = 'handles'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, 'lastVideoDir')
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const handle = await tx.objectStore(STORE_NAME).get('lastVideoDir') as unknown as FileSystemDirectoryHandle | undefined
    if (handle) {
      const perm = await (handle as any).queryPermission({ mode: 'read' })
      if (perm === 'granted') return handle
      const req = await (handle as any).requestPermission({ mode: 'read' })
      if (req === 'granted') return handle
    }
  } catch { /* ignore */ }
  return null
}

async function readDirectoryFSA(dirHandle: FileSystemDirectoryHandle, parentPath: string): Promise<VideoFileNode[]> {
  const nodes: VideoFileNode[] = []
  for await (const [name, handle] of dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (name.startsWith('.')) continue
    const path = parentPath ? `${parentPath}/${name}` : name
    if (handle.kind === 'directory') {
      const children = await readDirectoryFSA(handle as FileSystemDirectoryHandle, path)
      if (children.length > 0) {
        nodes.push({ id: nextId(), name, type: 'directory', path, children, expanded: false })
      }
    } else if (handle.kind === 'file' && isVideo(name)) {
      const file = await (handle as FileSystemFileHandle).getFile()
      nodes.push({ id: nextId(), name, type: 'file', path, fileHandle: file, duration: 0 })
    }
  }
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })
  return nodes
}

export function useVideoLibrary() {
  const [tree, setTree] = useState<VideoFileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [rootName, setRootName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const restoredRef = useRef(false)

  // Open folder - prefer native Electron dialog, fallback to FSA
  const openFolder = useCallback(async () => {
    setError('')
    let dirPath: string | null = null
    let nodes: VideoFileNode[] = []

    // Try native Electron dialog first
    dirPath = await openFolderNative()

    if (dirPath) {
      // Native mode: save path and read directory
      setLoading(true)
      try {
        await saveVideoPath(dirPath)
        setRootName(dirPath.split('/').pop() || dirPath.split('\\').pop() || dirPath)
        nodes = await readDirectoryNative(dirPath)
        setTree(nodes)
      } catch (e) {
        console.error('[useVideoLibrary] Native read failed, trying FSA:', e)
        // Fallback to FSA
        try {
          // @ts-ignore – File System Access API
          const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'read' })
          setRootName(dirHandle.name)
          saveDirHandle(dirHandle)
          nodes = await readDirectoryFSA(dirHandle, '')
          setTree(nodes)
        } catch (e2) {
          setError('无法读取文件夹，请确认权限。')
        }
      }
    } else {
      // Fallback to File System Access API
      try {
        // @ts-ignore – File System Access API
        const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'read' })
        setLoading(true)
        setRootName(dirHandle.name)
        saveDirHandle(dirHandle)
        nodes = await readDirectoryFSA(dirHandle, '')
        setTree(nodes)
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('无法打开文件夹选择器。')
        }
      }
    }

    setLoading(false)
  }, [])

  // Restore last folder on mount
  const restoreLastFolder = useCallback(async () => {
    if (restoredRef.current) return
    restoredRef.current = true

    // Strategy 1: Try localStorage first (most reliable)
    const localPath = loadFromLocalStorage(LS_VIDEO_PATH_KEY)
    if (localPath) {
      console.log('[useVideoLibrary] Restoring from localStorage:', localPath)
      try {
        setLoading(true)
        setRootName(localPath.split('/').pop() || localPath.split('\\').pop() || localPath)
        const nodes = await readDirectoryNative(localPath)
        if (nodes.length > 0) {
          setTree(nodes)
          try {
            if (window.electronAPI?.setLastVideoPath) {
              await window.electronAPI.setLastVideoPath(localPath)
            }
          } catch (e) { /* ignore */ }
          return
        }
      } catch (e) {
        console.error('[useVideoLibrary] LocalStorage restore failed, trying IPC:', e)
      }
    }

    // Strategy 2: Try Electron IPC settings
    let savedPath: string | null = null
    try {
      if (window.electronAPI?.getLastVideoPath) {
        savedPath = await window.electronAPI.getLastVideoPath()
      }
    } catch (e) {
      console.error('[useVideoLibrary] Failed to get last video path from IPC:', e)
    }

    if (savedPath && savedPath !== localPath) {
      console.log('[useVideoLibrary] Restoring from IPC settings:', savedPath)
      try {
        setLoading(true)
        setRootName(savedPath.split('/').pop() || savedPath.split('\\').pop() || savedPath)
        const nodes = await readDirectoryNative(savedPath)
        if (nodes.length > 0) {
          setTree(nodes)
          saveToLocalStorage(LS_VIDEO_PATH_KEY, savedPath)
          return
        }
      } catch (e) {
        console.error('[useVideoLibrary] IPC restore failed, trying FSA:', e)
      }
    }

    // Strategy 3: Fallback to IndexedDB + FSA
    const dirHandle = await loadDirHandle()
    if (!dirHandle) return

    try {
      setLoading(true)
      setRootName(dirHandle.name)
      const nodes = await readDirectoryFSA(dirHandle, '')
      setTree(nodes)
    } catch {
      // permission expired or folder moved, ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setTree(prev => toggleNode(prev, id))
  }, [])

  return { tree, setTree, loading, rootName, error, openFolder, toggleExpand, restoreLastFolder }
}

function toggleNode(nodes: VideoFileNode[], id: string): VideoFileNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, expanded: !n.expanded }
    if (n.children) return { ...n, children: toggleNode(n.children, id) }
    return n
  })
}
