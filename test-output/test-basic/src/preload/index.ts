import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Menu events
  onMenuAction: (callback: (action: string) => void) => {
    const menuActions = [
      'menu-new',
      'menu-open', 
      'menu-save',
      'menu-about',
      'menu-settings'
    ]
    
    menuActions.forEach(action => {
      ipcRenderer.on(action, () => callback(action))
    })
  },

  // Remove all listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>
      getPlatform: () => Promise<string>
      onMenuAction: (callback: (action: string) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}