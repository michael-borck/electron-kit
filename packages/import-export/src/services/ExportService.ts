import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import type { ExportOptions, ExportResult, ExportTemplate } from '../types'

export class ExportService {
  private templates: Map<string, ExportTemplate> = new Map()

  registerTemplate(template: ExportTemplate): void {
    this.templates.set(template.name, template)
  }

  getTemplates(format?: string): ExportTemplate[] {
    const templates = Array.from(this.templates.values())
    return format ? templates.filter(t => t.format === format) : templates
  }

  async exportData<T>(data: T, options: ExportOptions): Promise<ExportResult> {
    try {
      const { format, filename, template, includeMetadata = true } = options

      // Add metadata if requested
      const exportData = includeMetadata ? {
        data,
        metadata: {
          exportedAt: new Date().toISOString(),
          format,
          template: template || 'default'
        }
      } : data

      switch (format) {
        case 'json':
          return await this.exportJSON(exportData, filename)
        case 'html':
          return await this.exportHTML(exportData, filename, template)
        case 'pdf':
          return await this.exportPDF(exportData, filename, template)
        case 'docx':
          return await this.exportDOCX(exportData, filename, template)
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  private async exportJSON(data: any, filename?: string): Promise<ExportResult> {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const finalFilename = filename || `export-${Date.now()}.json`
    
    saveAs(blob, finalFilename)
    
    return {
      success: true,
      filename: finalFilename,
      data: blob
    }
  }

  private async exportHTML(data: any, filename?: string, templateName?: string): Promise<ExportResult> {
    const template = templateName ? this.templates.get(templateName) : null
    const htmlContent = template ? 
      this.renderTemplate(template.template, data) : 
      this.generateDefaultHTML(data)

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const finalFilename = filename || `export-${Date.now()}.html`
    
    saveAs(blob, finalFilename)
    
    return {
      success: true,
      filename: finalFilename,
      data: blob
    }
  }

  private async exportPDF(data: any, filename?: string, templateName?: string): Promise<ExportResult> {
    const pdf = new jsPDF()
    const template = templateName ? this.templates.get(templateName) : null
    
    if (template) {
      const content = this.renderTemplate(template.template, data)
      // Convert HTML/template to PDF
      this.addHTMLToPDF(pdf, content)
    } else {
      // Generate default PDF layout
      this.addDefaultContentToPDF(pdf, data)
    }

    const finalFilename = filename || `export-${Date.now()}.pdf`
    pdf.save(finalFilename)
    
    return {
      success: true,
      filename: finalFilename
    }
  }

  private async exportDOCX(data: any, filename?: string, templateName?: string): Promise<ExportResult> {
    const template = templateName ? this.templates.get(templateName) : null
    let content: string

    if (template) {
      content = this.renderTemplate(template.template, data)
    } else {
      content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: content.split('\n').map(line => 
          new Paragraph({
            children: [new TextRun(line)]
          })
        )
      }]
    })

    const buffer = await Packer.toBlob(doc)
    const finalFilename = filename || `export-${Date.now()}.docx`
    
    saveAs(buffer, finalFilename)
    
    return {
      success: true,
      filename: finalFilename,
      data: buffer
    }
  }

  private renderTemplate(template: string, data: any): string {
    // Simple template rendering - replace {{variable}} with data values
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key)
      return value !== undefined ? String(value) : match
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private generateDefaultHTML(data: any): string {
    const title = 'Exported Data'
    const timestamp = new Date().toLocaleString()
    const jsonString = JSON.stringify(data, null, 2)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .metadata { color: #666; font-size: 0.9em; margin-bottom: 20px; }
        .content { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <div class="metadata">Exported on ${timestamp}</div>
    </div>
    <div class="content">
        <pre>${jsonString}</pre>
    </div>
</body>
</html>`
  }

  private addHTMLToPDF(pdf: jsPDF, html: string): void {
    // Simple HTML to PDF conversion
    const lines = html.replace(/<[^>]*>/g, '').split('\n')
    let y = 20
    
    lines.forEach(line => {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }
      pdf.text(line, 20, y)
      y += 10
    })
  }

  private addDefaultContentToPDF(pdf: jsPDF, data: any): void {
    const title = 'Exported Data'
    const timestamp = new Date().toLocaleString()
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    
    pdf.setFontSize(16)
    pdf.text(title, 20, 20)
    
    pdf.setFontSize(10)
    pdf.text(`Exported on ${timestamp}`, 20, 35)
    
    pdf.setFontSize(12)
    const lines = content.split('\n')
    let y = 50
    
    lines.forEach(line => {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }
      pdf.text(line, 20, y)
      y += 6
    })
  }
}