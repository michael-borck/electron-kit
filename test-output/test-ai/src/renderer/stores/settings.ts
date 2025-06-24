import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CoreSettings } from '@shared/types'

const defaultSettings: CoreSettings = {
  appearance: {
    theme: 'system',
    fontFamily: 'system',
    fontSize: 'medium',
    accentColor: '#3b82f6',
    compactMode: false
  },
  window: {
    persistState: true,
    sidebarExpanded: true,
    zoomLevel: 1,
    alwaysOnTop: false
  },
  behavior: {
    autoSave: true,
    autoSaveInterval: 30,
    startupLaunch: false,
    notifications: true,
    checkUpdates: true
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    keyboardShortcuts: true
  },
  data: {
    dataLocation: '',
    autoBackup: true,
    exportFormat: 'json'
  }
}

interface SettingsStore {
  settings: CoreSettings
  updateSettings: (updates: Partial<CoreSettings>) => void
  updateAppearance: (updates: Partial<CoreSettings['appearance']>) => void
  updateWindow: (updates: Partial<CoreSettings['window']>) => void
  updateBehavior: (updates: Partial<CoreSettings['behavior']>) => void
  updateAccessibility: (updates: Partial<CoreSettings['accessibility']>) => void
  updateData: (updates: Partial<CoreSettings['data']>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      
      updateSettings: (updates) => {
        set(state => ({
          settings: { ...state.settings, ...updates }
        }))
      },

      updateAppearance: (updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            appearance: { ...state.settings.appearance, ...updates }
          }
        }))
      },

      updateWindow: (updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            window: { ...state.settings.window, ...updates }
          }
        }))
      },

      updateBehavior: (updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            behavior: { ...state.settings.behavior, ...updates }
          }
        }))
      },

      updateAccessibility: (updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            accessibility: { ...state.settings.accessibility, ...updates }
          }
        }))
      },

      updateData: (updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            data: { ...state.settings.data, ...updates }
          }
        }))
      },

      resetSettings: () => {
        set({ settings: defaultSettings })
      }
    }),
    {
      name: 'template-settings',
      version: 1
    }
  )
)