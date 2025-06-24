import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/app'
import { useSettingsStore } from '../../stores/settings'
import { Icon, type IconName } from '../ui/Icon'

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { navigationItems, sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const { settings } = useSettingsStore()
  const { sidebarExpanded } = settings.window

  const isCollapsed = sidebarCollapsed || !sidebarExpanded

  return (
    <aside 
      className={`
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        flex flex-col
      `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Template App
          </h2>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon 
            name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} 
            size={20}
            className="text-gray-600 dark:text-gray-400"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                    ${isActive 
                      ? 'bg-primary-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon 
                    name={item.icon as IconName} 
                    size={20}
                    className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
                  />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="px-2 py-1 text-xs bg-primary-600 text-white rounded-full min-w-[20px] text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {isCollapsed && item.badge && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Template App v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  )
}