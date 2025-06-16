export interface DocPage {
  id: string
  title: string
  content: string
  category?: string
  tags?: string[]
  order?: number
  lastModified?: Date
  author?: string
  description?: string
}

export interface DocCategory {
  id: string
  name: string
  description?: string
  icon?: string
  order?: number
  collapsed?: boolean
}

export interface DocSearchResult {
  page: DocPage
  matches: SearchMatch[]
  score: number
}

export interface SearchMatch {
  text: string
  start: number
  end: number
  type: 'title' | 'content' | 'tag'
}

export interface DocNavigation {
  previous?: DocPage
  next?: DocPage
  breadcrumbs: BreadcrumbItem[]
}

export interface BreadcrumbItem {
  id: string
  title: string
  url?: string
}

export interface DocConfig {
  baseUrl?: string
  defaultCategory?: string
  searchEnabled?: boolean
  maxSearchResults?: number
  highlightMatches?: boolean
  enableTableOfContents?: boolean
  enablePrintMode?: boolean
  customCSS?: string
}

export interface TourStep {
  id: string
  title: string
  content: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: 'click' | 'hover' | 'focus'
  nextButton?: string
  skipButton?: string
  backdrop?: boolean
}

export interface Tour {
  id: string
  title: string
  description?: string
  steps: TourStep[]
  autoStart?: boolean
  skippable?: boolean
}

export interface HelpTooltip {
  id: string
  target: string
  content: string
  title?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
  persistent?: boolean
}

export interface KeyboardShortcut {
  id: string
  key: string
  description: string
  category?: string
  action?: () => void
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category?: string
  tags?: string[]
  popularity?: number
}

export interface DocEvent {
  type: 'page-view' | 'search' | 'tour-start' | 'tour-complete' | 'tooltip-show' | 'faq-expand'
  data: any
  timestamp: Date
}

export interface DocMetrics {
  pageViews: Record<string, number>
  searchQueries: string[]
  tourCompletions: Record<string, number>
  popularFAQs: Record<string, number>
}