import React from 'react'
import { motion } from 'framer-motion'
import { useUpdateStore } from '../stores/updateStore'

interface UpdateProgressProps {
  className?: string
  showDetails?: boolean
}

export const UpdateProgress: React.FC<UpdateProgressProps> = ({ 
  className = '',
  showDetails = true 
}) => {
  const { status, isDownloading, isInstalling } = useUpdateStore()

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s'
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.round(seconds % 60)
      return `${minutes}m ${remainingSeconds}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  const progress = status.progress
  const percent = progress?.percent || 0

  const getStatusText = (): string => {
    if (isInstalling) return 'Installing update...'
    if (isDownloading) return 'Downloading update...'
    return 'Preparing...'
  }

  const getProgressColor = (): string => {
    if (isInstalling) return 'bg-green-500'
    if (isDownloading) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {getStatusText()}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {Math.round(percent)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full ${getProgressColor()} rounded-full relative`}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Progress Details */}
      {showDetails && progress && (
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
          {/* Downloaded/Total */}
          <div className="flex justify-between">
            <span>Downloaded:</span>
            <span className="font-mono">
              {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
            </span>
          </div>

          {/* Speed */}
          {status.downloadSpeed && (
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="font-mono">
                {formatSpeed(status.downloadSpeed)}
              </span>
            </div>
          )}

          {/* Time Remaining */}
          {status.timeRemaining && status.timeRemaining > 0 && (
            <div className="flex justify-between col-span-2">
              <span>Time remaining:</span>
              <span className="font-mono">
                {formatTime(status.timeRemaining)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Installation Message */}
      {isInstalling && (
        <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          The application will restart automatically when installation is complete.
        </div>
      )}
    </div>
  )
}