import { connect, Connection, Table } from 'lancedb'
import EventEmitter from 'eventemitter3'
import { cosine, euclidean } from 'ml-distance'
import type {
  VectorSearchConfig,
  Document,
  SearchQuery,
  SearchResponse,
  SearchResult,
  EmbeddingProvider,
  VectorStats,
  VectorIndex,
  SimilarityMatch,
  ClusterResult,
  VectorSearchEvent,
  BatchOperation,
  BatchResult
} from './types'

export class VectorSearchEngine extends EventEmitter {
  private config: VectorSearchConfig
  private connection: Connection | null = null
  private table: Table | null = null
  private embeddingProvider: EmbeddingProvider | null = null
  private isInitialized = false

  constructor(config: VectorSearchConfig) {
    super()
    this.config = {
      indexType: 'IVF_PQ',
      distanceType: 'cosine',
      ...config
    }
  }

  // Initialization
  async initialize(): Promise<void> {
    try {
      this.emit('event', { type: 'index', timestamp: Date.now(), data: { action: 'initializing' } })

      // Connect to LanceDB
      this.connection = await connect(this.config.databasePath)

      // Try to open existing table or create new one
      try {
        this.table = await this.connection.openTable(this.config.tableName)
      } catch (error) {
        // Table doesn't exist, will be created when first document is added
        this.table = null
      }

      this.isInitialized = true
      this.emit('event', { type: 'index', timestamp: Date.now(), data: { action: 'initialized' } })

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  // Embedding Provider Management
  setEmbeddingProvider(provider: EmbeddingProvider): void {
    if (provider.dimensions !== this.config.embeddingDimensions) {
      throw new Error(`Embedding dimensions mismatch: expected ${this.config.embeddingDimensions}, got ${provider.dimensions}`)
    }
    this.embeddingProvider = provider
  }

  // Document Management
  async addDocument(document: Document): Promise<void> {
    return this.addDocuments([document])
  }

  async addDocuments(documents: Document[]): Promise<void> {
    try {
      this.ensureInitialized()

      const startTime = Date.now()

      // Generate embeddings if not provided
      const documentsWithEmbeddings = await this.ensureEmbeddings(documents)

      // Prepare data for LanceDB
      const lanceData = documentsWithEmbeddings.map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: JSON.stringify(doc.metadata || {}),
        vector: doc.embedding!,
        timestamp: doc.timestamp || Date.now()
      }))

      // Create table if it doesn't exist
      if (!this.table) {
        this.table = await this.connection!.createTable(this.config.tableName, lanceData)
      } else {
        await this.table.add(lanceData)
      }

      const duration = Date.now() - startTime
      this.emit('event', { 
        type: 'insert', 
        timestamp: Date.now(), 
        data: { count: documents.length }, 
        duration 
      })

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  async updateDocument(document: Document): Promise<void> {
    try {
      this.ensureInitialized()
      this.ensureTable()

      const startTime = Date.now()

      // Generate embedding if not provided
      const docWithEmbedding = await this.ensureEmbeddings([document])

      // Update in LanceDB (delete old, insert new)
      await this.table!.delete(`id = "${document.id}"`)
      
      const lanceData = {
        id: docWithEmbedding[0].id,
        content: docWithEmbedding[0].content,
        metadata: JSON.stringify(docWithEmbedding[0].metadata || {}),
        vector: docWithEmbedding[0].embedding!,
        timestamp: Date.now()
      }

      await this.table!.add([lanceData])

      const duration = Date.now() - startTime
      this.emit('event', { 
        type: 'update', 
        timestamp: Date.now(), 
        data: { documentId: document.id }, 
        duration 
      })

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      this.ensureInitialized()
      this.ensureTable()

      const startTime = Date.now()

      await this.table!.delete(`id = "${documentId}"`)

      const duration = Date.now() - startTime
      this.emit('event', { 
        type: 'delete', 
        timestamp: Date.now(), 
        data: { documentId }, 
        duration 
      })

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  async deleteDocuments(documentIds: string[]): Promise<void> {
    try {
      this.ensureInitialized()
      this.ensureTable()

      const startTime = Date.now()

      const idList = documentIds.map(id => `"${id}"`).join(', ')
      await this.table!.delete(`id IN (${idList})`)

      const duration = Date.now() - startTime
      this.emit('event', { 
        type: 'delete', 
        timestamp: Date.now(), 
        data: { count: documentIds.length }, 
        duration 
      })

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  // Search Methods
  async search(query: SearchQuery): Promise<SearchResponse> {
    try {
      this.ensureInitialized()
      this.ensureTable()

      const startTime = Date.now()

      let queryVector: number[]

      if (query.embedding) {
        queryVector = query.embedding
      } else if (query.text && this.embeddingProvider) {
        queryVector = await this.embeddingProvider.generateEmbedding(query.text)
      } else {
        throw new Error('Either text query with embedding provider or embedding vector must be provided')
      }

      // Perform vector search
      const results = await this.table!
        .search(queryVector)
        .limit(query.limit || 10)
        .toArray()

      // Process results
      const searchResults: SearchResult[] = results.map(result => ({
        id: result.id,
        content: result.content,
        metadata: query.includeMetadata ? JSON.parse(result.metadata || '{}') : undefined,
        score: 1 - result._distance, // Convert distance to similarity score
        distance: result._distance
      }))

      // Apply threshold filter if specified
      const filteredResults = query.threshold 
        ? searchResults.filter(result => result.score >= query.threshold!)
        : searchResults

      const duration = Date.now() - startTime

      const response: SearchResponse = {
        results: filteredResults,
        totalResults: filteredResults.length,
        queryTime: duration,
        query
      }

      this.emit('event', { 
        type: 'search', 
        timestamp: Date.now(), 
        data: { resultsCount: filteredResults.length }, 
        duration 
      })

      return response

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  async findSimilar(documentId: string, limit: number = 10): Promise<SimilarityMatch[]> {
    try {
      this.ensureInitialized()
      this.ensureTable()

      // Get the document vector
      const doc = await this.table!
        .search(`id = "${documentId}"`)
        .limit(1)
        .toArray()

      if (doc.length === 0) {
        throw new Error(`Document with id ${documentId} not found`)
      }

      const queryVector = doc[0].vector

      // Search for similar documents (excluding the original)
      const results = await this.table!
        .search(queryVector)
        .limit(limit + 1)
        .toArray()

      // Filter out the original document and convert to SimilarityMatch
      const similarMatches: SimilarityMatch[] = results
        .filter(result => result.id !== documentId)
        .slice(0, limit)
        .map(result => ({
          documentId: result.id,
          similarity: 1 - result._distance,
          distance: result._distance,
          content: result.content,
          metadata: JSON.parse(result.metadata || '{}')
        }))

      return similarMatches

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  // Batch Operations
  async executeBatch(operation: BatchOperation): Promise<BatchResult> {
    const startTime = Date.now()
    let processed = 0
    let failed = 0
    const errors: Array<{ documentId: string; error: string }> = []

    try {
      const batchSize = operation.options?.batchSize || 100

      for (let i = 0; i < operation.documents.length; i += batchSize) {
        const batch = operation.documents.slice(i, i + batchSize)

        try {
          switch (operation.operation) {
            case 'insert':
              await this.addDocuments(batch)
              break
            case 'update':
              for (const doc of batch) {
                await this.updateDocument(doc)
              }
              break
            case 'delete':
              const ids = batch.map(doc => doc.id)
              await this.deleteDocuments(ids)
              break
          }
          processed += batch.length
        } catch (error) {
          failed += batch.length
          for (const doc of batch) {
            errors.push({
              documentId: doc.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      const duration = Date.now() - startTime

      return {
        success: failed === 0,
        processed,
        failed,
        errors,
        duration
      }

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  // Statistics and Info
  async getStats(): Promise<VectorStats> {
    try {
      this.ensureInitialized()

      if (!this.table) {
        return {
          totalDocuments: 0,
          totalVectors: 0,
          indexSize: 0,
          dimensions: this.config.embeddingDimensions,
          indices: [],
          lastUpdated: Date.now()
        }
      }

      const count = await this.table.countRows()

      return {
        totalDocuments: count,
        totalVectors: count,
        indexSize: 0, // LanceDB doesn't expose index size directly
        dimensions: this.config.embeddingDimensions,
        indices: [{
          name: this.config.tableName,
          tableName: this.config.tableName,
          vectorColumn: 'vector',
          indexType: this.config.indexType!,
          distanceType: this.config.distanceType!,
          parameters: this.config.indexParams || {},
          createdAt: Date.now(),
          documentsCount: count
        }],
        lastUpdated: Date.now()
      }

    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
      throw error
    }
  }

  // Utility Methods
  private async ensureEmbeddings(documents: Document[]): Promise<Document[]> {
    const documentsNeedingEmbeddings = documents.filter(doc => !doc.embedding)

    if (documentsNeedingEmbeddings.length > 0) {
      if (!this.embeddingProvider) {
        throw new Error('Embedding provider is required when documents do not have embeddings')
      }

      const texts = documentsNeedingEmbeddings.map(doc => doc.content)
      const embeddings = await this.embeddingProvider.generateEmbeddings(texts)

      documentsNeedingEmbeddings.forEach((doc, index) => {
        doc.embedding = embeddings[index]
      })
    }

    return documents
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('VectorSearchEngine must be initialized before use')
    }
  }

  private ensureTable(): void {
    if (!this.table) {
      throw new Error('No table available. Add documents first to create the table.')
    }
  }

  // Cleanup
  async close(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.close()
        this.connection = null
        this.table = null
      }
      this.isInitialized = false
      this.removeAllListeners()
    } catch (error) {
      this.emit('event', { type: 'error', timestamp: Date.now(), error: error as Error })
    }
  }
}