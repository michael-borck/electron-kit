import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpdateStore } from '../stores/updateStore'
import type { UpdateSchedule } from '../types'

interface UpdateSettingsProps {
  className?: string
}

export const UpdateSettings: React.FC<UpdateSettingsProps> = ({ className = '' }) => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    config,
    updateConfig,
    setChannel,
    getStats,
    getDiagnostics
  } = useUpdateStore()

  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'advanced' | 'diagnostics'>('general')
  const [schedule, setSchedule] = useState<UpdateSchedule>({
    enabled: false,
    time: '09:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  })

  const stats = getStats()
  const diagnostics = getDiagnostics?.() || null

  const handleConfigChange = (key: string, value: any) => {
    updateConfig({ [key]: value })
  }

  const handleScheduleChange = (updates: Partial<UpdateSchedule>) => {
    const newSchedule = { ...schedule, ...updates }
    setSchedule(newSchedule)
    // Apply schedule through store
    useUpdateStore.getState().setUpdateSchedule(newSchedule)
  }

  const toggleScheduleDay = (day: string) => {
    const newDays = schedule.days.includes(day as any)
      ? schedule.days.filter(d => d !== day)
      : [...schedule.days, day as any]
    
    handleScheduleChange({ days: newDays })
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const dayLabels = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  }

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSettingsOpen(false)
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] mx-4 flex flex-col ${className}`}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Update Settings
                </h2>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { id: 'general', label: 'General' },
                  { id: 'schedule', label: 'Schedule' },
                  { id: 'advanced', label: 'Advanced' },
                  { id: 'diagnostics', label: 'Diagnostics' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Auto-check for updates */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Automatically check for updates
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Check for new versions in the background
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoCheckForUpdates}
                        onChange={(e) => handleConfigChange('autoCheckForUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Check frequency */}
                  {config.autoCheckForUpdates && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Check frequency
                      </label>
                      <select
                        value={config.checkFrequency}
                        onChange={(e) => handleConfigChange('checkFrequency', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={1}>Every hour</option>
                        <option value={4}>Every 4 hours</option>
                        <option value={12}>Every 12 hours</option>
                        <option value={24}>Daily</option>
                        <option value={168}>Weekly</option>
                      </select>
                    </div>
                  )}

                  {/* Auto-download */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Automatically download updates
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Download updates in the background when found
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoDownload}
                        onChange={(e) => handleConfigChange('autoDownload', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Update channel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Update channel
                    </label>
                    <select
                      value={config.updateChannel}
                      onChange={(e) => setChannel(e.target.value as any)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="stable">Stable (Recommended)</option>
                      <option value="beta">Beta</option>
                      <option value="alpha">Alpha (Experimental)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {config.updateChannel === 'stable' && 'Get the most stable and tested releases'}
                      {config.updateChannel === 'beta' && 'Get pre-release versions with new features'}
                      {config.updateChannel === 'alpha' && 'Get experimental builds (may be unstable)'}
                    </p>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Show notifications
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Display notifications when updates are available
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.notifyUser}
                        onChange={(e) => handleConfigChange('notifyUser', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Enable scheduled updates
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Check for updates at specific times
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schedule.enabled}
                        onChange={(e) => handleScheduleChange({ enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {schedule.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Check time
                        </label>
                        <input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => handleScheduleChange({ time: e.target.value })}
                          className="block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Days of week
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {Object.entries(dayLabels).map(([day, label]) => (
                            <button
                              key={day}
                              onClick={() => toggleScheduleDay(day)}
                              className={`p-2 text-xs font-medium rounded-md transition-colors ${
                                schedule.days.includes(day as any)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Install on app quit
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically install updates when the app is closed
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoInstallOnAppQuit}
                        onChange={(e) => handleConfigChange('autoInstallOnAppQuit', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Allow pre-release versions
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Include beta and release candidate versions
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allowPrerelease}
                        onChange={(e) => handleConfigChange('allowPrerelease', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Enable rollback
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow rolling back to previous versions
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableRollback}
                        onChange={(e) => handleConfigChange('enableRollback', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {config.enableRollback && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Maximum rollback versions
                      </label>
                      <select
                        value={config.maxRollbackVersions}
                        onChange={(e) => handleConfigChange('maxRollbackVersions', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={1}>1 version</option>
                        <option value={3}>3 versions</option>
                        <option value={5}>5 versions</option>
                        <option value={10}>10 versions</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Verify signatures
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Verify digital signatures of update packages (recommended)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.verifySignature}
                        onChange={(e) => handleConfigChange('verifySignature', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Diagnostics Tab */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Update Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.totalChecks}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Total Checks
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.updatesFound}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Updates Found
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.updatesInstalled}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Installed
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.updateErrors}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Errors
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  {diagnostics && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        System Information
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Platform:</span>
                          <span className="text-gray-900 dark:text-white font-mono">
                            {diagnostics.platform} ({diagnostics.arch})
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Current Version:</span>
                          <span className="text-gray-900 dark:text-white font-mono">
                            {diagnostics.currentVersion}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Update Channel:</span>
                          <span className="text-gray-900 dark:text-white">
                            {diagnostics.updateChannel}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Network Status:</span>
                          <span className={`text-sm font-medium ${
                            diagnostics.networkStatus === 'online' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {diagnostics.networkStatus}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Last Check:</span>
                          <span className="text-gray-900 dark:text-white">
                            {diagnostics.lastCheck 
                              ? new Date(diagnostics.lastCheck).toLocaleString()
                              : 'Never'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}