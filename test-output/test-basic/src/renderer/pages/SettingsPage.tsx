import React from 'react'

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Settings
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Use the settings button in the header or the keyboard shortcut (Ctrl/Cmd + ,) to open the settings modal.
          </p>
          
          <p className="text-gray-600 dark:text-gray-400">
            This page is a placeholder - the actual settings interface is available as a modal overlay for quick access from anywhere in the application.
          </p>
        </div>
      </div>
    </div>
  )
}