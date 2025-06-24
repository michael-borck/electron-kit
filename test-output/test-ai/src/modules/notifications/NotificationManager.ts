import EventEmitter from 'eventemitter3'
import type {
  BaseNotification,
  ToastNotification,
  SystemNotification,
  ProgressNotification,
  NotificationConfig,
  NotificationHistory,
  NotificationStats,
  NotificationEvent,
  NotificationSound,
  NotificationType,
  NotificationPosition
} from './types'

export class NotificationManager extends EventEmitter {
  private config: NotificationConfig
  private notifications = new Map<string, ToastNotification>()
  private systemNotifications = new Map<string, Notification>()
  private progressNotifications = new Map<string, ProgressNotification>()
  private history: NotificationHistory[] = []
  private sounds = new Map<string, NotificationSound>()
  private audioContext: AudioContext | null = null
  private notificationCounter = 0

  constructor(config: Partial<NotificationConfig> = {}) {
    super()
    
    this.config = {
      enabled: true,
      defaultDuration: 5000,
      maxNotifications: 5,
      position: 'top-right',
      systemNotificationsEnabled: true,
      soundEnabled: false,
      animationDuration: 300,
      showTimestamp: true,
      showProgress: true,
      pauseOnHover: true,
      closeOnClick: true,
      newestOnTop: true,
      persistHistory: true,
      historyLimit: 100,
      doNotDisturb: false,
      ...config
    }

    this.initializeAudio()
    this.setupSystemNotificationHandlers()
  }

  // Configuration
  updateConfig(updates: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...updates }
    this.emit('config-updated', this.config)
  }

  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  // Toast Notifications
  show(notification: Omit<ToastNotification, 'id' | 'timestamp'>): string {
    if (!this.config.enabled || this.isQuietTime()) {
      return ''
    }

    const id = this.generateId()
    const timestamp = Date.now()

    const toast: ToastNotification = {
      id,
      timestamp,
      duration: notification.duration ?? this.config.defaultDuration,
      position: notification.position ?? this.config.position,
      dismissible: notification.dismissible ?? true,
      showProgress: notification.showProgress ?? this.config.showProgress,
      ...notification
    }

    // Enforce max notifications limit
    if (this.notifications.size >= this.config.maxNotifications) {
      this.dismissOldest()
    }

    this.notifications.set(id, toast)
    this.addToHistory(toast)
    this.playSound(toast.type)
    
    this.emit('show', { type: 'show', notification: toast, timestamp })

    // Auto-dismiss if not persistent
    if (toast.duration && toast.duration > 0 && !toast.persistent) {
      setTimeout(() => {
        this.dismiss(id, 'expire')
      }, toast.duration)
    }

    return id
  }

  // Convenience methods for different types
  info(title: string, message?: string, options?: Partial<ToastNotification>): string {
    return this.show({ ...options, type: 'info', title, message })
  }

  success(title: string, message?: string, options?: Partial<ToastNotification>): string {
    return this.show({ ...options, type: 'success', title, message })
  }

  warning(title: string, message?: string, options?: Partial<ToastNotification>): string {
    return this.show({ ...options, type: 'warning', title, message })
  }

  error(title: string, message?: string, options?: Partial<ToastNotification>): string {
    return this.show({ ...options, type: 'error', title, message, persistent: true })
  }

  loading(title: string, message?: string, options?: Partial<ToastNotification>): string {
    return this.show({ 
      ...options, 
      type: 'loading', 
      title, 
      message, 
      persistent: true,
      dismissible: false 
    })
  }

  dismiss(id: string, reason: 'user' | 'expire' | 'replace' = 'user'): boolean {
    const notification = this.notifications.get(id)
    if (!notification) return false

    this.notifications.delete(id)
    this.updateHistoryItem(id, { dismissed: true })
    
    if (notification.onDismiss) {
      notification.onDismiss()
    }

    this.emit('dismiss', { 
      type: 'dismiss', 
      notification, 
      timestamp: Date.now() 
    })

    return true
  }

  dismissAll(): void {
    const ids = Array.from(this.notifications.keys())
    ids.forEach(id => this.dismiss(id, 'user'))
  }

  private dismissOldest(): void {
    if (this.notifications.size === 0) return

    const oldest = Array.from(this.notifications.values())
      .sort((a, b) => a.timestamp - b.timestamp)[0]
    
    if (oldest) {
      this.dismiss(oldest.id, 'replace')
    }
  }

  // System Notifications
  async showSystem(notification: Omit<SystemNotification, 'id' | 'timestamp'>): Promise<string> {
    if (!this.config.systemNotificationsEnabled || this.isQuietTime()) {
      return ''
    }

    // Check for permission
    if (!('Notification' in window)) {
      console.warn('System notifications not supported')
      return ''
    }

    if (Notification.permission === 'denied') {
      console.warn('System notifications permission denied')
      return ''
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('System notifications permission not granted')
        return ''
      }
    }

    const id = this.generateId()
    const timestamp = Date.now()

    const systemNotification: SystemNotification = {
      id,
      timestamp,
      ...notification
    }

    const nativeNotification = new Notification(systemNotification.title, {
      body: systemNotification.message,
      icon: systemNotification.icon || this.config.systemIcon,
      silent: systemNotification.silent,
      tag: systemNotification.tag,
      requireInteraction: systemNotification.requireInteraction,
      renotify: systemNotification.renotify,
      badge: systemNotification.badge,
      image: systemNotification.image,
      vibrate: systemNotification.vibrate,
      timestamp: systemNotification.timestamp,
      data: systemNotification.data
    })

    this.systemNotifications.set(id, nativeNotification)
    this.addToHistory(systemNotification)
    this.playSound(systemNotification.type)

    this.emit('system-show', { 
      type: 'show', 
      notification: systemNotification, 
      timestamp 
    })

    return id
  }

  dismissSystem(id: string): boolean {
    const notification = this.systemNotifications.get(id)
    if (!notification) return false

    notification.close()
    this.systemNotifications.delete(id)
    
    return true
  }

  // Progress Notifications
  showProgress(
    title: string, 
    options: Partial<ProgressNotification> = {}
  ): string {
    const id = this.generateId()
    const timestamp = Date.now()

    const progressNotification: ProgressNotification = {
      id,
      timestamp,
      type: 'loading',
      title,
      progress: 0,
      indeterminate: false,
      cancelable: false,
      persistent: true,
      dismissible: false,
      ...options
    }

    this.progressNotifications.set(id, progressNotification)
    
    // Show as toast notification
    this.show({
      ...progressNotification,
      showProgress: true
    })

    return id
  }

  updateProgress(
    id: string, 
    progress: number, 
    message?: string,
    eta?: number
  ): boolean {
    const notification = this.progressNotifications.get(id)
    if (!notification) return false

    notification.progress = Math.max(0, Math.min(100, progress))
    if (message) notification.message = message
    if (eta !== undefined) notification.eta = eta

    this.progressNotifications.set(id, notification)
    
    // Update the toast notification
    const toast = this.notifications.get(id)
    if (toast) {
      toast.message = notification.message
      toast.metadata = { 
        ...toast.metadata, 
        progress: notification.progress,
        eta: notification.eta
      }
      this.notifications.set(id, toast)
    }

    this.emit('progress-update', { 
      type: 'show', 
      notification, 
      timestamp: Date.now() 
    })

    return true
  }

  completeProgress(id: string, message?: string): boolean {
    const notification = this.progressNotifications.get(id)
    if (!notification) return false

    notification.progress = 100
    if (message) notification.message = message

    // Convert to success notification
    this.dismiss(id)
    this.success(notification.title, message || 'Completed')
    
    this.progressNotifications.delete(id)
    return true
  }

  // Sound Management
  addSound(sound: NotificationSound): void {
    this.sounds.set(sound.id, sound)
  }

  private async playSound(type: NotificationType): Promise<void> {
    if (!this.config.soundEnabled || !this.audioContext) return

    const sound = Array.from(this.sounds.values())
      .find(s => s.enabled && s.id === type)

    if (!sound) return

    try {
      const response = await fetch(sound.file)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()
      
      source.buffer = audioBuffer
      gainNode.gain.value = sound.volume
      
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      source.start()
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }

  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Audio context not available:', error)
    }
  }

  // History Management
  getHistory(): NotificationHistory[] {
    return [...this.history].sort((a, b) => b.timestamp - a.timestamp)
  }

  clearHistory(): void {
    this.history = []
    this.emit('history-cleared')
  }

  private addToHistory(notification: BaseNotification): void {
    if (!this.config.persistHistory) return

    const historyItem: NotificationHistory = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      dismissed: false,
      clicked: false,
      duration: notification.duration || 0,
      metadata: notification.metadata
    }

    this.history.push(historyItem)

    // Enforce history limit
    if (this.history.length > this.config.historyLimit) {
      this.history = this.history.slice(-this.config.historyLimit)
    }

    this.emit('history-updated', historyItem)
  }

  private updateHistoryItem(
    id: string, 
    updates: Partial<NotificationHistory>
  ): void {
    const index = this.history.findIndex(item => item.id === id)
    if (index >= 0) {
      this.history[index] = { ...this.history[index], ...updates }
    }
  }

  // Statistics
  getStats(): NotificationStats {
    const total = this.history.length
    const byType = this.history.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<NotificationType, number>)

    const dismissed = this.history.filter(item => item.dismissed).length
    const clicked = this.history.filter(item => item.clicked).length
    const avgDuration = this.history.reduce((sum, item) => sum + item.duration, 0) / total || 0
    const mostRecentTimestamp = Math.max(...this.history.map(item => item.timestamp), 0)

    return {
      total,
      byType,
      dismissed,
      clicked,
      avgDuration,
      mostRecentTimestamp
    }
  }

  // Utility Methods
  getNotifications(): ToastNotification[] {
    const notifications = Array.from(this.notifications.values())
    return this.config.newestOnTop 
      ? notifications.sort((a, b) => b.timestamp - a.timestamp)
      : notifications.sort((a, b) => a.timestamp - b.timestamp)
  }

  getNotification(id: string): ToastNotification | undefined {
    return this.notifications.get(id)
  }

  private generateId(): string {
    return `notification_${++this.notificationCounter}_${Date.now()}`
  }

  private isQuietTime(): boolean {
    if (!this.config.doNotDisturb) return false
    
    if (!this.config.quietHours?.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { start, end } = this.config.quietHours
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end
    }
    
    return currentTime >= start && currentTime <= end
  }

  private setupSystemNotificationHandlers(): void {
    // Handle system notification events
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, can show more system notifications
      } else {
        // Page is visible, might want to show fewer system notifications
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.dismissAll()
    this.systemNotifications.forEach(notification => notification.close())
    this.systemNotifications.clear()
    this.progressNotifications.clear()
    
    if (this.audioContext) {
      this.audioContext.close()
    }

    this.removeAllListeners()
  }
}