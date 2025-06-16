// Main components
export { ChartJSWrapper } from './components/ChartJS/ChartJSWrapper'
export { D3Wrapper } from './components/D3/D3Wrapper'
export { RechartsWrapper } from './components/Recharts/RechartsWrapper'

// Specialized components
export { WordCloud } from './components/Specialized/WordCloud'
export { Heatmap } from './components/Specialized/Heatmap'
export { NetworkChart } from './components/Specialized/NetworkChart'

// Types
export type {
  ChartType,
  ChartDataPoint,
  ChartDataset,
  ChartConfig,
  ThemeConfig,
  ColorPalette,
  ChartExportOptions,
  ChartAnimation,
  TooltipConfig,
  LegendConfig,
  AxisConfig,
  ChartInteraction,
  D3ChartConfig,
  WordCloudConfig,
  HeatmapConfig,
  NetworkConfig,
  ChartEvent,
  ChartPlugin
} from './types'

// Utilities
export {
  // Chart utilities
  transformData,
  createDataset,
  createChartConfig,
  calculateStats,
  generateTimeSeriesData,
  aggregateByTimePeriod,
  filterDataByRange,
  smoothData,
  detectOutliers,
  
  // Color utilities
  COLOR_PALETTES,
  generatePalette,
  hexToHsl,
  hslToHex,
  generateGradient,
  hexToRgb,
  rgbToHex,
  getContrastRatio,
  getLuminance,
  isAccessible,
  getBestTextColor,
  darkenColor,
  lightenColor,
  getComplementaryColor,
  getAnalogousColors,
  generateRandomColor,
  mixColors,
  
  // Data utilities
  csvToChartData,
  jsonToChartData,
  groupDataBy,
  sortData,
  paginateData,
  searchData,
  normalizeData,
  calculateCumulativeSum,
  calculateMovingAverage,
  calculatePercentageChange,
  fillMissingData,
  resampleData,
  
  // Export utilities
  downloadDataURL,
  canvasToBlob,
  svgToDataURL,
  svgToCanvas,
  exportAsCSV,
  exportAsJSON,
  exportAsPDF,
  copyToClipboard,
  printChart,
  validateExportOptions,
  getFileExtension,
  generateFilename,
  
  // Theme utilities
  LIGHT_THEME,
  DARK_THEME,
  MATERIAL_THEME,
  BOOTSTRAP_THEME,
  THEMES,
  applyTheme,
  createCustomTheme,
  getSystemTheme,
  watchSystemTheme,
  applyThemeToElement,
  generateThemeCSS,
  validateTheme,
  getThemeContrastRatio,
  suggestAccessibleTheme,
  interpolateThemes
} from './utils'

// Re-export component refs for TypeScript users
export type { ChartJSWrapperRef } from './components/ChartJS/ChartJSWrapper'
export type { D3WrapperRef } from './components/D3/D3Wrapper'
export type { RechartsWrapperRef } from './components/Recharts/RechartsWrapper'
export type { WordCloudRef } from './components/Specialized/WordCloud'
export type { HeatmapRef } from './components/Specialized/Heatmap'
export type { NetworkChartRef } from './components/Specialized/NetworkChart'