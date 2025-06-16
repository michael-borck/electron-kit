import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  Legend,
  Filler,
  Title,
  SubTitle
} from 'chart.js'
import { Chart, getElementAtEvent, getDatasetAtEvent } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import type { ChartConfig, ChartEvent, ChartExportOptions } from '../../types'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  Legend,
  Filler,
  Title,
  SubTitle
)

interface ChartJSWrapperProps {
  config: ChartConfig
  onEvent?: (event: ChartEvent) => void
  className?: string
  style?: React.CSSProperties
}

export interface ChartJSWrapperRef {
  exportChart: (options: ChartExportOptions) => Promise<string>
  updateData: (data: any) => void
  destroy: () => void
  getChart: () => ChartJS | null
}

export const ChartJSWrapper = forwardRef<ChartJSWrapperRef, ChartJSWrapperProps>(
  ({ config, onEvent, className, style }, ref) => {
    const chartRef = useRef<ChartJS | null>(null)

    useImperativeHandle(ref, () => ({
      exportChart: async (options: ChartExportOptions) => {
        if (!chartRef.current) {
          throw new Error('Chart not initialized')
        }

        const canvas = chartRef.current.canvas
        const ctx = canvas.getContext('2d')!

        // Set background color if specified
        if (options.backgroundColor) {
          ctx.save()
          ctx.globalCompositeOperation = 'destination-over'
          ctx.fillStyle = options.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.restore()
        }

        // Export based on format
        switch (options.format) {
          case 'png':
          case 'jpg':
            return canvas.toDataURL(`image/${options.format}`, options.quality || 1)
          case 'svg':
            // For SVG export, we'd need a specialized library
            throw new Error('SVG export not implemented for Chart.js')
          case 'pdf':
            // For PDF export, we'd need jsPDF integration
            throw new Error('PDF export not implemented for Chart.js')
          default:
            throw new Error(`Unsupported export format: ${options.format}`)
        }
      },

      updateData: (data: any) => {
        if (chartRef.current) {
          chartRef.current.data = data
          chartRef.current.update()
        }
      },

      destroy: () => {
        if (chartRef.current) {
          chartRef.current.destroy()
          chartRef.current = null
        }
      },

      getChart: () => chartRef.current
    }))

    // Handle chart events
    const handleClick = (event: any) => {
      if (!chartRef.current || !onEvent) return

      const elements = getElementAtEvent(chartRef.current, event)
      const datasets = getDatasetAtEvent(chartRef.current, event)

      if (elements.length > 0) {
        const element = elements[0]
        onEvent({
          type: 'click',
          data: config.data.datasets[element.datasetIndex]?.data[element.index],
          element,
          index: element.index,
          datasetIndex: element.datasetIndex
        })
      }
    }

    const handleHover = (event: any) => {
      if (!chartRef.current || !onEvent) return

      const elements = getElementAtEvent(chartRef.current, event)

      if (elements.length > 0) {
        const element = elements[0]
        onEvent({
          type: 'hover',
          data: config.data.datasets[element.datasetIndex]?.data[element.index],
          element,
          index: element.index,
          datasetIndex: element.datasetIndex
        })
      }
    }

    // Prepare chart configuration
    const chartConfig = {
      type: config.type as any,
      data: config.data,
      options: {
        responsive: config.responsive !== false,
        maintainAspectRatio: config.maintainAspectRatio !== false,
        onClick: handleClick,
        onHover: handleHover,
        ...config.options
      },
      plugins: config.plugins || []
    }

    return (
      <div className={className} style={style}>
        <Chart
          ref={chartRef}
          type={config.type as any}
          data={config.data}
          options={chartConfig.options}
          plugins={chartConfig.plugins}
          width={config.width}
          height={config.height}
        />
      </div>
    )
  }
)