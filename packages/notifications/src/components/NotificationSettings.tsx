import React from 'react'
import { useNotificationStore } from '../stores/notificationStore'
import type { NotificationPosition } from '../types'

interface NotificationSettingsProps {
  className?: string
  style?: React.CSSProperties
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  style
}) => {
  const { config, updateConfig } = useNotificationStore()

  const positions: { value: NotificationPosition; label: string }[] = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ]

  const durations = [
    { value: 3000, label: '3 seconds' },
    { value: 5000, label: '5 seconds' },
    { value: 8000, label: '8 seconds' },
    { value: 0, label: 'Never (manual dismiss)' }
  ]

  return (
    <div className={`notification-settings space-y-6 ${className}`} style={style}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Notification Settings
        </h3>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          General
        </h4>

        {/* Enable Notifications */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Notifications
          </label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position
          </label>
          <select
            value={config.position}
            onChange={(e) => updateConfig({ position: e.target.value as NotificationPosition })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {positions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Default Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Duration
          </label>
          <select
            value={config.defaultDuration}
            onChange={(e) => updateConfig({ defaultDuration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {durations.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Max Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Visible Notifications: {config.maxNotifications}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={config.maxNotifications}
            onChange={(e) => updateConfig({ maxNotifications: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Visual Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Visual
        </h4>

        {/* Show Timestamp */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show Timestamp
          </label>
          <input
            type="checkbox"
            checked={config.showTimestamp}
            onChange={(e) => updateConfig({ showTimestamp: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Show Progress */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show Progress Bar
          </label>
          <input
            type="checkbox"
            checked={config.showProgress}
            onChange={(e) => updateConfig({ showProgress: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Newest on Top */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Newest on Top
          </label>
          <input
            type="checkbox"
            checked={config.newestOnTop}
            onChange={(e) => updateConfig({ newestOnTop: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Animation Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Animation Duration: {config.animationDuration}ms
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={config.animationDuration}
            onChange={(e) => updateConfig({ animationDuration: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>100ms</span>
            <span>1000ms</span>
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Behavior
        </h4>

        {/* Pause on Hover */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pause on Hover
          </label>
          <input
            type="checkbox"
            checked={config.pauseOnHover}
            onChange={(e) => updateConfig({ pauseOnHover: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Close on Click */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Close on Click
          </label>
          <input
            type="checkbox"
            checked={config.closeOnClick}
            onChange={(e) => updateConfig({ closeOnClick: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      {/* System Notifications */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          System Notifications
        </h4>

        {/* Enable System Notifications */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable System Notifications
          </label>
          <input
            type="checkbox"
            checked={config.systemNotificationsEnabled}
            onChange={(e) => updateConfig({ systemNotificationsEnabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Audio Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Audio
        </h4>

        {/* Enable Sound */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Sound
          </label>
          <input
            type="checkbox"
            checked={config.soundEnabled}
            onChange={(e) => updateConfig({ soundEnabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Do Not Disturb */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Do Not Disturb
        </h4>

        {/* Enable DND */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Do Not Disturb
          </label>
          <input
            type="checkbox"
            checked={config.doNotDisturb}
            onChange={(e) => updateConfig({ doNotDisturb: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Quiet Hours */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quiet Hours
            </label>
            <input
              type="checkbox"
              checked={config.quietHours?.enabled || false}
              onChange={(e) => updateConfig({ 
                quietHours: { 
                  ...config.quietHours, 
                  enabled: e.target.checked,
                  start: config.quietHours?.start || '22:00',
                  end: config.quietHours?.end || '08:00'
                } 
              })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {config.quietHours?.enabled && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={config.quietHours.start || '22:00'}
                  onChange={(e) => updateConfig({ 
                    quietHours: { 
                      ...config.quietHours!, 
                      start: e.target.value 
                    } 
                  })}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={config.quietHours.end || '08:00'}
                  onChange={(e) => updateConfig({ 
                    quietHours: { 
                      ...config.quietHours!, 
                      end: e.target.value 
                    } 
                  })}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          History
        </h4>

        {/* Persist History */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Save Notification History
          </label>
          <input
            type="checkbox"
            checked={config.persistHistory}
            onChange={(e) => updateConfig({ persistHistory: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* History Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            History Limit: {config.historyLimit} notifications
          </label>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={config.historyLimit}
            onChange={(e) => updateConfig({ historyLimit: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>10</span>
            <span>1000</span>
          </div>
        </div>
      </div>
    </div>
  )
}