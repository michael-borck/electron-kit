# @template/updater

A comprehensive auto-update system for Electron applications with built-in UI components, state management, and customizable workflows.

## Features

- **Automatic Updates**: Background checking, downloading, and installation
- **Multiple Channels**: Support for stable, beta, and alpha release channels  
- **Rich UI Components**: Pre-built dialogs, progress indicators, and settings panels
- **Rollback Support**: Ability to rollback to previous versions
- **Changelog Management**: Built-in changelog viewer with version history
- **State Management**: Zustand-based store with persistence
- **Customizable Notifications**: Toast notifications with action buttons
- **Keyboard Shortcuts**: Built-in shortcuts for common update actions
- **Diagnostics**: Comprehensive system information and update statistics
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @template/updater
```

## Quick Start

### 1. Initialize the Update System

```tsx
import { useUpdateStore } from '@template/updater'
import { useEffect } from 'react'

function App() {
  const { initialize } = useUpdateStore()

  useEffect(() => {
    // Initialize with version info
    initialize({
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      gitCommit: 'abc123',
      branch: 'main',
      environment: 'production'
    })
  }, [])

  return <div>Your App</div>
}
```

### 2. Add Update Components

```tsx
import {
  UpdateDialog,
  UpdateNotifications,
  UpdateNotificationBadge,
  ChangelogViewer,
  UpdateSettings
} from '@template/updater'

function App() {
  const { setSettingsOpen } = useUpdateStore()

  return (
    <div>
      {/* Your app content */}
      
      {/* Update notification badge in toolbar */}
      <UpdateNotificationBadge onClick={() => setSettingsOpen(true)} />
      
      {/* Update dialogs and notifications */}
      <UpdateDialog />
      <UpdateNotifications position="top-right" />
      <ChangelogViewer />
      <UpdateSettings />
    </div>
  )
}
```

### 3. Use Update Hooks

```tsx
import {
  useUpdateChecker,
  useUpdateDownloader,
  useUpdateNotifications
} from '@template/updater'

function UpdateManager() {
  const { checkNow, isChecking, lastCheckTime } = useUpdateChecker()
  const { startDownload, isDownloading, downloadProgress } = useUpdateDownloader()
  const { notifications, dismissAll } = useUpdateNotifications()

  return (
    <div>
      <button onClick={() => checkNow(true)} disabled={isChecking}>
        {isChecking ? 'Checking...' : 'Check for Updates'}
      </button>
      
      {downloadProgress && (
        <div>Download Progress: {Math.round(downloadProgress.percent)}%</div>
      )}
      
      {notifications.length > 0 && (
        <button onClick={dismissAll}>Dismiss All Notifications</button>
      )}
    </div>
  )
}
```

## Configuration

### Update Config

```tsx
import { useUpdateStore } from '@template/updater'

const { updateConfig } = useUpdateStore()

// Configure update behavior
updateConfig({
  autoCheckForUpdates: true,
  checkFrequency: 4, // hours
  autoDownload: true,
  autoInstallOnAppQuit: false,
  allowPrerelease: false,
  notifyUser: true,
  updateChannel: 'stable', // 'stable' | 'beta' | 'alpha'
  enableRollback: true,
  maxRollbackVersions: 3,
  verifySignature: true,
  showProgressDialog: true,
  showChangelogDialog: true
})
```

### Update Channels

```tsx
const { setChannel } = useUpdateStore()

// Switch update channel
setChannel('beta') // 'stable' | 'beta' | 'alpha'
```

### Scheduled Updates

```tsx
const { setUpdateSchedule } = useUpdateStore()

// Schedule updates for weekdays at 9 AM
setUpdateSchedule({
  enabled: true,
  time: '09:00',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
})
```

## Components

### UpdateDialog

Main update dialog with download/install controls:

```tsx
<UpdateDialog className="custom-dialog" />
```

### UpdateProgress

Progress indicator for downloads and installations:

```tsx
<UpdateProgress showDetails={true} />
```

### ChangelogViewer

Full-featured changelog viewer:

```tsx
<ChangelogViewer className="changelog-modal" />
```

### UpdateSettings

Comprehensive settings panel:

```tsx
<UpdateSettings className="settings-modal" />
```

### UpdateNotifications

Toast notifications for update events:

```tsx
<UpdateNotifications
  position="top-right"
  maxNotifications={5}
/>
```

### UpdateNotificationBadge

Notification badge for toolbars:

```tsx
<UpdateNotificationBadge
  onClick={() => setUpdateDialogOpen(true)}
/>
```

## Advanced Usage

### Custom Update Manager

```tsx
import { UpdateManager } from '@template/updater'

const updateManager = new UpdateManager({
  autoCheckForUpdates: true,
  checkFrequency: 2,
  updateChannel: 'beta'
}, {
  version: '1.0.0',
  buildTime: new Date().toISOString()
})

// Listen to events
updateManager.on('update-available', (info) => {
  console.log('Update available:', info.version)
})

updateManager.on('download-progress', (progress) => {
  console.log('Download progress:', progress.percent)
})

// Check for updates
const updateInfo = await updateManager.checkForUpdates()
if (updateInfo) {
  await updateManager.downloadUpdate()
  await updateManager.installAndRestart()
}
```

### Changelog Management

```tsx
const { setChangelog } = useUpdateStore()

// Set changelog entries
setChangelog([
  {
    version: '1.1.0',
    date: '2024-01-15',
    type: 'minor',
    critical: false,
    changes: [
      {
        type: 'feature',
        description: 'Added dark mode support',
        issueUrl: 'https://github.com/owner/repo/issues/123'
      },
      {
        type: 'bugfix',
        description: 'Fixed memory leak in chat component',
        pullRequestUrl: 'https://github.com/owner/repo/pull/456'
      }
    ]
  }
])
```

### Rollback Support

```tsx
const { rollback, getRollbackVersions } = useUpdateStore()

// Get available rollback versions
const rollbackVersions = getRollbackVersions()

// Rollback to specific version
const success = await rollback('1.0.0')
if (success) {
  console.log('Rollback successful')
}
```

### Diagnostics and Statistics

```tsx
const { getStats, getDiagnostics } = useUpdateStore()

// Get update statistics
const stats = getStats()
console.log('Total checks:', stats.totalChecks)
console.log('Updates found:', stats.updatesFound)
console.log('Success rate:', stats.successRate)

// Get system diagnostics
const diagnostics = getDiagnostics()
console.log('Platform:', diagnostics.platform)
console.log('Network status:', diagnostics.networkStatus)
```

## Electron Configuration

### Main Process Setup

```ts
// main.ts
import { autoUpdater } from 'electron-updater'

// Configure electron-updater
autoUpdater.checkForUpdatesAndNotify()

// Set up update server
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',
  repo: 'your-repo'
})
```

### Build Configuration

```json
// package.json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "your-username",
        "repo": "your-repo"
      }
    ]
  }
}
```

## Styling

The components use Tailwind CSS classes and support dark mode. You can customize the appearance by:

### CSS Variables

```css
:root {
  --update-primary-color: #3b82f6;
  --update-success-color: #10b981;
  --update-warning-color: #f59e0b;
  --update-error-color: #ef4444;
}
```

### Custom Classes

```tsx
<UpdateDialog className="custom-update-dialog" />
<UpdateNotifications className="custom-notifications" />
```

### Theme Override

```tsx
const customTheme = {
  colors: {
    primary: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  }
}

<UpdateDialog theme={customTheme} />
```

## API Reference

### Types

```tsx
interface UpdateInfo {
  version: string
  releaseNotes?: string
  releaseName?: string
  releaseDate?: string
  files: UpdateFile[]
  stagingPercentage?: number
}

interface UpdateConfig {
  autoCheckForUpdates: boolean
  checkFrequency: number
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  allowPrerelease: boolean
  notifyUser: boolean
  updateChannel: 'stable' | 'beta' | 'alpha'
  enableRollback: boolean
  maxRollbackVersions: number
  verifySignature: boolean
  showProgressDialog: boolean
  showChangelogDialog: boolean
}

interface ChangelogEntry {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  critical?: boolean
  changes: Array<{
    type: 'feature' | 'improvement' | 'bugfix' | 'security' | 'breaking'
    description: string
    issueUrl?: string
    pullRequestUrl?: string
  }>
}
```

### Store Methods

```tsx
const store = useUpdateStore()

// Core methods
store.initialize(versionInfo)
store.checkForUpdates(force?)
store.downloadUpdate()
store.installUpdate()
store.installAndRestart()
store.postponeUpdate()
store.cancelDownload()

// Configuration
store.updateConfig(updates)
store.setChannel(channel)
store.setUpdateSchedule(schedule)

// UI state
store.setUpdateDialogOpen(open)
store.setChangelogOpen(open)
store.setSettingsOpen(open)

// Getters
store.getStats()
store.getCurrentVersion()
store.hasUpdateAvailable()
store.isUpdateDownloaded()
```

## License

MIT License - see LICENSE file for details.