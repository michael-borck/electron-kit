import type { UpdateStats, UpdateDiagnostics } from '../types'

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format duration in milliseconds to human readable string
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Format download speed
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + '/s'
}

/**
 * Calculate time remaining based on download progress
 */
export const calculateTimeRemaining = (
  transferred: number,
  total: number,
  speed: number
): number => {
  if (speed === 0 || total === 0) return 0
  return Math.round((total - transferred) / speed)
}

/**
 * Check if version is newer than current
 */
export const isNewerVersion = (version: string, currentVersion: string): boolean => {
  const parseVersion = (v: string) => {
    return v.split('.').map(num => parseInt(num, 10))
  }

  const newV = parseVersion(version)
  const currentV = parseVersion(currentVersion)

  for (let i = 0; i < Math.max(newV.length, currentV.length); i++) {
    const newPart = newV[i] || 0
    const currentPart = currentV[i] || 0

    if (newPart > currentPart) return true
    if (newPart < currentPart) return false
  }

  return false
}

/**
 * Get version type (major, minor, patch)
 */
export const getVersionType = (version: string, previousVersion: string): 'major' | 'minor' | 'patch' => {
  const parseVersion = (v: string) => {
    return v.split('.').map(num => parseInt(num, 10))
  }

  const newV = parseVersion(version)
  const prevV = parseVersion(previousVersion)

  if (newV[0] > prevV[0]) return 'major'
  if (newV[1] > prevV[1]) return 'minor'
  return 'patch'
}

/**
 * Create update logger with structured logging
 */
export const createUpdateLogger = (prefix: string = '[UpdateManager]') => {
  return {
    info: (message: string, data?: any) => {
      console.log(`${prefix} [INFO] ${message}`, data || '')
    },
    warn: (message: string, data?: any) => {
      console.warn(`${prefix} [WARN] ${message}`, data || '')
    },
    error: (message: string, error?: Error | any) => {
      console.error(`${prefix} [ERROR] ${message}`, error || '')
    },
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${prefix} [DEBUG] ${message}`, data || '')
      }
    }
  }
}

/**
 * Validate update configuration
 */
export const validateUpdateConfig = (config: any): string[] => {
  const errors: string[] = []

  if (typeof config.autoCheckForUpdates !== 'boolean') {
    errors.push('autoCheckForUpdates must be a boolean')
  }

  if (typeof config.checkFrequency !== 'number' || config.checkFrequency <= 0) {
    errors.push('checkFrequency must be a positive number')
  }

  if (!['stable', 'beta', 'alpha'].includes(config.updateChannel)) {
    errors.push('updateChannel must be one of: stable, beta, alpha')
  }

  if (typeof config.maxRollbackVersions !== 'number' || config.maxRollbackVersions < 0) {
    errors.push('maxRollbackVersions must be a non-negative number')
  }

  return errors
}

/**
 * Calculate update statistics
 */
export const calculateUpdateStats = (stats: UpdateStats) => {
  const successRate = stats.totalChecks > 0 
    ? ((stats.updatesInstalled / (stats.updatesFound || 1)) * 100).toFixed(1)
    : '0'

  const errorRate = stats.totalChecks > 0
    ? ((stats.updateErrors / stats.totalChecks) * 100).toFixed(1)
    : '0'

  return {
    ...stats,
    successRate: parseFloat(successRate),
    errorRate: parseFloat(errorRate),
    averageCheckInterval: stats.totalChecks > 0 
      ? Math.round(24 / (stats.totalChecks / 30)) // Assuming 30-day period
      : 0
  }
}

/**
 * Generate update diagnostics report
 */
export const generateDiagnosticsReport = (diagnostics: UpdateDiagnostics): string => {
  const sections = [
    '=== Update System Diagnostics ===',
    '',
    `Platform: ${diagnostics.platform} (${diagnostics.arch})`,
    `App: ${diagnostics.appName} v${diagnostics.currentVersion}`,
    `Update Channel: ${diagnostics.updateChannel}`,
    `Update Server: ${diagnostics.updateServer}`,
    '',
    `Network Status: ${diagnostics.networkStatus}`,
    `Disk Space: ${formatBytes(diagnostics.diskSpace)}`,
    `Last Check: ${diagnostics.lastCheck ? new Date(diagnostics.lastCheck).toISOString() : 'Never'}`,
    '',
    '=== Permissions ===',
    `Can Write: ${diagnostics.permissions.canWrite ? 'Yes' : 'No'}`,
    `Can Download: ${diagnostics.permissions.canDownload ? 'Yes' : 'No'}`,
    '',
    `Report generated: ${new Date().toISOString()}`
  ]

  return sections.join('\n')
}

/**
 * Debounce function for update checking
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function for progress updates
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Retry function for network operations
 */
export const retry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }

  throw lastError!
}