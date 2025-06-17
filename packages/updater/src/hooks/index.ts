import { useEffect, useCallback, useState } from 'react'
import { useUpdateStore } from '../stores/updateStore'
import type { UpdateInfo, UpdateProgress } from '../types'

/**
 * Hook for handling update checking logic
 */
export const useUpdateChecker = () => {
  const {
    checkForUpdates,
    config,
    status,
    isChecking
  } = useUpdateStore()

  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)

  const checkNow = useCallback(async (force = false): Promise<UpdateInfo | null> => {
    try {
      const result = await checkForUpdates(force)
      setLastCheckTime(new Date())
      return result
    } catch (error) {
      console.error('Failed to check for updates:', error)
      return null
    }
  }, [checkForUpdates])

  // Auto-check on mount if enabled
  useEffect(() => {
    if (config.autoCheckForUpdates && !lastCheckTime) {
      checkNow()
    }
  }, [config.autoCheckForUpdates, lastCheckTime, checkNow])

  // Periodic checking
  useEffect(() => {
    if (!config.autoCheckForUpdates) return

    const interval = setInterval(() => {
      if (!isChecking) {
        checkNow()
      }
    }, config.checkFrequency * 60 * 60 * 1000) // Convert hours to ms

    return () => clearInterval(interval)
  }, [config.autoCheckForUpdates, config.checkFrequency, isChecking, checkNow])

  return {
    checkNow,
    isChecking,
    lastCheckTime,
    status,
    autoCheckEnabled: config.autoCheckForUpdates
  }
}

/**
 * Hook for handling update download logic
 */
export const useUpdateDownloader = () => {
  const {
    downloadUpdate,
    cancelDownload,
    status,
    isDownloading,
    config
  } = useUpdateStore()

  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null)
  const [downloadError, setDownloadError] = useState<Error | null>(null)

  const startDownload = useCallback(async (): Promise<void> => {
    if (status.state !== 'available') {
      throw new Error('No update available to download')
    }

    setDownloadError(null)
    
    try {
      await downloadUpdate()
    } catch (error) {
      setDownloadError(error as Error)
      throw error
    }
  }, [downloadUpdate, status.state])

  const cancelCurrentDownload = useCallback(() => {
    cancelDownload()
    setDownloadProgress(null)
    setDownloadError(null)
  }, [cancelDownload])

  // Update progress when status changes
  useEffect(() => {
    if (status.progress) {
      setDownloadProgress(status.progress)
    }
  }, [status.progress])

  // Auto-download if enabled and update is available
  useEffect(() => {
    if (config.autoDownload && status.state === 'available' && !isDownloading) {
      startDownload().catch(console.error)
    }
  }, [config.autoDownload, status.state, isDownloading, startDownload])

  return {
    startDownload,
    cancelDownload: cancelCurrentDownload,
    isDownloading,
    downloadProgress,
    downloadError,
    autoDownloadEnabled: config.autoDownload,
    canDownload: status.state === 'available'
  }
}

/**
 * Hook for managing update notifications
 */
export const useUpdateNotifications = () => {
  const {
    notifications,
    dismissNotification,
    dismissAllNotifications,
    config
  } = useUpdateStore()

  const [unreadCount, setUnreadCount] = useState(0)

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.length)
  }, [notifications])

  const dismissById = useCallback((id: string) => {
    dismissNotification(id)
  }, [dismissNotification])

  const dismissAll = useCallback(() => {
    dismissAllNotifications()
  }, [dismissAllNotifications])

  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type)
  }, [notifications])

  const hasUnreadNotifications = unreadCount > 0
  const notificationsEnabled = config.notifyUser

  return {
    notifications,
    unreadCount,
    hasUnreadNotifications,
    notificationsEnabled,
    dismissById,
    dismissAll,
    getNotificationsByType
  }
}

/**
 * Hook for handling update installation
 */
export const useUpdateInstaller = () => {
  const {
    installUpdate,
    installAndRestart,
    postponeUpdate,
    status,
    isInstalling,
    config
  } = useUpdateStore()

  const [installError, setInstallError] = useState<Error | null>(null)

  const install = useCallback(async (restart = false): Promise<void> => {
    if (status.state !== 'downloaded') {
      throw new Error('No update downloaded and ready to install')
    }

    setInstallError(null)
    
    try {
      if (restart) {
        await installAndRestart()
      } else {
        await installUpdate()
      }
    } catch (error) {
      setInstallError(error as Error)
      throw error
    }
  }, [installUpdate, installAndRestart, status.state])

  const postpone = useCallback(() => {
    postponeUpdate()
  }, [postponeUpdate])

  const canInstall = status.state === 'downloaded'
  const autoInstallOnQuit = config.autoInstallOnAppQuit

  return {
    install,
    postpone,
    isInstalling,
    installError,
    canInstall,
    autoInstallOnQuit
  }
}

/**
 * Hook for managing update settings
 */
export const useUpdateSettings = () => {
  const {
    config,
    updateConfig,
    setChannel,
    getStats,
    getDiagnostics
  } = useUpdateStore()

  const [settings, setSettings] = useState(config)

  // Sync settings with store
  useEffect(() => {
    setSettings(config)
  }, [config])

  const updateSetting = useCallback((key: string, value: any) => {
    updateConfig({ [key]: value })
  }, [updateConfig])

  const updateChannel = useCallback((channel: 'stable' | 'beta' | 'alpha') => {
    setChannel(channel)
  }, [setChannel])

  const resetSettings = useCallback(() => {
    // Reset to default config
    updateConfig({
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
    })
  }, [updateConfig])

  const stats = getStats()
  const diagnostics = getDiagnostics?.()

  return {
    settings,
    updateSetting,
    updateChannel,
    resetSettings,
    stats,
    diagnostics
  }
}

/**
 * Hook for keyboard shortcuts related to updates
 */
export const useUpdateShortcuts = () => {
  const {
    checkForUpdates,
    setUpdateDialogOpen,
    setChangelogOpen,
    setSettingsOpen
  } = useUpdateStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + U: Check for updates
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'U') {
        event.preventDefault()
        checkForUpdates(true)
      }

      // Ctrl/Cmd + Shift + D: Open update dialog
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        setUpdateDialogOpen(true)
      }

      // Ctrl/Cmd + Shift + C: Open changelog
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        setChangelogOpen(true)
      }

      // Ctrl/Cmd + Shift + S: Open settings
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        setSettingsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [checkForUpdates, setUpdateDialogOpen, setChangelogOpen, setSettingsOpen])

  return {
    shortcuts: {
      checkForUpdates: 'Ctrl+Shift+U (Cmd+Shift+U on Mac)',
      openUpdateDialog: 'Ctrl+Shift+D (Cmd+Shift+D on Mac)',
      openChangelog: 'Ctrl+Shift+C (Cmd+Shift+C on Mac)',
      openSettings: 'Ctrl+Shift+S (Cmd+Shift+S on Mac)'
    }
  }
}