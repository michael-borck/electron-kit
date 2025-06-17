import { autoUpdater } from 'electron-updater'
import EventEmitter from 'eventemitter3'
import * as semver from 'semver'
import type {
  UpdateInfo,
  UpdateConfig,
  UpdateStatus,
  UpdateState,
  UpdateProgress,
  UpdateEvent,
  UpdateStats,
  UpdateNotification,
  UpdateSchedule,
  RollbackInfo,
  ChangelogEntry,
  UpdateDiagnostics,
  VersionInfo
} from './types'

export class UpdateManager extends EventEmitter {
  private config: UpdateConfig
  private status: UpdateStatus
  private checkInterval: NodeJS.Timeout | null = null
  private scheduledCheckTimeout: NodeJS.Timeout | null = null
  private stats: UpdateStats
  private notifications: UpdateNotification[] = []
  private changelog: ChangelogEntry[] = []
  private rollbackVersions: RollbackInfo[] = []
  private versionInfo: VersionInfo

  constructor(config: Partial<UpdateConfig> = {}, versionInfo: VersionInfo) {
    super()
    
    this.versionInfo = versionInfo
    
    this.config = {
      autoCheckForUpdates: true,
      checkFrequency: 4, // 4 hours
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
      minimizeToTray: false,
      ...config
    }

    this.status = {
      state: 'not-available',
      currentVersion: versionInfo.version
    }

    this.stats = {
      totalChecks: 0,
      updatesFound: 0,
      updatesInstalled: 0,
      updatesCancelled: 0,
      updateErrors: 0,
      averageDownloadTime: 0,
      rollbacks: 0
    }

    this.setupAutoUpdater()
    this.scheduleChecks()
  }

  // Configuration
  updateConfig(updates: Partial<UpdateConfig>): void {
    const oldConfig = { ...this.config }
    this.config = { ...this.config, ...updates }
    
    // Handle configuration changes
    if (oldConfig.checkFrequency !== this.config.checkFrequency) {
      this.scheduleChecks()
    }
    
    if (oldConfig.updateChannel !== this.config.updateChannel) {
      this.setChannel(this.config.updateChannel)
    }
    
    autoUpdater.autoDownload = this.config.autoDownload
    autoUpdater.autoInstallOnAppQuit = this.config.autoInstallOnAppQuit
    autoUpdater.allowPrerelease = this.config.allowPrerelease
    
    this.emit('config-updated', this.config)
  }

  getConfig(): UpdateConfig {
    return { ...this.config }
  }

  // Version Management
  getCurrentVersion(): string {
    return this.versionInfo.version
  }

  getVersionInfo(): VersionInfo {
    return { ...this.versionInfo }
  }

  setChannel(channel: 'stable' | 'beta' | 'alpha'): void {
    this.config.updateChannel = channel
    autoUpdater.channel = channel
    this.emit('channel-changed', channel)
  }

  // Update Checking
  async checkForUpdates(force: boolean = false): Promise<UpdateInfo | null> {
    if (!force && this.status.state === 'checking') {
      return null
    }

    this.updateStatus({ state: 'checking' })
    this.stats.totalChecks++

    try {
      const result = await autoUpdater.checkForUpdates()
      
      if (result && result.updateInfo) {
        this.updateStatus({
          state: 'available',
          availableVersion: result.updateInfo.version,
          updateInfo: result.updateInfo as UpdateInfo
        })
        
        this.stats.updatesFound++
        
        if (this.config.notifyUser) {
          this.showUpdateNotification(result.updateInfo as UpdateInfo)
        }
        
        return result.updateInfo as UpdateInfo
      } else {
        this.updateStatus({ state: 'not-available' })
        return null
      }
    } catch (error) {
      this.handleError(error as Error)
      return null
    }
  }

  // Download Management
  async downloadUpdate(): Promise<void> {
    if (this.status.state !== 'available') {
      throw new Error('No update available to download')
    }

    this.updateStatus({ state: 'downloading' })
    
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  cancelDownload(): void {
    // electron-updater doesn't have a direct cancel method
    // We can work around this by tracking state
    if (this.status.state === 'downloading') {
      this.updateStatus({ state: 'cancelled' })
      this.stats.updatesCancelled++
      this.emit('download-cancelled')
    }
  }

  // Installation
  async installUpdate(): Promise<void> {
    if (this.status.state !== 'downloaded') {
      throw new Error('No update downloaded and ready to install')
    }

    this.updateStatus({ state: 'installing' })
    
    try {
      autoUpdater.quitAndInstall(false, true)
      this.stats.updatesInstalled++
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  async installAndRestart(): Promise<void> {
    if (this.status.state !== 'downloaded') {
      throw new Error('No update downloaded and ready to install')
    }

    this.updateStatus({ state: 'installing' })
    
    try {
      autoUpdater.quitAndInstall(true, true)
      this.stats.updatesInstalled++
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  postponeUpdate(): void {
    if (this.status.state === 'downloaded') {
      this.emit('update-postponed')
      // Schedule a reminder
      setTimeout(() => {
        if (this.status.state === 'downloaded') {
          this.showInstallReminder()
        }
      }, 30 * 60 * 1000) // 30 minutes
    }
  }

  // Rollback
  async rollback(targetVersion?: string): Promise<boolean> {
    if (!this.config.enableRollback) {
      throw new Error('Rollback is disabled')
    }

    const availableRollbacks = this.getRollbackVersions()
    
    if (availableRollbacks.length === 0) {
      throw new Error('No rollback versions available')
    }

    const rollbackVersion = targetVersion 
      ? availableRollbacks.find(r => r.version === targetVersion)
      : availableRollbacks[0] // Most recent rollback

    if (!rollbackVersion || !rollbackVersion.available) {
      throw new Error('Rollback version not available')
    }

    try {
      // This would require custom rollback logic
      // For now, we'll emit an event for the main process to handle
      this.emit('rollback-requested', { version: rollbackVersion.version })
      this.stats.rollbacks++
      return true
    } catch (error) {
      this.handleError(error as Error)
      return false
    }
  }

  getRollbackVersions(): RollbackInfo[] {
    return this.rollbackVersions.filter(r => r.available)
  }

  // Status and Progress
  getStatus(): UpdateStatus {
    return { ...this.status }
  }

  private updateStatus(updates: Partial<UpdateStatus>): void {
    this.status = { 
      ...this.status, 
      ...updates,
      lastChecked: new Date()
    }
    this.emit('status-updated', this.status)
  }

  // Scheduling
  private scheduleChecks(): void {
    // Clear existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    if (this.config.autoCheckForUpdates) {
      const intervalMs = this.config.checkFrequency * 60 * 60 * 1000 // Convert hours to ms
      this.checkInterval = setInterval(() => {
        this.checkForUpdates()
      }, intervalMs)
    }
  }

  setUpdateSchedule(schedule: UpdateSchedule): void {
    if (this.scheduledCheckTimeout) {
      clearTimeout(this.scheduledCheckTimeout)
    }

    if (!schedule.enabled) return

    const scheduleNext = () => {
      const now = new Date()
      const [hours, minutes] = schedule.time.split(':').map(Number)
      
      let nextCheck = new Date(now)
      nextCheck.setHours(hours, minutes, 0, 0)
      
      // If the time has passed today, schedule for tomorrow
      if (nextCheck <= now) {
        nextCheck.setDate(nextCheck.getDate() + 1)
      }
      
      // Find the next scheduled day
      while (!schedule.days.includes(this.getDayName(nextCheck))) {
        nextCheck.setDate(nextCheck.getDate() + 1)
      }
      
      const timeUntilCheck = nextCheck.getTime() - now.getTime()
      
      this.scheduledCheckTimeout = setTimeout(() => {
        this.checkForUpdates()
        scheduleNext() // Schedule the next check
      }, timeUntilCheck)
    }

    scheduleNext()
  }

  private getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  // Notifications
  private showUpdateNotification(updateInfo: UpdateInfo): void {
    const notification: UpdateNotification = {
      id: `update-${updateInfo.version}`,
      title: 'Update Available',
      message: `Version ${updateInfo.version} is available. ${updateInfo.releaseName || ''}`,
      type: 'info',
      actions: [
        {
          id: 'download',
          label: 'Download Now',
          action: 'download',
          primary: true
        },
        {
          id: 'learn-more',
          label: 'View Changes',
          action: 'learn-more'
        },
        {
          id: 'postpone',
          label: 'Later',
          action: 'postpone'
        }
      ],
      timestamp: Date.now()
    }

    this.notifications.push(notification)
    this.emit('notification', notification)
  }

  private showInstallReminder(): void {
    const notification: UpdateNotification = {
      id: 'install-reminder',
      title: 'Update Ready',
      message: 'An update has been downloaded and is ready to install.',
      type: 'info',
      actions: [
        {
          id: 'install',
          label: 'Install & Restart',
          action: 'install',
          primary: true
        },
        {
          id: 'postpone',
          label: 'Postpone',
          action: 'postpone'
        }
      ],
      persistent: true,
      timestamp: Date.now()
    }

    this.notifications.push(notification)
    this.emit('notification', notification)
  }

  getNotifications(): UpdateNotification[] {
    return [...this.notifications]
  }

  dismissNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.emit('notification-dismissed', id)
  }

  // Changelog
  setChangelog(changelog: ChangelogEntry[]): void {
    this.changelog = changelog.sort((a, b) => 
      semver.compare(b.version, a.version)
    )
  }

  getChangelog(): ChangelogEntry[] {
    return [...this.changelog]
  }

  getChangelogForVersion(version: string): ChangelogEntry | undefined {
    return this.changelog.find(entry => entry.version === version)
  }

  getChangelogSince(version: string): ChangelogEntry[] {
    return this.changelog.filter(entry => 
      semver.gt(entry.version, version)
    )
  }

  // Statistics
  getStats(): UpdateStats {
    return { ...this.stats }
  }

  resetStats(): void {
    this.stats = {
      totalChecks: 0,
      updatesFound: 0,
      updatesInstalled: 0,
      updatesCancelled: 0,
      updateErrors: 0,
      averageDownloadTime: 0,
      rollbacks: 0
    }
    this.emit('stats-reset')
  }

  // Diagnostics
  getDiagnostics(): UpdateDiagnostics {
    return {
      platform: process.platform,
      arch: process.arch,
      currentVersion: this.versionInfo.version,
      appName: autoUpdater.app?.getName() || 'Unknown',
      updateChannel: this.config.updateChannel,
      lastCheck: this.status.lastChecked || null,
      updateServer: autoUpdater.getFeedURL() || 'Not configured',
      networkStatus: navigator.onLine ? 'online' : 'offline',
      diskSpace: 0, // Would need to be implemented per platform
      permissions: {
        canWrite: true, // Would need to be checked
        canDownload: true // Would need to be checked
      }
    }
  }

  // Error Handling
  private handleError(error: Error): void {
    this.updateStatus({ 
      state: 'error', 
      error 
    })
    this.stats.updateErrors++
    
    const notification: UpdateNotification = {
      id: `error-${Date.now()}`,
      title: 'Update Error',
      message: error.message || 'An error occurred while updating',
      type: 'error',
      timestamp: Date.now()
    }
    
    this.notifications.push(notification)
    this.emit('error', error)
    this.emit('notification', notification)
  }

  // Auto-updater Setup
  private setupAutoUpdater(): void {
    autoUpdater.autoDownload = this.config.autoDownload
    autoUpdater.autoInstallOnAppQuit = this.config.autoInstallOnAppQuit
    autoUpdater.allowPrerelease = this.config.allowPrerelease
    autoUpdater.channel = this.config.updateChannel

    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      this.updateStatus({ state: 'checking' })
      this.emitUpdateEvent('checking-for-update')
    })

    autoUpdater.on('update-available', (info) => {
      this.updateStatus({ 
        state: 'available',
        availableVersion: info.version,
        updateInfo: info as UpdateInfo
      })
      this.emitUpdateEvent('update-available', info)
    })

    autoUpdater.on('update-not-available', (info) => {
      this.updateStatus({ state: 'not-available' })
      this.emitUpdateEvent('update-not-available', info)
    })

    autoUpdater.on('download-progress', (progress) => {
      const updateProgress: UpdateProgress = {
        bytesPerSecond: progress.bytesPerSecond,
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total
      }
      
      this.updateStatus({ 
        progress: updateProgress,
        downloadSpeed: progress.bytesPerSecond,
        timeRemaining: progress.total > 0 
          ? Math.round((progress.total - progress.transferred) / progress.bytesPerSecond)
          : undefined
      })
      
      this.emitUpdateEvent('download-progress', updateProgress)
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.updateStatus({ 
        state: 'downloaded',
        updateInfo: info as UpdateInfo
      })
      
      if (this.config.notifyUser) {
        this.showInstallReminder()
      }
      
      this.emitUpdateEvent('update-downloaded', info)
    })

    autoUpdater.on('before-quit-for-update', () => {
      this.updateStatus({ state: 'installing' })
      this.emitUpdateEvent('before-quit-for-update')
    })

    autoUpdater.on('error', (error) => {
      this.handleError(error)
    })
  }

  private emitUpdateEvent(type: string, data?: any): void {
    const event: UpdateEvent = {
      type: type as any,
      data,
      timestamp: Date.now()
    }
    this.emit('update-event', event)
  }

  // Cleanup
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    
    if (this.scheduledCheckTimeout) {
      clearTimeout(this.scheduledCheckTimeout)
    }

    this.removeAllListeners()
  }
}