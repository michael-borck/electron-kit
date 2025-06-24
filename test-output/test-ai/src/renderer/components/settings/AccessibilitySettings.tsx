import React from 'react'
import { useSettingsStore } from '../../stores/settings'

export const AccessibilitySettings: React.FC = () => {
  const { settings, updateAccessibility } = useSettingsStore()
  const { highContrast, reduceMotion, keyboardShortcuts } = settings.accessibility

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Accessibility
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configure accessibility features to improve usability for all users.
        </p>
      </div>

      {/* High Contrast */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              High Contrast Mode
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Increase color contrast for better visibility and readability
            </p>
          </div>
        </label>
      </div>

      {/* Reduce Motion */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => updateAccessibility({ reduceMotion: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reduce Motion
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Minimize animations and transitions to reduce motion sensitivity
            </p>
          </div>
        </label>
      </div>

      {/* Keyboard Shortcuts */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={keyboardShortcuts}
            onChange={(e) => updateAccessibility({ keyboardShortcuts: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Keyboard Shortcuts
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use keyboard shortcuts for navigation and common actions
            </p>
          </div>
        </label>
      </div>

      {/* Keyboard Shortcuts Reference */}
      {keyboardShortcuts && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Keyboard Shortcuts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Settings</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+,</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">New</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+N</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Open</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+O</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Save</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Zoom In</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl++</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Zoom Out</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+-</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Information */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          🌟 Screen Reader Support
        </h4>
        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
          <p>This application includes comprehensive screen reader support:</p>
          <ul className="ml-4 space-y-1">
            <li>• Proper ARIA labels and roles</li>
            <li>• Semantic HTML structure</li>
            <li>• Focus management for modals and navigation</li>
            <li>• Descriptive text for interactive elements</li>
          </ul>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 System Integration
        </h4>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p>The application also respects your system accessibility preferences:</p>
          <ul className="ml-4 space-y-1">
            <li>• System theme preferences (light/dark)</li>
            <li>• System font size settings</li>
            <li>• System motion preferences</li>
            <li>• System high contrast settings</li>
          </ul>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Accessibility Settings
        </h4>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div>High Contrast: {highContrast ? 'Enabled' : 'Disabled'}</div>
          <div>Reduce Motion: {reduceMotion ? 'Enabled' : 'Disabled'}</div>
          <div>Keyboard Shortcuts: {keyboardShortcuts ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>
    </div>
  )
}