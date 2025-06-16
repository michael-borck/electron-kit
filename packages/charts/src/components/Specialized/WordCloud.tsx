import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as d3 from 'd3'
import cloud from 'd3-cloud'
import type { WordCloudConfig, ChartEvent, ChartExportOptions } from '../../types'

interface WordCloudProps {
  config: WordCloudConfig
  onEvent?: (event: ChartEvent) => void
  className?: string
  style?: React.CSSProperties
}

export interface WordCloudRef {
  exportChart: (options: ChartExportOptions) => Promise<string>
  updateData: (words: WordCloudConfig['words']) => void
  destroy: () => void
}

export const WordCloud = forwardRef<WordCloudRef, WordCloudProps>(
  ({ config, onEvent, className, style }, ref) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(ref, () => ({
      exportChart: async (options: ChartExportOptions) => {
        if (!svgRef.current) {
          throw new Error('WordCloud not initialized')
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

      updateData: (words: WordCloudConfig['words']) => {
        const updatedConfig = { ...config, words }
        drawWordCloud(updatedConfig)
      },

      destroy: () => {
        if (svgRef.current) {
          d3.select(svgRef.current).selectAll('*').remove()
        }
      }
    }))

    const drawWordCloud = (cloudConfig: WordCloudConfig) => {
      if (!svgRef.current) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const {
        words,
        width,
        height,
        fontFamily = 'Arial',
        fontSizeMin = 10,
        fontSizeMax = 50,
        rotate = () => (Math.random() - 0.5) * 60,
        padding = 1,
        spiral = 'archimedean',
        colorScale = d3.schemeCategory10
      } = cloudConfig

      // Create font size scale
      const maxValue = d3.max(words, d => d.value) || 1
      const minValue = d3.min(words, d => d.value) || 1
      const fontScale = d3.scaleLinear()
        .domain([minValue, maxValue])
        .range([fontSizeMin, fontSizeMax])

      // Create color scale
      const color = d3.scaleOrdinal(colorScale)

      // Create word cloud layout
      const layout = cloud()
        .size([width, height])
        .words(words.map(d => ({
          ...d,
          size: fontScale(d.value)
        })))
        .padding(padding)
        .rotate(rotate)
        .font(fontFamily)
        .fontSize((d: any) => d.size)
        .spiral(spiral)
        .on('end', draw)

      layout.start()

      function draw(cloudWords: any[]) {
        const g = svg
          .append('g')
          .attr('transform', `translate(${width / 2},${height / 2})`)

        const text = g.selectAll('text')
          .data(cloudWords)
          .enter().append('text')
          .style('font-size', (d: any) => `${d.size}px`)
          .style('font-family', fontFamily)
          .style('fill', (d: any, i: number) => d.color || color(i.toString()))
          .style('cursor', 'pointer')
          .attr('text-anchor', 'middle')
          .attr('transform', (d: any) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
          .text((d: any) => d.text)
          .on('click', (event: any, d: any) => {
            onEvent?.({
              type: 'click',
              data: { text: d.text, value: d.value, size: d.size }
            })
          })
          .on('mouseover', (event: any, d: any) => {
            d3.select(event.target).style('opacity', 0.7)
            onEvent?.({
              type: 'hover',
              data: { text: d.text, value: d.value, size: d.size }
            })
          })
          .on('mouseout', (event: any) => {
            d3.select(event.target).style('opacity', 1)
          })

        // Add animation
        text
          .style('opacity', 0)
          .transition()
          .duration(800)
          .style('opacity', 1)
      }
    }

    useEffect(() => {
      if (svgRef.current) {
        drawWordCloud(config)
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