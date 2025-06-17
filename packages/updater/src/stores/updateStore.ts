import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UpdateManager } from '../UpdateManager'
import type {
  UpdateConfig,
  UpdateStatus,
  UpdateInfo,
  UpdateNotification,
  UpdateStats,
  ChangelogEntry,
  RollbackInfo,
  UpdateSchedule,
  VersionInfo
} from '../types'

interface UpdateStore {
  // Core state
  manager: UpdateManager | null
  status: UpdateStatus
  config: UpdateConfig
  notifications: UpdateNotification[]
  changelog: ChangelogEntry[]
  rollbackVersions: RollbackInfo[]
  
  // UI state
  isUpdateDialogOpen: boolean
  isChangelogOpen: boolean
  isSettingsOpen: boolean
  selectedChangelogVersion: string | null
  
  // Progress state
  isChecking: boolean
  isDownloading: boolean
  isInstalling: boolean
  
  // Actions - Core
  initialize: (versionInfo: VersionInfo) => void
  checkForUpdates: (force?: boolean) => Promise<UpdateInfo | null>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  installAndRestart: () => Promise<void>
  postponeUpdate: () => void
  cancelDownload: () => void
  
  // Actions - Configuration
  updateConfig: (updates: Partial<UpdateConfig>) => void
  setChannel: (channel: 'stable' | 'beta' | 'alpha') => void
  setUpdateSchedule: (schedule: UpdateSchedule) => void
  
  // Actions - Rollback
  rollback: (targetVersion?: string) => Promise<boolean>
  
  // Actions - UI
  setUpdateDialogOpen: (open: boolean) => void
  setChangelogOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSelectedChangelogVersion: (version: string | null) => void
  
  // Actions - Notifications
  dismissNotification: (id: string) => void
  dismissAllNotifications: () => void
  
  // Actions - Changelog
  setChangelog: (changelog: ChangelogEntry[]) => void
  
  // Getters
  getStats: () => UpdateStats
  getCurrentVersion: () => string | null
  getAvailableVersion: () => string | null
  hasUpdateAvailable: () => boolean
  isUpdateDownloaded: () => boolean
  getChangelogForVersion: (version: string) => ChangelogEntry | undefined
  getChangelogSince: (version: string) => ChangelogEntry[]
  getRollbackVersions: () => RollbackInfo[]
  
  // Internal
  refresh: () => void
}

export const useUpdateStore = create<UpdateStore>()(
  persist(
    (set, get) => ({
      // Initial state
      manager: null,
      status: {
        state: 'not-available',
        currentVersion: '0.0.0'
      },
      config: {
        autoCheckForUpdates: true,
        checkFrequency: 4,
        autoDownload: true,
        autoInstallOnAppQuit: false,
        allowPrerelease: false,
        notifyUser: true,
        allowManualCheck: true,
        requireUserAction: false,
        updateChannel: 'stable',
        enableRollback: true,
        maxRollbackVersions: 3,
        verifySignature: true,
        allowDowngrade: false,
        showProgressDialog: true,
        showChangelogDialog: true,
        minimizeToTray: false
      },
      notifications: [],
      changelog: [],
      rollbackVersions: [],
      
      // UI state
      isUpdateDialogOpen: false,
      isChangelogOpen: false,
      isSettingsOpen: false,
      selectedChangelogVersion: null,
      
      // Progress state
      isChecking: false,
      isDownloading: false,
      isInstalling: false,
      
      // Core actions
      initialize: (versionInfo) => {
        const manager = new UpdateManager(get().config, versionInfo)
        
        // Set up event listeners
        manager.on('status-updated', (status) => {
          set({ 
            status,
            isChecking: status.state === 'checking',
            isDownloading: status.state === 'downloading',
            isInstalling: status.state === 'installing'
          })
        })
        
        manager.on('config-updated', (config) => {
          set({ config })
        })
        
        manager.on('notification', (notification) => {
          const { notifications } = get()
          set({ notifications: [...notifications, notification] })
        })
        
        manager.on('notification-dismissed', (id) => {
          const { notifications } = get()
          set({ notifications: notifications.filter(n => n.id !== id) })
        })
        
        manager.on('update-available', (updateInfo) => {
          if (get().config.showChangelogDialog) {
            get().setChangelogOpen(true)
            get().setSelectedChangelogVersion(updateInfo.version)
          }
        })
        
        manager.on('update-downloaded', () => {
          if (get().config.showProgressDialog) {
            get().setUpdateDialogOpen(true)
          }
        })
        
        set({ 
          manager,
          status: manager.getStatus(),
          config: manager.getConfig()
        })
      },
      
      checkForUpdates: async (force = false) => {
        const { manager } = get()
        if (!manager) return null
        
        try {
          const result = await manager.checkForUpdates(force)
          get().refresh()
          return result
        } catch (error) {
          console.error('Failed to check for updates:', error)
          return null
        }
      },
      
      downloadUpdate: async () => {
        const { manager } = get()
        if (!manager) return
        
        try {
          await manager.downloadUpdate()
          get().refresh()
        } catch (error) {
          console.error('Failed to download update:', error)
          throw error
        }
      },
      
      installUpdate: async () => {
        const { manager } = get()
        if (!manager) return
        
        try {
          await manager.installUpdate()
          get().refresh()
        } catch (error) {
          console.error('Failed to install update:', error)
          throw error
        }
      },
      
      installAndRestart: async () => {
        const { manager } = get()
        if (!manager) return
        
        try {
          await manager.installAndRestart()
          get().refresh()
        } catch (error) {
          console.error('Failed to install and restart:', error)
          throw error
        }
      },
      
      postponeUpdate: () => {
        const { manager } = get()
        if (!manager) return
        
        manager.postponeUpdate()
        get().setUpdateDialogOpen(false)
      },
      
      cancelDownload: () => {
        const { manager } = get()
        if (!manager) return
        
        manager.cancelDownload()
        get().refresh()
      },
      
      // Configuration actions
      updateConfig: (updates) => {
        const { manager } = get()
        if (!manager) return
        
        manager.updateConfig(updates)
        get().refresh()
      },
      
      setChannel: (channel) => {
        const { manager } = get()
        if (!manager) return
        
        manager.setChannel(channel)
        get().refresh()
      },
      
      setUpdateSchedule: (schedule) => {
        const { manager } = get()
        if (!manager) return
        
        manager.setUpdateSchedule(schedule)
      },
      
      // Rollback actions
      rollback: async (targetVersion) => {
        const { manager } = get()
        if (!manager) return false
        
        try {
          const result = await manager.rollback(targetVersion)
          get().refresh()
          return result
        } catch (error) {
          console.error('Failed to rollback:', error)
          return false
        }
      },
      
      // UI actions
      setUpdateDialogOpen: (open) => {
        set({ isUpdateDialogOpen: open })
      },
      
      setChangelogOpen: (open) => {
        set({ isChangelogOpen: open })
      },
      
      setSettingsOpen: (open) => {
        set({ isSettingsOpen: open })
      },
      
      setSelectedChangelogVersion: (version) => {
        set({ selectedChangelogVersion: version })
      },
      
      // Notification actions
      dismissNotification: (id) => {
        const { manager } = get()
        if (!manager) return
        
        manager.dismissNotification(id)
        get().refresh()
      },
      
      dismissAllNotifications: () => {
        const { notifications } = get()
        notifications.forEach(notification => {
          get().dismissNotification(notification.id)
        })
      },
      
      // Changelog actions
      setChangelog: (changelog) => {
        const { manager } = get()
        if (!manager) return
        
        manager.setChangelog(changelog)
        set({ changelog })
      },
      
      // Getters
      getStats: () => {
        const { manager } = get()
        return manager?.getStats() || {
          totalChecks: 0,
          updatesFound: 0,
          updatesInstalled: 0,
          updatesCancelled: 0,
          updateErrors: 0,
          averageDownloadTime: 0,
          rollbacks: 0
        }
      },
      
      getCurrentVersion: () => {
        const { manager } = get()
        return manager?.getCurrentVersion() || null
      },
      
      getAvailableVersion: () => {
        const { status } = get()
        return status.availableVersion || null
      },
      
      hasUpdateAvailable: () => {
        const { status } = get()
        return status.state === 'available' || status.state === 'downloaded'
      },
      
      isUpdateDownloaded: () => {
        const { status } = get()
        return status.state === 'downloaded'
      },
      
      getChangelogForVersion: (version) => {
        const { manager } = get()
        return manager?.getChangelogForVersion(version)
      },
      
      getChangelogSince: (version) => {
        const { manager } = get()
        return manager?.getChangelogSince(version) || []
      },
      
      getRollbackVersions: () => {
        const { manager } = get()
        return manager?.getRollbackVersions() || []
      },
      
      // Internal refresh
      refresh: () => {
        const { manager } = get()
        if (!manager) return
        
        set({
          status: manager.getStatus(),
          config: manager.getConfig(),
          notifications: manager.getNotifications(),
          changelog: manager.getChangelog(),
          rollbackVersions: manager.getRollbackVersions()
        })
      }
    }),
    {
      name: 'update-store',
      partialize: (state) => ({
        // Only persist configuration and UI preferences
        config: state.config,
        isChangelogOpen: state.isChangelogOpen,
        selectedChangelogVersion: state.selectedChangelogVersion
      }),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...persistedState
        }
      }
    }
  )
)