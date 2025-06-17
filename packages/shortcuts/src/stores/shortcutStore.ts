import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ShortcutManager } from '../ShortcutManager'
import type {
  Shortcut,
  ShortcutScheme,
  ShortcutCategory,
  ShortcutConfig,
  ShortcutContext,
  KeyCombination,
  ShortcutConflict,
  ShortcutStats,
  ShortcutRecording
} from '../types'

interface ShortcutStore {
  // Core state
  manager: ShortcutManager
  shortcuts: Shortcut[]
  categories: ShortcutCategory[]
  schemes: ShortcutScheme[]
  config: ShortcutConfig
  currentContext: ShortcutContext
  
  // UI state
  isHelpOpen: boolean
  isSettingsOpen: boolean
  selectedCategory: string | null
  searchQuery: string
  
  // Recording state
  recording: ShortcutRecording
  recordingShortcutId: string | null
  
  // Conflicts
  conflicts: ShortcutConflict[]
  
  // Actions - Basic management
  setContext: (context: ShortcutContext) => void
  register: (shortcut: Shortcut) => void
  unregister: (shortcutId: string) => void
  enable: (shortcutId: string) => void
  disable: (shortcutId: string) => void
  
  // Actions - Customization
  customize: (shortcutId: string, keyCombination: KeyCombination) => void
  reset: (shortcutId: string) => void
  
  // Actions - Schemes
  loadScheme: (schemeId: string) => void
  saveScheme: (scheme: ShortcutScheme) => void
  exportScheme: (schemeId: string) => string | null
  importScheme: (schemeData: string) => boolean
  
  // Actions - Configuration
  updateConfig: (updates: Partial<ShortcutConfig>) => void
  
  // Actions - UI
  setHelpOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSelectedCategory: (categoryId: string | null) => void
  setSearchQuery: (query: string) => void
  
  // Actions - Recording
  startRecording: (shortcutId: string) => void
  stopRecording: () => void
  
  // Actions - Categories
  addCategory: (category: ShortcutCategory) => void
  
  // Getters
  getShortcutsByCategory: (category: string) => Shortcut[]
  getShortcutsByContext: (context: ShortcutContext) => Shortcut[]
  getFilteredShortcuts: () => Shortcut[]
  getStats: () => ShortcutStats
  getShortcutString: (combination: KeyCombination) => string
  findConflicts: (keyCombination: KeyCombination, context: ShortcutContext, excludeId?: string) => ShortcutConflict[]
  
  // Internal
  refresh: () => void
}

export const useShortcutStore = create<ShortcutStore>()(
  persist(
    (set, get) => {
      const manager = new ShortcutManager()
      
      // Listen for manager events
      manager.on('shortcut-registered', () => get().refresh())
      manager.on('shortcut-unregistered', () => get().refresh())
      manager.on('shortcut-triggered', () => get().refresh())
      manager.on('context-changed', (event) => {
        set({ currentContext: event.to })
      })
      manager.on('config-updated', (config) => {
        set({ config })
      })
      manager.on('scheme-changed', () => get().refresh())
      manager.on('conflict-detected', (conflicts) => {
        set({ conflicts })
      })

      return {
        // Initial state
        manager,
        shortcuts: [],
        categories: [],
        schemes: [],
        config: manager.getConfig(),
        currentContext: 'global',
        
        // UI state
        isHelpOpen: false,
        isSettingsOpen: false,
        selectedCategory: null,
        searchQuery: '',
        
        // Recording state
        recording: {
          isRecording: false,
          recordedKeys: [],
          isValid: false
        },
        recordingShortcutId: null,
        
        // Conflicts
        conflicts: [],
        
        // Basic management actions
        setContext: (context) => {
          manager.setContext(context)
        },
        
        register: (shortcut) => {
          manager.register(shortcut)
          get().refresh()
        },
        
        unregister: (shortcutId) => {
          manager.unregister(shortcutId)
          get().refresh()
        },
        
        enable: (shortcutId) => {
          manager.enable(shortcutId)
          get().refresh()
        },
        
        disable: (shortcutId) => {
          manager.disable(shortcutId)
          get().refresh()
        },
        
        // Customization actions
        customize: (shortcutId, keyCombination) => {
          const success = manager.customize(shortcutId, keyCombination)
          if (success) {
            get().refresh()
          }
        },
        
        reset: (shortcutId) => {
          manager.reset(shortcutId)
          get().refresh()
        },
        
        // Scheme actions
        loadScheme: (schemeId) => {
          manager.loadScheme(schemeId)
          get().refresh()
        },
        
        saveScheme: (scheme) => {
          manager.saveScheme(scheme)
          get().refresh()
        },
        
        exportScheme: (schemeId) => {
          return manager.exportScheme(schemeId)
        },
        
        importScheme: (schemeData) => {
          const success = manager.importScheme(schemeData)
          if (success) {
            get().refresh()
          }
          return success
        },
        
        // Configuration actions
        updateConfig: (updates) => {
          manager.updateConfig(updates)
        },
        
        // UI actions
        setHelpOpen: (open) => {
          set({ isHelpOpen: open })
        },
        
        setSettingsOpen: (open) => {
          set({ isSettingsOpen: open })
        },
        
        setSelectedCategory: (categoryId) => {
          set({ selectedCategory: categoryId })
        },
        
        setSearchQuery: (query) => {
          set({ searchQuery: query })
        },
        
        // Recording actions
        startRecording: (shortcutId) => {
          set({ 
            recordingShortcutId: shortcutId,
            recording: {
              isRecording: true,
              recordedKeys: [],
              isValid: false
            }
          })
          
          manager.startRecording((keys) => {
            if (keys) {
              // Validate the key combination
              const conflicts = manager.findConflicts(keys, get().currentContext, shortcutId)
              const isValid = conflicts.length === 0
              
              set({
                recording: {
                  isRecording: false,
                  recordedKeys: keys.modifiers,
                  recordedKey: keys.key,
                  isValid,
                  conflictsWith: conflicts.map(c => c.shortcutId2)
                }
              })
              
              if (isValid) {
                // Auto-apply the new key combination
                get().customize(shortcutId, keys)
                get().stopRecording()
              }
            } else {
              // Recording cancelled
              get().stopRecording()
            }
          })
        },
        
        stopRecording: () => {
          manager.stopRecording()
          set({
            recordingShortcutId: null,
            recording: {
              isRecording: false,
              recordedKeys: [],
              isValid: false
            }
          })
        },
        
        // Category actions
        addCategory: (category) => {
          manager.addCategory(category)
          get().refresh()
        },
        
        // Getters
        getShortcutsByCategory: (category) => {
          return manager.getShortcutsByCategory(category)
        },
        
        getShortcutsByContext: (context) => {
          return manager.getShortcutsByContext(context)
        },
        
        getFilteredShortcuts: () => {
          const { shortcuts, selectedCategory, searchQuery } = get()
          
          let filtered = shortcuts
          
          // Filter by category
          if (selectedCategory) {
            filtered = filtered.filter(s => s.category === selectedCategory)
          }
          
          // Filter by search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(s => 
              s.name.toLowerCase().includes(query) ||
              s.description.toLowerCase().includes(query) ||
              s.tags?.some(tag => tag.toLowerCase().includes(query)) ||
              manager.getShortcutString(s.keyCombination).toLowerCase().includes(query)
            )
          }
          
          return filtered
        },
        
        getStats: () => {
          return manager.getStats()
        },
        
        getShortcutString: (combination) => {
          return manager.getShortcutString(combination)
        },
        
        findConflicts: (keyCombination, context, excludeId) => {
          return manager.findConflicts(keyCombination, context, excludeId)
        },
        
        // Internal refresh
        refresh: () => {
          set({
            shortcuts: manager.getShortcuts(),
            categories: manager.getCategories(),
            schemes: manager.getSchemes(),
            config: manager.getConfig(),
            currentContext: manager.getContext()
          })
        }
      }
    },
    {
      name: 'shortcut-store',
      partialize: (state) => ({
        // Only persist configuration and UI preferences
        config: state.config,
        selectedCategory: state.selectedCategory
      }),
      merge: (persistedState, currentState) => {
        if (persistedState?.config) {
          // Update manager config with persisted settings
          currentState.manager.updateConfig(persistedState.config)
        }
        return {
          ...currentState,
          ...persistedState,
          // Always refresh from manager after hydration
          shortcuts: currentState.manager.getShortcuts(),
          categories: currentState.manager.getCategories(),
          schemes: currentState.manager.getSchemes(),
          config: currentState.manager.getConfig(),
          currentContext: currentState.manager.getContext()
        }
      }
    }
  )
)