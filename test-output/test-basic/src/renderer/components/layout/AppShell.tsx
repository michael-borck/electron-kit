import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { NotificationCenter } from './NotificationCenter'
import { SettingsModal } from '../settings/SettingsModal'
import { useAppStore } from '../../stores/app'

interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { settingsOpen } = useAppStore()

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Notifications */}
      <NotificationCenter />

      {/* Settings Modal */}
      {settingsOpen && <SettingsModal />}
    </div>
  )
}