import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpdateStore } from '../stores/updateStore'
import { UpdateProgress } from './UpdateProgress'
import { ChangelogViewer } from './ChangelogViewer'

interface UpdateDialogProps {
  className?: string
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({ className = '' }) => {
  const {
    isUpdateDialogOpen,
    setUpdateDialogOpen,
    status,
    config,
    isDownloading,
    isInstalling,
    downloadUpdate,
    installAndRestart,
    postponeUpdate,
    setChangelogOpen,
    getChangelogSince,
    getCurrentVersion
  } = useUpdateStore()

  const handleDownload = async () => {
    try {
      await downloadUpdate()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleInstall = async () => {
    try {
      await installAndRestart()
    } catch (error) {
      console.error('Installation failed:', error)
    }
  }

  const handleViewChangelog = () => {
    setChangelogOpen(true)
  }

  const handlePostpone = () => {
    postponeUpdate()
    setUpdateDialogOpen(false)
  }

  const currentVersion = getCurrentVersion()
  const availableVersion = status.availableVersion
  const changelog = availableVersion ? getChangelogSince(currentVersion || '0.0.0') : []

  return (
    <AnimatePresence>
      {isUpdateDialogOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUpdateDialogOpen(false)
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {status.state === 'downloaded' ? 'Update Ready' : 'Update Available'}
                </h2>
                <button
                  onClick={() => setUpdateDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isInstalling}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Version Info */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Current Version:</span>
                  <span className="font-mono">{currentVersion}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Available Version:</span>
                  <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                    {availableVersion}
                  </span>
                </div>
              </div>

              {/* Progress */}
              {(isDownloading || isInstalling) && (
                <div className="mb-4">
                  <UpdateProgress />
                </div>
              )}

              {/* Release Notes Preview */}
              {status.updateInfo?.releaseNotes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    What's New
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                    {status.updateInfo.releaseNotes.split('\n').slice(0, 3).map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                    {status.updateInfo.releaseNotes.split('\n').length > 3 && (
                      <div className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline mt-2"
                           onClick={handleViewChangelog}>
                        View full changelog...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Changelog Summary */}
              {changelog.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Changes Summary
                    </h3>
                    <button
                      onClick={handleViewChangelog}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                  <div className="space-y-1">
                    {changelog.slice(0, 2).map((entry) => (
                      <div key={entry.version} className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">v{entry.version}:</span>
                        <span className="ml-2">
                          {entry.changes.slice(0, 2).map(change => change.description).join(', ')}
                          {entry.changes.length > 2 && '...'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical Update Warning */}
              {changelog.some(entry => entry.critical) && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Critical Update
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        This update contains important security fixes and should be installed promptly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
              {status.state === 'downloaded' ? (
                <>
                  <button
                    onClick={handlePostpone}
                    disabled={isInstalling}
                    className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Postpone
                  </button>
                  <button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isInstalling ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Installing...
                      </>
                    ) : (
                      'Install & Restart'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePostpone}
                    disabled={isDownloading}
                    className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Later
                  </button>
                  {changelog.length > 0 && (
                    <button
                      onClick={handleViewChangelog}
                      disabled={isDownloading}
                      className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      View Changes
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      'Download Now'
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}