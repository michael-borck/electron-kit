export type ModifierKey = 'ctrl' | 'cmd' | 'alt' | 'shift' | 'meta'
export type Key = string // Letters, numbers, function keys, etc.

export interface KeyCombination {
  modifiers: ModifierKey[]
  key: Key
  description?: string
}

export interface Shortcut {
  id: string
  name: string
  description: string
  category?: string
  keyCombination: KeyCombination
  action: () => void | Promise<void>
  context?: ShortcutContext
  enabled: boolean
  global?: boolean // Works when app is not focused
  priority?: number // Higher priority shortcuts override lower ones
  icon?: string
  tags?: string[]
}

export type ShortcutContext = 
  | 'global' 
  | 'main'
  | 'editor' 
  | 'modal' 
  | 'settings'
  | 'search'
  | string // Custom contexts

export interface ShortcutScheme {
  id: string
  name: string
  description?: string
  shortcuts: Record<string, KeyCombination> // shortcut id -> key combination
  author?: string
  version?: string
  createdAt?: number
  updatedAt?: number
}

export interface ShortcutConflict {
  shortcutId1: string
  shortcutId2: string
  keyCombination: KeyCombination
  context: ShortcutContext
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
}

export interface ShortcutCategory {
  id: string
  name: string
  description?: string
  icon?: string
  order?: number
  color?: string
}

export interface ShortcutConfig {
  enabled: boolean
  globalShortcutsEnabled: boolean
  showInMenus: boolean
  showTooltips: boolean
  enableConflictDetection: boolean
  currentScheme: string
  customizations: Record<string, KeyCombination> // shortcut id -> custom key
  disabledShortcuts: string[]
  contextPriority: ShortcutContext[]
}

export interface ShortcutStats {
  totalShortcuts: number
  enabledShortcuts: number
  globalShortcuts: number
  customizations: number
  conflicts: number
  usage: Record<string, number> // shortcut id -> usage count
  lastUsed: Record<string, number> // shortcut id -> timestamp
}

export interface ShortcutEvent {
  type: 'triggered' | 'registered' | 'unregistered' | 'conflict' | 'scheme-changed'
  shortcutId?: string
  keyCombination?: KeyCombination
  context?: ShortcutContext
  timestamp: number
  data?: any
}

export interface KeySequence {
  keys: KeyCombination[]
  timeout?: number // ms between key combinations
  description?: string
}

export interface ChordShortcut extends Omit<Shortcut, 'keyCombination'> {
  sequence: KeySequence
}

export interface ShortcutHelpGroup {
  category: string
  shortcuts: Array<{
    id: string
    name: string
    keys: string
    description: string
  }>
}

export interface ShortcutRecording {
  isRecording: boolean
  recordedKeys: ModifierKey[]
  recordedKey?: string
  isValid: boolean
  conflictsWith?: string[]
}

export interface ShortcutProvider {
  id: string
  name: string
  description?: string
  shortcuts: Shortcut[]
  initialize?: () => void | Promise<void>
  cleanup?: () => void | Promise<void>
}