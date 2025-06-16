export type ExportFormat = 'json' | 'html' | 'pdf' | 'docx'
export type ImportSource = 'file' | 'url' | 'drag-drop' | 'clipboard'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  template?: string
  includeMetadata?: boolean
  compress?: boolean
}

export interface ImportOptions {
  validateSchema?: boolean
  mergeStrategy?: 'replace' | 'merge' | 'append'
  source: ImportSource
}

export interface ExportResult {
  success: boolean
  filename?: string
  data?: Blob | string
  error?: string
}

export interface ImportResult<T = any> {
  success: boolean
  data?: T
  metadata?: ImportMetadata
  errors?: ValidationError[]
  warnings?: string[]
}

export interface ImportMetadata {
  source: ImportSource
  filename?: string
  url?: string
  size: number
  timestamp: number
  format: string
  version?: string
}

export interface ValidationError {
  path: string
  message: string
  value?: any
  schema?: string
}

export interface FilePickerOptions {
  accept?: string[]
  multiple?: boolean
  description?: string
}

export interface DragDropOptions {
  accept?: string[]
  multiple?: boolean
  onDragEnter?: () => void
  onDragLeave?: () => void
  onDragOver?: (event: DragEvent) => void
}

export interface URLImportOptions {
  headers?: Record<string, string>
  timeout?: number
  validateCertificate?: boolean
  followRedirects?: boolean
}

export interface ExportTemplate {
  name: string
  format: ExportFormat
  template: string
  variables?: Record<string, any>
}

export interface SchemaDefinition {
  $schema?: string
  type: string
  properties?: Record<string, any>
  required?: string[]
  additionalProperties?: boolean
}