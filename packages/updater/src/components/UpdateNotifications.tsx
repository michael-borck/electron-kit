import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpdateStore } from '../stores/updateStore'
import type { UpdateNotification } from '../types'

interface UpdateNotificationsProps {
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxNotifications?: number
}

export const UpdateNotifications: React.FC<UpdateNotificationsProps> = ({
  className = '',
  position = 'top-right',
  maxNotifications = 5
}) => {
  const {
    notifications,
    dismissNotification,
    downloadUpdate,
    installAndRestart,
    postponeUpdate,
    setChangelogOpen,
    setUpdateDialogOpen
  } = useUpdateStore()

  const visibleNotifications = notifications
    .filter(n => !n.persistent || n.persistent)
    .slice(-maxNotifications)

  const handleAction = async (notification: UpdateNotification, actionId: string) => {
    switch (actionId) {
      case 'download':
        try {
          await downloadUpdate()
          dismissNotification(notification.id)
        } catch (error) {
          console.error('Download action failed:', error)
        }
        break
      case 'install':
        try {
          await installAndRestart()
          dismissNotification(notification.id)
        } catch (error) {
          console.error('Install action failed:', error)
        }
        break
      case 'postpone':
        postponeUpdate()
        dismissNotification(notification.id)
        break
      case 'learn-more':
        setChangelogOpen(true)
        break
      case 'skip':
        dismissNotification(notification.id)
        break
      case 'rollback':
        // Handle rollback
        break
      default:
        dismissNotification(notification.id)
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      default:
        return 'top-4 right-4'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getNotificationBorder = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500'
      case 'warning':
        return 'border-l-4 border-yellow-500'
      case 'error':
        return 'border-l-4 border-red-500'
      default:
        return 'border-l-4 border-blue-500'
    }
  }

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <div className="space-y-3 w-80">
        <AnimatePresence>
          {visibleNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${getNotificationBorder(notification.type)} overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    
                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notification.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleAction(notification, action.action)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              action.primary
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {/* Dismiss button */}
                  {!notification.persistent && (
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Auto-dismiss timer bar for non-persistent notifications */}
              {!notification.persistent && (
                <motion.div
                  className="h-1 bg-blue-500"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 8, ease: 'linear' }}
                  onAnimationComplete={() => dismissNotification(notification.id)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface UpdateNotificationBadgeProps {
  className?: string
  onClick?: () => void
}

export const UpdateNotificationBadge: React.FC<UpdateNotificationBadgeProps> = ({
  className = '',
  onClick
}) => {
  const { notifications, hasUpdateAvailable, isUpdateDownloaded } = useUpdateStore()

  const unreadCount = notifications.length

  if (unreadCount === 0 && !hasUpdateAvailable()) {
    return null
  }

  const getStatusColor = () => {
    if (isUpdateDownloaded()) return 'bg-green-500'
    if (hasUpdateAvailable()) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  const getStatusText = () => {
    if (isUpdateDownloaded()) return 'Update ready to install'
    if (hasUpdateAvailable()) return 'Update available'
    return 'No updates'
  }

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
      title={getStatusText()}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      
      {(unreadCount > 0 || hasUpdateAvailable()) && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 ${getStatusColor()} rounded-full min-w-[18px] h-[18px] flex items-center justify-center`}
        >
          {unreadCount > 0 ? (
            <span className="text-xs font-medium text-white px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </motion.div>
      )}
    </button>
  )
}