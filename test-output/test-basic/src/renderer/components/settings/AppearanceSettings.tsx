import React from 'react'
import { useSettingsStore } from '../../stores/settings'
import { useTheme } from '../../hooks/useTheme'
import { Icon } from '../ui/Icon'

export const AppearanceSettings: React.FC = () => {
  const { settings, updateAppearance } = useSettingsStore()
  const { currentTheme } = useTheme()
  const { theme, fontFamily, fontSize, accentColor, compactMode } = settings.appearance

  const themeOptions = [
    { value: 'light', label: 'Light', icon: 'Sun' },
    { value: 'dark', label: 'Dark', icon: 'Moon' },
    { value: 'system', label: 'System', icon: 'Monitor' }
  ] as const

  const fontFamilyOptions = [
    { value: 'system', label: 'System Default' },
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans Serif' }
  ] as const

  const fontSizeOptions = [
    { value: 'small', label: 'Small (14px)' },
    { value: 'medium', label: 'Medium (16px)' },
    { value: 'large', label: 'Large (18px)' },
    { value: 'xl', label: 'Extra Large (20px)' }
  ] as const

  const accentColors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16'  // Lime
  ]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Appearance
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Customize the look and feel of the application.
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateAppearance({ theme: option.value })}
              className={`
                flex items-center gap-2 p-3 rounded-lg border transition-colors
                ${theme === option.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <Icon name={option.icon as any} size={18} />
              <span className="text-sm font-medium">{option.label}</span>
              {theme === option.value && currentTheme !== option.value && option.value === 'system' && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({currentTheme})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Font Family
        </label>
        <select
          value={fontFamily}
          onChange={(e) => updateAppearance({ fontFamily: e.target.value as any })}
          className="input w-full"
        >
          {fontFamilyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Font Size
        </label>
        <select
          value={fontSize}
          onChange={(e) => updateAppearance({ fontSize: e.target.value as any })}
          className="input w-full"
        >
          {fontSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Accent Color
        </label>
        <div className="grid grid-cols-8 gap-2">
          {accentColors.map((color) => (
            <button
              key={color}
              onClick={() => updateAppearance({ accentColor: color })}
              className={`
                w-8 h-8 rounded-full border-2 transition-all
                ${accentColor === color
                  ? 'border-gray-900 dark:border-gray-100 scale-110'
                  : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => updateAppearance({ accentColor: e.target.value })}
            className="w-16 h-8 rounded border border-gray-300 dark:border-gray-600"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Custom color
          </span>
        </div>
      </div>

      {/* Compact Mode */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={compactMode}
            onChange={(e) => updateAppearance({ compactMode: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Compact Mode
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reduce spacing and padding for a more condensed interface
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}