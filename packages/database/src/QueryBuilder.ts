export class QueryBuilder {
  private selectFields: string[] = []
  private fromTable: string = ''
  private joinClauses: string[] = []
  private whereConditions: string[] = []
  private groupByFields: string[] = []
  private havingConditions: string[] = []
  private orderByFields: string[] = []
  private limitValue: number | null = null
  private offsetValue: number | null = null
  private parameters: any[] = []

  // SELECT methods
  select(fields: string | string[]): QueryBuilder {
    if (typeof fields === 'string') {
      this.selectFields.push(fields)
    } else {
      this.selectFields.push(...fields)
    }
    return this
  }

  from(table: string): QueryBuilder {
    this.fromTable = table
    return this
  }

  // JOIN methods
  join(table: string, condition: string): QueryBuilder {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`)
    return this
  }

  leftJoin(table: string, condition: string): QueryBuilder {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`)
    return this
  }

  rightJoin(table: string, condition: string): QueryBuilder {
    this.joinClauses.push(`RIGHT JOIN ${table} ON ${condition}`)
    return this
  }

  innerJoin(table: string, condition: string): QueryBuilder {
    this.joinClauses.push(`INNER JOIN ${table} ON ${condition}`)
    return this
  }

  // WHERE methods
  where(condition: string, ...params: any[]): QueryBuilder {
    this.whereConditions.push(condition)
    this.parameters.push(...params)
    return this
  }

  whereEqual(field: string, value: any): QueryBuilder {
    this.whereConditions.push(`${field} = ?`)
    this.parameters.push(value)
    return this
  }

  whereNotEqual(field: string, value: any): QueryBuilder {
    this.whereConditions.push(`${field} != ?`)
    this.parameters.push(value)
    return this
  }

  whereIn(field: string, values: any[]): QueryBuilder {
    const placeholders = values.map(() => '?').join(', ')
    this.whereConditions.push(`${field} IN (${placeholders})`)
    this.parameters.push(...values)
    return this
  }

  whereNotIn(field: string, values: any[]): QueryBuilder {
    const placeholders = values.map(() => '?').join(', ')
    this.whereConditions.push(`${field} NOT IN (${placeholders})`)
    this.parameters.push(...values)
    return this
  }

  whereLike(field: string, pattern: string): QueryBuilder {
    this.whereConditions.push(`${field} LIKE ?`)
    this.parameters.push(pattern)
    return this
  }

  whereNotNull(field: string): QueryBuilder {
    this.whereConditions.push(`${field} IS NOT NULL`)
    return this
  }

  whereNull(field: string): QueryBuilder {
    this.whereConditions.push(`${field} IS NULL`)
    return this
  }

  whereBetween(field: string, min: any, max: any): QueryBuilder {
    this.whereConditions.push(`${field} BETWEEN ? AND ?`)
    this.parameters.push(min, max)
    return this
  }

  // GROUP BY methods
  groupBy(fields: string | string[]): QueryBuilder {
    if (typeof fields === 'string') {
      this.groupByFields.push(fields)
    } else {
      this.groupByFields.push(...fields)
    }
    return this
  }

  having(condition: string, ...params: any[]): QueryBuilder {
    this.havingConditions.push(condition)
    this.parameters.push(...params)
    return this
  }

  // ORDER BY methods
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByFields.push(`${field} ${direction}`)
    return this
  }

  orderByAsc(field: string): QueryBuilder {
    return this.orderBy(field, 'ASC')
  }

  orderByDesc(field: string): QueryBuilder {
    return this.orderBy(field, 'DESC')
  }

  // LIMIT and OFFSET
  limit(count: number): QueryBuilder {
    this.limitValue = count
    return this
  }

  offset(count: number): QueryBuilder {
    this.offsetValue = count
    return this
  }

  // Build the query
  build(): { sql: string; parameters: any[] } {
    if (!this.fromTable) {
      throw new Error('FROM table is required')
    }

    let sql = 'SELECT '
    
    // SELECT clause
    if (this.selectFields.length > 0) {
      sql += this.selectFields.join(', ')
    } else {
      sql += '*'
    }

    // FROM clause
    sql += ` FROM ${this.fromTable}`

    // JOIN clauses
    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses.join(' ')
    }

    // WHERE clause
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.join(' AND ')
    }

    // GROUP BY clause
    if (this.groupByFields.length > 0) {
      sql += ' GROUP BY ' + this.groupByFields.join(', ')
    }

    // HAVING clause
    if (this.havingConditions.length > 0) {
      sql += ' HAVING ' + this.havingConditions.join(' AND ')
    }

    // ORDER BY clause
    if (this.orderByFields.length > 0) {
      sql += ' ORDER BY ' + this.orderByFields.join(', ')
    }

    // LIMIT clause
    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`
    }

    // OFFSET clause
    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`
    }

    return {
      sql,
      parameters: this.parameters
    }
  }

  // Reset the builder
  reset(): QueryBuilder {
    this.selectFields = []
    this.fromTable = ''
    this.joinClauses = []
    this.whereConditions = []
    this.groupByFields = []
    this.havingConditions = []
    this.orderByFields = []
    this.limitValue = null
    this.offsetValue = null
    this.parameters = []
    return this
  }

  // Static factory methods
  static create(): QueryBuilder {
    return new QueryBuilder()
  }

  static select(fields?: string | string[]): QueryBuilder {
    const builder = new QueryBuilder()
    if (fields) {
      builder.select(fields)
    }
    return builder
  }
}

// INSERT Query Builder
export class InsertBuilder {
  private tableName: string = ''
  private columns: string[] = []
  private values: any[][] = []
  private onConflictAction: string = ''

  into(table: string): InsertBuilder {
    this.tableName = table
    return this
  }

  value(data: Record<string, any>): InsertBuilder {
    if (this.columns.length === 0) {
      this.columns = Object.keys(data)
    }
    
    const rowValues = this.columns.map(col => data[col])
    this.values.push(rowValues)
    return this
  }

  values(dataArray: Record<string, any>[]): InsertBuilder {
    for (const data of dataArray) {
      this.value(data)
    }
    return this
  }

  onConflict(action: 'IGNORE' | 'REPLACE'): InsertBuilder {
    this.onConflictAction = action === 'IGNORE' ? 'OR IGNORE' : 'OR REPLACE'
    return this
  }

  build(): { sql: string; parameters: any[] } {
    if (!this.tableName) {
      throw new Error('Table name is required')
    }

    if (this.columns.length === 0 || this.values.length === 0) {
      throw new Error('At least one row of data is required')
    }

    const placeholders = this.columns.map(() => '?').join(', ')
    const valuesClause = this.values.map(() => `(${placeholders})`).join(', ')

    let sql = `INSERT ${this.onConflictAction} INTO ${this.tableName} (${this.columns.join(', ')}) VALUES ${valuesClause}`
    
    const parameters = this.values.flat()

    return { sql, parameters }
  }

  static into(table: string): InsertBuilder {
    return new InsertBuilder().into(table)
  }
}

// UPDATE Query Builder
export class UpdateBuilder {
  private tableName: string = ''
  private setClause: string[] = []
  private whereConditions: string[] = []
  private parameters: any[] = []

  table(name: string): UpdateBuilder {
    this.tableName = name
    return this
  }

  set(field: string, value: any): UpdateBuilder {
    this.setClause.push(`${field} = ?`)
    this.parameters.push(value)
    return this
  }

  setData(data: Record<string, any>): UpdateBuilder {
    for (const [field, value] of Object.entries(data)) {
      this.set(field, value)
    }
    return this
  }

  where(condition: string, ...params: any[]): UpdateBuilder {
    this.whereConditions.push(condition)
    this.parameters.push(...params)
    return this
  }

  whereEqual(field: string, value: any): UpdateBuilder {
    this.whereConditions.push(`${field} = ?`)
    this.parameters.push(value)
    return this
  }

  build(): { sql: string; parameters: any[] } {
    if (!this.tableName) {
      throw new Error('Table name is required')
    }

    if (this.setClause.length === 0) {
      throw new Error('At least one SET clause is required')
    }

    let sql = `UPDATE ${this.tableName} SET ${this.setClause.join(', ')}`

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.join(' AND ')
    }

    return { sql, parameters: this.parameters }
  }

  static table(name: string): UpdateBuilder {
    return new UpdateBuilder().table(name)
  }
}

// DELETE Query Builder
export class DeleteBuilder {
  private tableName: string = ''
  private whereConditions: string[] = []
  private parameters: any[] = []

  from(table: string): DeleteBuilder {
    this.tableName = table
    return this
  }

  where(condition: string, ...params: any[]): DeleteBuilder {
    this.whereConditions.push(condition)
    this.parameters.push(...params)
    return this
  }

  whereEqual(field: string, value: any): DeleteBuilder {
    this.whereConditions.push(`${field} = ?`)
    this.parameters.push(value)
    return this
  }

  build(): { sql: string; parameters: any[] } {
    if (!this.tableName) {
      throw new Error('Table name is required')
    }

    let sql = `DELETE FROM ${this.tableName}`

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.join(' AND ')
    }

    return { sql, parameters: this.parameters }
  }

  static from(table: string): DeleteBuilder {
    return new DeleteBuilder().from(table)
  }
}