export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'loading'

export type NotificationPosition = 
  | 'top-left' 
  | 'top-right' 
  | 'top-center'
  | 'bottom-left' 
  | 'bottom-right' 
  | 'bottom-center'

export interface BaseNotification {
  id: string
  type: NotificationType
  title: string
  message?: string
  timestamp: number
  duration?: number // milliseconds, 0 = persistent
  persistent?: boolean
  dismissible?: boolean
  actions?: NotificationAction[]
  metadata?: Record<string, any>
}

export interface ToastNotification extends BaseNotification {
  position?: NotificationPosition
  showProgress?: boolean
  onClick?: () => void
  onDismiss?: () => void
  className?: string
  style?: React.CSSProperties
}

export interface SystemNotification extends BaseNotification {
  icon?: string
  silent?: boolean
  tag?: string // For grouping/replacing notifications
  requireInteraction?: boolean
  renotify?: boolean
  badge?: string
  image?: string
  vibrate?: number[]
  timestamp?: number
  data?: any
}

export interface ProgressNotification extends BaseNotification {
  progress: number // 0-100
  indeterminate?: boolean
  eta?: number // Estimated time remaining in milliseconds
  onCancel?: () => void
  cancelable?: boolean
}

export interface NotificationAction {
  id: string
  title: string
  icon?: string
  onClick: () => void
  primary?: boolean
}

export interface NotificationQueue {
  id: string
  name: string
  maxSize: number
  priority: number
  position?: NotificationPosition
  notifications: ToastNotification[]
}

export interface NotificationHistory {
  id: string
  type: NotificationType
  title: string
  message?: string
  timestamp: number
  dismissed: boolean
  clicked: boolean
  duration: number
  metadata?: Record<string, any>
}

export interface NotificationConfig {
  // Global settings
  enabled: boolean
  defaultDuration: number
  maxNotifications: number
  position: NotificationPosition
  
  // System notifications
  systemNotificationsEnabled: boolean
  systemIcon?: string
  
  // Audio
  soundEnabled: boolean
  soundFile?: string
  
  // Visual
  animationDuration: number
  showTimestamp: boolean
  showProgress: boolean
  darkMode?: boolean
  
  // Behavior
  pauseOnHover: boolean
  closeOnClick: boolean
  newestOnTop: boolean
  
  // Persistence
  persistHistory: boolean
  historyLimit: number
  
  // Do Not Disturb
  doNotDisturb: boolean
  quietHours?: {
    enabled: boolean
    start: string // HH:MM
    end: string // HH:MM
  }
}

export interface NotificationStats {
  total: number
  byType: Record<NotificationType, number>
  dismissed: number
  clicked: number
  avgDuration: number
  mostRecentTimestamp: number
}

export interface NotificationEvent {
  type: 'show' | 'dismiss' | 'click' | 'action' | 'expire' | 'error'
  notification: BaseNotification
  actionId?: string
  timestamp: number
}

export interface NotificationSound {
  id: string
  name: string
  file: string
  volume: number
  enabled: boolean
}