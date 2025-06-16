import Database from 'better-sqlite3'
import EventEmitter from 'eventemitter3'
import { join, dirname } from 'path'
import { mkdirSync, existsSync, statSync, readdirSync } from 'fs'
import type { 
  DatabaseConfig, 
  Migration, 
  QueryResult, 
  SingleQueryResult, 
  TransactionResult,
  DatabaseStats,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  BackupInfo,
  DatabaseEvent,
  QueryOptions,
  PreparedStatementCache
} from './types'

export class DatabaseManager extends EventEmitter {
  private db: Database.Database | null = null
  private config: DatabaseConfig
  private preparedStatements: PreparedStatementCache = {}
  private backupInterval: NodeJS.Timeout | null = null

  constructor(config: DatabaseConfig) {
    super()
    this.config = {
      ...config,
      options: {
        readonly: false,
        fileMustExist: false,
        timeout: 5000,
        verbose: false,
        ...config.options
      },
      migrations: {
        directory: 'migrations',
        tableName: '_migrations',
        ...config.migrations
      },
      backup: {
        enabled: false,
        directory: 'backups',
        interval: 60, // 1 hour
        maxBackups: 10,
        ...config.backup
      }
    }
  }

  // Connection Management
  async connect(): Promise<void> {
    try {
      if (this.db) {
        this.emit('event', { type: 'error', timestamp: Date.now(), error: new Error('Database already connected') })
        return
      }

      // Ensure directory exists
      const dbDir = dirname(this.config.filename)
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true })
      }

      // Create database connection
      this.db = new Database(this.config.filename, this.config.options)

      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = 1000')
      this.db.pragma('temp_store = memory')

      // Set up error handling
      this.db.on('error', (error) => {
        this.emit('event', { type: 'error', timestamp: Date.now(), error })
      })

      this.emit('event', { type: 'open', timestamp: Date.now(), data: { filename: this.config.filename } })

      // Run migrations
      await this.runMigrations()

      // Start backup if enabled
      if (this.config.backup?.enabled) {
        this.startBackupSchedule()
      }

    } catch (error) {
      const event: DatabaseEvent = { type: 'error', timestamp: Date.now(), error: error as Error }
      this.emit('event', event)
      throw error
    }
  }

  disconnect(): void {
    try {
      if (this.backupInterval) {
        clearInterval(this.backupInterval)
        this.backupInterval = null
      }

      if (this.db) {
        // Clear prepared statements
        for (const stmt of Object.values(this.preparedStatements)) {
          if (stmt && typeof stmt.finalize === 'function') {
            stmt.finalize()
          }
        }
        this.preparedStatements = {}

        this.db.close()
        this.db = null
        
        this.emit('event', { type: 'close', timestamp: Date.now() })
      }
    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
    }
  }

  isConnected(): boolean {
    return this.db !== null && this.db.open
  }

  // Query Methods
  async query<T = any>(sql: string, params: any[] = [], options: QueryOptions = {}): Promise<QueryResult<T>> {
    try {
      this.ensureConnected()

      const stmt = this.getOrCreateStatement(sql)
      const result = stmt.all(...params)

      this.emit('event', { 
        type: 'query', 
        timestamp: Date.now(), 
        data: { sql, params, rowCount: result.length } 
      })

      return {
        data: result as T[],
        success: true
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Query failed'
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      
      return {
        data: [],
        success: false,
        error: errorMsg
      }
    }
  }

  async queryOne<T = any>(sql: string, params: any[] = [], options: QueryOptions = {}): Promise<SingleQueryResult<T>> {
    try {
      this.ensureConnected()

      const stmt = this.getOrCreateStatement(sql)
      const result = stmt.get(...params)

      this.emit('event', { 
        type: 'query', 
        timestamp: Date.now(), 
        data: { sql, params, found: !!result } 
      })

      return {
        data: result as T || null,
        success: true
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Query failed'
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      
      return {
        data: null,
        success: false,
        error: errorMsg
      }
    }
  }

  async execute(sql: string, params: any[] = [], options: QueryOptions = {}): Promise<QueryResult> {
    try {
      this.ensureConnected()

      const stmt = this.getOrCreateStatement(sql)
      const info = stmt.run(...params)

      this.emit('event', { 
        type: 'query', 
        timestamp: Date.now(), 
        data: { sql, params, changes: info.changes } 
      })

      return {
        data: [],
        changes: info.changes,
        lastInsertRowid: Number(info.lastInsertRowid),
        success: true
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execute failed'
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      
      return {
        data: [],
        success: false,
        error: errorMsg
      }
    }
  }

  async transaction<T>(callback: (tx: DatabaseManager) => T): Promise<TransactionResult> {
    try {
      this.ensureConnected()

      const transaction = this.db!.transaction(() => {
        return callback(this)
      })

      const result = transaction()

      return {
        success: true,
        results: Array.isArray(result) ? result : [result]
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Transaction failed'
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      
      return {
        success: false,
        results: [],
        error: errorMsg
      }
    }
  }

  // Migration Methods
  private async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      const createMigrationsTable = `
        CREATE TABLE IF NOT EXISTS ${this.config.migrations!.tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          filename TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      await this.execute(createMigrationsTable)

      // Load and run pending migrations
      const migrations = await this.loadMigrations()
      const executedMigrations = await this.getExecutedMigrations()
      
      const pendingMigrations = migrations.filter(migration => 
        !executedMigrations.some(executed => executed.version === migration.version)
      )

      for (const migration of pendingMigrations.sort((a, b) => a.version - b.version)) {
        await this.executeMigration(migration)
      }

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  private async loadMigrations(): Promise<Migration[]> {
    // This would typically load from files in the migrations directory
    // For now, return empty array - migrations would be provided by the app
    return []
  }

  private async getExecutedMigrations(): Promise<Array<{ version: number; name: string }>> {
    const result = await this.query<{ version: number; name: string }>(
      `SELECT version, name FROM ${this.config.migrations!.tableName} ORDER BY version ASC`
    )
    return result.data
  }

  private async executeMigration(migration: Migration): Promise<void> {
    try {
      // Execute the migration SQL
      await this.execute(migration.up)

      // Record the migration
      await this.execute(
        `INSERT INTO ${this.config.migrations!.tableName} (version, name, filename) VALUES (?, ?, ?)`,
        [migration.version, migration.name, migration.id]
      )

      this.emit('event', { 
        type: 'migration', 
        timestamp: Date.now(), 
        data: { migration: migration.name, version: migration.version } 
      })

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw new Error(`Migration failed: ${migration.name} - ${error}`)
    }
  }

  // Database Info Methods
  async getStats(): Promise<DatabaseStats> {
    this.ensureConnected()

    const dbStat = statSync(this.config.filename)
    const pageCount = this.db!.pragma('page_count', { simple: true }) as number
    const pageSize = this.db!.pragma('page_size', { simple: true }) as number
    const freePages = this.db!.pragma('freelist_count', { simple: true }) as number

    const tables = await this.getTables()

    return {
      filename: this.config.filename,
      size: dbStat.size,
      pageCount,
      pageSize,
      freePages,
      tables,
      indices: []
    }
  }

  private async getTables(): Promise<TableInfo[]> {
    const result = await this.query<{ name: string; type: string }>(
      "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name"
    )

    const tables: TableInfo[] = []

    for (const table of result.data) {
      const columns = await this.getTableColumns(table.name)
      const rowCount = table.type === 'table' ? await this.getRowCount(table.name) : undefined

      tables.push({
        name: table.name,
        type: table.type as 'table' | 'view',
        columns,
        rowCount
      })
    }

    return tables
  }

  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const result = await this.query<{
      name: string
      type: string
      notnull: number
      dflt_value: any
      pk: number
    }>(`PRAGMA table_info(${tableName})`)

    return result.data.map(col => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0,
      defaultValue: col.dflt_value,
      primaryKey: col.pk === 1
    }))
  }

  private async getRowCount(tableName: string): Promise<number> {
    const result = await this.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`)
    return result.data?.count || 0
  }

  // Backup Methods
  async createBackup(filename?: string): Promise<BackupInfo> {
    try {
      this.ensureConnected()

      const backupDir = this.config.backup!.directory!
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true })
      }

      const timestamp = Date.now()
      const backupFilename = filename || `backup_${timestamp}.db`
      const backupPath = join(backupDir, backupFilename)

      // Use SQLite backup API for atomic backup
      this.db!.backup(backupPath)

      const stat = statSync(backupPath)

      const backupInfo: BackupInfo = {
        filename: backupPath,
        timestamp,
        size: stat.size
      }

      this.emit('event', { type: 'backup', timestamp: Date.now(), data: backupInfo })
      
      // Clean up old backups
      await this.cleanupOldBackups()

      return backupInfo

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  private startBackupSchedule(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
    }

    const intervalMs = this.config.backup!.interval! * 60 * 1000 // Convert minutes to ms

    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup()
      } catch (error) {
        this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      }
    }, intervalMs)
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupDir = this.config.backup!.directory!
      const maxBackups = this.config.backup!.maxBackups!

      if (!existsSync(backupDir)) return

      const files = readdirSync(backupDir)
        .filter(file => file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: join(backupDir, file),
          stat: statSync(join(backupDir, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())

      // Remove old backups
      if (files.length > maxBackups) {
        const { unlink } = await import('fs/promises')
        const filesToDelete = files.slice(maxBackups)
        
        for (const file of filesToDelete) {
          await unlink(file.path)
        }
      }

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
    }
  }

  // Utility Methods
  private ensureConnected(): void {
    if (!this.db || !this.db.open) {
      throw new Error('Database is not connected')
    }
  }

  private getOrCreateStatement(sql: string): any {
    if (!this.preparedStatements[sql]) {
      this.preparedStatements[sql] = this.db!.prepare(sql)
    }
    return this.preparedStatements[sql]
  }

  // Cleanup
  destroy(): void {
    this.disconnect()
    this.removeAllListeners()
  }
}