import axios, { AxiosInstance } from 'axios'
import { BaseProvider } from './BaseProvider'
import type { 
  AIConfig, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  ChatCompletionOptions,
  TokenUsage 
} from '../types'

interface OllamaResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: {
    parent_model: string
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

export class OllamaProvider extends BaseProvider {
  private client: AxiosInstance

  constructor(config: AIConfig) {
    super(config)
    this.initializeClient()
  }

  private initializeClient(): void {
    const baseURL = this.config.baseUrl || 'http://localhost:11434'
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add bearer token if provided (for authenticated Ollama instances)
    if (this.config.bearerToken) {
      headers.Authorization = `Bearer ${this.config.bearerToken}`
    }

    this.client = axios.create({
      baseURL,
      timeout: this.config.timeout || 60000, // Ollama can be slower
      headers
    })
  }

  async chat(messages: AIMessage[], options: ChatCompletionOptions = {}): Promise<AIResponse> {
    try {
      this.validateConfig()

      const formattedMessages = this.formatMessages(messages)
      const ollamaMessages = this.convertToOllamaFormat(formattedMessages, options.systemPrompt)

      const requestBody = {
        model: options.model || this.config.model || 'llama2',
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
          num_predict: options.maxTokens || this.config.maxTokens,
          stop: options.stopSequences
        }
      }

      const response = await this.client.post('/api/chat', requestBody)
      const data: OllamaResponse = response.data

      if (!data.message?.content) {
        throw new Error('No response content received from Ollama')
      }

      // Extract usage information from Ollama response
      const usage: TokenUsage = {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }

      this.updateStatus({ connected: true, model: data.model })

      return {
        content: data.message.content,
        model: data.model,
        provider: 'ollama',
        usage,
        finishReason: data.done ? 'stop' : undefined,
        timestamp: Date.now()
      }

    } catch (error) {
      throw this.handleError(error, 'chat')
    }
  }

  async *chatStream(messages: AIMessage[], options: ChatCompletionOptions = {}): AsyncIterableIterator<AIStreamResponse> {
    try {
      this.validateConfig()

      const formattedMessages = this.formatMessages(messages)
      const ollamaMessages = this.convertToOllamaFormat(formattedMessages, options.systemPrompt)

      const requestBody = {
        model: options.model || this.config.model || 'llama2',
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
          num_predict: options.maxTokens || this.config.maxTokens,
          stop: options.stopSequences
        }
      }

      const response = await this.client.post('/api/chat', requestBody, {
        responseType: 'stream'
      })

      let content = ''
      let model = requestBody.model

      // Parse the streaming response
      const stream = response.data
      let buffer = ''

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaResponse = JSON.parse(line)
              model = data.model

              if (data.message?.content) {
                const delta = data.message.content
                content += delta

                this.emit('streamChunk', {
                  content,
                  delta,
                  done: data.done,
                  model,
                  provider: 'ollama'
                })
              }

              if (data.done) {
                return
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              continue
            }
          }
        }
      })

      // Convert to async iterator
      let resolve: (value: IteratorResult<AIStreamResponse>) => void
      let reject: (error: any) => void
      const chunks: AIStreamResponse[] = []
      let done = false

      this.on('streamChunk', (chunk: AIStreamResponse) => {
        chunks.push(chunk)
        if (resolve) {
          resolve({ value: chunks.shift()!, done: false })
          resolve = null as any
        }
      })

      stream.on('end', () => {
        done = true
        if (resolve) {
          resolve({ value: undefined as any, done: true })
        }
      })

      stream.on('error', (error: any) => {
        if (reject) {
          reject(error)
        }
      })

      while (!done || chunks.length > 0) {
        if (chunks.length > 0) {
          yield chunks.shift()!
        } else {
          await new Promise<IteratorResult<AIStreamResponse>>((res, rej) => {
            resolve = res
            reject = rej
          })
        }
      }

      this.updateStatus({ connected: true })

    } catch (error) {
      throw this.handleError(error, 'chatStream')
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      // Check if Ollama is running
      const response = await this.client.get('/api/tags')
      
      this.updateStatus({ connected: true })
      return true

    } catch (error) {
      this.handleError(error, 'checkConnection')
      return false
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/tags')
      const data = response.data

      if (data.models && Array.isArray(data.models)) {
        return data.models.map((model: OllamaModel) => model.name)
      }

      return []

    } catch (error) {
      this.handleError(error, 'getModels')
      return ['llama2', 'codellama', 'mistral'] // Fallback models
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      await this.client.post('/api/pull', { name: modelName })
      return true
    } catch (error) {
      this.handleError(error, 'pullModel')
      return false
    }
  }

  async deleteModel(modelName: string): Promise<boolean> {
    try {
      await this.client.delete('/api/delete', { data: { name: modelName } })
      return true
    } catch (error) {
      this.handleError(error, 'deleteModel')
      return false
    }
  }

  updateConfig(config: Partial<AIConfig>): void {
    super.updateConfig(config)
    
    // Reinitialize client if base URL or bearer token changed
    if (config.baseUrl !== undefined || config.bearerToken !== undefined) {
      this.initializeClient()
    }
  }

  private convertToOllamaFormat(messages: AIMessage[], systemPrompt?: string): any[] {
    const result: any[] = []

    // Add system prompt if provided
    if (systemPrompt) {
      result.push({ role: 'system', content: systemPrompt })
    }

    // Convert messages
    for (const message of messages) {
      if (message.role === 'system' && !systemPrompt) {
        result.push({ role: 'system', content: message.content })
      } else if (message.role === 'user') {
        result.push({ role: 'user', content: message.content })
      } else if (message.role === 'assistant') {
        result.push({ role: 'assistant', content: message.content })
      }
    }

    return result
  }

  protected validateConfig(): void {
    super.validateConfig()
    
    // Ollama doesn't require an API key, but needs a base URL
    const baseURL = this.config.baseUrl || 'http://localhost:11434'
    
    if (!baseURL.startsWith('http')) {
      throw new Error('Ollama base URL must start with http:// or https://')
    }
  }
}