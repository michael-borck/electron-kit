// Core manager
export { DocManager } from './DocManager'

// Store
export { useDocStore } from './stores/docStore'

// Components
export { DocViewer } from './components/DocViewer'
export { DocSidebar } from './components/DocSidebar'
export { DocSearch } from './components/DocSearch'
export { TableOfContents } from './components/TableOfContents'
export { TourOverlay } from './components/TourOverlay'
export { HelpTooltip, HelpTooltipManager } from './components/HelpTooltip'
export { FAQ } from './components/FAQ'

// Types
export type {
  DocPage,
  DocCategory,
  DocSearchResult,
  SearchMatch,
  DocNavigation,
  BreadcrumbItem,
  DocConfig,
  TourStep,
  Tour,
  HelpTooltip as HelpTooltipType,
  KeyboardShortcut,
  FAQ as FAQType,
  DocEvent,
  DocMetrics
} from './types'