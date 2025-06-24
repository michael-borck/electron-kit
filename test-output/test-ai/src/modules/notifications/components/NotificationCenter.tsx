import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '../stores/notificationStore'
import type { NotificationType } from '../types'

interface NotificationCenterProps {
  className?: string
  style?: React.CSSProperties
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  style
}) => {
  const {
    isHistoryOpen,
    setHistoryOpen,
    history,
    clearHistory,
    getUnreadCount,
    getStats,
    config,
    toggleDoNotDisturb
  } = useNotificationStore()

  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const unreadCount = getUnreadCount()
  const stats = getStats()

  // Filter history based on type and search
  const filteredHistory = history.filter(item => {
    const typeMatch = selectedType === 'all' || item.type === selectedType
    const searchMatch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return typeMatch && searchMatch
  })

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      case 'loading': return '⏳'
      default: return 'ℹ️'
    }
  }

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'info': return 'text-blue-600 dark:text-blue-400'
      case 'loading': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Toggle Button */}
      <div className="relative">
        <button
          onClick={() => setHistoryOpen(!isHistoryOpen)}
          className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Notification Center"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Center Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setHistoryOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col ${className}`}
              style={style}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h2>
                  <button
                    onClick={() => setHistoryOpen(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={toggleDoNotDisturb}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      config.doNotDisturb
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {config.doNotDisturb ? '🔕 DND On' : '🔔 DND Off'}
                  </button>
                  
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Search */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type Filter */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${
                      selectedType === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type as NotificationType)}
                      className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                        selectedType === type
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{getTypeIcon(type as NotificationType)}</span>
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <span className="text-4xl mb-2">🔔</span>
                    <p className="text-sm">
                      {searchQuery ? 'No matching notifications' : 'No notifications yet'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredHistory.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 mb-2 rounded-lg border transition-colors cursor-pointer ${
                          item.dismissed
                            ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-60'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {item.title}
                              </h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                {formatTime(item.timestamp)}
                              </span>
                            </div>
                            
                            {item.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {item.message}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                {!item.dismissed && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                                {item.clicked && (
                                  <span className="text-xs text-green-600 dark:text-green-400">Clicked</span>
                                )}
                              </div>
                              
                              {item.duration > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {Math.round(item.duration / 1000)}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              {stats.total > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Total notifications:</span>
                      <span>{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dismissed:</span>
                      <span>{stats.dismissed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clicked:</span>
                      <span>{stats.clicked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. duration:</span>
                      <span>{Math.round(stats.avgDuration / 1000)}s</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}