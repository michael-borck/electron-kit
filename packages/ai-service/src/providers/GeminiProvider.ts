import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { BaseProvider } from './BaseProvider'
import type { 
  AIConfig, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  ChatCompletionOptions,
  TokenUsage 
} from '../types'

export class GeminiProvider extends BaseProvider {
  private client: GoogleGenerativeAI | null = null

  constructor(config: AIConfig) {
    super(config)
    this.initializeClient()
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      throw new Error('Google Gemini API key is required')
    }

    this.client = new GoogleGenerativeAI(this.config.apiKey)
  }

  async chat(messages: AIMessage[], options: ChatCompletionOptions = {}): Promise<AIResponse> {
    try {
      this.validateConfig()
      if (!this.client) this.initializeClient()

      const model = this.client!.getGenerativeModel({
        model: options.model || this.config.model || 'gemini-pro',
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens || this.config.maxTokens,
          stopSequences: options.stopSequences
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          }
        ]
      })

      const formattedMessages = this.formatMessages(messages)
      const { history, currentMessage } = this.convertToGeminiFormat(formattedMessages, options.systemPrompt)

      // Start chat session with history
      const chat = model.startChat({ history })
      
      const result = await chat.sendMessage(currentMessage)
      const response = await result.response

      if (!response.text()) {
        throw new Error('No response content received from Gemini')
      }

      // Gemini doesn't provide detailed usage statistics, so we estimate
      const usage: TokenUsage = {
        promptTokens: this.estimateTokens(currentMessage),
        completionTokens: this.estimateTokens(response.text()),
        totalTokens: this.estimateTokens(currentMessage) + this.estimateTokens(response.text())
      }

      this.updateStatus({ connected: true, model: options.model || this.config.model || 'gemini-pro' })

      return {
        content: response.text(),
        model: options.model || this.config.model || 'gemini-pro',
        provider: 'gemini',
        usage,
        finishReason: response.candidates?.[0]?.finishReason || undefined,
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

      const model = this.client!.getGenerativeModel({
        model: options.model || this.config.model || 'gemini-pro',
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens || this.config.maxTokens,
          stopSequences: options.stopSequences
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          }
        ]
      })

      const formattedMessages = this.formatMessages(messages)
      const { history, currentMessage } = this.convertToGeminiFormat(formattedMessages, options.systemPrompt)

      // Start chat session with history
      const chat = model.startChat({ history })
      
      const result = await chat.sendMessageStream(currentMessage)
      let content = ''
      const modelName = options.model || this.config.model || 'gemini-pro'

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        content += chunkText

        yield {
          content,
          delta: chunkText,
          done: false,
          model: modelName,
          provider: 'gemini'
        }
      }

      // Final chunk to indicate completion
      yield {
        content,
        delta: '',
        done: true,
        model: modelName,
        provider: 'gemini'
      }

      this.updateStatus({ connected: true })

    } catch (error) {
      throw this.handleError(error, 'chatStream')
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.client) this.initializeClient()

      const model = this.client!.getGenerativeModel({ model: 'gemini-pro' })
      
      // Test with a minimal request
      const result = await model.generateContent('test')
      await result.response

      this.updateStatus({ connected: true })
      return true

    } catch (error) {
      this.handleError(error, 'checkConnection')
      return false
    }
  }

  async getModels(): Promise<string[]> {
    try {
      // Google Gemini doesn't have a models endpoint, so return known models
      const models = [
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ]

      return models

    } catch (error) {
      this.handleError(error, 'getModels')
      return ['gemini-pro', 'gemini-1.5-flash'] // Fallback models
    }
  }

  updateConfig(config: Partial<AIConfig>): void {
    super.updateConfig(config)
    
    // Reinitialize client if API key changed
    if (config.apiKey) {
      this.client = null
      if (this.config.apiKey) {
        this.initializeClient()
      }
    }
  }

  private convertToGeminiFormat(messages: AIMessage[], systemPrompt?: string): {
    history: any[]
    currentMessage: string
  } {
    const history: any[] = []
    let systemContext = ''

    // Handle system prompt
    if (systemPrompt) {
      systemContext = systemPrompt + '\n\n'
    } else {
      const systemMessage = messages.find(m => m.role === 'system')
      if (systemMessage) {
        systemContext = systemMessage.content + '\n\n'
      }
    }

    // Convert messages to Gemini format (excluding system messages and the last user message)
    const nonSystemMessages = messages.filter(m => m.role !== 'system')
    
    // Add all but the last message to history
    for (let i = 0; i < nonSystemMessages.length - 1; i++) {
      const message = nonSystemMessages[i]
      
      if (message.role === 'user') {
        history.push({
          role: 'user',
          parts: [{ text: message.content }]
        })
      } else if (message.role === 'assistant') {
        history.push({
          role: 'model',
          parts: [{ text: message.content }]
        })
      }
    }

    // The current message is the last user message (with system context if present)
    const lastMessage = nonSystemMessages[nonSystemMessages.length - 1]
    const currentMessage = systemContext + (lastMessage?.content || '')

    return { history, currentMessage }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4)
  }

  protected validateConfig(): void {
    super.validateConfig()
    
    if (!this.config.apiKey) {
      throw new Error('Google Gemini API key is required')
    }
  }
}