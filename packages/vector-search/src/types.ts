export interface VectorSearchConfig {
  databasePath: string
  tableName: string
  embeddingDimensions: number
  indexType?: 'IVF_PQ' | 'HNSW' | 'BTREE'
  distanceType?: 'l2' | 'cosine' | 'dot'
  indexParams?: {
    numPartitions?: number
    numSubQuantizers?: number
    maxIterations?: number
    tolerance?: number
  }
}

export interface Document {
  id: string
  content: string
  metadata?: Record<string, any>
  embedding?: number[]
  timestamp?: number
}

export interface SearchResult {
  id: string
  content: string
  metadata?: Record<string, any>
  score: number
  distance: number
}

export interface SearchQuery {
  text?: string
  embedding?: number[]
  filters?: Record<string, any>
  limit?: number
  threshold?: number
  includeMetadata?: boolean
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  queryTime: number
  query: SearchQuery
}

export interface EmbeddingProvider {
  name: string
  dimensions: number
  generateEmbedding(text: string): Promise<number[]>
  generateEmbeddings(texts: string[]): Promise<number[][]>
}

export interface VectorIndex {
  name: string
  tableName: string
  vectorColumn: string
  indexType: string
  distanceType: string
  parameters: Record<string, any>
  createdAt: number
  documentsCount: number
}

export interface VectorStats {
  totalDocuments: number
  totalVectors: number
  indexSize: number
  dimensions: number
  indices: VectorIndex[]
  lastUpdated: number
}

export interface SimilarityMatch {
  documentId: string
  similarity: number
  distance: number
  content?: string
  metadata?: Record<string, any>
}

export interface ClusterResult {
  clusterId: number
  documents: string[]
  centroid: number[]
  variance: number
}

export interface VectorSearchEvent {
  type: 'index' | 'search' | 'insert' | 'update' | 'delete' | 'error'
  timestamp: number
  data?: any
  error?: Error
  duration?: number
}

export interface BatchOperation {
  operation: 'insert' | 'update' | 'delete'
  documents: Document[]
  options?: {
    batchSize?: number
    parallel?: boolean
  }
}

export interface BatchResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{ documentId: string; error: string }>
  duration: number
}