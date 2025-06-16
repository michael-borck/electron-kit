import React, { useState } from 'react'
import { useDocStore } from '../stores/docStore'
import type { FAQ as FAQType } from '../types'

interface FAQProps {
  categoryFilter?: string
  searchQuery?: string
  className?: string
  style?: React.CSSProperties
  showSearch?: boolean
  showCategories?: boolean
  maxItems?: number
}

export const FAQ: React.FC<FAQProps> = ({ 
  categoryFilter,
  searchQuery: externalSearchQuery,
  className = '',
  style,
  showSearch = true,
  showCategories = true,
  maxItems
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || 'all')

  const {
    getFAQs,
    expandedFAQs,
    toggleFAQ,
    expandAllFAQs,
    collapseAllFAQs,
    darkMode
  } = useDocStore()

  const searchQuery = externalSearchQuery || internalSearchQuery

  // Get all FAQs and process them
  const allFAQs = getFAQs()
  
  // Filter by category
  const categoryFilteredFAQs = selectedCategory === 'all' 
    ? allFAQs 
    : allFAQs.filter(faq => faq.category === selectedCategory)

  // Filter by search query
  const searchFilteredFAQs = searchQuery
    ? categoryFilteredFAQs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categoryFilteredFAQs

  // Limit results if specified
  const finalFAQs = maxItems 
    ? searchFilteredFAQs.slice(0, maxItems)
    : searchFilteredFAQs

  // Get unique categories
  const categories = Array.from(new Set(allFAQs.map(faq => faq.category).filter(Boolean)))

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>')
  }

  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const renderFAQItem = (faq: FAQType) => {
    const isExpanded = expandedFAQs.has(faq.id)

    return (
      <div 
        key={faq.id}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        <button
          onClick={() => toggleFAQ(faq.id)}
          className="w-full px-4 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 
                className="font-medium text-gray-900 dark:text-white"
                dangerouslySetInnerHTML={{ 
                  __html: highlightMatch(faq.question, searchQuery) 
                }}
              />
              <div className="flex items-center gap-2 mt-2">
                {faq.category && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                    {faq.category}
                  </span>
                )}
                {faq.tags?.map(tag => (
                  <span 
                    key={tag}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {faq.popularity && faq.popularity > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    👍 {faq.popularity}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-4 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: highlightMatch(faq.answer, searchQuery) 
              }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`faq-component ${className}`} style={style}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Find answers to common questions about using our application.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        {showSearch && (
          <div className="relative">
            <input
              type="text"
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">🔍</span>
            </div>
            {internalSearchQuery && (
              <button
                onClick={() => setInternalSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Category Filter & Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {showCategories && categories.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Expand/Collapse All */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={expandAllFAQs}
              className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Expand All
            </button>
            <button
              onClick={collapseAllFAQs}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {finalFAQs.length} {finalFAQs.length === 1 ? 'question' : 'questions'}
          {searchQuery && ` matching "${searchQuery}"`}
          {maxItems && finalFAQs.length >= maxItems && ` (showing first ${maxItems})`}
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {finalFAQs.length > 0 ? (
          finalFAQs.map(renderFAQItem)
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❓</div>
            <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No FAQs found
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {searchQuery ? (
                <>Try different keywords or <button 
                  onClick={() => setInternalSearchQuery('')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  clear search
                </button></>
              ) : (
                'No frequently asked questions are available yet.'
              )}
            </div>
          </div>
        )}
      </div>

      {/* Load More */}
      {maxItems && searchFilteredFAQs.length > maxItems && (
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Showing {maxItems} of {searchFilteredFAQs.length} questions
          </div>
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors">
            Show More
          </button>
        </div>
      )}
    </div>
  )
}