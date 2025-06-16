import React, { useEffect, useRef } from 'react'
import { useDocStore } from '../stores/docStore'

interface DocViewerProps {
  pageId?: string
  className?: string
  style?: React.CSSProperties
}

export const DocViewer: React.FC<DocViewerProps> = ({ 
  pageId, 
  className = '',
  style 
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const {
    currentPage,
    setCurrentPage,
    docManager,
    searchQuery,
    highlightSearchTerms,
    fontSize,
    darkMode,
    showLineNumbers,
    printMode
  } = useDocStore()

  // Load page when pageId changes
  useEffect(() => {
    if (pageId) {
      const page = docManager.getPage(pageId)
      if (page) {
        setCurrentPage(page)
      }
    }
  }, [pageId, docManager, setCurrentPage])

  // Apply search highlighting
  useEffect(() => {
    if (contentRef.current && searchQuery && highlightSearchTerms) {
      highlightSearchInContent(contentRef.current, searchQuery)
    }
  }, [searchQuery, highlightSearchTerms, currentPage])

  const highlightSearchInContent = (element: HTMLElement, query: string) => {
    // Remove existing highlights
    element.querySelectorAll('.search-highlight').forEach(el => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el)
        parent.normalize()
      }
    })

    if (!query.trim()) return

    // Add new highlights
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    )

    const textNodes: Text[] = []
    let node: Text | null

    while (node = walker.nextNode() as Text) {
      textNodes.push(node)
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent || ''
      const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
      
      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<mark class="search-highlight bg-yellow-200 dark:bg-yellow-600">$1</mark>')
        const wrapper = document.createElement('span')
        wrapper.innerHTML = highlightedText
        textNode.parentNode?.replaceChild(wrapper, textNode)
      }
    })
  }

  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const renderContent = () => {
    if (!currentPage) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-4">📖</div>
            <div className="text-lg font-medium">No page selected</div>
            <div className="text-sm">Choose a page from the sidebar to get started</div>
          </div>
        </div>
      )
    }

    const renderedContent = docManager.renderMarkdown(currentPage.content)

    return (
      <article className={`prose max-w-none ${
        darkMode ? 'prose-invert' : ''
      } ${
        printMode ? 'print:prose-sm' : ''
      }`}>
        {/* Page Header */}
        <header className="mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {currentPage.title}
          </h1>
          {currentPage.description && (
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {currentPage.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {currentPage.author && (
              <span>By {currentPage.author}</span>
            )}
            {currentPage.lastModified && (
              <span>
                Updated {new Date(currentPage.lastModified).toLocaleDateString()}
              </span>
            )}
            {currentPage.tags && currentPage.tags.length > 0 && (
              <div className="flex gap-1">
                {currentPage.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div 
          ref={contentRef}
          className={`${showLineNumbers ? 'line-numbers' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

        {/* Page Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div>
              {currentPage.category && (
                <span>Category: {docManager.getCategory(currentPage.category)?.name}</span>
              )}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => window.print()}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                Print
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                }}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                Copy Link
              </button>
            </div>
          </div>
        </footer>
      </article>
    )
  }

  return (
    <div 
      className={`doc-viewer h-full overflow-y-auto ${className} ${
        darkMode ? 'dark' : ''
      } ${
        printMode ? 'print-mode' : ''
      }`}
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: 1.6,
        ...style 
      }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {renderContent()}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .doc-viewer .search-highlight {
          background-color: #fef08a;
          border-radius: 2px;
          padding: 0 2px;
        }
        
        .dark .doc-viewer .search-highlight {
          background-color: #ca8a04;
          color: white;
        }
        
        .doc-viewer .line-numbers pre {
          counter-reset: line;
        }
        
        .doc-viewer .line-numbers pre code {
          counter-increment: line;
        }
        
        .doc-viewer .line-numbers pre code::before {
          content: counter(line);
          display: inline-block;
          width: 3em;
          padding-right: 1em;
          margin-right: 1em;
          color: #6b7280;
          text-align: right;
          border-right: 1px solid #e5e7eb;
        }
        
        .dark .doc-viewer .line-numbers pre code::before {
          color: #9ca3af;
          border-right-color: #374151;
        }
        
        .print-mode {
          background: white !important;
          color: black !important;
        }
        
        @media print {
          .doc-viewer {
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
          
          .doc-viewer h1 { font-size: 18pt !important; }
          .doc-viewer h2 { font-size: 16pt !important; }
          .doc-viewer h3 { font-size: 14pt !important; }
          .doc-viewer h4 { font-size: 13pt !important; }
          .doc-viewer h5 { font-size: 12pt !important; }
          .doc-viewer h6 { font-size: 11pt !important; }
          
          .doc-viewer .search-highlight {
            background: transparent !important;
            border: 1px solid #000 !important;
          }
        }
      `}</style>
    </div>
  )
}