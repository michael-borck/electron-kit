import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '../stores/notificationStore'
import { ToastNotification } from './ToastNotification'
import type { NotificationPosition } from '../types'

interface ToastContainerProps {
  position?: NotificationPosition
  className?: string
  style?: React.CSSProperties
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position,
  className = '',
  style
}) => {
  const { notifications, config } = useNotificationStore()
  
  const containerPosition = position || config.position
  
  // Filter notifications by position
  const positionNotifications = notifications.filter(
    notification => (notification.position || config.position) === containerPosition
  )

  const getContainerClasses = (pos: NotificationPosition) => {
    const baseClasses = 'fixed z-50 flex flex-col gap-2 p-4 pointer-events-none'
    
    switch (pos) {
      case 'top-left':
        return `${baseClasses} top-0 left-0`
      case 'top-right':
        return `${baseClasses} top-0 right-0`
      case 'top-center':
        return `${baseClasses} top-0 left-1/2 transform -translate-x-1/2`
      case 'bottom-left':
        return `${baseClasses} bottom-0 left-0`
      case 'bottom-right':
        return `${baseClasses} bottom-0 right-0`
      case 'bottom-center':
        return `${baseClasses} bottom-0 left-1/2 transform -translate-x-1/2`
      default:
        return `${baseClasses} top-0 right-0`
    }
  }

  const getAnimationVariants = (pos: NotificationPosition) => {
    const isTop = pos.includes('top')
    const isLeft = pos.includes('left')
    const isCenter = pos.includes('center')
    
    let x = 0
    let y = 0
    
    if (isCenter) {
      x = 0 // Center positioning handled by transform
    } else if (isLeft) {
      x = -100
    } else {
      x = 100
    }
    
    if (isTop) {
      y = -100
    } else {
      y = 100
    }

    return {
      initial: { x: `${x}%`, y: `${y}%`, opacity: 0, scale: 0.8 },
      animate: { x: 0, y: 0, opacity: 1, scale: 1 },
      exit: { x: `${x}%`, y: `${y}%`, opacity: 0, scale: 0.8 }
    }
  }

  const variants = getAnimationVariants(containerPosition)

  if (positionNotifications.length === 0) {
    return null
  }

  return (
    <div 
      className={`${getContainerClasses(containerPosition)} ${className}`}
      style={style}
    >
      <AnimatePresence mode="popLayout">
        {positionNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: config.animationDuration / 1000
            }}
            className="pointer-events-auto"
          >
            <ToastNotification notification={notification} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}