import React from 'react'
import { useAppStore } from '../stores/app'

export const HomePage: React.FC = () => {
  const { addNotification } = useAppStore()

  const handleTestNotification = () => {
    addNotification({
      type: 'success',
      title: 'Welcome!',
      message: 'This is a test notification from the home page.'
    })
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to Template App
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            This is the core template for building consistent Electron applications with React, TypeScript, and Tailwind CSS.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Modular Architecture
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Optional modules for AI services, charts, export functionality, and more.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Universal Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Consistent settings across all applications including theme, accessibility, and window management.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Cross-Platform
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Build for Windows, macOS, and Linux with automated GitHub Actions workflows.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={handleTestNotification}
              className="btn btn-primary px-4 py-2"
            >
              Test Notification
            </button>
            
            <button
              onClick={() => useAppStore.getState().setSettingsOpen(true)}
              className="btn btn-secondary px-4 py-2"
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}