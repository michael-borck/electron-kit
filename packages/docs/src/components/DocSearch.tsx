import React, { useState, useEffect, useRef } from 'react'
import { useDocStore } from '../stores/docStore'

interface DocSearchProps {
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  showResults?: boolean
}

export const DocSearch: React.FC<DocSearchProps> = ({ 
  className = '',
  style,
  placeholder = 'Search documentation...',
  showResults = true
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchOpen,
    setSearchQuery,
    performSearch,
    clearSearch,
    setSearchOpen,
    setCurrentPage,
    darkMode
  } = useDocStore()

  // Auto-focus when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  // Perform search when query changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery)
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      
      // Escape to close search
      if (event.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false)
          clearSearch()
        }
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, setSearchOpen, clearSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleResultClick = (pageId: string) => {
    const result = searchResults.find(r => r.page.id === pageId)
    if (result) {
      setCurrentPage(result.page)
      setIsOpen(false)
      if (!searchOpen) {
        clearSearch()
      }
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>')
  }

  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const getSnippet = (content: string, query: string, maxLength: number = 150) => {
    if (!query.trim()) return content.substring(0, maxLength) + '...'
    
    const lowerContent = content.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerContent.indexOf(lowerQuery)
    
    if (index === -1) {
      return content.substring(0, maxLength) + '...'
    }
    
    const start = Math.max(0, index - 50)
    const end = Math.min(content.length, index + query.length + 100)
    const snippet = content.substring(start, end)
    
    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '')
  }

  return (
    <div className={`relative ${className}`} style={style} ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(searchQuery.length >= 2)}
          placeholder={placeholder}
          className={`w-full px-4 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 dark:text-gray-500">🔍</span>
        </div>
        
        {/* Loading/Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isSearching ? (
            <div className="animate-spin text-blue-500">⚙️</div>
          ) : searchQuery && (
            <button
              onClick={() => {
                clearSearch()
                setIsOpen(false)
              }}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Keyboard Shortcut Hint */}
        {!searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && isOpen && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin inline-block mb-2">⚙️</div>
              <div>Searching...</div>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </div>
              <ul className="py-2">
                {searchResults.map((result, index) => (
                  <li key={result.page.id}>
                    <button
                      onClick={() => handleResultClick(result.page.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <span className="text-blue-500 dark:text-blue-400">📄</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div 
                            className="font-medium text-gray-900 dark:text-white mb-1"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightMatch(result.page.title, searchQuery) 
                            }}
                          />
                          <div 
                            className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightMatch(
                                getSnippet(result.page.content.replace(/<[^>]*>/g, ''), searchQuery),
                                searchQuery
                              ) 
                            }}
                          />
                          <div className="flex items-center gap-2 mt-2">
                            {result.page.category && (
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {result.page.category}
                              </span>
                            )}
                            {result.page.tags?.map(tag => (
                              <span 
                                key={tag}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                              {Math.round((1 - result.score) * 100)}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < searchResults.length - 1 && (
                      <div className="mx-4 border-b border-gray-100 dark:border-gray-700" />
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">🔍</div>
              <div>No results found for "{searchQuery}"</div>
              <div className="text-sm mt-1">Try different keywords or check spelling</div>
            </div>
          )}
        </div>
      )}

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="p-4">
              <DocSearch 
                placeholder="Search all documentation..."
                showResults={true}
                className="text-lg"
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}