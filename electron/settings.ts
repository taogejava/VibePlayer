import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import os from 'os'

interface AppSettings {
  lastMusicPath: string | null
  lastVideoPath: string | null
  selectedTheme: string | null
  selectedFont: string | null
}

const DEFAULT_SETTINGS: AppSettings = {
  lastMusicPath: null,
  lastVideoPath: null,
  selectedTheme: null,
  selectedFont: null,
}

let settingsCache: AppSettings | null = null

function getSettingsFilePath(): string {
  try {
    const userDataPath = app.getPath('userData')
    const filePath = path.join(userDataPath, 'vibeplayer-settings.json')
    console.log('[Settings] File path:', filePath)
    return filePath
  } catch (error) {
    console.error('[Settings] Failed to get userData path, using fallback:', error)
    const fallbackPath = path.join(os.homedir(), '.vibeplayer', 'vibeplayer-settings.json')
    console.log('[Settings] Fallback path:', fallbackPath)
    return fallbackPath
  }
}

export function loadSettings(): AppSettings {
  if (settingsCache) return settingsCache

  try {
    const filePath = getSettingsFilePath()
    console.log('[Settings] Attempting to load from:', filePath)
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      settingsCache = { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
      console.log('[Settings] ✓ Successfully loaded from:', filePath)
      console.log('[Settings] Loaded data:', JSON.stringify(settingsCache, null, 2))
      return settingsCache!
    } else {
      console.log('[Settings] Settings file does not exist:', filePath)
    }
  } catch (error) {
    console.error('[Settings] ✗ Failed to load settings:', error)
  }

  settingsCache = { ...DEFAULT_SETTINGS }
  console.log('[Settings] Using default settings')
  return settingsCache!
}

export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const currentSettings = loadSettings()
    const newSettings = { ...currentSettings, ...settings }
    settingsCache = newSettings

    const filePath = getSettingsFilePath()
    const dir = path.dirname(filePath)
    
    console.log('[Settings] Attempting to save to:', filePath)
    console.log('[Settings] Data to save:', JSON.stringify(newSettings, null, 2))
    
    if (!fs.existsSync(dir)) {
      console.log('[Settings] Creating directory:', dir)
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2), 'utf-8')
    
    const verifyExists = fs.existsSync(filePath)
    console.log('[Settings] ✓ Save successful! File exists:', verifyExists)
    
    if (!verifyExists) {
      throw new Error('File was not created after write')
    }
  } catch (error) {
    console.error('[Settings] ✗ Failed to save settings:', error)
    throw error
  }
}

export function getLastMusicPath(): string | null {
  return loadSettings().lastMusicPath
}

export function setLastMusicPath(pathValue: string): void {
  console.log('[Settings] setLastMusicPath called with:', pathValue)
  saveSettings({ lastMusicPath: pathValue })
}

export function getLastVideoPath(): string | null {
  return loadSettings().lastVideoPath
}

export function setLastVideoPath(pathValue: string): void {
  console.log('[Settings] setLastVideoPath called with:', pathValue)
  saveSettings({ lastVideoPath: pathValue })
}

export function getSettingsFilePathPublic(): string {
  return getSettingsFilePath()
}
