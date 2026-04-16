// Preload script for VibePlayer Electron app
// Security: contextBridge is enabled, no Node.js APIs exposed to renderer
// File System Access API (showDirectoryPicker) works natively in Chromium/Electron renderer
// So we don't need to expose any custom APIs here.

// This file exists as a security best practice placeholder.
// If you need to expose Node.js APIs to the renderer in the future,
// use contextBridge.exposeInMainWorld() here.

console.log('VibePlayer preload script loaded')
