import Anthropic from '@anthropic-ai/sdk'
import { BaseProvider } from './BaseProvider'
import type { 
  AIConfig, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  ChatCompletionOptions,
  TokenUsage 
} from '../types'

export class ClaudeProvider extends BaseProvider {
  private client: Anthropic | null = null

  constructor(config: AIConfig) {
    super(config)
    this.initializeClient()
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 30000
    })
  }

  async chat(messages: AIMessage[], options: ChatCompletionOptions = {}): Promise<AIResponse> {
    try {
      this.validateConfig()
      if (!this.client) this.initializeClient()

      const formattedMessages = this.formatMessages(messages)
      const { system, messages: claudeMessages } = this.convertToClaudeFormat(formattedMessages, options.systemPrompt)

      const response = await this.client!.messages.create({
        model: options.model || this.config.model || 'claude-3-sonnet-20240229',
        messages: claudeMessages,
        system: system || undefined,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens || this.config.maxTokens || 4096,
        stop_sequences: options.stopSequences
      })

      if (!response.content[0] || response.content[0].type !== 'text') {
        throw new Error('No text content received from Claude')
      }

      const usage: TokenUsage = {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }

      this.updateStatus({ connected: true, model: response.model })

      return {
        content: response.content[0].text,
        model: response.model,
        provider: 'claude',
        usage,
        finishReason: response.stop_reason || undefined,
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
      const { system, messages: claudeMessages } = this.convertToClaudeFormat(formattedMessages, options.systemPrompt)

      const stream = await this.client!.messages.create({
        model: options.model || this.config.model || 'claude-3-sonnet-20240229',
        messages: claudeMessages,
        system: system || undefined,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens || this.config.maxTokens || 4096,
        stop_sequences: options.stopSequences,
        stream: true
      })

      let content = ''
      let model = ''
      let id = ''

      for await (const chunk of stream) {
        if (chunk.type === 'message_start') {
          model = chunk.message.model
          id = chunk.message.id
        } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const delta = chunk.delta.text
          content += delta

          yield {
            content,
            delta,
            done: false,
            model,
            provider: 'claude',
            id
          }
        } else if (chunk.type === 'message_stop') {
          yield {
            content,
            delta: '',
            done: true,
            model,
            provider: 'claude',
            id
          }
          break
        }
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
      await this.client!.messages.create({
        model: 'claude-3-haiku-20240307',
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
      // Claude doesn't have a models endpoint, so return known models
      const models = [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2.0',
        'claude-instant-1.2'
      ]

      return models

    } catch (error) {
      this.handleError(error, 'getModels')
      return ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'] // Fallback models
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

  private convertToClaudeFormat(messages: AIMessage[], systemPrompt?: string): {
    system: string | null
    messages: Anthropic.Messages.MessageParam[]
  } {
    let system: string | null = null
    const claudeMessages: Anthropic.Messages.MessageParam[] = []

    // Extract system message or use provided system prompt
    if (systemPrompt) {
      system = systemPrompt
    } else {
      const systemMessage = messages.find(m => m.role === 'system')
      if (systemMessage) {
        system = systemMessage.content
      }
    }

    // Convert non-system messages
    for (const message of messages) {
      if (message.role !== 'system') {
        claudeMessages.push({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content
        })
      }
    }

    // Ensure conversation starts with user message
    if (claudeMessages.length > 0 && claudeMessages[0].role === 'assistant') {
      claudeMessages.unshift({
        role: 'user',
        content: 'Please continue our conversation.'
      })
    }

    return { system, messages: claudeMessages }
  }

  protected validateConfig(): void {
    super.validateConfig()
    
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required')
    }
  }
}