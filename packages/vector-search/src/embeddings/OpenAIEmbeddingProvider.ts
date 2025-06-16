import { BaseEmbeddingProvider } from './BaseEmbeddingProvider'

export interface OpenAIEmbeddingConfig {
  apiKey: string
  model?: string
  baseUrl?: string
  timeout?: number
}

export class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  name = 'openai-embedding'
  dimensions: number
  
  private config: OpenAIEmbeddingConfig
  private modelDimensions: Record<string, number> = {
    'text-embedding-ada-002': 1536,
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072
  }

  constructor(config: OpenAIEmbeddingConfig) {
    super()
    this.config = {
      model: 'text-embedding-ada-002',
      baseUrl: 'https://api.openai.com/v1',
      timeout: 30000,
      ...config
    }
    
    this.dimensions = this.modelDimensions[this.config.model!] || 1536
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text])
    return embeddings[0]
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          input: texts,
          encoding_format: 'float'
        }),
        signal: AbortSignal.timeout(this.config.timeout!)
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from OpenAI API')
      }

      // Sort by index to maintain order
      const sortedData = data.data.sort((a: any, b: any) => a.index - b.index)
      const embeddings = sortedData.map((item: any) => item.embedding)

      // Validate embeddings
      for (const embedding of embeddings) {
        this.validateEmbedding(embedding)
      }

      return embeddings

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate OpenAI embeddings: ${error.message}`)
      }
      throw new Error('Failed to generate OpenAI embeddings: Unknown error')
    }
  }

  // Configuration methods
  updateConfig(newConfig: Partial<OpenAIEmbeddingConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (newConfig.model && this.modelDimensions[newConfig.model]) {
      this.dimensions = this.modelDimensions[newConfig.model]
    }
  }

  getConfig(): OpenAIEmbeddingConfig {
    return { ...this.config }
  }

  getSupportedModels(): Array<{ model: string; dimensions: number }> {
    return Object.entries(this.modelDimensions).map(([model, dimensions]) => ({
      model,
      dimensions
    }))
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateEmbedding('test')
      return true
    } catch {
      return false
    }
  }
}