import React, { useState } from 'react'
import { useDocStore } from '../stores/docStore'
import type { DocPage, DocCategory } from '../types'

interface DocSidebarProps {
  className?: string
  style?: React.CSSProperties
}

export const DocSidebar: React.FC<DocSidebarProps> = ({ 
  className = '',
  style 
}) => {
  const {
    sidebarOpen,
    setSidebarOpen,
    currentPage,
    currentCategory,
    setCurrentPage,
    setCurrentCategory,
    getPages,
    getCategories,
    getPagesByCategory,
    darkMode
  } = useDocStore()

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const categories = getCategories()
  const uncategorizedPages = getPages().filter(page => !page.category)

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId)
    } else {
      newCollapsed.add(categoryId)
    }
    setCollapsedCategories(newCollapsed)
  }

  const handlePageClick = (page: DocPage) => {
    setCurrentPage(page)
    if (page.category) {
      setCurrentCategory(page.category)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    setCurrentCategory(categoryId)
    const pages = getPagesByCategory(categoryId)
    if (pages.length > 0) {
      setCurrentPage(pages[0])
    }
  }

  const renderPageItem = (page: DocPage, level: number = 0) => {
    const isActive = currentPage?.id === page.id
    const indent = level * 16

    return (
      <li key={page.id}>
        <button
          onClick={() => handlePageClick(page)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            isActive
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate">{page.title}</span>
            {page.tags && page.tags.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {page.tags.length}
              </span>
            )}
          </div>
          {page.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {page.description}
            </div>
          )}
        </button>
      </li>
    )
  }

  const renderCategory = (category: DocCategory) => {
    const pages = getPagesByCategory(category.id)
    const isCollapsed = collapsedCategories.has(category.id)
    const isActive = currentCategory === category.id

    return (
      <li key={category.id} className="mb-2">
        <div className="flex items-center">
          <button
            onClick={() => toggleCategory(category.id)}
            className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <span className={`transform transition-transform ${
              isCollapsed ? '' : 'rotate-90'
            }`}>
              ▶
            </span>
            {category.icon && (
              <span className="text-lg">{category.icon}</span>
            )}
            <span className="flex-1 truncate">{category.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {pages.length}
            </span>
          </button>
          <button
            onClick={() => handleCategoryClick(category.id)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="View category overview"
          >
            📄
          </button>
        </div>
        
        {!isCollapsed && pages.length > 0 && (
          <ul className="ml-4 mt-1 space-y-1">
            {pages.map(page => renderPageItem(page, 1))}
          </ul>
        )}

        {category.description && !isCollapsed && (
          <div className="ml-8 mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
            {category.description}
          </div>
        )}
      </li>
    )
  }

  if (!sidebarOpen) {
    return (
      <div className={`w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`} style={style}>
        <div className="p-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Open sidebar"
          >
            <span className="text-gray-600 dark:text-gray-400">📚</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <aside 
      className={`w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`} 
      style={style}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Documentation
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Close sidebar"
          >
            <span className="text-gray-600 dark:text-gray-400">✕</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {/* Categories */}
          {categories.map(category => renderCategory(category))}
          
          {/* Uncategorized Pages */}
          {uncategorizedPages.length > 0 && (
            <>
              {categories.length > 0 && (
                <li className="my-4">
                  <hr className="border-gray-200 dark:border-gray-700" />
                </li>
              )}
              <li className="mb-2">
                <div className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                  Other Pages
                </div>
              </li>
              {uncategorizedPages.map(page => renderPageItem(page))}
            </>
          )}
        </ul>

        {/* Empty State */}
        {categories.length === 0 && uncategorizedPages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No documentation pages yet
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {getPages().length} page{getPages().length !== 1 ? 's' : ''} total
        </div>
      </div>
    </aside>
  )
}