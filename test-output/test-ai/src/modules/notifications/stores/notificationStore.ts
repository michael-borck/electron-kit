import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NotificationManager } from '../NotificationManager'
import type {
  ToastNotification,
  NotificationConfig,
  NotificationHistory,
  NotificationStats,
  NotificationPosition,
  NotificationType
} from '../types'

interface NotificationStore {
  // Core state
  manager: NotificationManager
  notifications: ToastNotification[]
  history: NotificationHistory[]
  config: NotificationConfig
  
  // UI state
  isHistoryOpen: boolean
  selectedNotification: ToastNotification | null
  
  // Actions - Basic notifications
  show: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => string
  info: (title: string, message?: string, options?: Partial<ToastNotification>) => string
  success: (title: string, message?: string, options?: Partial<ToastNotification>) => string
  warning: (title: string, message?: string, options?: Partial<ToastNotification>) => string
  error: (title: string, message?: string, options?: Partial<ToastNotification>) => string
  loading: (title: string, message?: string, options?: Partial<ToastNotification>) => string
  
  // Actions - Management
  dismiss: (id: string) => void
  dismissAll: () => void
  
  // Actions - System notifications
  showSystem: (title: string, message?: string, options?: any) => Promise<string>
  
  // Actions - Progress notifications
  showProgress: (title: string, options?: any) => string
  updateProgress: (id: string, progress: number, message?: string, eta?: number) => void
  completeProgress: (id: string, message?: string) => void
  
  // Actions - Configuration
  updateConfig: (updates: Partial<NotificationConfig>) => void
  toggleDoNotDisturb: () => void
  setPosition: (position: NotificationPosition) => void
  
  // Actions - History
  setHistoryOpen: (open: boolean) => void
  clearHistory: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  
  // Actions - Selection
  selectNotification: (notification: ToastNotification | null) => void
  
  // Getters
  getStats: () => NotificationStats
  getUnreadCount: () => number
  getNotificationsByType: (type: NotificationType) => ToastNotification[]
  
  // Internal
  refresh: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => {
      const manager = new NotificationManager()
      
      // Listen for manager events
      manager.on('show', () => get().refresh())
      manager.on('dismiss', () => get().refresh())
      manager.on('history-updated', () => get().refresh())
      manager.on('config-updated', (config) => {
        set({ config })
      })

      return {
        // Initial state
        manager,
        notifications: [],
        history: [],
        config: manager.getConfig(),
        isHistoryOpen: false,
        selectedNotification: null,
        
        // Basic notification actions
        show: (notification) => {
          const id = manager.show(notification)
          get().refresh()
          return id
        },
        
        info: (title, message, options) => {
          const id = manager.info(title, message, options)
          get().refresh()
          return id
        },
        
        success: (title, message, options) => {
          const id = manager.success(title, message, options)
          get().refresh()
          return id
        },
        
        warning: (title, message, options) => {
          const id = manager.warning(title, message, options)
          get().refresh()
          return id
        },
        
        error: (title, message, options) => {
          const id = manager.error(title, message, options)
          get().refresh()
          return id
        },
        
        loading: (title, message, options) => {
          const id = manager.loading(title, message, options)
          get().refresh()
          return id
        },
        
        // Management actions
        dismiss: (id) => {
          manager.dismiss(id)
          get().refresh()
        },
        
        dismissAll: () => {
          manager.dismissAll()
          get().refresh()
        },
        
        // System notifications
        showSystem: async (title, message, options) => {
          const id = await manager.showSystem({ title, message, ...options })
          get().refresh()
          return id
        },
        
        // Progress notifications
        showProgress: (title, options) => {
          const id = manager.showProgress(title, options)
          get().refresh()
          return id
        },
        
        updateProgress: (id, progress, message, eta) => {
          manager.updateProgress(id, progress, message, eta)
          get().refresh()
        },
        
        completeProgress: (id, message) => {
          manager.completeProgress(id, message)
          get().refresh()
        },
        
        // Configuration actions
        updateConfig: (updates) => {
          manager.updateConfig(updates)
          const config = manager.getConfig()
          set({ config })
        },
        
        toggleDoNotDisturb: () => {
          const { config } = get()
          get().updateConfig({ doNotDisturb: !config.doNotDisturb })
        },
        
        setPosition: (position) => {
          get().updateConfig({ position })
        },
        
        // History actions
        setHistoryOpen: (open) => {
          set({ isHistoryOpen: open })
        },
        
        clearHistory: () => {
          manager.clearHistory()
          get().refresh()
        },
        
        markAsRead: (id) => {
          // Implementation depends on how you want to track read status
          // For now, we'll just emit an event
          manager.emit('mark-read', id)
        },
        
        markAllAsRead: () => {
          const { history } = get()
          history.forEach(item => {
            if (!item.dismissed) {
              get().markAsRead(item.id)
            }
          })
        },
        
        // Selection actions
        selectNotification: (notification) => {
          set({ selectedNotification: notification })
        },
        
        // Getters
        getStats: () => {
          return manager.getStats()
        },
        
        getUnreadCount: () => {
          const { history } = get()
          return history.filter(item => !item.dismissed && !item.clicked).length
        },
        
        getNotificationsByType: (type) => {
          const { notifications } = get()
          return notifications.filter(notification => notification.type === type)
        },
        
        // Internal refresh
        refresh: () => {
          set({
            notifications: manager.getNotifications(),
            history: manager.getHistory()
          })
        }
      }
    },
    {
      name: 'notification-store',
      partialize: (state) => ({
        // Only persist configuration and some UI preferences
        config: {
          enabled: state.config.enabled,
          defaultDuration: state.config.defaultDuration,
          maxNotifications: state.config.maxNotifications,
          position: state.config.position,
          systemNotificationsEnabled: state.config.systemNotificationsEnabled,
          soundEnabled: state.config.soundEnabled,
          showTimestamp: state.config.showTimestamp,
          showProgress: state.config.showProgress,
          pauseOnHover: state.config.pauseOnHover,
          closeOnClick: state.config.closeOnClick,
          newestOnTop: state.config.newestOnTop,
          doNotDisturb: state.config.doNotDisturb,
          quietHours: state.config.quietHours,
          darkMode: state.config.darkMode
        }
      }),
      merge: (persistedState, currentState) => {
        if (persistedState?.config) {
          // Update manager config with persisted settings
          currentState.manager.updateConfig(persistedState.config)
        }
        return {
          ...currentState,
          ...persistedState,
          // Always refresh from manager after hydration
          notifications: currentState.manager.getNotifications(),
          history: currentState.manager.getHistory(),
          config: currentState.manager.getConfig()
        }
      }
    }
  )
)