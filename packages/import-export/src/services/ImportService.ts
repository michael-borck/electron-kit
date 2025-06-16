import Ajv from 'ajv'
import type { 
  ImportOptions, 
  ImportResult, 
  ImportMetadata, 
  ValidationError, 
  SchemaDefinition,
  URLImportOptions 
} from '../types'

export class ImportService {
  private ajv: Ajv
  private schemas: Map<string, SchemaDefinition> = new Map()

  constructor() {
    this.ajv = new Ajv({ allErrors: true })
  }

  registerSchema(name: string, schema: SchemaDefinition): void {
    this.schemas.set(name, schema)
    this.ajv.addSchema(schema, name)
  }

  getSchemas(): Map<string, SchemaDefinition> {
    return this.schemas
  }

  async importFromFile<T>(file: File, options: ImportOptions = { source: 'file' }): Promise<ImportResult<T>> {
    try {
      const metadata: ImportMetadata = {
        source: 'file',
        filename: file.name,
        size: file.size,
        timestamp: Date.now(),
        format: this.getFileFormat(file.name)
      }

      const content = await this.readFile(file)
      const data = await this.parseContent<T>(content, metadata.format)
      
      return await this.processImportedData(data, metadata, options)
    } catch (error) {
      return {
        success: false,
        errors: [{
          path: 'file',
          message: error instanceof Error ? error.message : 'Failed to import file'
        }]
      }
    }
  }

  async importFromURL<T>(
    url: string, 
    options: ImportOptions = { source: 'url' },
    urlOptions: URLImportOptions = {}
  ): Promise<ImportResult<T>> {
    try {
      const metadata: ImportMetadata = {
        source: 'url',
        url,
        size: 0,
        timestamp: Date.now(),
        format: this.getFormatFromURL(url)
      }

      const response = await this.fetchFromURL(url, urlOptions)
      const content = await response.text()
      metadata.size = content.length

      const data = await this.parseContent<T>(content, metadata.format)
      
      return await this.processImportedData(data, metadata, options)
    } catch (error) {
      return {
        success: false,
        errors: [{
          path: 'url',
          message: error instanceof Error ? error.message : 'Failed to import from URL'
        }]
      }
    }
  }

  async importFromClipboard<T>(options: ImportOptions = { source: 'clipboard' }): Promise<ImportResult<T>> {
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('Clipboard API not available')
      }

      const content = await navigator.clipboard.readText()
      const metadata: ImportMetadata = {
        source: 'clipboard',
        size: content.length,
        timestamp: Date.now(),
        format: 'json' // Assume JSON for clipboard content
      }

      const data = await this.parseContent<T>(content, metadata.format)
      
      return await this.processImportedData(data, metadata, options)
    } catch (error) {
      return {
        success: false,
        errors: [{
          path: 'clipboard',
          message: error instanceof Error ? error.message : 'Failed to import from clipboard'
        }]
      }
    }
  }

  async importMultipleFiles<T>(
    files: FileList, 
    options: ImportOptions = { source: 'file' }
  ): Promise<ImportResult<T[]>> {
    const results: T[] = []
    const errors: ValidationError[] = []
    const warnings: string[] = []

    for (const file of Array.from(files)) {
      const result = await this.importFromFile<T>(file, options)
      
      if (result.success && result.data) {
        results.push(result.data)
      } else {
        errors.push(...(result.errors || []))
        warnings.push(`Failed to import ${file.name}`)
      }
    }

    const metadata: ImportMetadata = {
      source: 'file',
      size: Array.from(files).reduce((total, file) => total + file.size, 0),
      timestamp: Date.now(),
      format: 'multiple'
    }

    return {
      success: results.length > 0,
      data: results,
      metadata,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  private async fetchFromURL(url: string, options: URLImportOptions): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000)

    try {
      const response = await fetch(url, {
        headers: options.headers,
        signal: controller.signal,
        redirect: options.followRedirects !== false ? 'follow' : 'manual'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async parseContent<T>(content: string, format: string): Promise<T> {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.parse(content)
      case 'csv':
        return this.parseCSV(content) as T
      case 'xml':
        return this.parseXML(content) as T
      case 'yaml':
      case 'yml':
        throw new Error('YAML parsing not implemented')
      default:
        // Try JSON first, fallback to raw text
        try {
          return JSON.parse(content)
        } catch {
          return content as unknown as T
        }
    }
  }

  private parseCSV(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      data.push(row)
    }

    return data
  }

  private parseXML(content: string): any {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/xml')
    
    if (doc.querySelector('parsererror')) {
      throw new Error('Invalid XML content')
    }

    return this.xmlToObject(doc.documentElement)
  }

  private xmlToObject(element: Element): any {
    const result: any = {}
    
    // Handle attributes
    for (const attr of Array.from(element.attributes)) {
      result[`@${attr.name}`] = attr.value
    }

    // Handle child elements
    const children = Array.from(element.children)
    if (children.length === 0) {
      return element.textContent || ''
    }

    for (const child of children) {
      const childData = this.xmlToObject(child)
      
      if (result[child.tagName]) {
        if (!Array.isArray(result[child.tagName])) {
          result[child.tagName] = [result[child.tagName]]
        }
        result[child.tagName].push(childData)
      } else {
        result[child.tagName] = childData
      }
    }

    return result
  }

  private async processImportedData<T>(
    data: T, 
    metadata: ImportMetadata, 
    options: ImportOptions
  ): Promise<ImportResult<T>> {
    const result: ImportResult<T> = {
      success: true,
      data,
      metadata
    }

    // Validate schema if requested
    if (options.validateSchema) {
      const validation = this.validateData(data)
      if (!validation.valid) {
        result.errors = validation.errors
        if (validation.errors.length > 0) {
          result.success = false
        }
      }
    }

    return result
  }

  private validateData(data: any): { valid: boolean; errors: ValidationError[] } {
    // Try to find a matching schema
    const schemas = Array.from(this.schemas.keys())
    const errors: ValidationError[] = []

    for (const schemaName of schemas) {
      const validate = this.ajv.getSchema(schemaName)
      if (validate && validate(data)) {
        return { valid: true, errors: [] }
      }
      
      if (validate?.errors) {
        errors.push(...validate.errors.map(error => ({
          path: error.instancePath || error.dataPath || 'root',
          message: error.message || 'Validation error',
          value: error.data,
          schema: schemaName
        })))
      }
    }

    return { 
      valid: errors.length === 0, 
      errors: errors.slice(0, 10) // Limit to first 10 errors
    }
  }

  private getFileFormat(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  private getFormatFromURL(url: string): string {
    try {
      const parsedURL = new URL(url)
      const pathname = parsedURL.pathname
      const extension = pathname.split('.').pop()?.toLowerCase()
      return extension || 'json' // Default to JSON for URLs
    } catch {
      return 'json'
    }
  }
}