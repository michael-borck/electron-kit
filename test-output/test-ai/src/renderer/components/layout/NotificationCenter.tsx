import React from 'react'
import { useAppStore } from '../../stores/app'
import { Icon } from '../ui/Icon'

export const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification, clearNotifications } = useAppStore()

  if (notifications.length === 0) return null

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'Check'
      case 'warning':
        return 'AlertTriangle'
      case 'error':
        return 'XCircle'
      default:
        return 'AlertCircle'
    }
  }

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-sm">
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              p-4 rounded-lg border shadow-lg animate-slide-down
              ${getNotificationColors(notification.type)}
            `}
          >
            <div className="flex items-start gap-3">
              <Icon 
                name={getNotificationIcon(notification.type) as any}
                size={20}
                className="flex-shrink-0 mt-0.5"
              />
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{notification.title}</h4>
                <p className="text-sm opacity-90 mt-1">{notification.message}</p>
              </div>

              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 1 && (
        <button
          onClick={clearNotifications}
          className="mt-3 w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Clear all notifications
        </button>
      )}
    </div>
  )
}