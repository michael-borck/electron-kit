import React, { useState } from 'react'
import { useAppStore } from '../../stores/app'
import { Icon } from '../ui/Icon'
import { AppearanceSettings } from './AppearanceSettings'
import { WindowSettings } from './WindowSettings'
import { BehaviorSettings } from './BehaviorSettings'
import { AccessibilitySettings } from './AccessibilitySettings'
import { DataSettings } from './DataSettings'

type SettingsTab = 'appearance' | 'window' | 'behavior' | 'accessibility' | 'data'

interface SettingsTabConfig {
  id: SettingsTab
  label: string
  icon: string
  component: React.ComponentType
}

const settingsTabs: SettingsTabConfig[] = [
  { id: 'appearance', label: 'Appearance', icon: 'Sun', component: AppearanceSettings },
  { id: 'window', label: 'Window', icon: 'Monitor', component: WindowSettings },
  { id: 'behavior', label: 'Behavior', icon: 'Settings', component: BehaviorSettings },
  { id: 'accessibility', label: 'Accessibility', icon: 'Settings', component: AccessibilitySettings },
  { id: 'data', label: 'Data', icon: 'Settings', component: DataSettings }
]

export const SettingsModal: React.FC = () => {
  const { setSettingsOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')

  const handleClose = () => {
    setSettingsOpen(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const ActiveComponent = settingsTabs.find(tab => tab.id === activeTab)?.component || AppearanceSettings

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon name="X" size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex h-[600px]">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4">
              <ul className="space-y-1">
                {settingsTabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                        ${activeTab === tab.id
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <Icon 
                        name={tab.icon as any} 
                        size={18}
                        className={activeTab === tab.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
                      />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <ActiveComponent />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="btn btn-secondary px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}