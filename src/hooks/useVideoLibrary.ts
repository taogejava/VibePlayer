import { useState, useCallback } from 'react'

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

  const openFolder = useCallback(async () => {
    setError('')
    try {
      // @ts-ignore – File System Access API
      const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'read' })
      setLoading(true)
      setRootName(dirHandle.name)
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

  const toggleExpand = useCallback((id: string) => {
    setTree(prev => toggleNode(prev, id))
  }, [])

  return { tree, setTree, loading, rootName, error, openFolder, toggleExpand }
}

function toggleNode(nodes: VideoFileNode[], id: string): VideoFileNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, expanded: !n.expanded }
    if (n.children) return { ...n, children: toggleNode(n.children, id) }
    return n
  })
}
