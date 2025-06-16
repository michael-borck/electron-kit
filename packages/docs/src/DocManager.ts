import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import Fuse from 'fuse.js'
import type {
  DocPage,
  DocCategory,
  DocSearchResult,
  DocNavigation,
  DocConfig,
  Tour,
  HelpTooltip,
  FAQ,
  DocEvent,
  DocMetrics
} from './types'

export class DocManager {
  private pages = new Map<string, DocPage>()
  private categories = new Map<string, DocCategory>()
  private tours = new Map<string, Tour>()
  private tooltips = new Map<string, HelpTooltip>()
  private faqs = new Map<string, FAQ>()
  private searchIndex: Fuse<DocPage> | null = null
  private config: DocConfig
  private eventListeners = new Map<string, ((event: DocEvent) => void)[]>()
  private metrics: DocMetrics = {
    pageViews: {},
    searchQueries: [],
    tourCompletions: {},
    popularFAQs: {}
  }

  constructor(config: DocConfig = {}) {
    this.config = {
      searchEnabled: true,
      maxSearchResults: 10,
      highlightMatches: true,
      enableTableOfContents: true,
      enablePrintMode: true,
      ...config
    }

    this.setupMarked()
    this.buildSearchIndex()
  }

  private setupMarked(): void {
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value
          } catch (err) {
            console.warn('Syntax highlighting failed:', err)
          }
        }
        return hljs.highlightAuto(code).value
      },
      breaks: true,
      gfm: true
    })
  }

  private buildSearchIndex(): void {
    if (!this.config.searchEnabled) return

    const pages = Array.from(this.pages.values())
    this.searchIndex = new Fuse(pages, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'description', weight: 0.1 }
      ],
      threshold: 0.3,
      includeMatches: true,
      includeScore: true,
      minMatchCharLength: 2
    })
  }

  // Page Management
  addPage(page: DocPage): void {
    this.pages.set(page.id, {
      ...page,
      lastModified: page.lastModified || new Date()
    })
    this.buildSearchIndex()
    this.emitEvent('page-added', { page })
  }

  getPage(id: string): DocPage | undefined {
    const page = this.pages.get(id)
    if (page) {
      this.trackPageView(id)
    }
    return page
  }

  getPages(): DocPage[] {
    return Array.from(this.pages.values()).sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  getPagesByCategory(categoryId: string): DocPage[] {
    return this.getPages().filter(page => page.category === categoryId)
  }

  updatePage(id: string, updates: Partial<DocPage>): void {
    const page = this.pages.get(id)
    if (page) {
      this.pages.set(id, {
        ...page,
        ...updates,
        lastModified: new Date()
      })
      this.buildSearchIndex()
      this.emitEvent('page-updated', { id, updates })
    }
  }

  deletePage(id: string): void {
    if (this.pages.delete(id)) {
      this.buildSearchIndex()
      this.emitEvent('page-deleted', { id })
    }
  }

  // Category Management
  addCategory(category: DocCategory): void {
    this.categories.set(category.id, category)
    this.emitEvent('category-added', { category })
  }

  getCategory(id: string): DocCategory | undefined {
    return this.categories.get(id)
  }

  getCategories(): DocCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  updateCategory(id: string, updates: Partial<DocCategory>): void {
    const category = this.categories.get(id)
    if (category) {
      this.categories.set(id, { ...category, ...updates })
      this.emitEvent('category-updated', { id, updates })
    }
  }

  deleteCategory(id: string): void {
    if (this.categories.delete(id)) {
      // Remove category from pages
      this.pages.forEach(page => {
        if (page.category === id) {
          this.updatePage(page.id, { category: undefined })
        }
      })
      this.emitEvent('category-deleted', { id })
    }
  }

  // Content Rendering
  renderMarkdown(content: string): string {
    const html = marked(content)
    return DOMPurify.sanitize(html)
  }

  generateTableOfContents(content: string): Array<{ level: number; title: string; id: string }> {
    const headings: Array<{ level: number; title: string; id: string }> = []
    const tokens = marked.lexer(content)

    tokens.forEach(token => {
      if (token.type === 'heading') {
        const id = token.text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        headings.push({
          level: token.depth,
          title: token.text,
          id
        })
      }
    })

    return headings
  }

  // Search
  search(query: string): DocSearchResult[] {
    if (!this.searchIndex || !this.config.searchEnabled) return []

    this.trackSearch(query)
    const results = this.searchIndex.search(query, {
      limit: this.config.maxSearchResults
    })

    return results.map(result => ({
      page: result.item,
      matches: result.matches?.map(match => ({
        text: match.value || '',
        start: match.indices?.[0]?.[0] || 0,
        end: match.indices?.[0]?.[1] || 0,
        type: match.key as 'title' | 'content' | 'tag'
      })) || [],
      score: result.score || 0
    }))
  }

  // Navigation
  getNavigation(pageId: string): DocNavigation {
    const pages = this.getPages()
    const currentIndex = pages.findIndex(page => page.id === pageId)
    const currentPage = pages[currentIndex]

    return {
      previous: currentIndex > 0 ? pages[currentIndex - 1] : undefined,
      next: currentIndex < pages.length - 1 ? pages[currentIndex + 1] : undefined,
      breadcrumbs: this.generateBreadcrumbs(currentPage)
    }
  }

  private generateBreadcrumbs(page?: DocPage): Array<{ id: string; title: string; url?: string }> {
    const breadcrumbs: Array<{ id: string; title: string; url?: string }> = []

    if (page?.category) {
      const category = this.getCategory(page.category)
      if (category) {
        breadcrumbs.push({
          id: category.id,
          title: category.name,
          url: `#/category/${category.id}`
        })
      }
    }

    if (page) {
      breadcrumbs.push({
        id: page.id,
        title: page.title,
        url: `#/page/${page.id}`
      })
    }

    return breadcrumbs
  }

  // Tours
  addTour(tour: Tour): void {
    this.tours.set(tour.id, tour)
    this.emitEvent('tour-added', { tour })
  }

  getTour(id: string): Tour | undefined {
    return this.tours.get(id)
  }

  getTours(): Tour[] {
    return Array.from(this.tours.values())
  }

  startTour(id: string): void {
    const tour = this.tours.get(id)
    if (tour) {
      this.emitEvent('tour-start', { tourId: id, tour })
    }
  }

  completeTour(id: string): void {
    this.trackTourCompletion(id)
    this.emitEvent('tour-complete', { tourId: id })
  }

  // Tooltips
  addTooltip(tooltip: HelpTooltip): void {
    this.tooltips.set(tooltip.id, tooltip)
    this.emitEvent('tooltip-added', { tooltip })
  }

  getTooltip(id: string): HelpTooltip | undefined {
    return this.tooltips.get(id)
  }

  getTooltips(): HelpTooltip[] {
    return Array.from(this.tooltips.values())
  }

  showTooltip(id: string): void {
    const tooltip = this.tooltips.get(id)
    if (tooltip) {
      this.emitEvent('tooltip-show', { tooltipId: id, tooltip })
    }
  }

  // FAQ
  addFAQ(faq: FAQ): void {
    this.faqs.set(faq.id, faq)
    this.emitEvent('faq-added', { faq })
  }

  getFAQ(id: string): FAQ | undefined {
    return this.faqs.get(id)
  }

  getFAQs(): FAQ[] {
    return Array.from(this.faqs.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  }

  getFAQsByCategory(category: string): FAQ[] {
    return this.getFAQs().filter(faq => faq.category === category)
  }

  expandFAQ(id: string): void {
    this.trackFAQExpansion(id)
    this.emitEvent('faq-expand', { faqId: id })
  }

  // Bulk Import
  async importFromDirectory(directoryPath: string): Promise<void> {
    // This would be implemented in the main process
    // to read files from the filesystem
    throw new Error('importFromDirectory must be implemented in main process')
  }

  async importFromGitHub(repoUrl: string, docsPath: string = 'docs'): Promise<void> {
    // This would fetch documentation from a GitHub repository
    throw new Error('importFromGitHub not implemented yet')
  }

  // Export
  exportToJSON(): string {
    return JSON.stringify({
      pages: Array.from(this.pages.entries()),
      categories: Array.from(this.categories.entries()),
      tours: Array.from(this.tours.entries()),
      tooltips: Array.from(this.tooltips.entries()),
      faqs: Array.from(this.faqs.entries()),
      config: this.config,
      metrics: this.metrics
    }, null, 2)
  }

  importFromJSON(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString)
      
      if (data.pages) {
        this.pages = new Map(data.pages)
      }
      if (data.categories) {
        this.categories = new Map(data.categories)
      }
      if (data.tours) {
        this.tours = new Map(data.tours)
      }
      if (data.tooltips) {
        this.tooltips = new Map(data.tooltips)
      }
      if (data.faqs) {
        this.faqs = new Map(data.faqs)
      }
      if (data.config) {
        this.config = { ...this.config, ...data.config }
      }
      if (data.metrics) {
        this.metrics = { ...this.metrics, ...data.metrics }
      }

      this.buildSearchIndex()
      this.emitEvent('import-complete', { data })
    } catch (error) {
      this.emitEvent('import-error', { error })
      throw new Error(`Failed to import documentation: ${error}`)
    }
  }

  // Analytics
  private trackPageView(pageId: string): void {
    this.metrics.pageViews[pageId] = (this.metrics.pageViews[pageId] || 0) + 1
    this.emitEvent('page-view', { pageId })
  }

  private trackSearch(query: string): void {
    this.metrics.searchQueries.push(query)
    if (this.metrics.searchQueries.length > 1000) {
      this.metrics.searchQueries = this.metrics.searchQueries.slice(-500)
    }
    this.emitEvent('search', { query })
  }

  private trackTourCompletion(tourId: string): void {
    this.metrics.tourCompletions[tourId] = (this.metrics.tourCompletions[tourId] || 0) + 1
  }

  private trackFAQExpansion(faqId: string): void {
    this.metrics.popularFAQs[faqId] = (this.metrics.popularFAQs[faqId] || 0) + 1
    const faq = this.faqs.get(faqId)
    if (faq) {
      faq.popularity = this.metrics.popularFAQs[faqId]
    }
  }

  getMetrics(): DocMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      pageViews: {},
      searchQueries: [],
      tourCompletions: {},
      popularFAQs: {}
    }
    this.emitEvent('metrics-reset', {})
  }

  // Event System
  on(event: string, listener: (event: DocEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  off(event: string, listener: (event: DocEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emitEvent(type: string, data: any): void {
    const event: DocEvent = {
      type: type as any,
      data,
      timestamp: new Date()
    }

    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }

    // Also emit to general event listeners
    const generalListeners = this.eventListeners.get('*')
    if (generalListeners) {
      generalListeners.forEach(listener => listener(event))
    }
  }
}