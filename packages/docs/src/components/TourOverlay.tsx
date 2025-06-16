import React, { useEffect, useRef, useState } from 'react'
import { useDocStore } from '../stores/docStore'
import type { TourStep } from '../types'

interface TourOverlayProps {
  className?: string
  style?: React.CSSProperties
}

export const TourOverlay: React.FC<TourOverlayProps> = ({ 
  className = '',
  style 
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  const {
    activeTour,
    currentTourStep,
    nextTourStep,
    previousTourStep,
    completeTour,
    skipTour,
    darkMode
  } = useDocStore()

  const currentStep = activeTour?.steps[currentTourStep]

  // Find target element and calculate position
  useEffect(() => {
    if (!currentStep?.target) {
      setTargetElement(null)
      setTooltipPosition(null)
      return
    }

    const element = document.querySelector(currentStep.target) as HTMLElement
    if (element) {
      setTargetElement(element)
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect()
      const scrollX = window.pageXOffset
      const scrollY = window.pageYOffset
      
      let x = rect.left + scrollX
      let y = rect.top + scrollY
      
      // Adjust position based on preferred placement
      switch (currentStep.position) {
        case 'top':
          x += rect.width / 2
          y -= 10
          break
        case 'bottom':
          x += rect.width / 2
          y += rect.height + 10
          break
        case 'left':
          x -= 10
          y += rect.height / 2
          break
        case 'right':
          x += rect.width + 10
          y += rect.height / 2
          break
        default:
          x += rect.width / 2
          y += rect.height + 10
      }
      
      setTooltipPosition({ x, y })
      
      // Scroll element into view if needed
      const viewportHeight = window.innerHeight
      const elementTop = rect.top
      const elementBottom = rect.bottom
      
      if (elementTop < 100 || elementBottom > viewportHeight - 100) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
    } else {
      setTargetElement(null)
      setTooltipPosition(null)
    }
  }, [currentStep])

  // Handle keyboard navigation
  useEffect(() => {
    if (!activeTour) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          skipTour()
          break
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          event.preventDefault()
          nextTourStep()
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (currentTourStep > 0) {
            previousTourStep()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTour, currentTourStep, nextTourStep, previousTourStep, skipTour])

  // Handle step actions
  useEffect(() => {
    if (!currentStep || !targetElement) return

    const handleAction = () => {
      // Auto-advance after action if specified
      setTimeout(() => {
        nextTourStep()
      }, 500)
    }

    switch (currentStep.action) {
      case 'click':
        targetElement.addEventListener('click', handleAction)
        return () => targetElement.removeEventListener('click', handleAction)
      case 'hover':
        targetElement.addEventListener('mouseenter', handleAction)
        return () => targetElement.removeEventListener('mouseenter', handleAction)
      case 'focus':
        targetElement.addEventListener('focus', handleAction)
        return () => targetElement.removeEventListener('focus', handleAction)
    }
  }, [currentStep, targetElement, nextTourStep])

  if (!activeTour || !currentStep) {
    return null
  }

  const isLastStep = currentTourStep === activeTour.steps.length - 1
  const progress = ((currentTourStep + 1) / activeTour.steps.length) * 100

  const renderBackdrop = () => {
    if (!currentStep.backdrop || !targetElement) return null

    const rect = targetElement.getBoundingClientRect()
    const scrollX = window.pageXOffset
    const scrollY = window.pageYOffset

    return (
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Top */}
        <div 
          className="absolute bg-black bg-opacity-50"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: rect.top + scrollY
          }}
        />
        {/* Bottom */}
        <div 
          className="absolute bg-black bg-opacity-50"
          style={{
            top: rect.bottom + scrollY,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
        {/* Left */}
        <div 
          className="absolute bg-black bg-opacity-50"
          style={{
            top: rect.top + scrollY,
            left: 0,
            width: rect.left + scrollX,
            height: rect.height
          }}
        />
        {/* Right */}
        <div 
          className="absolute bg-black bg-opacity-50"
          style={{
            top: rect.top + scrollY,
            left: rect.right + scrollX,
            right: 0,
            height: rect.height
          }}
        />
        {/* Highlight border around target */}
        <div 
          className="absolute border-2 border-blue-500 rounded pointer-events-none"
          style={{
            top: rect.top + scrollY - 2,
            left: rect.left + scrollX - 2,
            width: rect.width + 4,
            height: rect.height + 4
          }}
        />
      </div>
    )
  }

  const getTooltipClasses = () => {
    const position = currentStep.position || 'bottom'
    const baseClasses = 'absolute z-50 max-w-sm'
    
    switch (position) {
      case 'top':
        return `${baseClasses} mb-2 transform -translate-x-1/2`
      case 'bottom':
        return `${baseClasses} mt-2 transform -translate-x-1/2`
      case 'left':
        return `${baseClasses} mr-2 transform -translate-y-1/2`
      case 'right':
        return `${baseClasses} ml-2 transform -translate-y-1/2`
      default:
        return `${baseClasses} mt-2 transform -translate-x-1/2`
    }
  }

  const getArrowClasses = () => {
    const position = currentStep.position || 'bottom'
    const baseClasses = 'absolute w-3 h-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform rotate-45'
    
    switch (position) {
      case 'top':
        return `${baseClasses} -bottom-1.5 left-1/2 -translate-x-1/2`
      case 'bottom':
        return `${baseClasses} -top-1.5 left-1/2 -translate-x-1/2`
      case 'left':
        return `${baseClasses} -right-1.5 top-1/2 -translate-y-1/2`
      case 'right':
        return `${baseClasses} -left-1.5 top-1/2 -translate-y-1/2`
      default:
        return `${baseClasses} -top-1.5 left-1/2 -translate-x-1/2`
    }
  }

  return (
    <div ref={overlayRef} className={`tour-overlay ${className}`} style={style}>
      {/* Backdrop */}
      {renderBackdrop()}

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          className={getTooltipClasses()}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          {/* Arrow */}
          <div className={getArrowClasses()} />
          
          {/* Tooltip Content */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {currentStep.title}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Step {currentTourStep + 1} of {activeTour.steps.length}
                </div>
              </div>
              {activeTour.skippable && (
                <button
                  onClick={skipTour}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                  title="Skip tour"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-3">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Content */}
            <div 
              className="text-sm text-gray-700 dark:text-gray-300 mb-4"
              dangerouslySetInnerHTML={{ __html: currentStep.content }}
            />

            {/* Action Hint */}
            {currentStep.action && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                {currentStep.action === 'click' && '👆 Click the highlighted element to continue'}
                {currentStep.action === 'hover' && '🖱️ Hover over the highlighted element to continue'}
                {currentStep.action === 'focus' && '🎯 Focus the highlighted element to continue'}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={previousTourStep}
                disabled={currentTourStep === 0}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {activeTour.skippable && (
                  <button
                    onClick={skipTour}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {currentStep.skipButton || 'Skip Tour'}
                  </button>
                )}

                <button
                  onClick={isLastStep ? completeTour : nextTourStep}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  {isLastStep 
                    ? 'Complete' 
                    : currentStep.nextButton || 'Next'
                  }
                </button>
              </div>
            </div>

            {/* Keyboard Hints */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex gap-4">
                <span>← → Navigate</span>
                <span>Enter/Space Next</span>
                <span>Esc Skip</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}