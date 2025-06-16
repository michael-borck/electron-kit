import type { ColorPalette } from '../types'

/**
 * Predefined color palettes
 */
export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: 'Default',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
    description: 'Default vibrant palette'
  },
  {
    name: 'Blues',
    colors: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
    description: 'Blue monochromatic palette'
  },
  {
    name: 'Greens',
    colors: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'],
    description: 'Green monochromatic palette'
  },
  {
    name: 'Purples',
    colors: ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#6d28d9'],
    description: 'Purple monochromatic palette'
  },
  {
    name: 'Warm',
    colors: ['#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
    description: 'Warm colors palette'
  },
  {
    name: 'Cool',
    colors: ['#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490'],
    description: 'Cool colors palette'
  },
  {
    name: 'Pastel',
    colors: ['#fecaca', '#fed7d7', '#fde68a', '#d9f99d', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'],
    description: 'Soft pastel colors'
  },
  {
    name: 'Vibrant',
    colors: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#7c3aed', '#be185d', '#059669'],
    description: 'High contrast vibrant colors'
  },
  {
    name: 'Grayscale',
    colors: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151'],
    description: 'Grayscale palette'
  },
  {
    name: 'Accessible',
    colors: ['#1f2937', '#7c2d12', '#166534', '#1e40af', '#7c3aed', '#be185d', '#0891b2', '#ca8a04'],
    description: 'High contrast accessible colors'
  }
]

/**
 * Generate a color palette based on a base color
 */
export function generatePalette(baseColor: string, count: number = 8): string[] {
  const colors: string[] = []
  const hsl = hexToHsl(baseColor)
  
  for (let i = 0; i < count; i++) {
    const lightness = 0.2 + (0.6 * i) / (count - 1)
    const saturation = Math.max(0.3, hsl.s - (i * 0.1))
    colors.push(hslToHex(hsl.h, saturation, lightness))
  }
  
  return colors
}

/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return { h: h * 360, s, l }
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  h /= 360
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * Generate gradient colors between two colors
 */
export function generateGradient(startColor: string, endColor: string, steps: number): string[] {
  const start = hexToRgb(startColor)
  const end = hexToRgb(endColor)
  const colors: string[] = []

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1)
    const r = Math.round(start.r + (end.r - start.r) * ratio)
    const g = Math.round(start.g + (end.g - start.g) * ratio)
    const b = Math.round(start.b + (end.b - start.b) * ratio)
    colors.push(rgbToHex(r, g, b))
  }

  return colors
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Get relative luminance of a color
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  const rsRGB = rgb.r / 255
  const gsRGB = rgb.g / 255
  const bsRGB = rgb.b / 255

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Check if a color is accessible against white background
 */
export function isAccessible(color: string, background: string = '#ffffff'): boolean {
  return getContrastRatio(color, background) >= 4.5
}

/**
 * Get the best text color (black or white) for a background color
 */
export function getBestTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#ffffff')
  const blackContrast = getContrastRatio(backgroundColor, '#000000')
  return whiteContrast > blackContrast ? '#ffffff' : '#000000'
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - percent / 100))
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex(hsl.h, hsl.s, Math.min(1, hsl.l + percent / 100))
}

/**
 * Get complementary color
 */
export function getComplementaryColor(hex: string): string {
  const hsl = hexToHsl(hex)
  const complementaryHue = (hsl.h + 180) % 360
  return hslToHex(complementaryHue, hsl.s, hsl.l)
}

/**
 * Get analogous colors
 */
export function getAnalogousColors(hex: string, count: number = 3): string[] {
  const hsl = hexToHsl(hex)
  const colors: string[] = []
  const step = 30

  for (let i = 0; i < count; i++) {
    const hue = (hsl.h + (i - Math.floor(count / 2)) * step + 360) % 360
    colors.push(hslToHex(hue, hsl.s, hsl.l))
  }

  return colors
}

/**
 * Generate random color
 */
export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

/**
 * Mix two colors
 */
export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio)
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio)
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)
  
  return rgbToHex(r, g, b)
}