import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DocManager } from '../DocManager'
import type { DocPage, DocCategory, Tour, HelpTooltip, FAQ, DocSearchResult } from '../types'

interface DocStore {
  // Core state
  docManager: DocManager
  currentPage: DocPage | null
  currentCategory: string | null
  searchQuery: string
  searchResults: DocSearchResult[]
  isSearching: boolean
  
  // UI state
  sidebarOpen: boolean
  searchOpen: boolean
  tableOfContentsOpen: boolean
  printMode: boolean
  
  // Tour state
  activeTour: Tour | null
  currentTourStep: number
  tourProgress: Record<string, boolean>
  
  // Tooltip state
  activeTooltips: Set<string>
  tooltipPositions: Record<string, { x: number; y: number }>
  
  // FAQ state
  expandedFAQs: Set<string>
  
  // Settings
  fontSize: number
  darkMode: boolean
  highlightSearchTerms: boolean
  showLineNumbers: boolean
  
  // Actions - Page Management
  setCurrentPage: (page: DocPage | null) => void
  setCurrentCategory: (categoryId: string | null) => void
  
  // Actions - Search
  setSearchQuery: (query: string) => void
  performSearch: (query: string) => void
  clearSearch: () => void
  setSearchOpen: (open: boolean) => void
  
  // Actions - UI
  setSidebarOpen: (open: boolean) => void
  setTableOfContentsOpen: (open: boolean) => void
  setPrintMode: (enabled: boolean) => void
  setFontSize: (size: number) => void
  setDarkMode: (enabled: boolean) => void
  setHighlightSearchTerms: (enabled: boolean) => void
  setShowLineNumbers: (enabled: boolean) => void
  
  // Actions - Tours
  startTour: (tourId: string) => void
  nextTourStep: () => void
  previousTourStep: () => void
  completeTour: () => void
  skipTour: () => void
  markTourCompleted: (tourId: string) => void
  
  // Actions - Tooltips
  showTooltip: (tooltipId: string, position?: { x: number; y: number }) => void
  hideTooltip: (tooltipId: string) => void
  hideAllTooltips: () => void
  
  // Actions - FAQ
  toggleFAQ: (faqId: string) => void
  expandFAQ: (faqId: string) => void
  collapseFAQ: (faqId: string) => void
  expandAllFAQs: () => void
  collapseAllFAQs: () => void
  
  // Actions - Data Management
  refreshData: () => void
  exportData: () => string
  importData: (jsonString: string) => void
  
  // Getters
  getPages: () => DocPage[]
  getCategories: () => DocCategory[]
  getPagesByCategory: (categoryId: string) => DocPage[]
  getTours: () => Tour[]
  getTooltips: () => HelpTooltip[]
  getFAQs: () => FAQ[]
  getMetrics: () => any
}

export const useDocStore = create<DocStore>()(
  persist(
    (set, get) => ({
      // Initial state
      docManager: new DocManager(),
      currentPage: null,
      currentCategory: null,
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      
      // UI state
      sidebarOpen: true,
      searchOpen: false,
      tableOfContentsOpen: true,
      printMode: false,
      
      // Tour state
      activeTour: null,
      currentTourStep: 0,
      tourProgress: {},
      
      // Tooltip state
      activeTooltips: new Set(),
      tooltipPositions: {},
      
      // FAQ state
      expandedFAQs: new Set(),
      
      // Settings
      fontSize: 16,
      darkMode: false,
      highlightSearchTerms: true,
      showLineNumbers: false,
      
      // Page Management Actions
      setCurrentPage: (page) => {
        set({ currentPage: page })
        if (page) {
          get().docManager.getPage(page.id) // This tracks the page view
        }
      },
      
      setCurrentCategory: (categoryId) => {
        set({ currentCategory: categoryId })
      },
      
      // Search Actions
      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },
      
      performSearch: (query) => {
        set({ isSearching: true, searchQuery: query })
        try {
          const results = get().docManager.search(query)
          set({ searchResults: results, isSearching: false })
        } catch (error) {
          console.error('Search failed:', error)
          set({ searchResults: [], isSearching: false })
        }
      },
      
      clearSearch: () => {
        set({ searchQuery: '', searchResults: [], searchOpen: false })
      },
      
      setSearchOpen: (open) => {
        set({ searchOpen: open })
        if (!open) {
          get().clearSearch()
        }
      },
      
      // UI Actions
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
      },
      
      setTableOfContentsOpen: (open) => {
        set({ tableOfContentsOpen: open })
      },
      
      setPrintMode: (enabled) => {
        set({ printMode: enabled })
      },
      
      setFontSize: (size) => {
        set({ fontSize: Math.max(12, Math.min(24, size)) })
      },
      
      setDarkMode: (enabled) => {
        set({ darkMode: enabled })
      },
      
      setHighlightSearchTerms: (enabled) => {
        set({ highlightSearchTerms: enabled })
      },
      
      setShowLineNumbers: (enabled) => {
        set({ showLineNumbers: enabled })
      },
      
      // Tour Actions
      startTour: (tourId) => {
        const tour = get().docManager.getTour(tourId)
        if (tour) {
          set({ activeTour: tour, currentTourStep: 0 })
          get().docManager.startTour(tourId)
        }
      },
      
      nextTourStep: () => {
        const { activeTour, currentTourStep } = get()
        if (activeTour && currentTourStep < activeTour.steps.length - 1) {
          set({ currentTourStep: currentTourStep + 1 })
        } else if (activeTour) {
          get().completeTour()
        }
      },
      
      previousTourStep: () => {
        const { currentTourStep } = get()
        if (currentTourStep > 0) {
          set({ currentTourStep: currentTourStep - 1 })
        }
      },
      
      completeTour: () => {
        const { activeTour } = get()
        if (activeTour) {
          get().docManager.completeTour(activeTour.id)
          get().markTourCompleted(activeTour.id)
          set({ activeTour: null, currentTourStep: 0 })
        }
      },
      
      skipTour: () => {
        set({ activeTour: null, currentTourStep: 0 })
      },
      
      markTourCompleted: (tourId) => {
        const { tourProgress } = get()
        set({ tourProgress: { ...tourProgress, [tourId]: true } })
      },
      
      // Tooltip Actions
      showTooltip: (tooltipId, position) => {
        const { activeTooltips, tooltipPositions } = get()
        const newActiveTooltips = new Set(activeTooltips)
        newActiveTooltips.add(tooltipId)
        
        const newPositions = { ...tooltipPositions }
        if (position) {
          newPositions[tooltipId] = position
        }
        
        set({ 
          activeTooltips: newActiveTooltips,
          tooltipPositions: newPositions
        })
        
        get().docManager.showTooltip(tooltipId)
      },
      
      hideTooltip: (tooltipId) => {
        const { activeTooltips, tooltipPositions } = get()
        const newActiveTooltips = new Set(activeTooltips)
        newActiveTooltips.delete(tooltipId)
        
        const newPositions = { ...tooltipPositions }
        delete newPositions[tooltipId]
        
        set({ 
          activeTooltips: newActiveTooltips,
          tooltipPositions: newPositions
        })
      },
      
      hideAllTooltips: () => {
        set({ activeTooltips: new Set(), tooltipPositions: {} })
      },
      
      // FAQ Actions
      toggleFAQ: (faqId) => {
        const { expandedFAQs } = get()
        const newExpandedFAQs = new Set(expandedFAQs)
        
        if (newExpandedFAQs.has(faqId)) {
          newExpandedFAQs.delete(faqId)
        } else {
          newExpandedFAQs.add(faqId)
          get().docManager.expandFAQ(faqId)
        }
        
        set({ expandedFAQs: newExpandedFAQs })
      },
      
      expandFAQ: (faqId) => {
        const { expandedFAQs } = get()
        const newExpandedFAQs = new Set(expandedFAQs)
        newExpandedFAQs.add(faqId)
        set({ expandedFAQs: newExpandedFAQs })
        get().docManager.expandFAQ(faqId)
      },
      
      collapseFAQ: (faqId) => {
        const { expandedFAQs } = get()
        const newExpandedFAQs = new Set(expandedFAQs)
        newExpandedFAQs.delete(faqId)
        set({ expandedFAQs: newExpandedFAQs })
      },
      
      expandAllFAQs: () => {
        const faqs = get().docManager.getFAQs()
        const allFAQIds = new Set(faqs.map(faq => faq.id))
        set({ expandedFAQs: allFAQIds })
      },
      
      collapseAllFAQs: () => {
        set({ expandedFAQs: new Set() })
      },
      
      // Data Management Actions
      refreshData: () => {
        // Force re-render by updating the reference
        const { docManager } = get()
        set({ docManager })
      },
      
      exportData: () => {
        return get().docManager.exportToJSON()
      },
      
      importData: (jsonString) => {
        try {
          get().docManager.importFromJSON(jsonString)
          get().refreshData()
        } catch (error) {
          console.error('Failed to import documentation data:', error)
          throw error
        }
      },
      
      // Getters
      getPages: () => get().docManager.getPages(),
      getCategories: () => get().docManager.getCategories(),
      getPagesByCategory: (categoryId) => get().docManager.getPagesByCategory(categoryId),
      getTours: () => get().docManager.getTours(),
      getTooltips: () => get().docManager.getTooltips(),
      getFAQs: () => get().docManager.getFAQs(),
      getMetrics: () => get().docManager.getMetrics()
    }),
    {
      name: 'doc-store',
      partialize: (state) => ({
        // Only persist UI preferences and tour progress
        sidebarOpen: state.sidebarOpen,
        tableOfContentsOpen: state.tableOfContentsOpen,
        fontSize: state.fontSize,
        darkMode: state.darkMode,
        highlightSearchTerms: state.highlightSearchTerms,
        showLineNumbers: state.showLineNumbers,
        tourProgress: state.tourProgress,
        expandedFAQs: Array.from(state.expandedFAQs)
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        expandedFAQs: new Set(persistedState?.expandedFAQs || [])
      })
    }
  )
)