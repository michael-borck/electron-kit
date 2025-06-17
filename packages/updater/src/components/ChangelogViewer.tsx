import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpdateStore } from '../stores/updateStore'
import type { ChangelogEntry } from '../types'

interface ChangelogViewerProps {
  className?: string
}

export const ChangelogViewer: React.FC<ChangelogViewerProps> = ({ className = '' }) => {
  const {
    isChangelogOpen,
    setChangelogOpen,
    selectedChangelogVersion,
    setSelectedChangelogVersion,
    changelog,
    getCurrentVersion,
    getChangelogSince
  } = useUpdateStore()

  const [selectedTab, setSelectedTab] = useState<'recent' | 'all'>('recent')

  const currentVersion = getCurrentVersion()
  const recentChangelog = currentVersion ? getChangelogSince(currentVersion) : []
  const displayChangelog = selectedTab === 'recent' ? recentChangelog : changelog

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      case 'improvement':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'bugfix':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'security':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'breaking':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getVersionBadgeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'patch':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AnimatePresence>
      {isChangelogOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setChangelogOpen(false)
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
                  Release History
                </h2>
                <button
                  onClick={() => setChangelogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setSelectedTab('recent')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === 'recent'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Recent Changes ({recentChangelog.length})
                </button>
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === 'all'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  All Versions ({changelog.length})
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Sidebar - Version List */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {displayChangelog.map((entry) => (
                    <button
                      key={entry.version}
                      onClick={() => setSelectedChangelogVersion(entry.version)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedChangelogVersion === entry.version
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          v{entry.version}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVersionBadgeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {formatDate(entry.date)}
                      </div>
                      {entry.critical && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Critical
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.changes.length} changes
                      </div>
                    </button>
                  ))}
                  
                  {displayChangelog.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {selectedTab === 'recent' ? 'No recent changes' : 'No changelog available'}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content - Change Details */}
              <div className="flex-1 overflow-y-auto">
                {selectedChangelogVersion && (() => {
                  const selectedEntry = displayChangelog.find(entry => entry.version === selectedChangelogVersion)
                  return selectedEntry ? (
                    <div className="p-6">
                      {/* Version Header */}
                      <div className="mb-6">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Version {selectedEntry.version}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getVersionBadgeColor(selectedEntry.type)}`}>
                            {selectedEntry.type}
                          </span>
                          {selectedEntry.critical && (
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              Critical
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Released on {formatDate(selectedEntry.date)}
                        </div>
                      </div>

                      {/* Changes */}
                      <div className="space-y-4">
                        {selectedEntry.changes.map((change, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              {getChangeTypeIcon(change.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {change.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {change.description}
                              </p>
                              {(change.issueUrl || change.pullRequestUrl) && (
                                <div className="flex space-x-3 mt-2">
                                  {change.issueUrl && (
                                    <a
                                      href={change.issueUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      View Issue
                                    </a>
                                  )}
                                  {change.pullRequestUrl && (
                                    <a
                                      href={change.pullRequestUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      View PR
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Download Link */}
                      {selectedEntry.downloadUrl && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                Download this version
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-400">
                                Get the standalone installer for version {selectedEntry.version}
                              </p>
                            </div>
                            <a
                              href={selectedEntry.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Download
                              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null
                })() || (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    Select a version to view details
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}