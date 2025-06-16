export interface DatabaseConfig {
  filename: string
  options?: {
    readonly?: boolean
    fileMustExist?: boolean
    timeout?: number
    verbose?: boolean
  }
  migrations?: {
    directory?: string
    tableName?: string
  }
  backup?: {
    enabled?: boolean
    directory?: string
    interval?: number // minutes
    maxBackups?: number
  }
}

export interface Migration {
  id: string
  version: number
  name: string
  up: string
  down?: string
  timestamp: number
}

export interface QueryResult<T = any> {
  data: T[]
  changes?: number
  lastInsertRowid?: number
  success: boolean
  error?: string
}

export interface SingleQueryResult<T = any> {
  data: T | null
  success: boolean
  error?: string
}

export interface TransactionResult {
  success: boolean
  results: any[]
  error?: string
}

export interface DatabaseStats {
  filename: string
  size: number // bytes
  pageCount: number
  pageSize: number
  freePages: number
  tables: TableInfo[]
  indices: IndexInfo[]
}

export interface TableInfo {
  name: string
  type: 'table' | 'view' | 'index'
  columns: ColumnInfo[]
  rowCount?: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  primaryKey: boolean
}

export interface IndexInfo {
  name: string
  tableName: string
  columns: string[]
  unique: boolean
}

export interface BackupInfo {
  filename: string
  timestamp: number
  size: number
  compressed?: boolean
}

export interface DatabaseEvent {
  type: 'open' | 'close' | 'migration' | 'backup' | 'error' | 'query'
  timestamp: number
  data?: any
  error?: Error
}

export interface QueryOptions {
  timeout?: number
  safeIntegers?: boolean
  returnChanges?: boolean
}

export interface PreparedStatementCache {
  [key: string]: any // better-sqlite3 Statement
}