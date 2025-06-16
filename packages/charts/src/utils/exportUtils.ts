import type { ChartExportOptions } from '../types'

/**
 * Download a data URL as a file
 */
export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Convert canvas to blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg' = 'png',
  quality: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      `image/${format}`,
      quality
    )
  })
}

/**
 * Convert SVG string to data URL
 */
export function svgToDataURL(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

/**
 * Convert SVG to canvas
 */
export function svgToCanvas(
  svgString: string,
  width: number,
  height: number,
  backgroundColor?: string
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    canvas.width = width
    canvas.height = height

    img.onload = () => {
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas)
    }

    img.onerror = () => {
      reject(new Error('Failed to load SVG image'))
    }

    img.src = svgToDataURL(svgString)
  })
}

/**
 * Export chart data as CSV
 */
export function exportAsCSV(
  data: any[],
  filename: string = 'chart-data.csv',
  columns?: string[]
): void {
  if (data.length === 0) return

  const headers = columns || Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export chart data as JSON
 */
export function exportAsJSON(
  data: any,
  filename: string = 'chart-data.json'
): void {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export chart as PDF (requires jsPDF)
 */
export async function exportAsPDF(
  canvas: HTMLCanvasElement,
  filename: string = 'chart.pdf',
  options: {
    format?: 'a4' | 'letter' | 'a3' | 'a5'
    orientation?: 'portrait' | 'landscape'
    margin?: number
    title?: string
  } = {}
): Promise<void> {
  try {
    // Dynamic import of jsPDF to avoid bundling if not used
    const { jsPDF } = await import('jspdf')
    
    const {
      format = 'a4',
      orientation = 'landscape',
      margin = 20,
      title
    } = options

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const availableWidth = pageWidth - (margin * 2)
    const availableHeight = pageHeight - (margin * 2) - (title ? 20 : 0)

    // Calculate scaling to fit the image
    const imgAspectRatio = canvas.width / canvas.height
    const availableAspectRatio = availableWidth / availableHeight

    let imgWidth, imgHeight
    if (imgAspectRatio > availableAspectRatio) {
      imgWidth = availableWidth
      imgHeight = availableWidth / imgAspectRatio
    } else {
      imgHeight = availableHeight
      imgWidth = availableHeight * imgAspectRatio
    }

    const x = (pageWidth - imgWidth) / 2
    let y = margin

    // Add title if provided
    if (title) {
      pdf.setFontSize(16)
      pdf.text(title, pageWidth / 2, margin + 10, { align: 'center' })
      y += 20
    }

    // Add the chart image
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

    pdf.save(filename)
  } catch (error) {
    console.error('PDF export requires jsPDF library:', error)
    throw new Error('PDF export requires jsPDF library to be installed')
  }
}

/**
 * Copy chart to clipboard as image
 */
export async function copyToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  try {
    const blob = await canvasToBlob(canvas, 'png')
    const clipboardItem = new ClipboardItem({ 'image/png': blob })
    await navigator.clipboard.write([clipboardItem])
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    throw new Error('Failed to copy chart to clipboard')
  }
}

/**
 * Print chart
 */
export function printChart(
  canvas: HTMLCanvasElement,
  title?: string
): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Failed to open print window')
  }

  const imgData = canvas.toDataURL('image/png')
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Chart'}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            text-align: center;
          }
          h1 {
            margin-bottom: 20px;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body { margin: 0; padding: 0; }
            img { max-width: 100%; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${title ? `<h1>${title}</h1>` : ''}
        <img src="${imgData}" alt="Chart" />
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  
  // Wait for image to load before printing
  const img = printWindow.document.querySelector('img')
  if (img) {
    img.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  } else {
    printWindow.print()
    printWindow.close()
  }
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ChartExportOptions): void {
  const { format, width, height, quality } = options

  const validFormats = ['png', 'jpg', 'svg', 'pdf']
  if (!validFormats.includes(format)) {
    throw new Error(`Invalid format: ${format}. Supported formats: ${validFormats.join(', ')}`)
  }

  if (width !== undefined && (width <= 0 || width > 10000)) {
    throw new Error('Width must be between 1 and 10000 pixels')
  }

  if (height !== undefined && (height <= 0 || height > 10000)) {
    throw new Error('Height must be between 1 and 10000 pixels')
  }

  if (quality !== undefined && (quality < 0 || quality > 1)) {
    throw new Error('Quality must be between 0 and 1')
  }
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: string): string {
  const extensions: Record<string, string> = {
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpg',
    svg: 'svg',
    pdf: 'pdf',
    csv: 'csv',
    json: 'json'
  }
  
  return extensions[format.toLowerCase()] || format
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  baseName: string = 'chart',
  format: string = 'png',
  includeTimestamp: boolean = true
): string {
  const extension = getFileExtension(format)
  const timestamp = includeTimestamp ? `-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}` : ''
  return `${baseName}${timestamp}.${extension}`
}