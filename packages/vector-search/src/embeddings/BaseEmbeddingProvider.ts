import type { EmbeddingProvider } from '../types'

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  abstract name: string
  abstract dimensions: number

  abstract generateEmbedding(text: string): Promise<number[]>
  
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Default implementation processes texts sequentially
    const embeddings: number[][] = []
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text)
      embeddings.push(embedding)
    }
    
    return embeddings
  }

  // Utility methods
  protected normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector
  }

  protected preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  protected validateEmbedding(embedding: number[]): void {
    if (embedding.length !== this.dimensions) {
      throw new Error(`Embedding dimension mismatch: expected ${this.dimensions}, got ${embedding.length}`)
    }
    
    if (embedding.some(val => !Number.isFinite(val))) {
      throw new Error('Embedding contains invalid values (NaN or Infinity)')
    }
  }
}