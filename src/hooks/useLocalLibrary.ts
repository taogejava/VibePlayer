import { useState, useCallback } from 'react'

export const AUDIO_EXTENSIONS = new Set([
  'mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'aiff', 'ape'
])

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileNode[]
  fileHandle?: File
  url?: string
  duration?: number
  expanded?: boolean
}

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isAudio(name: string) {
  return AUDIO_EXTENSIONS.has(getExt(name))
}

let idCounter = 0
function nextId() { return String(++idCounter) }

// ── LocalStorage Fallback (works in both Electron and browser) ──
const LS_MUSIC_PATH_KEY = 'vibeplayer-last-music-path'

function saveToLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
    console.log(`[useLocalLibrary] Saved to localStorage: ${key} = ${value}`)
  } catch (e) {
    console.error('[useLocalLibrary] Failed to save to localStorage:', e)
  }
}

// ── Electron native filesystem (using IPC to main process) ──
async function openFolderNative(): Promise<string | null> {
  try {
    if (window.electronAPI?.openFolderDialog) {
      return await window.electronAPI.openFolderDialog()
    }
  } catch (e) {
    console.error('[useLocalLibrary] Failed to open folder dialog:', e)
  }
  return null
}

function assignIds(nodes: any[]): any[] {
  let counter = 0
  function walk(items: any[]): any[] {
    return items.map((item: any) => {
      const node: any = {
        id: `native-${counter++}-${item.name}`,
        name: item.name,
        type: item.isDirectory ? 'directory' : 'file',
        path: item.path,
      }
      if (item.children && item.children.length > 0) {
        node.children = walk(item.children)
      }
      return node
    })
  }
  return walk(nodes)
}

// ── Read directory using Node.js fs via IPC ──
async function readDirectoryNative(dirPath: string): Promise<any[]> {
  try {
    if (window.electronAPI?.readDirectory) {
      const result = await window.electronAPI.readDirectory(dirPath)
      if (result && Array.isArray(result)) {
        return assignIds(result)
      }
    }
  } catch (e) {
    console.error('[useLocalLibrary] Failed to read directory:', e)
  }
  return []
}

// ── Save path using both Electron IPC and localStorage ──
async function saveMusicPath(path: string): Promise<void> {
  // Save via Electron IPC (persistent on disk)
  try {
    if (window.electronAPI?.setLastMusicPath) {
      await window.electronAPI.setLastMusicPath(path)
      console.log('[useLocalLibrary] Saved via IPC:', path)
    }
  } catch (e) {
    console.error('[useLocalLibrary] IPC save failed:', e)
  }
  // Also save to localStorage as fallback
  saveToLocalStorage(LS_MUSIC_PATH_KEY, path)
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
    tx.objectStore(STORE_NAME).put(handle, 'lastMusicDir')
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

async function readDirectoryFSA(dirHandle: FileSystemDirectoryHandle, parentPath: string): Promise<FileNode[]> {
  const nodes: FileNode[] = []
  for await (const [name, handle] of dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (name.startsWith('.')) continue
    const path = parentPath ? `${parentPath}/${name}` : name
    if (handle.kind === 'directory') {
      const children = await readDirectoryFSA(handle as FileSystemDirectoryHandle, path)
      if (children.length > 0) {
        nodes.push({ id: nextId(), name, type: 'directory', path, children, expanded: false })
      }
    } else if (handle.kind === 'file' && isAudio(name)) {
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

export function useLocalLibrary() {
  const [tree, setTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [rootName, setRootName] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Open folder - prefer native Electron dialog, fallback to FSA
  const openFolder = useCallback(async () => {
    setError('')
    let dirPath: string | null = null
    let nodes: FileNode[] = []

    // Try native Electron dialog first
    dirPath = await openFolderNative()

    if (dirPath) {
      // Native mode: save path and read directory
      setLoading(true)
      try {
        await saveMusicPath(dirPath)
        setRootName(dirPath.split('/').pop() || dirPath.split('\\').pop() || dirPath)
        nodes = await readDirectoryNative(dirPath)
        setTree(nodes)
      } catch (e) {
        console.error('[useLocalLibrary] Native read failed, trying FSA:', e)
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

  const toggleExpand = useCallback((id: string) => {
    setTree(prev => toggleNode(prev, id))
  }, [])

  return { tree, setTree, loading, rootName, error, openFolder, toggleExpand }
}

function toggleNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, expanded: !n.expanded }
    if (n.children) return { ...n, children: toggleNode(n.children, id) }
    return n
  })
}
