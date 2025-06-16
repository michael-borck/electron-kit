import React from 'react'
import { useSettingsStore } from '../../stores/settings'

export const BehaviorSettings: React.FC = () => {
  const { settings, updateBehavior } = useSettingsStore()
  const { autoSave, autoSaveInterval, startupLaunch, notifications, checkUpdates } = settings.behavior

  const autoSaveIntervalOptions = [
    { value: 15, label: '15 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Application Behavior
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configure how the application behaves and interacts with your system.
        </p>
      </div>

      {/* Auto Save */}
      <div>
        <label className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => updateBehavior({ autoSave: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto Save
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Automatically save changes at regular intervals
            </p>
          </div>
        </label>

        {autoSave && (
          <div className="ml-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auto Save Interval
            </label>
            <select
              value={autoSaveInterval}
              onChange={(e) => updateBehavior({ autoSaveInterval: parseInt(e.target.value) })}
              className="input w-full max-w-xs"
            >
              {autoSaveIntervalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Startup Launch */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={startupLaunch}
            onChange={(e) => updateBehavior({ startupLaunch: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Launch on System Startup
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Automatically start the application when your computer starts
            </p>
          </div>
        </label>
      </div>

      {/* Notifications */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => updateBehavior({ notifications: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Notifications
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Display system notifications for important events and updates
            </p>
          </div>
        </label>
      </div>

      {/* Check Updates */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={checkUpdates}
            onChange={(e) => updateBehavior({ checkUpdates: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Check for Updates
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Automatically check for application updates on startup
            </p>
          </div>
        </label>
      </div>

      {/* Behavior Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Behavior Settings
        </h4>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div>
            Auto Save: {autoSave ? `Enabled (every ${autoSaveInterval}s)` : 'Disabled'}
          </div>
          <div>Launch on Startup: {startupLaunch ? 'Yes' : 'No'}</div>
          <div>Notifications: {notifications ? 'Enabled' : 'Disabled'}</div>
          <div>Update Checks: {checkUpdates ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>

      {/* Performance Impact */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 Performance Tips
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Longer auto-save intervals reduce CPU usage</li>
          <li>• Disabling startup launch improves boot time</li>
          <li>• Notifications use minimal system resources</li>
        </ul>
      </div>
    </div>
  )
}