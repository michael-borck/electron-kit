import { create } from 'zustand'
import type { AppState, NavigationItem, Notification } from '@shared/types'

interface AppStore extends AppState {
  // State updates
  setLoading: (loading: boolean) => void
  setCurrentRoute: (route: string) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSettingsOpen: (open: boolean) => void
  
  // Navigation
  navigationItems: NavigationItem[]
  setNavigationItems: (items: NavigationItem[]) => void
  updateNavigationBadge: (itemId: string, badge?: number) => void
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // App info
  appInfo: { name: string; version: string; platform: string } | null
  setAppInfo: (info: { name: string; version: string; platform: string }) => void
}

const defaultNavigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home', icon: 'Home', path: '/' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
  { id: 'about', label: 'About', icon: 'Info', path: '/about' }
]

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  isLoading: false,
  currentRoute: '/',
  sidebarCollapsed: false,
  settingsOpen: false,
  notifications: [],
  navigationItems: defaultNavigationItems,
  appInfo: null,

  // State setters
  setLoading: (loading) => set({ isLoading: loading }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  // Navigation methods
  setNavigationItems: (items) => set({ navigationItems: items }),
  updateNavigationBadge: (itemId, badge) => {
    set(state => ({
      navigationItems: state.navigationItems.map(item =>
        item.id === itemId ? { ...item, badge } : item
      )
    }))
  },

  // Notification methods
  addNotification: (notification) => {
    const id = Date.now().toString()
    const timestamp = Date.now()
    set(state => ({
      notifications: [...state.notifications, { ...notification, id, timestamp }]
    }))
    
    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        get().removeNotification(id)
      }, 5000)
    }
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },

  clearNotifications: () => set({ notifications: [] }),

  // App info
  setAppInfo: (info) => set({ appInfo: info })
})