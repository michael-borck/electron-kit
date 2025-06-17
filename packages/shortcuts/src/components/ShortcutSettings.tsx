import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShortcutStore } from '../stores/shortcutStore'
import { ShortcutRecorder } from './ShortcutRecorder'
import type { Shortcut, ShortcutScheme } from '../types'

interface ShortcutSettingsProps {
  className?: string
  style?: React.CSSProperties
}

export const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({
  className = '',
  style
}) => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    shortcuts,
    categories,
    schemes,
    config,
    updateConfig,
    getShortcutsByCategory,
    getShortcutString,
    customize,
    reset,
    enable,
    disable,
    loadScheme,
    saveScheme,
    exportScheme,
    importScheme,
    conflicts,
    getStats
  } = useShortcutStore()

  const [selectedTab, setSelectedTab] = useState<'shortcuts' | 'schemes' | 'settings'>('shortcuts')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [showConflicts, setShowConflicts] = useState(false)

  const stats = getStats()

  // Filter shortcuts
  const filteredShortcuts = React.useMemo(() => {
    let filtered = shortcuts

    if (selectedCategory) {
      filtered = getShortcutsByCategory(selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        getShortcutString(s.keyCombination).toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [shortcuts, selectedCategory, searchQuery, getShortcutsByCategory, getShortcutString])

  const handleCustomize = (shortcutId: string, keys: string) => {
    // This would be handled by ShortcutRecorder
    setEditingShortcut(null)
  }

  const handleExportScheme = (schemeId: string) => {
    const data = exportScheme(schemeId)
    if (data) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shortcuts-${schemeId}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImportScheme = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const data = e.target?.result as string
          if (importScheme(data)) {
            alert('Scheme imported successfully!')
          } else {
            alert('Failed to import scheme. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const renderShortcutsTab = () => (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
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
        </div>

        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <span>⚠️</span>
              <span className="font-medium">
                {conflicts.length} shortcut conflict{conflicts.length !== 1 ? 's' : ''} detected
              </span>
            </div>
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              {showConflicts ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showConflicts && (
            <div className="mt-3 space-y-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300">
                  Shortcuts "{conflict.shortcutId1}" and "{conflict.shortcutId2}" both use {getShortcutString(conflict.keyCombination)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shortcuts List */}
      <div className="space-y-2">
        {filteredShortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className={`p-4 border rounded-lg transition-colors ${
              shortcut.enabled
                ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {shortcut.name}
                  </h4>
                  {shortcut.global && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                      Global
                    </span>
                  )}
                  {shortcut.category && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                      {shortcut.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {shortcut.description}
                </p>
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                {/* Current Shortcut */}
                <div className="text-right">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                    {getShortcutString(shortcut.keyCombination)}
                  </kbd>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingShortcut(shortcut.id)}
                    className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => reset(shortcut.id)}
                    className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                  >
                    Reset
                  </button>
                  
                  <button
                    onClick={() => shortcut.enabled ? disable(shortcut.id) : enable(shortcut.id)}
                    className={`px-2 py-1 text-sm ${
                      shortcut.enabled
                        ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
                        : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
                    }`}
                  >
                    {shortcut.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredShortcuts.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <span className="text-4xl mb-4 block">⌨️</span>
          <p>No shortcuts found</p>
        </div>
      )}
    </div>
  )

  const renderSchemesTab = () => (
    <div className="space-y-6">
      {/* Current Scheme */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Current Scheme
        </h3>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {schemes.find(s => s.id === config.currentScheme)?.name || 'Unknown'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {schemes.find(s => s.id === config.currentScheme)?.description}
              </div>
            </div>
            <button
              onClick={() => handleExportScheme(config.currentScheme)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Available Schemes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Available Schemes
          </h3>
          <button
            onClick={handleImportScheme}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
          >
            Import Scheme
          </button>
        </div>
        
        <div className="space-y-2">
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              className={`p-4 border rounded-lg transition-colors ${
                scheme.id === config.currentScheme
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {scheme.name}
                  </div>
                  {scheme.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {scheme.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Object.keys(scheme.shortcuts).length} shortcuts
                    {scheme.author && ` • by ${scheme.author}`}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {scheme.id !== config.currentScheme && (
                    <button
                      onClick={() => loadScheme(scheme.id)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                    >
                      Load
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleExportScheme(scheme.id)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-sm transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* General Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          General
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Shortcuts
            </label>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Global Shortcuts
            </label>
            <input
              type="checkbox"
              checked={config.globalShortcutsEnabled}
              onChange={(e) => updateConfig({ globalShortcutsEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show in Menus
            </label>
            <input
              type="checkbox"
              checked={config.showInMenus}
              onChange={(e) => updateConfig({ showInMenus: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Tooltips
            </label>
            <input
              type="checkbox"
              checked={config.showTooltips}
              onChange={(e) => updateConfig({ showTooltips: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conflict Detection
            </label>
            <input
              type="checkbox"
              checked={config.enableConflictDetection}
              onChange={(e) => updateConfig({ enableConflictDetection: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalShortcuts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Shortcuts
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.enabledShortcuts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Enabled
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.globalShortcuts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Global
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.customizations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Customized
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!isSettingsOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Settings Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`fixed top-0 right-0 h-full w-2/3 max-w-4xl bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col ${className}`}
        style={style}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Shortcut Settings
            </h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-500 dark:text-gray-400">✕</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'shortcuts', label: 'Shortcuts' },
              { id: 'schemes', label: 'Schemes' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'shortcuts' && renderShortcutsTab()}
          {selectedTab === 'schemes' && renderSchemesTab()}
          {selectedTab === 'settings' && renderGeneralTab()}
        </div>
      </motion.div>

      {/* Shortcut Recorder Modal */}
      {editingShortcut && (
        <ShortcutRecorder
          shortcutId={editingShortcut}
          onClose={() => setEditingShortcut(null)}
        />
      )}
    </>
  )
}