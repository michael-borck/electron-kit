import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as d3 from 'd3'
import type { HeatmapConfig, ChartEvent, ChartExportOptions } from '../../types'

interface HeatmapProps {
  config: HeatmapConfig
  onEvent?: (event: ChartEvent) => void
  className?: string
  style?: React.CSSProperties
}

export interface HeatmapRef {
  exportChart: (options: ChartExportOptions) => Promise<string>
  updateData: (data: HeatmapConfig['data']) => void
  destroy: () => void
}

export const Heatmap = forwardRef<HeatmapRef, HeatmapProps>(
  ({ config, onEvent, className, style }, ref) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(ref, () => ({
      exportChart: async (options: ChartExportOptions) => {
        if (!svgRef.current) {
          throw new Error('Heatmap not initialized')
        }

        const svg = svgRef.current
        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svg)

        switch (options.format) {
          case 'svg':
            return `data:image/svg+xml;base64,${btoa(svgString)}`
          case 'png':
          case 'jpg':
            return new Promise((resolve) => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')!
              const img = new Image()

              img.onload = () => {
                canvas.width = options.width || svg.clientWidth
                canvas.height = options.height || svg.clientHeight
                
                if (options.backgroundColor) {
                  ctx.fillStyle = options.backgroundColor
                  ctx.fillRect(0, 0, canvas.width, canvas.height)
                }
                
                ctx.drawImage(img, 0, 0)
                resolve(canvas.toDataURL(`image/${options.format}`, options.quality || 1))
              }

              img.src = `data:image/svg+xml;base64,${btoa(svgString)}`
            })
          default:
            throw new Error(`Unsupported export format: ${options.format}`)
        }
      },

      updateData: (data: HeatmapConfig['data']) => {
        const updatedConfig = { ...config, data }
        drawHeatmap(updatedConfig)
      },

      destroy: () => {
        if (svgRef.current) {
          d3.select(svgRef.current).selectAll('*').remove()
        }
      }
    }))

    const drawHeatmap = (heatmapConfig: HeatmapConfig) => {
      if (!svgRef.current) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const {
        data,
        width,
        height,
        colorScale = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
        cellSize = 20,
        margin = { top: 50, right: 50, bottom: 50, left: 50 }
      } = heatmapConfig

      // Get unique x and y values
      const xLabels = Array.from(new Set(data.map(d => d.x.toString()))).sort()
      const yLabels = Array.from(new Set(data.map(d => d.y.toString()))).sort()

      // Calculate cell dimensions
      const cellWidth = (width - margin.left - margin.right) / xLabels.length
      const cellHeight = (height - margin.top - margin.bottom) / yLabels.length

      // Create scales
      const xScale = d3.scaleBand()
        .domain(xLabels)
        .range([0, width - margin.left - margin.right])

      const yScale = d3.scaleBand()
        .domain(yLabels)
        .range([0, height - margin.top - margin.bottom])

      const colorScaleFunc = d3.scaleSequential()
        .interpolator(d3.interpolateBlues)
        .domain(d3.extent(data, d => d.value) as [number, number])

      // Create main group
      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // Create cells
      const cells = g.selectAll('.cell')
        .data(data)
        .enter().append('rect')
        .attr('class', 'cell')
        .attr('x', d => xScale(d.x.toString())!)
        .attr('y', d => yScale(d.y.toString())!)
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScaleFunc(d.value))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          onEvent?.({
            type: 'click',
            data: { x: d.x, y: d.y, value: d.value }
          })
        })
        .on('mouseover', (event, d) => {
          d3.select(event.target).attr('stroke-width', 2)
          onEvent?.({
            type: 'hover',
            data: { x: d.x, y: d.y, value: d.value }
          })
        })
        .on('mouseout', (event) => {
          d3.select(event.target).attr('stroke-width', 1)
        })

      // Add x-axis
      g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')

      // Add y-axis
      g.append('g')
        .call(d3.axisLeft(yScale))

      // Add value labels in cells
      g.selectAll('.cell-label')
        .data(data)
        .enter().append('text')
        .attr('class', 'cell-label')
        .attr('x', d => xScale(d.x.toString())! + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.y.toString())! + yScale.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('fill', d => d.value > 0.5 ? '#fff' : '#000')
        .text(d => d.value.toFixed(2))

      // Add animation
      cells
        .style('opacity', 0)
        .transition()
        .duration(800)
        .style('opacity', 1)
    }

    useEffect(() => {
      if (svgRef.current) {
        drawHeatmap(config)
      }
    }, [config])

    return (
      <div ref={containerRef} className={className} style={style}>
        <svg
          ref={svgRef}
          width={config.width}
          height={config.height}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    )
  }
)