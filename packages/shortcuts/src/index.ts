// Core manager
export { ShortcutManager } from './ShortcutManager'

// Store
export { useShortcutStore } from './stores/shortcutStore'

// Components
export { ShortcutHelp, useShortcutHelp } from './components/ShortcutHelp'
export { ShortcutSettings } from './components/ShortcutSettings'
export { ShortcutRecorder } from './components/ShortcutRecorder'

// Types
export type {
  ModifierKey,
  Key,
  KeyCombination,
  Shortcut,
  ShortcutContext,
  ShortcutScheme,
  ShortcutConflict,
  ShortcutCategory,
  ShortcutConfig,
  ShortcutStats,
  ShortcutEvent,
  KeySequence,
  ChordShortcut,
  ShortcutHelpGroup,
  ShortcutRecording,
  ShortcutProvider
} from './types'