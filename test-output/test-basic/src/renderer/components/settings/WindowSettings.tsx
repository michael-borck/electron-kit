import React from 'react'
import { useSettingsStore } from '../../stores/settings'
import { useAppStore } from '../../stores/app'

export const WindowSettings: React.FC = () => {
  const { settings, updateWindow } = useSettingsStore()
  const { setSidebarCollapsed } = useAppStore()
  const { persistState, sidebarExpanded, zoomLevel, alwaysOnTop } = settings.window

  const zoomOptions = [
    { value: 0.8, label: '80%' },
    { value: 0.9, label: '90%' },
    { value: 1.0, label: '100%' },
    { value: 1.1, label: '110%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' }
  ]

  const handleSidebarToggle = (expanded: boolean) => {
    updateWindow({ sidebarExpanded: expanded })
    setSidebarCollapsed(!expanded)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Window & Layout
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configure window behavior and layout preferences.
        </p>
      </div>

      {/* Window State Persistence */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={persistState}
            onChange={(e) => updateWindow({ persistState: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Remember Window State
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Save window size, position, and maximized state between sessions
            </p>
          </div>
        </label>
      </div>

      {/* Sidebar Expanded */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={sidebarExpanded}
            onChange={(e) => handleSidebarToggle(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sidebar Expanded
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Show sidebar in expanded state by default
            </p>
          </div>
        </label>
      </div>

      {/* Zoom Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Zoom Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {zoomOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateWindow({ zoomLevel: option.value })}
              className={`
                p-2 text-sm rounded border transition-colors
                ${Math.abs(zoomLevel - option.value) < 0.01
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => updateWindow({ zoomLevel: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>50%</span>
            <span>Current: {Math.round(zoomLevel * 100)}%</span>
            <span>200%</span>
          </div>
        </div>
      </div>

      {/* Always on Top */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={alwaysOnTop}
            onChange={(e) => updateWindow({ alwaysOnTop: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Always on Top
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Keep this window above all other windows
            </p>
          </div>
        </label>
      </div>

      {/* Window Info */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Window State
        </h4>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div>Zoom Level: {Math.round(zoomLevel * 100)}%</div>
          <div>Sidebar: {sidebarExpanded ? 'Expanded' : 'Collapsed'}</div>
          <div>Persistence: {persistState ? 'Enabled' : 'Disabled'}</div>
          <div>Always on Top: {alwaysOnTop ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  )
}