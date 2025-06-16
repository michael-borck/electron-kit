import type { ThemeConfig, ChartConfig } from '../types'
import { COLOR_PALETTES } from './colorUtils'

/**
 * Default light theme
 */
export const LIGHT_THEME: ThemeConfig = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  background: '#ffffff',
  surface: '#f8fafc',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    disabled: '#94a3b8'
  },
  grid: '#e2e8f0',
  axis: '#64748b'
}

/**
 * Default dark theme
 */
export const DARK_THEME: ThemeConfig = {
  primary: '#60a5fa',
  secondary: '#94a3b8',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  background: '#0f172a',
  surface: '#1e293b',
  text: {
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    disabled: '#64748b'
  },
  grid: '#334155',
  axis: '#94a3b8'
}

/**
 * Material Design theme
 */
export const MATERIAL_THEME: ThemeConfig = {
  primary: '#1976d2',
  secondary: '#757575',
  success: '#388e3c',
  warning: '#f57c00',
  error: '#d32f2f',
  info: '#0288d1',
  background: '#fafafa',
  surface: '#ffffff',
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#bdbdbd'
  },
  grid: '#e0e0e0',
  axis: '#757575'
}

/**
 * Bootstrap theme
 */
export const BOOTSTRAP_THEME: ThemeConfig = {
  primary: '#0d6efd',
  secondary: '#6c757d',
  success: '#198754',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#0dcaf0',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: {
    primary: '#212529',
    secondary: '#6c757d',
    disabled: '#adb5bd'
  },
  grid: '#dee2e6',
  axis: '#6c757d'
}

/**
 * Available themes
 */
export const THEMES = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  material: MATERIAL_THEME,
  bootstrap: BOOTSTRAP_THEME
} as const

/**
 * Apply theme to chart configuration
 */
export function applyTheme(config: ChartConfig, theme: ThemeConfig): ChartConfig {
  const themedConfig = { ...config }

  // Apply theme colors to datasets
  if (themedConfig.data.datasets) {
    themedConfig.data.datasets = themedConfig.data.datasets.map((dataset, index) => {
      const palette = COLOR_PALETTES[0].colors
      const color = palette[index % palette.length]
      
      return {
        ...dataset,
        backgroundColor: dataset.backgroundColor || color,
        borderColor: dataset.borderColor || color,
        pointBackgroundColor: dataset.pointBackgroundColor || color,
        pointBorderColor: dataset.pointBorderColor || theme.background
      }
    })
  }

  // Apply theme to chart options
  themedConfig.options = {
    ...themedConfig.options,
    plugins: {
      ...themedConfig.options?.plugins,
      legend: {
        ...themedConfig.options?.plugins?.legend,
        labels: {
          ...themedConfig.options?.plugins?.legend?.labels,
          color: theme.text.primary
        }
      },
      title: {
        ...themedConfig.options?.plugins?.title,
        color: theme.text.primary
      },
      tooltip: {
        ...themedConfig.options?.plugins?.tooltip,
        backgroundColor: theme.surface,
        titleColor: theme.text.primary,
        bodyColor: theme.text.secondary,
        borderColor: theme.grid,
        borderWidth: 1
      }
    },
    scales: themedConfig.type !== 'pie' && themedConfig.type !== 'doughnut' ? {
      ...themedConfig.options?.scales,
      x: {
        ...themedConfig.options?.scales?.x,
        grid: {
          ...themedConfig.options?.scales?.x?.grid,
          color: theme.grid
        },
        ticks: {
          ...themedConfig.options?.scales?.x?.ticks,
          color: theme.text.secondary
        },
        title: {
          ...themedConfig.options?.scales?.x?.title,
          color: theme.text.primary
        }
      },
      y: {
        ...themedConfig.options?.scales?.y,
        grid: {
          ...themedConfig.options?.scales?.y?.grid,
          color: theme.grid
        },
        ticks: {
          ...themedConfig.options?.scales?.y?.ticks,
          color: theme.text.secondary
        },
        title: {
          ...themedConfig.options?.scales?.y?.title,
          color: theme.text.primary
        }
      }
    } : themedConfig.options?.scales
  }

  return themedConfig
}

/**
 * Create custom theme
 */
export function createCustomTheme(
  baseTheme: ThemeConfig = LIGHT_THEME,
  overrides: Partial<ThemeConfig> = {}
): ThemeConfig {
  return {
    ...baseTheme,
    ...overrides,
    text: {
      ...baseTheme.text,
      ...overrides.text
    }
  }
}

/**
 * Get theme based on system preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

/**
 * Listen for theme changes
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light')
  }
  
  mediaQuery.addEventListener('change', handler)
  
  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}

/**
 * Apply theme to DOM element
 */
export function applyThemeToElement(element: HTMLElement, theme: ThemeConfig): void {
  element.style.backgroundColor = theme.background
  element.style.color = theme.text.primary
}

/**
 * Generate CSS variables from theme
 */
export function generateThemeCSS(theme: ThemeConfig, prefix: string = '--chart'): string {
  return `
    ${prefix}-primary: ${theme.primary};
    ${prefix}-secondary: ${theme.secondary};
    ${prefix}-success: ${theme.success};
    ${prefix}-warning: ${theme.warning};
    ${prefix}-error: ${theme.error};
    ${prefix}-info: ${theme.info};
    ${prefix}-background: ${theme.background};
    ${prefix}-surface: ${theme.surface};
    ${prefix}-text-primary: ${theme.text.primary};
    ${prefix}-text-secondary: ${theme.text.secondary};
    ${prefix}-text-disabled: ${theme.text.disabled};
    ${prefix}-grid: ${theme.grid};
    ${prefix}-axis: ${theme.axis};
  `.trim()
}

/**
 * Validate theme configuration
 */
export function validateTheme(theme: Partial<ThemeConfig>): string[] {
  const errors: string[] = []
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

  const colorFields = [
    'primary', 'secondary', 'success', 'warning', 'error', 'info',
    'background', 'surface', 'grid', 'axis'
  ]

  colorFields.forEach(field => {
    const value = (theme as any)[field]
    if (value && !colorRegex.test(value)) {
      errors.push(`Invalid color format for ${field}: ${value}`)
    }
  })

  if (theme.text) {
    const textFields = ['primary', 'secondary', 'disabled']
    textFields.forEach(field => {
      const value = (theme.text as any)[field]
      if (value && !colorRegex.test(value)) {
        errors.push(`Invalid color format for text.${field}: ${value}`)
      }
    })
  }

  return errors
}

/**
 * Get contrast ratio between theme colors
 */
export function getThemeContrastRatio(theme: ThemeConfig): {
  primaryOnBackground: number
  textOnBackground: number
  textOnSurface: number
} {
  // This would use the contrast calculation from colorUtils
  // Simplified implementation for now
  return {
    primaryOnBackground: 4.5, // Placeholder
    textOnBackground: 7.0,   // Placeholder  
    textOnSurface: 6.5       // Placeholder
  }
}

/**
 * Suggest accessible theme adjustments
 */
export function suggestAccessibleTheme(theme: ThemeConfig): Partial<ThemeConfig> {
  // This would analyze the theme and suggest improvements for accessibility
  // Simplified implementation for now
  return {
    // Suggested improvements would be returned here
  }
}

/**
 * Interpolate between two themes
 */
export function interpolateThemes(
  theme1: ThemeConfig,
  theme2: ThemeConfig,
  ratio: number
): ThemeConfig {
  const interpolateColor = (color1: string, color2: string): string => {
    // Simple linear interpolation between hex colors
    const r1 = parseInt(color1.slice(1, 3), 16)
    const g1 = parseInt(color1.slice(3, 5), 16)
    const b1 = parseInt(color1.slice(5, 7), 16)
    
    const r2 = parseInt(color2.slice(1, 3), 16)
    const g2 = parseInt(color2.slice(3, 5), 16)
    const b2 = parseInt(color2.slice(5, 7), 16)
    
    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return {
    primary: interpolateColor(theme1.primary, theme2.primary),
    secondary: interpolateColor(theme1.secondary, theme2.secondary),
    success: interpolateColor(theme1.success, theme2.success),
    warning: interpolateColor(theme1.warning, theme2.warning),
    error: interpolateColor(theme1.error, theme2.error),
    info: interpolateColor(theme1.info, theme2.info),
    background: interpolateColor(theme1.background, theme2.background),
    surface: interpolateColor(theme1.surface, theme2.surface),
    text: {
      primary: interpolateColor(theme1.text.primary, theme2.text.primary),
      secondary: interpolateColor(theme1.text.secondary, theme2.text.secondary),
      disabled: interpolateColor(theme1.text.disabled, theme2.text.disabled)
    },
    grid: interpolateColor(theme1.grid, theme2.grid),
    axis: interpolateColor(theme1.axis, theme2.axis)
  }
}