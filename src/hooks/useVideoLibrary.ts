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

// ── IndexedDB helpers for persisting FileSystemDirectoryHandle ──
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
  } catch { /* ignore if not supported */ }
}

async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const handle = await tx.objectStore(STORE_NAME).get('lastVideoDir') as unknown as FileSystemDirectoryHandle | undefined
    if (handle) {
      // Verify permission is still granted
      const perm = await (handle as any).queryPermission({ mode: 'read' })
      if (perm === 'granted') return handle
      // Try requesting permission silently
      const req = await (handle as any).requestPermission({ mode: 'read' })
      if (req === 'granted') return handle
    }
  } catch { /* ignore */ }
  return null
}

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isVideo(name: string) {
  return VIDEO_EXTENSIONS.has(getExt(name))
}

let idCounter = 10000
function nextId() { return String(++idCounter) }

async function readDirectoryEntry(
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string
): Promise<VideoFileNode[]> {
  const nodes: VideoFileNode[] = []
  for await (const [name, handle] of dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (name.startsWith('.')) continue
    const path = parentPath ? `${parentPath}/${name}` : name
    if (handle.kind === 'directory') {
      const children = await readDirectoryEntry(handle as FileSystemDirectoryHandle, path)
      if (children.length > 0) {
        nodes.push({
          id: nextId(),
          name,
          type: 'directory',
          path,
          children,
          expanded: false,
        })
      }
    } else if (handle.kind === 'file' && isVideo(name)) {
      const file = await (handle as FileSystemFileHandle).getFile()
      nodes.push({
        id: nextId(),
        name,
        type: 'file',
        path,
        fileHandle: file,
        duration: 0,
      })
    }
  }
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })
  return nodes
}

export function flattenVideoFiles(nodes: VideoFileNode[]): VideoFileNode[] {
  const result: VideoFileNode[] = []
  for (const node of nodes) {
    if (node.type === 'file') result.push(node)
    else if (node.children) result.push(...flattenVideoFiles(node.children))
  }
  return result
}

export function useVideoLibrary() {
  const [tree, setTree] = useState<VideoFileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [rootName, setRootName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const restoredRef = useRef(false)

  const openFolder = useCallback(async () => {
    setError('')
    try {
      // @ts-ignore – File System Access API
      const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'read' })
      setLoading(true)
      setRootName(dirHandle.name)
      saveDirHandle(dirHandle)  // persist for next session
      const nodes = await readDirectoryEntry(dirHandle, '')
      setTree(nodes)
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError('无法读取文件夹，请确认浏览器权限。')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Restore last opened folder on mount
  const restoreLastFolder = useCallback(async () => {
    if (restoredRef.current) return
    restoredRef.current = true
    const dirHandle = await loadDirHandle()
    if (!dirHandle) return
    try {
      setLoading(true)
      setRootName(dirHandle.name)
      const nodes = await readDirectoryEntry(dirHandle, '')
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
