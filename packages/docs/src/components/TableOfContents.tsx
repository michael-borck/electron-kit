import React, { useEffect, useState } from 'react'
import { useDocStore } from '../stores/docStore'

interface TableOfContentsProps {
  className?: string
  style?: React.CSSProperties
  maxDepth?: number
  showToggle?: boolean
}

interface TOCItem {
  level: number
  title: string
  id: string
  element?: HTMLElement
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  className = '',
  style,
  maxDepth = 6,
  showToggle = true
}) => {
  const {
    currentPage,
    tableOfContentsOpen,
    setTableOfContentsOpen,
    docManager,
    darkMode
  } = useDocStore()

  const [tocItems, setTocItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Generate TOC when page changes
  useEffect(() => {
    if (currentPage) {
      const items = docManager.generateTableOfContents(currentPage.content)
        .filter(item => item.level <= maxDepth)
        .map(item => ({
          ...item,
          element: undefined
        }))
      setTocItems(items)
    } else {
      setTocItems([])
    }
  }, [currentPage, docManager, maxDepth])

  // Track scroll position to highlight active section
  useEffect(() => {
    if (tocItems.length === 0) return

    const updateActiveId = () => {
      const elements = tocItems.map(item => {
        const element = document.getElementById(item.id)
        return { ...item, element }
      }).filter(item => item.element)

      // Find the currently visible section
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      
      let activeItem = elements[0]
      
      for (const item of elements) {
        if (item.element) {
          const rect = item.element.getBoundingClientRect()
          const elementTop = rect.top + scrollY
          
          if (elementTop <= scrollY + windowHeight / 3) {
            activeItem = item
          } else {
            break
          }
        }
      }
      
      setActiveId(activeItem?.id || '')
    }

    // Initial update
    updateActiveId()

    // Listen for scroll events
    const handleScroll = () => {
      requestAnimationFrame(updateActiveId)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [tocItems])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80 // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      })
    }
  }

  const getIndentClass = (level: number) => {
    const indents = {
      1: 'pl-0',
      2: 'pl-4',
      3: 'pl-8',
      4: 'pl-12',
      5: 'pl-16',
      6: 'pl-20'
    }
    return indents[level as keyof typeof indents] || 'pl-0'
  }

  const getFontSizeClass = (level: number) => {
    const sizes = {
      1: 'text-sm font-semibold',
      2: 'text-sm font-medium',
      3: 'text-sm',
      4: 'text-xs font-medium',
      5: 'text-xs',
      6: 'text-xs'
    }
    return sizes[level as keyof typeof sizes] || 'text-sm'
  }

  if (!currentPage || tocItems.length === 0) {
    return null
  }

  return (
    <div className={`table-of-contents ${className}`} style={style}>
      {/* Toggle Button */}
      {showToggle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Table of Contents
          </h3>
          <button
            onClick={() => setTableOfContentsOpen(!tableOfContentsOpen)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={tableOfContentsOpen ? 'Collapse' : 'Expand'}
          >
            <span className={`transform transition-transform text-gray-500 dark:text-gray-400 ${
              tableOfContentsOpen ? 'rotate-90' : ''
            }`}>
              ▶
            </span>
          </button>
        </div>
      )}

      {/* TOC Items */}
      {tableOfContentsOpen && (
        <nav className="space-y-1">
          {tocItems.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              onClick={() => scrollToSection(item.id)}
              className={`block w-full text-left py-1 px-2 rounded transition-colors ${getIndentClass(item.level)} ${getFontSizeClass(item.level)} ${
                activeId === item.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-l-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="truncate block">
                {item.title}
              </span>
            </button>
          ))}
          
          {/* Progress Indicator */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Reading Progress</span>
              <span>{tocItems.findIndex(item => item.id === activeId) + 1} / {tocItems.length}</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((tocItems.findIndex(item => item.id === activeId) + 1) / tocItems.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </nav>
      )}

      {/* Floating TOC for mobile */}
      {tocItems.length > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden z-40">
          <button
            onClick={() => setTableOfContentsOpen(!tableOfContentsOpen)}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
            title="Table of Contents"
          >
            📑
          </button>
          
          {tableOfContentsOpen && (
            <div className="absolute bottom-14 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Contents
                  </h4>
                  <button
                    onClick={() => setTableOfContentsOpen(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                <nav className="space-y-1">
                  {tocItems.map((item, index) => (
                    <button
                      key={`mobile-${item.id}-${index}`}
                      onClick={() => {
                        scrollToSection(item.id)
                        setTableOfContentsOpen(false)
                      }}
                      className={`block w-full text-left py-1 px-2 rounded text-sm transition-colors ${getIndentClass(Math.min(item.level, 3))} ${
                        activeId === item.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="truncate block">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}