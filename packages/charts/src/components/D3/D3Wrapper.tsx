import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as d3 from 'd3'
import type { D3ChartConfig, ChartEvent, ChartExportOptions } from '../../types'

interface D3WrapperProps {
  config: D3ChartConfig
  chartType: 'line' | 'bar' | 'scatter' | 'area' | 'heatmap' | 'network'
  onEvent?: (event: ChartEvent) => void
  className?: string
  style?: React.CSSProperties
}

export interface D3WrapperRef {
  exportChart: (options: ChartExportOptions) => Promise<string>
  updateData: (data: any[]) => void
  destroy: () => void
  getSVG: () => SVGSVGElement | null
}

export const D3Wrapper = forwardRef<D3WrapperRef, D3WrapperProps>(
  ({ config, chartType, onEvent, className, style }, ref) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(ref, () => ({
      exportChart: async (options: ChartExportOptions) => {
        if (!svgRef.current) {
          throw new Error('Chart not initialized')
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

      updateData: (data: any[]) => {
        if (svgRef.current) {
          const updatedConfig = { ...config, data }
          drawChart(updatedConfig)
        }
      },

      destroy: () => {
        if (svgRef.current) {
          d3.select(svgRef.current).selectAll('*').remove()
        }
      },

      getSVG: () => svgRef.current
    }))

    const drawChart = (chartConfig: D3ChartConfig) => {
      if (!svgRef.current) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const { width, height, margin, data } = chartConfig
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      switch (chartType) {
        case 'line':
          drawLineChart(g, data, innerWidth, innerHeight, chartConfig)
          break
        case 'bar':
          drawBarChart(g, data, innerWidth, innerHeight, chartConfig)
          break
        case 'scatter':
          drawScatterChart(g, data, innerWidth, innerHeight, chartConfig)
          break
        case 'area':
          drawAreaChart(g, data, innerWidth, innerHeight, chartConfig)
          break
        case 'heatmap':
          drawHeatmap(g, data, innerWidth, innerHeight, chartConfig)
          break
        case 'network':
          drawNetworkChart(g, data, innerWidth, innerHeight, chartConfig)
          break
      }
    }

    const drawLineChart = (g: any, data: any[], width: number, height: number, config: D3ChartConfig) => {
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, (d: any) => d.x) as [number, number])
        .range([0, width])

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, (d: any) => d.y) as [number, number])
        .range([height, 0])

      const line = d3.line<any>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveMonotoneX)

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))

      g.append('g')
        .call(d3.axisLeft(yScale))

      // Add line
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', config.theme?.primary || '#3b82f6')
        .attr('stroke-width', 2)
        .attr('d', line)

      // Add points
      g.selectAll('.dot')
        .data(data)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', (d: any) => xScale(d.x))
        .attr('cy', (d: any) => yScale(d.y))
        .attr('r', 4)
        .attr('fill', config.theme?.primary || '#3b82f6')
        .on('click', (event: any, d: any) => {
          onEvent?.({ type: 'click', data: d })
        })
        .on('mouseover', (event: any, d: any) => {
          onEvent?.({ type: 'hover', data: d })
        })
    }

    const drawBarChart = (g: any, data: any[], width: number, height: number, config: D3ChartConfig) => {
      const xScale = d3.scaleBand()
        .domain(data.map((d: any) => d.label))
        .range([0, width])
        .padding(0.1)

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d: any) => d.value) as number])
        .range([height, 0])

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))

      g.append('g')
        .call(d3.axisLeft(yScale))

      // Add bars
      g.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', (d: any) => xScale(d.label)!)
        .attr('y', (d: any) => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', (d: any) => height - yScale(d.value))
        .attr('fill', config.theme?.primary || '#3b82f6')
        .on('click', (event: any, d: any) => {
          onEvent?.({ type: 'click', data: d })
        })
        .on('mouseover', (event: any, d: any) => {
          onEvent?.({ type: 'hover', data: d })
        })
    }

    const drawScatterChart = (g: any, data: any[], width: number, height: number, config: D3ChartConfig) => {
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, (d: any) => d.x) as [number, number])
        .range([0, width])

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, (d: any) => d.y) as [number, number])
        .range([height, 0])

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))

      g.append('g')
        .call(d3.axisLeft(yScale))

      // Add points
      g.selectAll('.dot')
        .data(data)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', (d: any) => xScale(d.x))
        .attr('cy', (d: any) => yScale(d.y))
        .attr('r', (d: any) => d.r || 5)
        .attr('fill', (d: any) => d.color || config.theme?.primary || '#3b82f6')
        .attr('opacity', 0.7)
        .on('click', (event: any, d: any) => {
          onEvent?.({ type: 'click', data: d })
        })
        .on('mouseover', (event: any, d: any) => {
          onEvent?.({ type: 'hover', data: d })
        })
    }

    const drawAreaChart = (g: any, data: any[], width: number, height: number, config: D3ChartConfig) => {
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, (d: any) => d.x) as [number, number])
        .range([0, width])

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d: any) => d.y) as number])
        .range([height, 0])

      const area = d3.area<any>()
        .x(d => xScale(d.x))
        .y0(height)
        .y1(d => yScale(d.y))
        .curve(d3.curveMonotoneX)

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))

      g.append('g')
        .call(d3.axisLeft(yScale))

      // Add area
      g.append('path')
        .datum(data)
        .attr('fill', config.theme?.primary || '#3b82f6')
        .attr('opacity', 0.6)
        .attr('d', area)
    }

    const drawHeatmap = (g: any, data: any[], width: number, height: number, config: D3ChartConfig) => {
      // Implementation for heatmap
      // This is a simplified version - real implementation would be more complex
      const xLabels = Array.from(new Set(data.map((d: any) => d.x)))
      const yLabels = Array.from(new Set(data.map((d: any) => d.y)))

      const xScale = d3.scaleBand()
        .domain(xLabels as string[])
        .range([0, width])

      const yScale = d3.scaleBand()
        .domain(yLabels as string[])
        .range([0, height])

      const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(data, (d: any) => d.value) as [number, number])

      g.selectAll('.cell')
        .data(data)
        .enter().append('rect')
        .attr('class', 'cell')
        .attr('x', (d: any) => xScale(d.x))
        .attr('y', (d: any) => yScale(d.y))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', (d: any) => colorScale(d.value))
    }

    const drawNetworkChart = (g: any, data: any[], width: number, height: number, config: D3ChartConfig) => {
      // Implementation for network chart
      // This is a simplified version - real implementation would use force simulation
      const nodes = data.filter((d: any) => d.type === 'node')
      const links = data.filter((d: any) => d.type === 'link')

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))

      const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)

      const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('r', (d: any) => d.r || 5)
        .attr('fill', (d: any) => d.color || config.theme?.primary || '#3b82f6')

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        node
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y)
      })
    }

    useEffect(() => {
      if (svgRef.current) {
        drawChart(config)
      }
    }, [config, chartType])

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