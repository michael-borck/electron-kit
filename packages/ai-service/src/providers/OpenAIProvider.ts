import OpenAI from 'openai'
import { BaseProvider } from './BaseProvider'
import type { 
  AIConfig, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  ChatCompletionOptions,
  TokenUsage 
} from '../types'

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI | null = null

  constructor(config: AIConfig) {
    super(config)
    this.initializeClient()
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      dangerouslyAllowBrowser: true
    })
  }

  async chat(messages: AIMessage[], options: ChatCompletionOptions = {}): Promise<AIResponse> {
    try {
      this.validateConfig()
      if (!this.client) this.initializeClient()

      const formattedMessages = this.formatMessages(messages)
      const openaiMessages = this.convertToOpenAIFormat(formattedMessages, options.systemPrompt)

      const response = await this.client!.chat.completions.create({
        model: options.model || this.config.model || 'gpt-3.5-turbo',
        messages: openaiMessages,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens || this.config.maxTokens,
        stop: options.stopSequences,
        stream: false
      })

      const choice = response.choices[0]
      if (!choice?.message?.content) {
        throw new Error('No response content received from OpenAI')
      }

      const usage: TokenUsage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }

      this.updateStatus({ connected: true, model: response.model })

      return {
        content: choice.message.content,
        model: response.model,
        provider: 'openai',
        usage,
        finishReason: choice.finish_reason || undefined,
        id: response.id,
        timestamp: Date.now()
      }

    } catch (error) {
      throw this.handleError(error, 'chat')
    }
  }

  async *chatStream(messages: AIMessage[], options: ChatCompletionOptions = {}): AsyncIterableIterator<AIStreamResponse> {
    try {
      this.validateConfig()
      if (!this.client) this.initializeClient()

      const formattedMessages = this.formatMessages(messages)
      const openaiMessages = this.convertToOpenAIFormat(formattedMessages, options.systemPrompt)

      const stream = await this.client!.chat.completions.create({
        model: options.model || this.config.model || 'gpt-3.5-turbo',
        messages: openaiMessages,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens || this.config.maxTokens,
        stop: options.stopSequences,
        stream: true
      })

      let content = ''

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        content += delta

        const done = chunk.choices[0]?.finish_reason !== null

        yield {
          content,
          delta,
          done,
          model: chunk.model,
          provider: 'openai',
          id: chunk.id
        }

        if (done) break
      }

      this.updateStatus({ connected: true })

    } catch (error) {
      throw this.handleError(error, 'chatStream')
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.client) this.initializeClient()

      // Test with a minimal request
      await this.client!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })

      this.updateStatus({ connected: true })
      return true

    } catch (error) {
      this.handleError(error, 'checkConnection')
      return false
    }
  }

  async getModels(): Promise<string[]> {
    try {
      if (!this.client) this.initializeClient()

      const response = await this.client!.models.list()
      const models = response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort()

      return models

    } catch (error) {
      this.handleError(error, 'getModels')
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'] // Fallback models
    }
  }

  updateConfig(config: Partial<AIConfig>): void {
    super.updateConfig(config)
    
    // Reinitialize client if API key or base URL changed
    if (config.apiKey || config.baseUrl) {
      this.client = null
      if (this.config.apiKey) {
        this.initializeClient()
      }
    }
  }

  private convertToOpenAIFormat(messages: AIMessage[], systemPrompt?: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const result: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

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
    
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }
}