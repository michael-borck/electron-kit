import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as d3 from 'd3'
import type { NetworkConfig, ChartEvent, ChartExportOptions } from '../../types'

interface NetworkChartProps {
  config: NetworkConfig
  onEvent?: (event: ChartEvent) => void
  className?: string
  style?: React.CSSProperties
}

export interface NetworkChartRef {
  exportChart: (options: ChartExportOptions) => Promise<string>
  updateData: (nodes: NetworkConfig['nodes'], links: NetworkConfig['links']) => void
  destroy: () => void
}

export const NetworkChart = forwardRef<NetworkChartRef, NetworkChartProps>(
  ({ config, onEvent, className, style }, ref) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const simulationRef = useRef<d3.Simulation<any, any> | null>(null)

    useImperativeHandle(ref, () => ({
      exportChart: async (options: ChartExportOptions) => {
        if (!svgRef.current) {
          throw new Error('NetworkChart not initialized')
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

      updateData: (nodes: NetworkConfig['nodes'], links: NetworkConfig['links']) => {
        const updatedConfig = { ...config, nodes, links }
        drawNetworkChart(updatedConfig)
      },

      destroy: () => {
        if (simulationRef.current) {
          simulationRef.current.stop()
        }
        if (svgRef.current) {
          d3.select(svgRef.current).selectAll('*').remove()
        }
      }
    }))

    const drawNetworkChart = (networkConfig: NetworkConfig) => {
      if (!svgRef.current) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const {
        nodes,
        links,
        width,
        height,
        simulation: simConfig = {
          strength: -300,
          distance: 30,
          iterations: 300
        }
      } = networkConfig

      // Create a copy of nodes and links to avoid mutating the original data
      const nodesCopy = nodes.map(d => ({ ...d }))
      const linksCopy = links.map(d => ({ ...d }))

      // Create color scale for groups
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

      // Create force simulation
      const simulation = d3.forceSimulation(nodesCopy)
        .force('link', d3.forceLink(linksCopy).id((d: any) => d.id).distance(simConfig.distance))
        .force('charge', d3.forceManyBody().strength(simConfig.strength))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius((d: any) => (d.value || 5) + 2))

      simulationRef.current = simulation

      // Create zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          container.attr('transform', event.transform)
        })

      svg.call(zoom as any)

      // Create container for zoomable content
      const container = svg.append('g')

      // Create links
      const link = container.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(linksCopy)
        .enter().append('line')
        .attr('stroke', d => d.color || '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', d => Math.sqrt(d.value || 1))

      // Create nodes
      const node = container.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodesCopy)
        .enter().append('circle')
        .attr('r', d => d.value || 5)
        .attr('fill', d => d.color || colorScale(d.group || ''))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          onEvent?.({
            type: 'click',
            data: { id: d.id, label: d.label, group: d.group, value: d.value }
          })
        })
        .on('mouseover', (event, d) => {
          // Highlight connected nodes and links
          const connectedNodes = new Set()
          const connectedLinks = new Set()

          linksCopy.forEach((l, i) => {
            if (l.source === d || l.target === d) {
              connectedLinks.add(i)
              connectedNodes.add(l.source === d ? l.target : l.source)
            }
          })

          node.style('opacity', n => connectedNodes.has(n) || n === d ? 1 : 0.3)
          link.style('opacity', (l, i) => connectedLinks.has(i) ? 1 : 0.1)

          onEvent?.({
            type: 'hover',
            data: { id: d.id, label: d.label, group: d.group, value: d.value }
          })
        })
        .on('mouseout', () => {
          node.style('opacity', 1)
          link.style('opacity', 0.6)
        })
        .call(d3.drag<SVGCircleElement, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }) as any)

      // Add labels
      const labels = container.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(nodesCopy)
        .enter().append('text')
        .text(d => d.label || d.id)
        .style('font-size', '12px')
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central')
        .style('pointer-events', 'none')
        .style('fill', '#333')

      // Update positions on each tick
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        node
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y)

        labels
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y + 20)
      })

      // Add legend for groups
      const groups = Array.from(new Set(nodes.map(d => d.group).filter(Boolean)))
      if (groups.length > 0) {
        const legend = svg.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(20, 20)`)

        const legendItems = legend.selectAll('.legend-item')
          .data(groups)
          .enter().append('g')
          .attr('class', 'legend-item')
          .attr('transform', (d, i) => `translate(0, ${i * 20})`)

        legendItems.append('circle')
          .attr('r', 6)
          .attr('fill', d => colorScale(d!))

        legendItems.append('text')
          .attr('x', 15)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .style('font-size', '12px')
          .text(d => d!)
      }

      // Add animation
      node
        .style('opacity', 0)
        .transition()
        .duration(800)
        .style('opacity', 1)

      link
        .style('opacity', 0)
        .transition()
        .duration(800)
        .style('opacity', 0.6)
    }

    useEffect(() => {
      if (svgRef.current) {
        drawNetworkChart(config)
      }

      return () => {
        if (simulationRef.current) {
          simulationRef.current.stop()
        }
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