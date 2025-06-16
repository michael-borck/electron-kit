import EventEmitter from 'eventemitter3'
import type { 
  AIConfig, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  ChatCompletionOptions,
  AIError,
  AIProviderStatus,
  RateLimitInfo
} from '../types'

export abstract class BaseProvider extends EventEmitter {
  protected config: AIConfig
  protected status: AIProviderStatus
  
  constructor(config: AIConfig) {
    super()
    this.config = config
    this.status = {
      provider: config.provider,
      connected: false,
      lastChecked: new Date()
    }
  }

  abstract chat(messages: AIMessage[], options?: ChatCompletionOptions): Promise<AIResponse>
  abstract chatStream(messages: AIMessage[], options?: ChatCompletionOptions): AsyncIterableIterator<AIStreamResponse>
  abstract checkConnection(): Promise<boolean>
  abstract getModels(): Promise<string[]>

  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config }
    this.emit('configUpdated', this.config)
  }

  getConfig(): AIConfig {
    return { ...this.config }
  }

  getStatus(): AIProviderStatus {
    return { ...this.status }
  }

  protected updateStatus(updates: Partial<AIProviderStatus>): void {
    this.status = { 
      ...this.status, 
      ...updates, 
      lastChecked: new Date() 
    }
    this.emit('statusChanged', this.status)
  }

  protected handleError(error: any, context: string): AIError {
    const aiError: AIError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      provider: this.config.provider,
      details: { context, originalError: error }
    }

    this.updateStatus({ 
      connected: false, 
      lastError: aiError 
    })

    this.emit('error', aiError)
    return aiError
  }

  protected extractRateLimitInfo(headers: Headers): RateLimitInfo | undefined {
    const rateLimitHeaders = {
      requestsPerMinute: headers.get('x-ratelimit-limit-requests'),
      requestsRemaining: headers.get('x-ratelimit-remaining-requests'),
      tokensPerMinute: headers.get('x-ratelimit-limit-tokens'),
      tokensRemaining: headers.get('x-ratelimit-remaining-tokens'),
      resetTime: headers.get('x-ratelimit-reset-requests')
    }

    // Check if any rate limit headers are present
    const hasRateLimitInfo = Object.values(rateLimitHeaders).some(value => value !== null)
    
    if (!hasRateLimitInfo) return undefined

    return {
      requestsPerMinute: rateLimitHeaders.requestsPerMinute ? 
        parseInt(rateLimitHeaders.requestsPerMinute) : undefined,
      requestsRemaining: rateLimitHeaders.requestsRemaining ? 
        parseInt(rateLimitHeaders.requestsRemaining) : undefined,
      tokensPerMinute: rateLimitHeaders.tokensPerMinute ? 
        parseInt(rateLimitHeaders.tokensPerMinute) : undefined,
      tokensRemaining: rateLimitHeaders.tokensRemaining ? 
        parseInt(rateLimitHeaders.tokensRemaining) : undefined,
      resetTime: rateLimitHeaders.resetTime ? 
        new Date(parseInt(rateLimitHeaders.resetTime) * 1000) : undefined
    }
  }

  protected validateConfig(): void {
    if (!this.config.provider) {
      throw new Error('Provider is required')
    }
  }

  protected createRequestTimeout(timeoutMs: number = 30000): AbortController {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeoutMs)
    return controller
  }

  protected formatMessages(messages: AIMessage[]): AIMessage[] {
    return messages.map(msg => ({
      ...msg,
      content: msg.content.trim(),
      timestamp: msg.timestamp || Date.now(),
      id: msg.id || Math.random().toString(36).substr(2, 9)
    }))
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}