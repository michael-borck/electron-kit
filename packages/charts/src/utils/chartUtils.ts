import type { ChartDataPoint, ChartDataset, ChartConfig } from '../types'

/**
 * Transform data from various formats to chart-compatible format
 */
export function transformData(
  data: any[],
  xKey: string,
  yKey: string,
  labelKey?: string
): ChartDataPoint[] {
  return data.map(item => ({
    x: item[xKey],
    y: item[yKey],
    label: labelKey ? item[labelKey] : undefined,
    ...item
  }))
}

/**
 * Create a dataset with default styling
 */
export function createDataset(
  label: string,
  data: ChartDataPoint[],
  options: Partial<ChartDataset> = {}
): ChartDataset {
  return {
    label,
    data,
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
    borderWidth: 2,
    fill: false,
    ...options
  }
}

/**
 * Generate chart configuration with defaults
 */
export function createChartConfig(
  type: ChartConfig['type'],
  datasets: ChartDataset[],
  labels?: string[],
  options: ChartConfig['options'] = {}
): ChartConfig {
  return {
    type,
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: false
        }
      },
      scales: type !== 'pie' && type !== 'doughnut' && type !== 'radar' ? {
        y: {
          beginAtZero: true
        }
      } : undefined,
      ...options
    }
  }
}

/**
 * Calculate statistical measures for datasets
 */
export function calculateStats(data: number[]) {
  if (data.length === 0) return null

  const sorted = [...data].sort((a, b) => a - b)
  const sum = data.reduce((acc, val) => acc + val, 0)
  const mean = sum / data.length
  
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]

  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length
  const standardDeviation = Math.sqrt(variance)

  return {
    min: Math.min(...data),
    max: Math.max(...data),
    sum,
    mean,
    median,
    variance,
    standardDeviation,
    count: data.length
  }
}

/**
 * Generate time series data
 */
export function generateTimeSeriesData(
  startDate: Date,
  endDate: Date,
  interval: 'day' | 'hour' | 'minute' = 'day',
  valueGenerator: (date: Date, index: number) => number = () => Math.random() * 100
): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const current = new Date(startDate)
  let index = 0

  while (current <= endDate) {
    data.push({
      x: new Date(current),
      y: valueGenerator(current, index),
      label: current.toISOString()
    })

    switch (interval) {
      case 'minute':
        current.setMinutes(current.getMinutes() + 1)
        break
      case 'hour':
        current.setHours(current.getHours() + 1)
        break
      case 'day':
        current.setDate(current.getDate() + 1)
        break
    }
    index++
  }

  return data
}

/**
 * Aggregate data by time periods
 */
export function aggregateByTimePeriod(
  data: ChartDataPoint[],
  period: 'hour' | 'day' | 'week' | 'month',
  aggregateFunction: 'sum' | 'average' | 'count' | 'min' | 'max' = 'sum'
): ChartDataPoint[] {
  const groups = new Map<string, number[]>()

  data.forEach(point => {
    const date = new Date(point.x as Date)
    let key: string

    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
        break
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
        break
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`
        break
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(point.y as number)
  })

  return Array.from(groups.entries()).map(([key, values]) => {
    let aggregatedValue: number

    switch (aggregateFunction) {
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0)
        break
      case 'average':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length
        break
      case 'count':
        aggregatedValue = values.length
        break
      case 'min':
        aggregatedValue = Math.min(...values)
        break
      case 'max':
        aggregatedValue = Math.max(...values)
        break
    }

    return {
      x: key,
      y: aggregatedValue,
      label: key
    }
  })
}

/**
 * Filter data based on value ranges
 */
export function filterDataByRange(
  data: ChartDataPoint[],
  xRange?: [number | Date, number | Date],
  yRange?: [number, number]
): ChartDataPoint[] {
  return data.filter(point => {
    if (xRange) {
      const x = point.x instanceof Date ? point.x.getTime() : Number(point.x)
      const xMin = xRange[0] instanceof Date ? xRange[0].getTime() : Number(xRange[0])
      const xMax = xRange[1] instanceof Date ? xRange[1].getTime() : Number(xRange[1])
      if (x < xMin || x > xMax) return false
    }

    if (yRange) {
      const y = Number(point.y)
      if (y < yRange[0] || y > yRange[1]) return false
    }

    return true
  })
}

/**
 * Smooth data using moving average
 */
export function smoothData(data: ChartDataPoint[], windowSize: number = 3): ChartDataPoint[] {
  if (windowSize < 1 || data.length < windowSize) return data

  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2))
    const end = Math.min(data.length, start + windowSize)
    const window = data.slice(start, end)
    const average = window.reduce((sum, p) => sum + Number(p.y), 0) / window.length

    return {
      ...point,
      y: average
    }
  })
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(data: ChartDataPoint[]): {
  outliers: ChartDataPoint[]
  cleaned: ChartDataPoint[]
} {
  const values = data.map(p => Number(p.y)).sort((a, b) => a - b)
  const q1Index = Math.floor(values.length * 0.25)
  const q3Index = Math.floor(values.length * 0.75)
  const q1 = values[q1Index]
  const q3 = values[q3Index]
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const outliers: ChartDataPoint[] = []
  const cleaned: ChartDataPoint[] = []

  data.forEach(point => {
    const value = Number(point.y)
    if (value < lowerBound || value > upperBound) {
      outliers.push(point)
    } else {
      cleaned.push(point)
    }
  })

  return { outliers, cleaned }
}