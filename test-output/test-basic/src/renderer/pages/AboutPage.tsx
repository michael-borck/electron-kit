import React from 'react'
import { useAppStore } from '../stores/app'

export const AboutPage: React.FC = () => {
  const { appInfo } = useAppStore()

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {appInfo?.name || 'Template App'}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Version {appInfo?.version || '1.0.0'}
          </p>
          
          <div className="max-w-2xl mx-auto text-left space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                About This Template
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This is a branded Electron application template built with React, TypeScript, and Tailwind CSS. 
                It provides a consistent foundation for building professional desktop applications with modern web technologies.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Technology Stack
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Electron - Cross-platform desktop app framework</li>
                <li>• React 18 - Modern UI library with hooks</li>
                <li>• TypeScript - Type-safe JavaScript</li>
                <li>• Tailwind CSS - Utility-first CSS framework</li>
                <li>• Vite - Fast build tool and dev server</li>
                <li>• Zustand - Lightweight state management</li>
              </ul>
            </div>

            {appInfo && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  System Information
                </h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Platform: {appInfo.platform}</li>
                  <li>• Version: {appInfo.version}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}