import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/app'
import { useTheme } from '../../hooks/useTheme'
import { Icon } from '../ui/Icon'

export const Header: React.FC = () => {
  const location = useLocation()
  const { setSettingsOpen, appInfo } = useAppStore()
  const { currentTheme, toggleTheme } = useTheme()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Home'
      case '/settings':
        return 'Settings'
      case '/about':
        return 'About'
      default:
        return 'Template App'
    }
  }

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'dark':
        return 'Moon'
      case 'light':
        return 'Sun'
      default:
        return 'Monitor'
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {getPageTitle()}
          </h1>
          {appInfo && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {appInfo.name} v{appInfo.version}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle theme"
          >
            <Icon 
              name={getThemeIcon() as any} 
              size={20}
              className="text-gray-600 dark:text-gray-400"
            />
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Open settings"
          >
            <Icon 
              name="Settings" 
              size={20}
              className="text-gray-600 dark:text-gray-400"
            />
          </button>
        </div>
      </div>
    </header>
  )
}