import { useEffect } from 'react'
import { useSettingsStore } from '../stores/settings'

export const useTheme = () => {
  const { settings, updateAppearance } = useSettingsStore()
  const { theme, fontSize, fontFamily, compactMode, highContrast } = settings.appearance
  const { reduceMotion } = settings.accessibility

  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Apply theme
    const applyTheme = (theme: string) => {
      body.classList.remove('light', 'dark')
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        body.classList.add(systemTheme)
      } else {
        body.classList.add(theme)
      }
    }

    applyTheme(theme)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px'
    }
    root.style.fontSize = fontSizeMap[fontSize]

    // Apply font family
    const fontFamilyMap = {
      system: 'Inter, system-ui, -apple-system, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      'sans-serif': 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'
    }
    root.style.fontFamily = fontFamilyMap[fontFamily]

    // Apply compact mode
    root.classList.toggle('compact', compactMode)

    // Apply accessibility preferences
    root.classList.toggle('high-contrast', highContrast)
    root.classList.toggle('reduce-motion', reduceMotion)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [theme, fontSize, fontFamily, compactMode, highContrast, reduceMotion])

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    updateAppearance({ theme: nextTheme })
  }

  const getCurrentTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  return {
    theme,
    currentTheme: getCurrentTheme(),
    fontSize,
    fontFamily,
    compactMode,
    toggleTheme,
    updateAppearance
  }
}