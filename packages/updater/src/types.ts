export interface UpdateInfo {
  version: string
  releaseNotes?: string
  releaseName?: string
  releaseDate?: string
  files: UpdateFile[]
  path?: string
  sha512?: string
  sha256?: string
  stagingPercentage?: number
}

export interface UpdateFile {
  url: string
  sha512: string
  size: number
  blockMapSize?: number
}

export interface VersionInfo {
  version: string
  buildTime?: string
  gitCommit?: string
  branch?: string
  environment?: string
}

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

export interface UpdateConfig {
  // Update checking
  autoCheckForUpdates: boolean
  checkFrequency: number // hours
  
  // Update behavior
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  allowPrerelease: boolean
  
  // User interaction
  notifyUser: boolean
  allowManualCheck: boolean
  requireUserAction: boolean
  
  // Channels
  updateChannel: 'stable' | 'beta' | 'alpha'
  
  // Rollback
  enableRollback: boolean
  maxRollbackVersions: number
  
  // Security
  verifySignature: boolean
  allowDowngrade: boolean
  
  // UI preferences
  showProgressDialog: boolean
  showChangelogDialog: boolean
  minimizeToTray: boolean
}

export type UpdateState = 
  | 'checking'
  | 'available' 
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'installed'
  | 'error'
  | 'cancelled'

export interface UpdateStatus {
  state: UpdateState
  currentVersion: string
  availableVersion?: string
  updateInfo?: UpdateInfo
  progress?: UpdateProgress
  error?: Error
  lastChecked?: Date
  downloadSpeed?: number
  timeRemaining?: number
}

export interface ChangelogEntry {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  changes: {
    type: 'feature' | 'improvement' | 'bugfix' | 'security' | 'breaking'
    description: string
    issueUrl?: string
    pullRequestUrl?: string
  }[]
  downloadUrl?: string
  critical?: boolean
}

export interface RollbackInfo {
  version: string
  date: string
  reason?: string
  available: boolean
}

export interface UpdateEvent {
  type: 'checking-for-update' 
      | 'update-available' 
      | 'update-not-available'
      | 'update-downloaded'
      | 'download-progress'
      | 'before-quit-for-update'
      | 'update-cancelled'
      | 'error'
  data?: any
  timestamp: number
}

export interface UpdateSchedule {
  enabled: boolean
  time: string // HH:MM format
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]
  timezone?: string
}

export interface UpdateStats {
  totalChecks: number
  updatesFound: number
  updatesInstalled: number
  updatesCancelled: number
  updateErrors: number
  averageDownloadTime: number
  lastUpdateDate?: Date
  rollbacks: number
}

export interface UpdateNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  actions?: UpdateNotificationAction[]
  persistent?: boolean
  timestamp: number
}

export interface UpdateNotificationAction {
  id: string
  label: string
  action: 'download' | 'install' | 'postpone' | 'skip' | 'learn-more' | 'rollback'
  primary?: boolean
}

export interface UpdateProvider {
  id: string
  name: string
  baseUrl: string
  headers?: Record<string, string>
  timeout?: number
}

export interface UpdateDiagnostics {
  platform: string
  arch: string
  currentVersion: string
  appName: string
  updateChannel: string
  lastCheck: Date | null
  updateServer: string
  networkStatus: 'online' | 'offline'
  diskSpace: number
  permissions: {
    canWrite: boolean
    canDownload: boolean
  }
}

export interface UpdateBatch {
  id: string
  name: string
  description?: string
  versions: string[]
  rolloutPercentage: number
  startDate: Date
  endDate?: Date
  enabled: boolean
}