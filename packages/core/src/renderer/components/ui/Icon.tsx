import React from 'react'
import { 
  Home, 
  Settings, 
  Info, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Bell,
  Check,
  AlertCircle,
  AlertTriangle,
  XCircle,
  type LucideIcon
} from 'lucide-react'

const iconMap = {
  Home,
  Settings,
  Info,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Bell,
  Check,
  AlertCircle,
  AlertTriangle,
  XCircle
} as const

export type IconName = keyof typeof iconMap

interface IconProps {
  name: IconName
  size?: number
  className?: string
  color?: string
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 20, 
  className = '', 
  color 
}) => {
  const IconComponent = iconMap[name] as LucideIcon
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <IconComponent 
      size={size} 
      className={className}
      color={color}
    />
  )
}