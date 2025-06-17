import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShortcutStore } from '../stores/shortcutStore'
import type { ShortcutHelpGroup } from '../types'

interface ShortcutHelpProps {
  className?: string
  style?: React.CSSProperties
  showCategories?: boolean
  compactMode?: boolean
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({
  className = '',
  style,
  showCategories = true,
  compactMode = false
}) => {
  const {
    isHelpOpen,
    setHelpOpen,
    getFilteredShortcuts,
    categories,
    getShortcutString,
    currentContext,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory
  } = useShortcutStore()

  const shortcuts = getFilteredShortcuts()

  // Group shortcuts by category
  const groupedShortcuts: ShortcutHelpGroup[] = React.useMemo(() => {
    const groups = new Map<string, ShortcutHelpGroup>()
    
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General'
      
      if (!groups.has(category)) {
        groups.set(category, {
          category,
          shortcuts: []
        })
      }
      
      groups.get(category)!.shortcuts.push({
        id: shortcut.id,
        name: shortcut.name,
        keys: getShortcutString(shortcut.keyCombination),
        description: shortcut.description
      })
    })
    
    // Sort shortcuts within each group
    for (const group of groups.values()) {
      group.shortcuts.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return Array.from(groups.values()).sort((a, b) => a.category.localeCompare(b.category))
  }, [shortcuts, getShortcutString])

  if (!isHelpOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setHelpOpen(true)}
          className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
          title="Show keyboard shortcuts (Press ? to toggle)"
        >
          ⌨️
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setHelpOpen(false)}
      />

      {/* Help Panel */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`fixed inset-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh] ${className}`}
        style={style}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Context: <span className="font-medium">{currentContext}</span>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-500 dark:text-gray-400">✕</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">🔍</span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          {showCategories && categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.icon && <span>{category.icon}</span>}
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {groupedShortcuts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <span className="text-4xl mb-4">⌨️</span>
              <p className="text-lg font-medium mb-2">No shortcuts found</p>
              <p className="text-sm">
                {searchQuery ? 'Try different search terms' : 'No shortcuts available for this context'}
              </p>
            </div>
          ) : (
            <div className={`space-y-6 ${compactMode ? 'space-y-4' : ''}`}>
              {groupedShortcuts.map((group) => (
                <div key={group.category}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {group.category}
                  </h3>
                  <div className={`grid gap-2 ${compactMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {shortcut.name}
                          </div>
                          {!compactMode && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {shortcut.description}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                            {shortcut.keys}
                          </kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>{shortcuts.length} shortcuts shown</span>
              <span>Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-mono text-xs">?</kbd> to toggle this help</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHelpOpen(false)}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// Hook to register the help shortcut
export const useShortcutHelp = () => {
  const { setHelpOpen, isHelpOpen } = useShortcutStore()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle help with ? key (Shift + /)
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Only if not in an input field
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault()
          setHelpOpen(!isHelpOpen)
        }
      }
      
      // Close help with Escape
      if (event.key === 'Escape' && isHelpOpen) {
        event.preventDefault()
        setHelpOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setHelpOpen, isHelpOpen])
}