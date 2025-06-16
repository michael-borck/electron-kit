import React, { useEffect, useRef, useState } from 'react'
import { useDocStore } from '../stores/docStore'
import type { HelpTooltip as HelpTooltipType } from '../types'

interface HelpTooltipProps {
  tooltip: HelpTooltipType
  className?: string
  style?: React.CSSProperties
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  tooltip, 
  className = '',
  style 
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const {
    activeTooltips,
    tooltipPositions,
    hideTooltip,
    darkMode
  } = useDocStore()

  const isActive = activeTooltips.has(tooltip.id)
  const storedPosition = tooltipPositions[tooltip.id]

  // Find target element
  useEffect(() => {
    const element = document.querySelector(tooltip.target) as HTMLElement
    setTargetElement(element)
  }, [tooltip.target])

  // Calculate position
  useEffect(() => {
    if (!targetElement || !isActive) {
      setPosition(null)
      setIsVisible(false)
      return
    }

    const calculatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      const scrollX = window.pageXOffset
      const scrollY = window.pageYOffset
      
      let x = rect.left + scrollX
      let y = rect.top + scrollY
      
      // Use stored position if available
      if (storedPosition) {
        setPosition(storedPosition)
        setIsVisible(true)
        return
      }
      
      // Calculate position based on preferred placement
      const tooltipWidth = 280 // Approximate tooltip width
      const tooltipHeight = 120 // Approximate tooltip height
      const offset = 10
      
      switch (tooltip.position || 'top') {
        case 'top':
          x += rect.width / 2 - tooltipWidth / 2
          y -= tooltipHeight + offset
          break
        case 'bottom':
          x += rect.width / 2 - tooltipWidth / 2
          y += rect.height + offset
          break
        case 'left':
          x -= tooltipWidth + offset
          y += rect.height / 2 - tooltipHeight / 2
          break
        case 'right':
          x += rect.width + offset
          y += rect.height / 2 - tooltipHeight / 2
          break
      }
      
      // Keep tooltip within viewport
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10))
      y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10))
      
      setPosition({ x, y })
      setIsVisible(true)
    }

    calculatePosition()
    
    // Recalculate on scroll/resize
    const handleUpdate = () => {
      if (isActive) {
        calculatePosition()
      }
    }
    
    window.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate)
    
    return () => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [targetElement, isActive, storedPosition, tooltip.position])

  // Handle trigger events
  useEffect(() => {
    if (!targetElement) return

    let timeoutId: NodeJS.Timeout

    const showTooltip = () => {
      if (tooltip.delay) {
        timeoutId = setTimeout(() => {
          setIsVisible(true)
        }, tooltip.delay)
      } else {
        setIsVisible(true)
      }
    }

    const hideTooltipHandler = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (!tooltip.persistent) {
        setIsVisible(false)
        hideTooltip(tooltip.id)
      }
    }

    switch (tooltip.trigger || 'hover') {
      case 'hover':
        targetElement.addEventListener('mouseenter', showTooltip)
        targetElement.addEventListener('mouseleave', hideTooltipHandler)
        break
      case 'click':
        targetElement.addEventListener('click', showTooltip)
        document.addEventListener('click', (e) => {
          if (!targetElement.contains(e.target as Node) && 
              !tooltipRef.current?.contains(e.target as Node)) {
            hideTooltipHandler()
          }
        })
        break
      case 'focus':
        targetElement.addEventListener('focus', showTooltip)
        targetElement.addEventListener('blur', hideTooltipHandler)
        break
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      targetElement.removeEventListener('mouseenter', showTooltip)
      targetElement.removeEventListener('mouseleave', hideTooltipHandler)
      targetElement.removeEventListener('click', showTooltip)
      targetElement.removeEventListener('focus', showTooltip)
      targetElement.removeEventListener('blur', hideTooltipHandler)
    }
  }, [targetElement, tooltip, hideTooltip])

  // Click outside to close
  useEffect(() => {
    if (!isVisible || !tooltip.persistent) return

    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && 
          !tooltipRef.current.contains(event.target as Node) &&
          targetElement &&
          !targetElement.contains(event.target as Node)) {
        hideTooltip(tooltip.id)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVisible, tooltip.persistent, tooltip.id, targetElement, hideTooltip])

  if (!isActive || !isVisible || !position) {
    return null
  }

  const getArrowClasses = () => {
    const pos = tooltip.position || 'top'
    const baseClasses = 'absolute w-3 h-3 bg-gray-900 dark:bg-gray-100 transform rotate-45'
    
    switch (pos) {
      case 'top':
        return `${baseClasses} -bottom-1.5 left-1/2 -translate-x-1/2`
      case 'bottom':
        return `${baseClasses} -top-1.5 left-1/2 -translate-x-1/2`
      case 'left':
        return `${baseClasses} -right-1.5 top-1/2 -translate-y-1/2`
      case 'right':
        return `${baseClasses} -left-1.5 top-1/2 -translate-y-1/2`
      default:
        return `${baseClasses} -bottom-1.5 left-1/2 -translate-x-1/2`
    }
  }

  return (
    <div
      ref={tooltipRef}
      className={`help-tooltip fixed z-50 max-w-xs ${className}`}
      style={{
        left: position.x,
        top: position.y,
        ...style
      }}
    >
      {/* Arrow */}
      <div className={getArrowClasses()} />
      
      {/* Tooltip Content */}
      <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg p-3 relative z-10">
        {/* Header */}
        {tooltip.title && (
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm">
              {tooltip.title}
            </h4>
            {tooltip.persistent && (
              <button
                onClick={() => hideTooltip(tooltip.id)}
                className="text-gray-300 dark:text-gray-600 hover:text-white dark:hover:text-gray-900 ml-2 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />

        {/* Help Icon */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
          ?
        </div>
      </div>
    </div>
  )
}

// Tooltip Manager Component
export const HelpTooltipManager: React.FC = () => {
  const { getTooltips, activeTooltips } = useDocStore()
  
  const tooltips = getTooltips()
  const activeTooltipsList = tooltips.filter(tooltip => activeTooltips.has(tooltip.id))

  return (
    <>
      {activeTooltipsList.map(tooltip => (
        <HelpTooltip 
          key={tooltip.id} 
          tooltip={tooltip}
        />
      ))}
    </>
  )
}