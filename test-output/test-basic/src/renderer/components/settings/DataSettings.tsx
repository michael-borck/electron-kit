import React from 'react'
import { useSettingsStore } from '../../stores/settings'
import { useAppStore } from '../../stores/app'

export const DataSettings: React.FC = () => {
  const { settings, updateData, resetSettings } = useSettingsStore()
  const { addNotification } = useAppStore()
  const { dataLocation, autoBackup, exportFormat } = settings.data

  const exportFormatOptions = [
    { value: 'json', label: 'JSON', description: 'Human-readable and widely supported' },
    { value: 'pdf', label: 'PDF', description: 'Professional documents and reports' },
    { value: 'html', label: 'HTML', description: 'Web pages and online sharing' },
    { value: 'docx', label: 'Word', description: 'Microsoft Word documents' }
  ] as const

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
      resetSettings()
      addNotification({
        type: 'success',
        title: 'Settings Reset',
        message: 'All settings have been reset to their default values.'
      })
    }
  }

  const handleDataLocationChange = () => {
    // In a real implementation, this would open a folder picker dialog
    addNotification({
      type: 'info',
      title: 'Data Location',
      message: 'Folder picker dialog would open here in a real implementation.'
    })
  }

  const handleExportData = () => {
    addNotification({
      type: 'info',
      title: 'Export Data',
      message: 'Data export functionality would be implemented here.'
    })
  }

  const handleImportData = () => {
    addNotification({
      type: 'info',
      title: 'Import Data',
      message: 'Data import functionality would be implemented here.'
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data & Privacy
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Manage your data, backups, and privacy preferences.
        </p>
      </div>

      {/* Data Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Data Storage Location
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={dataLocation || 'Default location'}
            readOnly
            className="input flex-1 bg-gray-50 dark:bg-gray-900"
            placeholder="Default application data directory"
          />
          <button
            onClick={handleDataLocationChange}
            className="btn btn-secondary px-3 py-2"
          >
            Change
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Choose where your application data is stored locally
        </p>
      </div>

      {/* Auto Backup */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={autoBackup}
            onChange={(e) => updateData({ autoBackup: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Automatic Backups
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Automatically create periodic backups of your data
            </p>
          </div>
        </label>
      </div>

      {/* Default Export Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Default Export Format
        </label>
        <div className="space-y-2">
          {exportFormatOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="radio"
                name="exportFormat"
                value={option.value}
                checked={exportFormat === option.value}
                onChange={(e) => updateData({ exportFormat: e.target.value as any })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Management Actions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Data Management
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Export Data
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Export your data in the selected format
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="btn btn-secondary px-3 py-1.5 text-sm"
            >
              Export
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Import Data
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Import data from a file
              </p>
            </div>
            <button
              onClick={handleImportData}
              className="btn btn-secondary px-3 py-1.5 text-sm"
            >
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Information */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          🔒 Privacy First
        </h4>
        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
          <p>Your privacy is important to us:</p>
          <ul className="ml-4 space-y-1">
            <li>• All data is stored locally on your device</li>
            <li>• No data is sent to external servers</li>
            <li>• You have full control over your data</li>
            <li>• Export your data anytime in multiple formats</li>
          </ul>
        </div>
      </div>

      {/* Reset Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            ⚠️ Reset All Settings
          </h4>
          <p className="text-xs text-red-700 dark:text-red-300 mb-3">
            This will reset all application settings to their default values. Your data will not be affected.
          </p>
          <button
            onClick={handleResetSettings}
            className="btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm"
          >
            Reset Settings
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Data Settings
        </h4>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div>Storage Location: {dataLocation || 'Default'}</div>
          <div>Auto Backup: {autoBackup ? 'Enabled' : 'Disabled'}</div>
          <div>Export Format: {exportFormat.toUpperCase()}</div>
        </div>
      </div>
    </div>
  )
}