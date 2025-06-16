// Main vector search engine
export { VectorSearchEngine } from './VectorSearchEngine'

// Embedding providers
export { BaseEmbeddingProvider } from './embeddings/BaseEmbeddingProvider'
export { SimpleEmbeddingProvider } from './embeddings/SimpleEmbeddingProvider'
export { OpenAIEmbeddingProvider } from './embeddings/OpenAIEmbeddingProvider'
export type { OpenAIEmbeddingConfig } from './embeddings/OpenAIEmbeddingProvider'

// Types
export type {
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

// Utility functions
export const createVectorSearch = (config: VectorSearchConfig) => new VectorSearchEngine(config)

export const getDefaultConfig = (databasePath: string, tableName: string = 'documents'): VectorSearchConfig => ({
  databasePath,
  tableName,
  embeddingDimensions: 384,
  indexType: 'IVF_PQ',
  distanceType: 'cosine',
  indexParams: {
    numPartitions: 256,
    numSubQuantizers: 96,
    maxIterations: 50,
    tolerance: 1e-4
  }
})

// Distance calculation utilities
export const VectorUtils = {
  // Calculate cosine similarity
  cosineSimilarity: (a: number[], b: number[]): number => {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  },

  // Calculate Euclidean distance
  euclideanDistance: (a: number[], b: number[]): number => {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let sum = 0
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i]
      sum += diff * diff
    }

    return Math.sqrt(sum)
  },

  // Calculate dot product
  dotProduct: (a: number[], b: number[]): number => {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let product = 0
    for (let i = 0; i < a.length; i++) {
      product += a[i] * b[i]
    }

    return product
  },

  // Normalize vector
  normalize: (vector: number[]): number[] => {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector
  },

  // Calculate vector magnitude
  magnitude: (vector: number[]): number => {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  },

  // Add vectors
  add: (a: number[], b: number[]): number[] => {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }
    return a.map((val, i) => val + b[i])
  },

  // Subtract vectors
  subtract: (a: number[], b: number[]): number[] => {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }
    return a.map((val, i) => val - b[i])
  },

  // Scale vector
  scale: (vector: number[], scalar: number): number[] => {
    return vector.map(val => val * scalar)
  },

  // Calculate centroid of vectors
  centroid: (vectors: number[][]): number[] => {
    if (vectors.length === 0) {
      throw new Error('Cannot calculate centroid of empty vector set')
    }

    const dimensions = vectors[0].length
    const centroid = new Array(dimensions).fill(0)

    for (const vector of vectors) {
      if (vector.length !== dimensions) {
        throw new Error('All vectors must have the same length')
      }
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i]
      }
    }

    return centroid.map(val => val / vectors.length)
  }
}

// Text preprocessing utilities
export const TextUtils = {
  // Clean and normalize text
  cleanText: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  },

  // Extract keywords using simple frequency analysis
  extractKeywords: (text: string, maxKeywords: number = 10): string[] => {
    const words = TextUtils.cleanText(text).split(' ')
    const wordCounts = new Map<string, number>()

    // Count word frequencies
    for (const word of words) {
      if (word.length > 2) { // Skip very short words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    }

    // Sort by frequency and return top keywords
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word)
  },

  // Split text into chunks
  chunkText: (text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] => {
    if (text.length <= maxChunkSize) {
      return [text]
    }

    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      let end = start + maxChunkSize

      // Try to break at word boundary
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end)
        if (lastSpace > start) {
          end = lastSpace
        }
      }

      chunks.push(text.slice(start, end))
      start = end - overlap
    }

    return chunks
  },

  // Calculate text similarity using simple word overlap
  textSimilarity: (text1: string, text2: string): number => {
    const words1 = new Set(TextUtils.cleanText(text1).split(' '))
    const words2 = new Set(TextUtils.cleanText(text2).split(' '))

    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }
}