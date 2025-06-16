import { BaseEmbeddingProvider } from './BaseEmbeddingProvider'

export class SimpleEmbeddingProvider extends BaseEmbeddingProvider {
  name = 'simple-embedding'
  dimensions: number

  private vocabulary: Map<string, number> = new Map()
  private vocabularySize: number

  constructor(dimensions: number = 384, vocabularySize: number = 10000) {
    super()
    this.dimensions = dimensions
    this.vocabularySize = vocabularySize
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const preprocessed = this.preprocessText(text)
    const words = preprocessed.split(' ').filter(word => word.length > 0)
    
    if (words.length === 0) {
      return new Array(this.dimensions).fill(0)
    }

    // Build vocabulary on the fly
    this.updateVocabulary(words)

    // Create a simple bag-of-words vector
    const vector = new Array(this.dimensions).fill(0)
    
    // Use hash-based approach to map words to vector positions
    for (const word of words) {
      const wordIndex = this.getWordIndex(word)
      const position = wordIndex % this.dimensions
      vector[position] += 1 / words.length // Normalize by word count
    }

    // Add some simple n-gram features
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]}_${words[i + 1]}`
      const bigramIndex = this.getWordIndex(bigram)
      const position = bigramIndex % this.dimensions
      vector[position] += 0.5 / (words.length - 1)
    }

    // Normalize the vector
    const normalized = this.normalizeVector(vector)
    this.validateEmbedding(normalized)
    
    return normalized
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Build vocabulary from all texts first
    const allWords = new Set<string>()
    
    for (const text of texts) {
      const preprocessed = this.preprocessText(text)
      const words = preprocessed.split(' ').filter(word => word.length > 0)
      words.forEach(word => allWords.add(word))
    }
    
    this.updateVocabulary(Array.from(allWords))
    
    // Generate embeddings
    return Promise.all(texts.map(text => this.generateEmbedding(text)))
  }

  private updateVocabulary(words: string[]): void {
    for (const word of words) {
      if (!this.vocabulary.has(word) && this.vocabulary.size < this.vocabularySize) {
        this.vocabulary.set(word, this.vocabulary.size)
      }
    }
  }

  private getWordIndex(word: string): number {
    if (this.vocabulary.has(word)) {
      return this.vocabulary.get(word)!
    }
    
    // Simple hash function for unknown words
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash)
  }

  // Additional utility methods
  getVocabularySize(): number {
    return this.vocabulary.size
  }

  getVocabulary(): string[] {
    return Array.from(this.vocabulary.keys())
  }

  resetVocabulary(): void {
    this.vocabulary.clear()
  }
}