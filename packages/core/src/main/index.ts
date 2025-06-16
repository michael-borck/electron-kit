import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized: boolean
}

class ElectronApp {
  private mainWindow: BrowserWindow | null = null
  private store: Store

  constructor() {
    this.store = new Store()
    this.initializeApp()
  }

  private initializeApp(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createWindow()
      this.createMenu()
      
      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow()
        }
      })
    })

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.on('new-window', (navigationEvent, url) => {
        navigationEvent.preventDefault()
        shell.openExternal(url)
      })
    })
  }

  private createWindow(): void {
    // Get saved window state or use defaults
    const windowState = this.store.get('windowState', {
      width: 1200,
      height: 800,
      isMaximized: false
    }) as WindowState

    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: windowState.width,
      height: windowState.height,
      x: windowState.x,
      y: windowState.y,
      minWidth: 800,
      minHeight: 600,
      show: false, // Don't show until ready-to-show
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: join(__dirname, '../preload/index.js')
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      icon: join(__dirname, '../../assets/icon.png')
    })

    // Restore window state
    if (windowState.isMaximized) {
      this.mainWindow.maximize()
    }

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000')
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
      this.mainWindow?.focus()
    })

    // Save window state on resize/move
    this.mainWindow.on('resize', () => this.saveWindowState())
    this.mainWindow.on('move', () => this.saveWindowState())
    this.mainWindow.on('maximize', () => this.saveWindowState())
    this.mainWindow.on('unmaximize', () => this.saveWindowState())

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    // Security: Prevent navigation to external URLs
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url !== this.mainWindow?.webContents.getURL()) {
        event.preventDefault()
        shell.openExternal(url)
      }
    })
  }

  private saveWindowState(): void {
    if (!this.mainWindow) return

    const bounds = this.mainWindow.getBounds()
    const isMaximized = this.mainWindow.isMaximized()

    const windowState: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized
    }

    this.store.set('windowState', windowState)
  }

  private createMenu(): void {
    const isMac = process.platform === 'darwin'

    const template: Electron.MenuItemConstructorOptions[] = [
      ...(isMac ? [{
        label: app.getName(),
        submenu: [
          { role: 'about' as const },
          { type: 'separator' as const },
          { role: 'services' as const },
          { type: 'separator' as const },
          { role: 'hide' as const },
          { role: 'hideOthers' as const },
          { role: 'unhide' as const },
          { type: 'separator' as const },
          { role: 'quit' as const }
        ]
      }] : []),
      {
        label: 'File',
        submenu: [
          {
            label: 'New',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new')
            }
          },
          {
            label: 'Open',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-open')
            }
          },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu-save')
            }
          },
          { type: 'separator' },
          isMac ? { role: 'close' } : { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          ...(isMac ? [
            { role: 'pasteAndMatchStyle' as const },
            { role: 'delete' as const },
            { role: 'selectAll' as const },
            { type: 'separator' as const },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' as const },
                { role: 'stopSpeaking' as const }
              ]
            }
          ] : [
            { role: 'delete' as const },
            { type: 'separator' as const },
            { role: 'selectAll' as const }
          ])
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
          ...(isMac ? [
            { type: 'separator' as const },
            { role: 'front' as const },
            { type: 'separator' as const },
            { role: 'window' as const }
          ] : [])
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              this.mainWindow?.webContents.send('menu-about')
            }
          },
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow?.webContents.send('menu-settings')
            }
          }
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

// Initialize the app
new ElectronApp()

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-platform', () => {
  return process.platform
})