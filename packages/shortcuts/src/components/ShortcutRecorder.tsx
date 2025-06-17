import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useShortcutStore } from '../stores/shortcutStore'
import type { KeyCombination, ModifierKey } from '../types'

interface ShortcutRecorderProps {
  shortcutId: string
  onClose: () => void
}

export const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({
  shortcutId,
  onClose
}) => {
  const {
    shortcuts,
    getShortcutString,
    customize,
    findConflicts,
    currentContext,
    startRecording,
    stopRecording,
    recording
  } = useShortcutStore()

  const [recordedKeys, setRecordedKeys] = useState<KeyCombination | null>(null)
  const [conflicts, setConflicts] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)

  const shortcut = shortcuts.find(s => s.id === shortcutId)

  useEffect(() => {
    if (recording.isRecording) {
      setIsListening(true)
    } else if (recording.recordedKey) {
      const keys: KeyCombination = {
        modifiers: recording.recordedKeys,
        key: recording.recordedKey
      }
      setRecordedKeys(keys)
      setIsListening(false)
      
      // Check for conflicts
      const foundConflicts = findConflicts(keys, currentContext, shortcutId)
      setConflicts(foundConflicts.map(c => c.shortcutId2))
    }
  }, [recording, findConflicts, currentContext, shortcutId])

  const handleStartRecording = () => {
    setRecordedKeys(null)
    setConflicts([])
    startRecording(shortcutId)
  }

  const handleStopRecording = () => {
    stopRecording()
    setIsListening(false)
  }

  const handleSave = () => {
    if (recordedKeys && conflicts.length === 0) {
      customize(shortcutId, recordedKeys)
      onClose()
    }
  }

  const handleCancel = () => {
    stopRecording()
    onClose()
  }

  if (!shortcut) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Record New Shortcut
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Recording shortcut for: <span className="font-medium">{shortcut.name}</span>
            </p>
          </div>

          {/* Current Shortcut */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current shortcut:
            </div>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
              {getShortcutString(shortcut.keyCombination)}
            </kbd>
          </div>

          {/* Recording Area */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {isListening ? 'Press the key combination...' : 'New shortcut:'}
            </div>
            
            <div className={`
              h-16 border-2 border-dashed rounded-lg flex items-center justify-center
              ${isListening 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
              }
            `}>
              {isListening ? (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <span className="text-sm font-medium">Listening for keys...</span>
                </div>
              ) : recordedKeys ? (
                <kbd className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-lg font-mono text-gray-700 dark:text-gray-300">
                  {getShortcutString(recordedKeys)}
                </kbd>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Click "Record" to capture a new shortcut
                </span>
              )}
            </div>
          </div>

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                <span>⚠️</span>
                <span className="font-medium text-sm">Shortcut Conflict</span>
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                This shortcut is already used by:
                <ul className="list-disc list-inside mt-1">
                  {conflicts.map(conflictId => {
                    const conflictShortcut = shortcuts.find(s => s.id === conflictId)
                    return (
                      <li key={conflictId}>
                        {conflictShortcut?.name || conflictId}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">Tips:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Use Ctrl/Cmd + letter for standard shortcuts</li>
                <li>Add Shift or Alt for more combinations</li>
                <li>Function keys (F1-F12) work well for global shortcuts</li>
                <li>Press Escape to cancel recording</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            {!isListening && !recordedKeys && (
              <button
                onClick={handleStartRecording}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Record
              </button>
            )}
            
            {isListening && (
              <button
                onClick={handleStopRecording}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                Stop Recording
              </button>
            )}
            
            {recordedKeys && (
              <>
                <button
                  onClick={handleStartRecording}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Record Again
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={conflicts.length > 0}
                  className={`px-4 py-2 rounded transition-colors ${
                    conflicts.length > 0
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}