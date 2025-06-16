import { useEffect, useState } from 'react'
import { useAppStore } from '../stores/app'

export const useElectron = () => {
  const { setAppInfo, addNotification } = useAppStore()
  const [isElectron] = useState(() => typeof window.electronAPI !== 'undefined')

  useEffect(() => {
    if (!isElectron) return

    // Get app information
    const getAppInfo = async () => {
      try {
        const [version, platform] = await Promise.all([
          window.electronAPI.getAppVersion(),
          window.electronAPI.getPlatform()
        ])
        
        setAppInfo({
          name: 'Template App',
          version,
          platform
        })
      } catch (error) {
        console.error('Failed to get app info:', error)
      }
    }

    getAppInfo()

    // Listen for menu actions
    const handleMenuAction = (action: string) => {
      switch (action) {
        case 'menu-new':
          addNotification({
            type: 'info',
            title: 'New File',
            message: 'Create new file functionality triggered'
          })
          break
        case 'menu-open':
          addNotification({
            type: 'info', 
            title: 'Open File',
            message: 'Open file functionality triggered'
          })
          break
        case 'menu-save':
          addNotification({
            type: 'success',
            title: 'Save',
            message: 'Save functionality triggered'
          })
          break
        case 'menu-settings':
          useAppStore.getState().setSettingsOpen(true)
          break
        case 'menu-about':
          addNotification({
            type: 'info',
            title: 'About',
            message: 'About dialog triggered'
          })
          break
        default:
          console.log('Unhandled menu action:', action)
      }
    }

    window.electronAPI.onMenuAction(handleMenuAction)

    return () => {
      // Cleanup listeners
      const menuActions = ['menu-new', 'menu-open', 'menu-save', 'menu-about', 'menu-settings']
      menuActions.forEach(action => {
        window.electronAPI.removeAllListeners(action)
      })
    }
  }, [isElectron, setAppInfo, addNotification])

  return {
    isElectron,
    electronAPI: isElectron ? window.electronAPI : null
  }
}