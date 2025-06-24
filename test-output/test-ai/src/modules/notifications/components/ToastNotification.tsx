import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNotificationStore } from '../stores/notificationStore'
import type { ToastNotification as ToastNotificationType } from '../types'

interface ToastNotificationProps {
  notification: ToastNotificationType
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ notification }) => {
  const { dismiss, config } = useNotificationStore()
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)
  const [timeRemaining, setTimeRemaining] = useState(notification.duration || 0)

  useEffect(() => {
    if (!notification.duration || notification.duration <= 0 || notification.persistent) {
      return
    }

    let startTime = Date.now()
    let pausedTime = 0
    let animationFrame: number

    const updateProgress = () => {
      if (isPaused) {
        pausedTime += 16 // Approximate frame time
        animationFrame = requestAnimationFrame(updateProgress)
        return
      }

      const elapsed = Date.now() - startTime - pausedTime
      const remaining = Math.max(0, notification.duration! - elapsed)
      const progressPercent = (remaining / notification.duration!) * 100

      setProgress(progressPercent)
      setTimeRemaining(remaining)

      if (remaining > 0) {
        animationFrame = requestAnimationFrame(updateProgress)
      }
    }

    animationFrame = requestAnimationFrame(updateProgress)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [notification.duration, notification.persistent, isPaused])

  const handleClick = () => {
    if (notification.onClick) {
      notification.onClick()
    }
    
    if (config.closeOnClick && notification.dismissible) {
      dismiss(notification.id)
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    dismiss(notification.id)
  }

  const handleMouseEnter = () => {
    if (config.pauseOnHover) {
      setIsPaused(true)
    }
  }

  const handleMouseLeave = () => {
    if (config.pauseOnHover) {
      setIsPaused(false)
    }
  }

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      case 'loading':
        return '⏳'
      default:
        return 'ℹ️'
    }
  }

  const getTypeClasses = () => {
    const baseClasses = 'border-l-4'
    
    switch (notification.type) {
      case 'success':
        return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/20`
      case 'error':
        return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-900/20`
      case 'warning':
        return `${baseClasses} border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20`
      case 'info':
        return `${baseClasses} border-blue-500 bg-blue-50 dark:bg-blue-900/20`
      case 'loading':
        return `${baseClasses} border-gray-500 bg-gray-50 dark:bg-gray-900/20`
      default:
        return `${baseClasses} border-gray-500 bg-gray-50 dark:bg-gray-900/20`
    }
  }

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  const renderProgressBar = () => {
    if (!notification.showProgress || !notification.duration || notification.persistent) {
      return null
    }

    return (
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    )
  }

  const renderActions = () => {
    if (!notification.actions || notification.actions.length === 0) {
      return null
    }

    return (
      <div className="flex gap-2 mt-3">
        {notification.actions.map((action) => (
          <button
            key={action.id}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
              if (!notification.persistent) {
                dismiss(notification.id)
              }
            }}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              action.primary
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {action.icon && <span className="mr-1">{action.icon}</span>}
            {action.title}
          </button>
        ))}
      </div>
    )
  }

  const renderMetadata = () => {
    if (!notification.metadata) return null

    // Handle progress metadata for progress notifications
    if (notification.metadata.progress !== undefined) {
      const progress = notification.metadata.progress
      const eta = notification.metadata.eta

      return (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>{Math.round(progress)}%</span>
            {eta && (
              <span>ETA: {Math.ceil(eta / 1000)}s</span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <motion.div
      layout
      className={`
        relative min-w-80 max-w-md p-4 rounded-lg shadow-lg cursor-pointer
        ${getTypeClasses()}
        ${notification.className || ''}
      `}
      style={notification.style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Main Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-lg">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {notification.title}
            </h4>
            
            <div className="flex items-center gap-2 ml-2">
              {/* Timestamp */}
              {config.showTimestamp && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              )}
              
              {/* Time remaining */}
              {notification.duration && notification.duration > 0 && !notification.persistent && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              )}

              {/* Dismiss button */}
              {notification.dismissible && (
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Dismiss notification"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          {notification.message && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {notification.message}
            </p>
          )}

          {/* Metadata (progress bars, etc.) */}
          {renderMetadata()}

          {/* Actions */}
          {renderActions()}
        </div>
      </div>

      {/* Progress bar */}
      {renderProgressBar()}

      {/* Loading spinner for loading notifications */}
      {notification.type === 'loading' && (
        <div className="absolute top-4 right-4">
          <motion.div
            className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  )
}