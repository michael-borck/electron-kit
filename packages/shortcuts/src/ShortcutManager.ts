import EventEmitter from 'eventemitter3'
import type {
  Shortcut,
  ShortcutScheme,
  ShortcutConflict,
  ShortcutCategory,
  ShortcutConfig,
  ShortcutStats,
  ShortcutEvent,
  ShortcutContext,
  KeyCombination,
  ModifierKey,
  ShortcutProvider
} from './types'

export class ShortcutManager extends EventEmitter {
  private shortcuts = new Map<string, Shortcut>()
  private categories = new Map<string, ShortcutCategory>()
  private schemes = new Map<string, ShortcutScheme>()
  private providers = new Map<string, ShortcutProvider>()
  private config: ShortcutConfig
  private currentContext: ShortcutContext = 'global'
  private keyListeners = new Map<string, (event: KeyboardEvent) => void>()
  private globalShortcuts = new Set<string>()
  private usageStats = new Map<string, number>()
  private lastUsed = new Map<string, number>()

  // For key recording
  private isRecording = false
  private recordingCallback?: (keys: KeyCombination | null) => void

  constructor(config: Partial<ShortcutConfig> = {}) {
    super()
    
    this.config = {
      enabled: true,
      globalShortcutsEnabled: true,
      showInMenus: true,
      showTooltips: true,
      enableConflictDetection: true,
      currentScheme: 'default',
      customizations: {},
      disabledShortcuts: [],
      contextPriority: ['modal', 'search', 'editor', 'main', 'global'],
      ...config
    }

    this.setupEventListeners()
    this.createDefaultScheme()
  }

  // Configuration
  updateConfig(updates: Partial<ShortcutConfig>): void {
    this.config = { ...this.config, ...updates }
    this.emit('config-updated', this.config)
  }

  getConfig(): ShortcutConfig {
    return { ...this.config }
  }

  // Context Management
  setContext(context: ShortcutContext): void {
    const previousContext = this.currentContext
    this.currentContext = context
    this.emit('context-changed', { from: previousContext, to: context })
  }

  getContext(): ShortcutContext {
    return this.currentContext
  }

  // Shortcut Registration
  register(shortcut: Shortcut): void {
    if (this.shortcuts.has(shortcut.id)) {
      console.warn(`Shortcut ${shortcut.id} is already registered`)
      return
    }

    // Apply customizations if they exist
    const customKeys = this.config.customizations[shortcut.id]
    if (customKeys) {
      shortcut.keyCombination = customKeys
    }

    // Check if disabled
    if (this.config.disabledShortcuts.includes(shortcut.id)) {
      shortcut.enabled = false
    }

    this.shortcuts.set(shortcut.id, shortcut)
    
    if (shortcut.enabled) {
      this.bindShortcut(shortcut)
    }

    this.emit('shortcut-registered', { 
      type: 'registered', 
      shortcutId: shortcut.id,
      keyCombination: shortcut.keyCombination,
      context: shortcut.context,
      timestamp: Date.now() 
    })
  }

  unregister(shortcutId: string): boolean {
    const shortcut = this.shortcuts.get(shortcutId)
    if (!shortcut) return false

    this.unbindShortcut(shortcut)
    this.shortcuts.delete(shortcutId)
    
    this.emit('shortcut-unregistered', { 
      type: 'unregistered', 
      shortcutId,
      timestamp: Date.now() 
    })

    return true
  }

  // Bulk registration
  registerProvider(provider: ShortcutProvider): void {
    this.providers.set(provider.id, provider)
    
    if (provider.initialize) {
      provider.initialize()
    }

    provider.shortcuts.forEach(shortcut => {
      this.register(shortcut)
    })
  }

  unregisterProvider(providerId: string): void {
    const provider = this.providers.get(providerId)
    if (!provider) return

    provider.shortcuts.forEach(shortcut => {
      this.unregister(shortcut.id)
    })

    if (provider.cleanup) {
      provider.cleanup()
    }

    this.providers.delete(providerId)
  }

  // Shortcut Management
  enable(shortcutId: string): boolean {
    const shortcut = this.shortcuts.get(shortcutId)
    if (!shortcut) return false

    shortcut.enabled = true
    this.bindShortcut(shortcut)
    
    // Remove from disabled list
    this.config.disabledShortcuts = this.config.disabledShortcuts.filter(id => id !== shortcutId)
    
    return true
  }

  disable(shortcutId: string): boolean {
    const shortcut = this.shortcuts.get(shortcutId)
    if (!shortcut) return false

    shortcut.enabled = false
    this.unbindShortcut(shortcut)
    
    // Add to disabled list
    if (!this.config.disabledShortcuts.includes(shortcutId)) {
      this.config.disabledShortcuts.push(shortcutId)
    }
    
    return true
  }

  customize(shortcutId: string, keyCombination: KeyCombination): boolean {
    const shortcut = this.shortcuts.get(shortcutId)
    if (!shortcut) return false

    // Check for conflicts
    const conflicts = this.findConflicts(keyCombination, shortcut.context || 'global', shortcutId)
    if (conflicts.length > 0 && this.config.enableConflictDetection) {
      this.emit('conflict-detected', conflicts)
      return false
    }

    // Unbind old shortcut
    this.unbindShortcut(shortcut)

    // Update shortcut
    shortcut.keyCombination = keyCombination
    this.config.customizations[shortcutId] = keyCombination

    // Rebind with new keys
    if (shortcut.enabled) {
      this.bindShortcut(shortcut)
    }

    return true
  }

  reset(shortcutId: string): boolean {
    const shortcut = this.shortcuts.get(shortcutId)
    if (!shortcut) return false

    // Remove customization
    delete this.config.customizations[shortcutId]

    // Reset to default from current scheme
    const scheme = this.schemes.get(this.config.currentScheme)
    if (scheme && scheme.shortcuts[shortcutId]) {
      shortcut.keyCombination = scheme.shortcuts[shortcutId]
    }

    // Rebind
    this.unbindShortcut(shortcut)
    if (shortcut.enabled) {
      this.bindShortcut(shortcut)
    }

    return true
  }

  // Key Binding
  private bindShortcut(shortcut: Shortcut): void {
    const keyString = this.getKeyString(shortcut.keyCombination)
    
    if (shortcut.global && this.config.globalShortcutsEnabled) {
      this.bindGlobalShortcut(shortcut, keyString)
    } else {
      this.bindLocalShortcut(shortcut, keyString)
    }
  }

  private unbindShortcut(shortcut: Shortcut): void {
    const keyString = this.getKeyString(shortcut.keyCombination)
    
    if (shortcut.global) {
      this.unbindGlobalShortcut(keyString)
    } else {
      this.unbindLocalShortcut(keyString)
    }
  }

  private bindGlobalShortcut(shortcut: Shortcut, keyString: string): void {
    // This would typically use electron's globalShortcut.register
    // For now, we'll track it and emit an event for the main process to handle
    this.globalShortcuts.add(shortcut.id)
    this.emit('bind-global', { shortcut, keyString })
  }

  private unbindGlobalShortcut(keyString: string): void {
    this.emit('unbind-global', { keyString })
  }

  private bindLocalShortcut(shortcut: Shortcut, keyString: string): void {
    const handler = (event: KeyboardEvent) => {
      if (!this.config.enabled || !shortcut.enabled) return
      
      // Check context
      if (shortcut.context && shortcut.context !== 'global' && shortcut.context !== this.currentContext) {
        return
      }

      if (this.matchesKeyCombination(event, shortcut.keyCombination)) {
        event.preventDefault()
        event.stopPropagation()
        this.triggerShortcut(shortcut)
      }
    }

    this.keyListeners.set(keyString, handler)
    document.addEventListener('keydown', handler, true)
  }

  private unbindLocalShortcut(keyString: string): void {
    const handler = this.keyListeners.get(keyString)
    if (handler) {
      document.removeEventListener('keydown', handler, true)
      this.keyListeners.delete(keyString)
    }
  }

  private triggerShortcut(shortcut: Shortcut): void {
    // Track usage
    this.usageStats.set(shortcut.id, (this.usageStats.get(shortcut.id) || 0) + 1)
    this.lastUsed.set(shortcut.id, Date.now())

    // Execute action
    try {
      const result = shortcut.action()
      if (result instanceof Promise) {
        result.catch(error => {
          console.error(`Shortcut ${shortcut.id} action failed:`, error)
        })
      }
    } catch (error) {
      console.error(`Shortcut ${shortcut.id} action failed:`, error)
    }

    this.emit('shortcut-triggered', { 
      type: 'triggered', 
      shortcutId: shortcut.id,
      keyCombination: shortcut.keyCombination,
      context: this.currentContext,
      timestamp: Date.now() 
    })
  }

  // Key Matching
  private matchesKeyCombination(event: KeyboardEvent, combination: KeyCombination): boolean {
    const eventModifiers = this.getEventModifiers(event)
    const requiredModifiers = new Set(combination.modifiers)

    // Check if all required modifiers are pressed
    for (const modifier of requiredModifiers) {
      if (!eventModifiers.has(modifier)) return false
    }

    // Check if any extra modifiers are pressed
    for (const modifier of eventModifiers) {
      if (!requiredModifiers.has(modifier)) return false
    }

    // Check key
    const key = this.normalizeKey(event.key)
    const targetKey = this.normalizeKey(combination.key)

    return key === targetKey
  }

  private getEventModifiers(event: KeyboardEvent): Set<ModifierKey> {
    const modifiers = new Set<ModifierKey>()
    
    if (event.ctrlKey) modifiers.add('ctrl')
    if (event.metaKey) modifiers.add('cmd')
    if (event.altKey) modifiers.add('alt')
    if (event.shiftKey) modifiers.add('shift')
    
    return modifiers
  }

  private normalizeKey(key: string): string {
    // Normalize key names
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Escape': 'Esc',
      'Delete': 'Del'
    }
    
    return keyMap[key] || key.toLowerCase()
  }

  // Utility Methods
  private getKeyString(combination: KeyCombination): string {
    const modifiers = [...combination.modifiers].sort()
    return [...modifiers, combination.key].join('+')
  }

  getShortcutString(combination: KeyCombination): string {
    const modifierSymbols: Record<ModifierKey, string> = {
      'cmd': '⌘',
      'ctrl': '⌃',
      'alt': '⌥',
      'shift': '⇧',
      'meta': '⊞'
    }

    const parts: string[] = []
    
    // Add modifiers in standard order
    const order: ModifierKey[] = ['ctrl', 'cmd', 'alt', 'shift']
    for (const modifier of order) {
      if (combination.modifiers.includes(modifier)) {
        parts.push(modifierSymbols[modifier] || modifier)
      }
    }
    
    // Add key
    parts.push(combination.key.toUpperCase())
    
    return parts.join('')
  }

  // Conflict Detection
  findConflicts(keyCombination: KeyCombination, context: ShortcutContext, excludeId?: string): ShortcutConflict[] {
    const conflicts: ShortcutConflict[] = []
    
    for (const [id, shortcut] of this.shortcuts) {
      if (excludeId && id === excludeId) continue
      if (!shortcut.enabled) continue
      
      // Check if keys match
      if (this.keyMapsEqual(keyCombination, shortcut.keyCombination)) {
        // Check context overlap
        const contextConflict = this.contextsConflict(context, shortcut.context || 'global')
        
        if (contextConflict) {
          conflicts.push({
            shortcutId1: excludeId || '',
            shortcutId2: id,
            keyCombination,
            context,
            severity: contextConflict === 'exact' ? 'error' : 'warning',
            suggestion: `Consider using different keys or contexts`
          })
        }
      }
    }
    
    return conflicts
  }

  private keyMapsEqual(keys1: KeyCombination, keys2: KeyCombination): boolean {
    if (keys1.key !== keys2.key) return false
    
    const mods1 = new Set(keys1.modifiers)
    const mods2 = new Set(keys2.modifiers)
    
    if (mods1.size !== mods2.size) return false
    
    for (const mod of mods1) {
      if (!mods2.has(mod)) return false
    }
    
    return true
  }

  private contextsConflict(context1: ShortcutContext, context2: ShortcutContext): 'exact' | 'partial' | null {
    if (context1 === context2) return 'exact'
    if (context1 === 'global' || context2 === 'global') return 'partial'
    return null
  }

  // Schemes
  private createDefaultScheme(): void {
    const defaultScheme: ShortcutScheme = {
      id: 'default',
      name: 'Default',
      description: 'Default keyboard shortcuts',
      shortcuts: {},
      createdAt: Date.now()
    }
    
    this.schemes.set('default', defaultScheme)
  }

  saveScheme(scheme: ShortcutScheme): void {
    this.schemes.set(scheme.id, {
      ...scheme,
      updatedAt: Date.now()
    })
  }

  loadScheme(schemeId: string): boolean {
    const scheme = this.schemes.get(schemeId)
    if (!scheme) return false

    // Apply scheme to all shortcuts
    for (const [shortcutId, keyCombination] of Object.entries(scheme.shortcuts)) {
      const shortcut = this.shortcuts.get(shortcutId)
      if (shortcut) {
        this.unbindShortcut(shortcut)
        shortcut.keyCombination = keyCombination
        if (shortcut.enabled) {
          this.bindShortcut(shortcut)
        }
      }
    }

    this.config.currentScheme = schemeId
    this.emit('scheme-changed', { 
      type: 'scheme-changed', 
      data: { schemeId },
      timestamp: Date.now() 
    })

    return true
  }

  exportScheme(schemeId: string): string | null {
    const scheme = this.schemes.get(schemeId)
    if (!scheme) return null

    // Include current customizations
    const exportScheme = {
      ...scheme,
      shortcuts: {
        ...scheme.shortcuts,
        ...this.config.customizations
      }
    }

    return JSON.stringify(exportScheme, null, 2)
  }

  importScheme(schemeData: string): boolean {
    try {
      const scheme = JSON.parse(schemeData) as ShortcutScheme
      this.saveScheme(scheme)
      return true
    } catch (error) {
      console.error('Failed to import scheme:', error)
      return false
    }
  }

  // Key Recording
  startRecording(callback: (keys: KeyCombination | null) => void): void {
    this.isRecording = true
    this.recordingCallback = callback
  }

  stopRecording(): void {
    this.isRecording = false
    this.recordingCallback = undefined
  }

  private setupEventListeners(): void {
    // Global key listener for recording
    document.addEventListener('keydown', (event) => {
      if (this.isRecording && this.recordingCallback) {
        event.preventDefault()
        event.stopPropagation()

        // Don't record just modifiers
        if (['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) {
          return
        }

        const modifiers = Array.from(this.getEventModifiers(event))
        const key = this.normalizeKey(event.key)

        const combination: KeyCombination = {
          modifiers: modifiers as ModifierKey[],
          key
        }

        this.recordingCallback(combination)
        this.stopRecording()
      }
    }, true)

    // Escape to cancel recording
    document.addEventListener('keyup', (event) => {
      if (this.isRecording && event.key === 'Escape') {
        this.recordingCallback?.(null)
        this.stopRecording()
      }
    })
  }

  // Data Access
  getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }

  getShortcut(id: string): Shortcut | undefined {
    return this.shortcuts.get(id)
  }

  getShortcutsByContext(context: ShortcutContext): Shortcut[] {
    return this.getShortcuts().filter(s => s.context === context || s.context === 'global')
  }

  getShortcutsByCategory(category: string): Shortcut[] {
    return this.getShortcuts().filter(s => s.category === category)
  }

  getSchemes(): ShortcutScheme[] {
    return Array.from(this.schemes.values())
  }

  getCategories(): ShortcutCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  addCategory(category: ShortcutCategory): void {
    this.categories.set(category.id, category)
  }

  getStats(): ShortcutStats {
    const shortcuts = this.getShortcuts()
    
    return {
      totalShortcuts: shortcuts.length,
      enabledShortcuts: shortcuts.filter(s => s.enabled).length,
      globalShortcuts: shortcuts.filter(s => s.global).length,
      customizations: Object.keys(this.config.customizations).length,
      conflicts: this.findAllConflicts().length,
      usage: Object.fromEntries(this.usageStats),
      lastUsed: Object.fromEntries(this.lastUsed)
    }
  }

  private findAllConflicts(): ShortcutConflict[] {
    const conflicts: ShortcutConflict[] = []
    const shortcuts = this.getShortcuts().filter(s => s.enabled)
    
    for (let i = 0; i < shortcuts.length; i++) {
      for (let j = i + 1; j < shortcuts.length; j++) {
        const shortcut1 = shortcuts[i]
        const shortcut2 = shortcuts[j]
        
        if (this.keyMapsEqual(shortcut1.keyCombination, shortcut2.keyCombination)) {
          const contextConflict = this.contextsConflict(
            shortcut1.context || 'global',
            shortcut2.context || 'global'
          )
          
          if (contextConflict) {
            conflicts.push({
              shortcutId1: shortcut1.id,
              shortcutId2: shortcut2.id,
              keyCombination: shortcut1.keyCombination,
              context: shortcut1.context || 'global',
              severity: contextConflict === 'exact' ? 'error' : 'warning'
            })
          }
        }
      }
    }
    
    return conflicts
  }

  // Cleanup
  destroy(): void {
    // Unbind all shortcuts
    for (const shortcut of this.shortcuts.values()) {
      this.unbindShortcut(shortcut)
    }

    // Cleanup providers
    for (const provider of this.providers.values()) {
      if (provider.cleanup) {
        provider.cleanup()
      }
    }

    this.shortcuts.clear()
    this.keyListeners.clear()
    this.globalShortcuts.clear()
    this.removeAllListeners()
  }
}