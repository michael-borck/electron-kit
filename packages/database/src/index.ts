// Main database manager
export { DatabaseManager } from './DatabaseManager'

// Query builders
export { 
  QueryBuilder, 
  InsertBuilder, 
  UpdateBuilder, 
  DeleteBuilder 
} from './QueryBuilder'

// Types
export type {
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

// Utility functions
export const createDatabase = (config: DatabaseConfig) => new DatabaseManager(config)

export const getDefaultConfig = (filename: string): DatabaseConfig => ({
  filename,
  options: {
    readonly: false,
    fileMustExist: false,
    timeout: 5000,
    verbose: false
  },
  migrations: {
    directory: 'migrations',
    tableName: '_migrations'
  },
  backup: {
    enabled: false,
    directory: 'backups',
    interval: 60, // 1 hour
    maxBackups: 10
  }
})

// Common SQL helpers
export const SQL = {
  // Escape SQL identifiers (table names, column names)
  escapeId: (identifier: string): string => {
    return `"${identifier.replace(/"/g, '""')}"`
  },

  // Create table helper
  createTable: (
    tableName: string, 
    columns: Record<string, string>, 
    options: { ifNotExists?: boolean; primaryKey?: string[] } = {}
  ): string => {
    const columnDefs = Object.entries(columns).map(([name, type]) => `${SQL.escapeId(name)} ${type}`)
    
    if (options.primaryKey && options.primaryKey.length > 0) {
      const pkColumns = options.primaryKey.map(col => SQL.escapeId(col)).join(', ')
      columnDefs.push(`PRIMARY KEY (${pkColumns})`)
    }

    const ifNotExists = options.ifNotExists ? 'IF NOT EXISTS ' : ''
    return `CREATE TABLE ${ifNotExists}${SQL.escapeId(tableName)} (${columnDefs.join(', ')})`
  },

  // Create index helper
  createIndex: (
    indexName: string,
    tableName: string,
    columns: string[],
    options: { unique?: boolean; ifNotExists?: boolean } = {}
  ): string => {
    const unique = options.unique ? 'UNIQUE ' : ''
    const ifNotExists = options.ifNotExists ? 'IF NOT EXISTS ' : ''
    const columnList = columns.map(col => SQL.escapeId(col)).join(', ')
    
    return `CREATE ${unique}INDEX ${ifNotExists}${SQL.escapeId(indexName)} ON ${SQL.escapeId(tableName)} (${columnList})`
  },

  // Drop table helper
  dropTable: (tableName: string, ifExists: boolean = true): string => {
    const ifExistsClause = ifExists ? 'IF EXISTS ' : ''
    return `DROP TABLE ${ifExistsClause}${SQL.escapeId(tableName)}`
  },

  // Drop index helper
  dropIndex: (indexName: string, ifExists: boolean = true): string => {
    const ifExistsClause = ifExists ? 'IF EXISTS ' : ''
    return `DROP INDEX ${ifExistsClause}${SQL.escapeId(indexName)}`
  }
}

// Migration helpers
export const MigrationHelpers = {
  createMigration: (
    version: number,
    name: string,
    up: string,
    down?: string
  ): Migration => ({
    id: `${version}_${name.replace(/\s+/g, '_').toLowerCase()}`,
    version,
    name,
    up,
    down,
    timestamp: Date.now()
  }),

  addColumn: (tableName: string, columnName: string, columnType: string): string => {
    return `ALTER TABLE ${SQL.escapeId(tableName)} ADD COLUMN ${SQL.escapeId(columnName)} ${columnType}`
  },

  dropColumn: (tableName: string, columnName: string): string => {
    return `ALTER TABLE ${SQL.escapeId(tableName)} DROP COLUMN ${SQL.escapeId(columnName)}`
  },

  renameTable: (oldName: string, newName: string): string => {
    return `ALTER TABLE ${SQL.escapeId(oldName)} RENAME TO ${SQL.escapeId(newName)}`
  },

  renameColumn: (tableName: string, oldName: string, newName: string): string => {
    return `ALTER TABLE ${SQL.escapeId(tableName)} RENAME COLUMN ${SQL.escapeId(oldName)} TO ${SQL.escapeId(newName)}`
  }
}