// Core application types that are shared between main and renderer processes

export interface CoreSettings {
  appearance: {
    theme: 'light' | 'dark' | 'system'
    fontFamily: 'system' | 'serif' | 'sans-serif'
    fontSize: 'small' | 'medium' | 'large' | 'xl'
    accentColor: string
    compactMode: boolean
  }
  window: {
    persistState: boolean
    sidebarExpanded: boolean
    zoomLevel: number
    alwaysOnTop: boolean
  }
  behavior: {
    autoSave: boolean
    autoSaveInterval: number
    startupLaunch: boolean
    notifications: boolean
    checkUpdates: boolean
  }
  accessibility: {
    highContrast: boolean
    reduceMotion: boolean
    keyboardShortcuts: boolean
  }
  data: {
    dataLocation: string
    autoBackup: boolean
    exportFormat: 'json' | 'pdf' | 'html' | 'docx'
  }
}

export interface AppInfo {
  name: string
  version: string
  platform: string
}

export interface NavigationItem {
  id: string
  label: string
  icon: string
  path: string
  badge?: number
}

export interface AppState {
  isLoading: boolean
  currentRoute: string
  sidebarCollapsed: boolean
  settingsOpen: boolean
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  persistent?: boolean
}

export interface MenuItem {
  action: string
  label: string
  accelerator?: string
}