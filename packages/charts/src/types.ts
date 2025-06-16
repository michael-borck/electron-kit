import type { ChartConfiguration, ChartData, ChartOptions } from 'chart.js'

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'bubble' | 'area' | 'histogram' | 'heatmap' | 'treemap' | 'wordcloud' | 'sankey' | 'network'

export interface ChartDataPoint {
  x?: number | string | Date
  y?: number | string | Date
  z?: number
  r?: number
  label?: string
  value?: number
  category?: string
  color?: string
  [key: string]: any
}

export interface ChartDataset {
  label: string
  data: ChartDataPoint[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
  tension?: number
  pointRadius?: number
  pointHoverRadius?: number
  [key: string]: any
}

export interface ChartConfig {
  type: ChartType
  data: {
    labels?: string[]
    datasets: ChartDataset[]
  }
  options?: ChartOptions
  plugins?: any[]
  responsive?: boolean
  maintainAspectRatio?: boolean
  width?: number
  height?: number
}

export interface ThemeConfig {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  info: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    disabled: string
  }
  grid: string
  axis: string
}

export interface ColorPalette {
  name: string
  colors: string[]
  description?: string
}

export interface ChartExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf'
  width?: number
  height?: number
  quality?: number
  backgroundColor?: string
  filename?: string
}

export interface ChartAnimation {
  duration: number
  easing: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
  delay?: number
  loop?: boolean
}

export interface TooltipConfig {
  enabled: boolean
  mode: 'point' | 'nearest' | 'index' | 'dataset'
  intersect: boolean
  backgroundColor?: string
  titleColor?: string
  bodyColor?: string
  borderColor?: string
  borderWidth?: number
  cornerRadius?: number
  displayColors?: boolean
  multiKeyBackground?: string
  usePointStyle?: boolean
}

export interface LegendConfig {
  display: boolean
  position: 'top' | 'left' | 'bottom' | 'right' | 'chartArea'
  align: 'start' | 'center' | 'end'
  labels?: {
    color?: string
    font?: {
      size?: number
      family?: string
      weight?: string
    }
    padding?: number
    usePointStyle?: boolean
  }
}

export interface AxisConfig {
  type?: 'linear' | 'logarithmic' | 'category' | 'time' | 'timeseries'
  display?: boolean
  position?: 'left' | 'right' | 'top' | 'bottom'
  title?: {
    display: boolean
    text: string
    color?: string
    font?: {
      size?: number
      family?: string
      weight?: string
    }
  }
  min?: number
  max?: number
  beginAtZero?: boolean
  grid?: {
    display?: boolean
    color?: string
    lineWidth?: number
  }
  ticks?: {
    color?: string
    font?: {
      size?: number
      family?: string
      weight?: string
    }
    stepSize?: number
    precision?: number
    callback?: (value: any, index: number, values: any[]) => string
  }
}

export interface ChartInteraction {
  mode: 'point' | 'nearest' | 'index' | 'dataset' | 'x' | 'y'
  intersect: boolean
  includeInvisible?: boolean
}

export interface D3ChartConfig {
  width: number
  height: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
  data: any[]
  scales?: {
    x?: any
    y?: any
    color?: any
  }
  axes?: {
    x?: any
    y?: any
  }
  theme?: ThemeConfig
  animation?: ChartAnimation
}

export interface WordCloudConfig {
  words: Array<{
    text: string
    value: number
    color?: string
  }>
  width: number
  height: number
  fontFamily?: string
  fontSizeMin?: number
  fontSizeMax?: number
  rotate?: () => number
  padding?: number
  spiral?: 'archimedean' | 'rectangular'
  colorScale?: string[]
}

export interface HeatmapConfig {
  data: Array<{
    x: number | string
    y: number | string
    value: number
  }>
  width: number
  height: number
  colorScale?: string[]
  cellSize?: number
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface NetworkConfig {
  nodes: Array<{
    id: string
    label?: string
    group?: string
    value?: number
    color?: string
  }>
  links: Array<{
    source: string
    target: string
    value?: number
    color?: string
  }>
  width: number
  height: number
  simulation?: {
    strength?: number
    distance?: number
    iterations?: number
  }
}

export interface ChartEvent {
  type: 'hover' | 'click' | 'select' | 'zoom' | 'pan' | 'resize'
  data: any
  element?: any
  index?: number
  datasetIndex?: number
}

export interface ChartPlugin {
  id: string
  beforeInit?: (chart: any) => void
  afterInit?: (chart: any) => void
  beforeUpdate?: (chart: any) => void
  afterUpdate?: (chart: any) => void
  beforeDraw?: (chart: any) => void
  afterDraw?: (chart: any) => void
  beforeDatasetsDraw?: (chart: any) => void
  afterDatasetsDraw?: (chart: any) => void
  beforeEvent?: (chart: any, args: any) => void
  afterEvent?: (chart: any, args: any) => void
  resize?: (chart: any, size: any) => void
  destroy?: (chart: any) => void
}