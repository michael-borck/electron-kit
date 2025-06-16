import type { ChartDataPoint } from '../types'

/**
 * Convert CSV string to chart data
 */
export function csvToChartData(
  csvString: string,
  xColumn: string,
  yColumn: string,
  labelColumn?: string
): ChartDataPoint[] {
  const lines = csvString.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  const xIndex = headers.indexOf(xColumn)
  const yIndex = headers.indexOf(yColumn)
  const labelIndex = labelColumn ? headers.indexOf(labelColumn) : -1
  
  if (xIndex === -1 || yIndex === -1) {
    throw new Error(`Column not found: ${xColumn} or ${yColumn}`)
  }
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    return {
      x: isNaN(Number(values[xIndex])) ? values[xIndex] : Number(values[xIndex]),
      y: Number(values[yIndex]),
      label: labelIndex !== -1 ? values[labelIndex] : undefined
    }
  })
}

/**
 * Convert JSON array to chart data
 */
export function jsonToChartData(
  jsonArray: any[],
  xKey: string,
  yKey: string,
  labelKey?: string
): ChartDataPoint[] {
  return jsonArray.map(item => ({
    x: item[xKey],
    y: Number(item[yKey]),
    label: labelKey ? item[labelKey] : undefined,
    ...item
  }))
}

/**
 * Group data by a specific key
 */
export function groupDataBy<T>(
  data: T[],
  groupKey: string,
  valueKey: string,
  aggregateFunction: 'sum' | 'average' | 'count' | 'min' | 'max' = 'sum'
): ChartDataPoint[] {
  const groups = new Map<string, number[]>()
  
  data.forEach(item => {
    const groupValue = (item as any)[groupKey]?.toString() || 'Unknown'
    const value = Number((item as any)[valueKey]) || 0
    
    if (!groups.has(groupValue)) {
      groups.set(groupValue, [])
    }
    groups.get(groupValue)!.push(value)
  })
  
  return Array.from(groups.entries()).map(([group, values]) => {
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
      x: group,
      y: aggregatedValue,
      label: group
    }
  })
}

/**
 * Sort data by a specific field
 */
export function sortData(
  data: ChartDataPoint[],
  field: 'x' | 'y' | 'label',
  direction: 'asc' | 'desc' = 'asc'
): ChartDataPoint[] {
  return [...data].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    if (aVal === undefined || bVal === undefined) return 0
    
    let comparison = 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal)
    } else if (aVal instanceof Date && bVal instanceof Date) {
      comparison = aVal.getTime() - bVal.getTime()
    } else {
      comparison = Number(aVal) - Number(bVal)
    }
    
    return direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Paginate data
 */
export function paginateData(
  data: ChartDataPoint[],
  page: number,
  pageSize: number
): {
  data: ChartDataPoint[]
  totalPages: number
  currentPage: number
  totalItems: number
} {
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  
  return {
    data: data.slice(startIndex, endIndex),
    totalPages,
    currentPage: page,
    totalItems
  }
}

/**
 * Search data by text
 */
export function searchData(
  data: ChartDataPoint[],
  searchTerm: string,
  searchFields: (keyof ChartDataPoint)[] = ['label']
): ChartDataPoint[] {
  const term = searchTerm.toLowerCase()
  
  return data.filter(item =>
    searchFields.some(field => {
      const value = item[field]
      return value?.toString().toLowerCase().includes(term)
    })
  )
}

/**
 * Normalize data to a specific range
 */
export function normalizeData(
  data: ChartDataPoint[],
  field: 'x' | 'y' = 'y',
  minRange: number = 0,
  maxRange: number = 1
): ChartDataPoint[] {
  const values = data.map(d => Number(d[field]))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  
  if (range === 0) return data
  
  return data.map(item => ({
    ...item,
    [field]: minRange + ((Number(item[field]) - min) / range) * (maxRange - minRange)
  }))
}

/**
 * Calculate cumulative sum
 */
export function calculateCumulativeSum(data: ChartDataPoint[]): ChartDataPoint[] {
  let sum = 0
  return data.map(item => {
    sum += Number(item.y)
    return {
      ...item,
      y: sum
    }
  })
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: ChartDataPoint[],
  windowSize: number
): ChartDataPoint[] {
  if (windowSize <= 0 || windowSize > data.length) return data
  
  return data.map((item, index) => {
    const start = Math.max(0, index - windowSize + 1)
    const window = data.slice(start, index + 1)
    const average = window.reduce((sum, d) => sum + Number(d.y), 0) / window.length
    
    return {
      ...item,
      y: average
    }
  })
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(data: ChartDataPoint[]): ChartDataPoint[] {
  if (data.length < 2) return data
  
  return data.map((item, index) => {
    if (index === 0) {
      return { ...item, y: 0 }
    }
    
    const previous = Number(data[index - 1].y)
    const current = Number(item.y)
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0
    
    return {
      ...item,
      y: change
    }
  })
}

/**
 * Fill missing data points
 */
export function fillMissingData(
  data: ChartDataPoint[],
  fillMethod: 'linear' | 'forward' | 'backward' | 'zero' = 'linear'
): ChartDataPoint[] {
  const filled = [...data]
  
  for (let i = 0; i < filled.length; i++) {
    if (filled[i].y === null || filled[i].y === undefined || isNaN(Number(filled[i].y))) {
      let fillValue: number
      
      switch (fillMethod) {
        case 'linear':
          // Find previous and next valid values
          let prevIndex = i - 1
          let nextIndex = i + 1
          
          while (prevIndex >= 0 && (filled[prevIndex].y === null || isNaN(Number(filled[prevIndex].y)))) {
            prevIndex--
          }
          
          while (nextIndex < filled.length && (filled[nextIndex].y === null || isNaN(Number(filled[nextIndex].y)))) {
            nextIndex++
          }
          
          if (prevIndex >= 0 && nextIndex < filled.length) {
            const prevValue = Number(filled[prevIndex].y)
            const nextValue = Number(filled[nextIndex].y)
            const ratio = (i - prevIndex) / (nextIndex - prevIndex)
            fillValue = prevValue + (nextValue - prevValue) * ratio
          } else if (prevIndex >= 0) {
            fillValue = Number(filled[prevIndex].y)
          } else if (nextIndex < filled.length) {
            fillValue = Number(filled[nextIndex].y)
          } else {
            fillValue = 0
          }
          break
          
        case 'forward':
          let forwardIndex = i - 1
          while (forwardIndex >= 0 && (filled[forwardIndex].y === null || isNaN(Number(filled[forwardIndex].y)))) {
            forwardIndex--
          }
          fillValue = forwardIndex >= 0 ? Number(filled[forwardIndex].y) : 0
          break
          
        case 'backward':
          let backwardIndex = i + 1
          while (backwardIndex < filled.length && (filled[backwardIndex].y === null || isNaN(Number(filled[backwardIndex].y)))) {
            backwardIndex++
          }
          fillValue = backwardIndex < filled.length ? Number(filled[backwardIndex].y) : 0
          break
          
        case 'zero':
        default:
          fillValue = 0
          break
      }
      
      filled[i] = { ...filled[i], y: fillValue }
    }
  }
  
  return filled
}

/**
 * Resample data to a specific number of points
 */
export function resampleData(
  data: ChartDataPoint[],
  targetCount: number,
  method: 'linear' | 'nearest' = 'linear'
): ChartDataPoint[] {
  if (data.length <= targetCount) return data
  
  const step = data.length / targetCount
  const resampled: ChartDataPoint[] = []
  
  for (let i = 0; i < targetCount; i++) {
    const index = i * step
    
    if (method === 'nearest') {
      const nearestIndex = Math.round(index)
      resampled.push(data[Math.min(nearestIndex, data.length - 1)])
    } else {
      // Linear interpolation
      const lowerIndex = Math.floor(index)
      const upperIndex = Math.min(Math.ceil(index), data.length - 1)
      
      if (lowerIndex === upperIndex) {
        resampled.push(data[lowerIndex])
      } else {
        const ratio = index - lowerIndex
        const lower = data[lowerIndex]
        const upper = data[upperIndex]
        
        resampled.push({
          x: typeof lower.x === 'number' && typeof upper.x === 'number'
            ? lower.x + (upper.x - lower.x) * ratio
            : lower.x,
          y: Number(lower.y) + (Number(upper.y) - Number(lower.y)) * ratio,
          label: lower.label
        })
      }
    }
  }
  
  return resampled
}