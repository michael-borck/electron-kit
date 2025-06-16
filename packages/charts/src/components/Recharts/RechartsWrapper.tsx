import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ScatterChart,
  RadarChart,
  ComposedChart,
  ResponsiveContainer,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Pie,
  Cell,
  Scatter,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import html2canvas from 'html2canvas'
import type { ChartConfig, ChartEvent, ChartExportOptions } from '../../types'

interface RechartsWrapperProps {
  config: ChartConfig
  onEvent?: (event: ChartEvent) => void
  className?: string
  style?: React.CSSProperties
}

export interface RechartsWrapperRef {
  exportChart: (options: ChartExportOptions) => Promise<string>
  updateData: (data: any) => void
  destroy: () => void
}

export const RechartsWrapper = forwardRef<RechartsWrapperRef, RechartsWrapperProps>(
  ({ config, onEvent, className, style }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(ref, () => ({
      exportChart: async (options: ChartExportOptions) => {
        if (!containerRef.current) {
          throw new Error('Chart not initialized')
        }

        const canvas = await html2canvas(containerRef.current, {
          backgroundColor: options.backgroundColor || '#ffffff',
          width: options.width,
          height: options.height
        })

        switch (options.format) {
          case 'png':
            return canvas.toDataURL('image/png', options.quality || 1)
          case 'jpg':
            return canvas.toDataURL('image/jpeg', options.quality || 1)
          case 'svg':
            throw new Error('SVG export not available for Recharts')
          default:
            throw new Error(`Unsupported export format: ${options.format}`)
        }
      },

      updateData: (data: any) => {
        // Recharts automatically updates when props change
        // This is handled by React's re-rendering
      },

      destroy: () => {
        // Recharts cleanup is handled by React
      }
    }))

    const handleClick = (data: any, index?: number) => {
      onEvent?.({
        type: 'click',
        data,
        index
      })
    }

    const handleMouseEnter = (data: any, index?: number) => {
      onEvent?.({
        type: 'hover',
        data,
        index
      })
    }

    const renderChart = () => {
      const { type, data, options = {} } = config
      const chartData = data.datasets[0]?.data || []
      
      // Convert chart data for Recharts format
      const rechartsData = chartData.map((point: any, index: number) => ({
        ...point,
        name: data.labels?.[index] || point.label || point.x,
        value: point.value || point.y,
        ...point
      }))

      const commonProps = {
        data: rechartsData,
        margin: { top: 20, right: 30, left: 20, bottom: 5 },
        ...options
      }

      switch (type) {
        case 'line':
          return (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey="value"
                  stroke={dataset.borderColor || '#8884d8'}
                  strokeWidth={dataset.borderWidth || 2}
                  dot={{ fill: dataset.backgroundColor || '#8884d8' }}
                  onClick={handleClick}
                  onMouseEnter={handleMouseEnter}
                />
              ))}
            </LineChart>
          )

        case 'bar':
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Bar
                  key={index}
                  dataKey="value"
                  fill={dataset.backgroundColor || '#8884d8'}
                  onClick={handleClick}
                  onMouseEnter={handleMouseEnter}
                />
              ))}
            </BarChart>
          )

        case 'area':
          return (
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey="value"
                  stroke={dataset.borderColor || '#8884d8'}
                  fill={dataset.backgroundColor || '#8884d8'}
                  fillOpacity={0.6}
                  onClick={handleClick}
                  onMouseEnter={handleMouseEnter}
                />
              ))}
            </AreaChart>
          )

        case 'pie':
        case 'doughnut':
          const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']
          return (
            <PieChart {...commonProps}>
              <Pie
                data={rechartsData}
                cx="50%"
                cy="50%"
                outerRadius={type === 'doughnut' ? 80 : 100}
                innerRadius={type === 'doughnut' ? 40 : 0}
                fill="#8884d8"
                dataKey="value"
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
              >
                {rechartsData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )

        case 'scatter':
          return (
            <ScatterChart {...commonProps}>
              <CartesianGrid />
              <XAxis dataKey="x" type="number" />
              <YAxis dataKey="y" type="number" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Scatter
                  key={index}
                  name={dataset.label}
                  data={dataset.data}
                  fill={dataset.backgroundColor || '#8884d8'}
                  onClick={handleClick}
                  onMouseEnter={handleMouseEnter}
                />
              ))}
            </ScatterChart>
          )

        case 'radar':
          return (
            <RadarChart {...commonProps}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Radar
                  key={index}
                  name={dataset.label}
                  dataKey="value"
                  stroke={dataset.borderColor || '#8884d8'}
                  fill={dataset.backgroundColor || '#8884d8'}
                  fillOpacity={0.6}
                  onClick={handleClick}
                  onMouseEnter={handleMouseEnter}
                />
              ))}
            </RadarChart>
          )

        default:
          return (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Unsupported chart type: {type}
            </div>
          )
      }
    }

    return (
      <div ref={containerRef} className={className} style={style}>
        <ResponsiveContainer width="100%" height={config.height || 400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    )
  }
)