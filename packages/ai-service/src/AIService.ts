import EventEmitter from 'eventemitter3'
import { BaseProvider } from './providers/BaseProvider'
import { OpenAIProvider } from './providers/OpenAIProvider'
import { ClaudeProvider } from './providers/ClaudeProvider'
import { GeminiProvider } from './providers/GeminiProvider'
import { OllamaProvider } from './providers/OllamaProvider'
import type { 
  AIProvider, 
  AIConfig, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  ChatCompletionOptions,
  AIProviderConfig,
  AIProviderStatus,
  AIError
} from './types'

export class AIService extends EventEmitter {
  private providers: Map<AIProvider, BaseProvider> = new Map()
  private activeProvider: AIProvider | null = null

  constructor() {
    super()
  }

  // Provider Management
  registerProvider(config: AIConfig): void {
    const existingProvider = this.providers.get(config.provider)
    if (existingProvider) {
      existingProvider.removeAllListeners()
    }

    let provider: BaseProvider

    switch (config.provider) {
      case 'openai':
        provider = new OpenAIProvider(config)
        break
      case 'claude':
        provider = new ClaudeProvider(config)
        break
      case 'gemini':
        provider = new GeminiProvider(config)
        break
      case 'ollama':
        provider = new OllamaProvider(config)
        break
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }

    // Forward provider events
    provider.on('statusChanged', (status) => {
      this.emit('providerStatusChanged', status)
    })

    provider.on('error', (error) => {
      this.emit('providerError', error)
    })

    provider.on('configUpdated', (config) => {
      this.emit('providerConfigUpdated', config)
    })

    this.providers.set(config.provider, provider)
    
    // Set as active if it's the first provider or if no active provider
    if (!this.activeProvider) {
      this.activeProvider = config.provider
    }

    this.emit('providerRegistered', config.provider)
  }

  removeProvider(provider: AIProvider): void {
    const providerInstance = this.providers.get(provider)
    if (providerInstance) {
      providerInstance.removeAllListeners()
      this.providers.delete(provider)
      
      if (this.activeProvider === provider) {
        // Set new active provider if available
        const remainingProviders = Array.from(this.providers.keys())
        this.activeProvider = remainingProviders.length > 0 ? remainingProviders[0] : null
      }
      
      this.emit('providerRemoved', provider)
    }
  }

  // Active Provider Management
  setActiveProvider(provider: AIProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} is not registered`)
    }
    
    this.activeProvider = provider
    this.emit('activeProviderChanged', provider)
  }

  getActiveProvider(): AIProvider | null {
    return this.activeProvider
  }

  getRegisteredProviders(): AIProvider[] {
    return Array.from(this.providers.keys())
  }

  // Provider Information
  getProviderStatus(provider?: AIProvider): AIProviderStatus | AIProviderStatus[] {
    if (provider) {
      const providerInstance = this.providers.get(provider)
      if (!providerInstance) {
        throw new Error(`Provider ${provider} is not registered`)
      }
      return providerInstance.getStatus()
    }

    // Return all provider statuses
    return Array.from(this.providers.entries()).map(([_, instance]) => 
      instance.getStatus()
    )
  }

  getProviderConfig(provider: AIProvider): AIConfig | null {
    const providerInstance = this.providers.get(provider)
    return providerInstance ? providerInstance.getConfig() : null
  }

  updateProviderConfig(provider: AIProvider, config: Partial<AIConfig>): void {
    const providerInstance = this.providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not registered`)
    }
    
    providerInstance.updateConfig(config)
  }

  // AI Operations
  async chat(messages: AIMessage[], options?: ChatCompletionOptions): Promise<AIResponse> {
    const provider = this.getActiveProviderInstance()
    return await provider.chat(messages, options)
  }

  async *chatStream(messages: AIMessage[], options?: ChatCompletionOptions): AsyncIterableIterator<AIStreamResponse> {
    const provider = this.getActiveProviderInstance()
    yield* provider.chatStream(messages, options)
  }

  async checkConnection(provider?: AIProvider): Promise<boolean> {
    if (provider) {
      const providerInstance = this.providers.get(provider)
      if (!providerInstance) {
        throw new Error(`Provider ${provider} is not registered`)
      }
      return await providerInstance.checkConnection()
    }

    // Check active provider
    const activeProvider = this.getActiveProviderInstance()
    return await activeProvider.checkConnection()
  }

  async checkAllConnections(): Promise<Record<AIProvider, boolean>> {
    const results: Record<string, boolean> = {}
    
    const checks = Array.from(this.providers.entries()).map(async ([provider, instance]) => {
      try {
        const connected = await instance.checkConnection()
        results[provider] = connected
      } catch {
        results[provider] = false
      }
    })

    await Promise.all(checks)
    return results as Record<AIProvider, boolean>
  }

  async getModels(provider?: AIProvider): Promise<string[]> {
    if (provider) {
      const providerInstance = this.providers.get(provider)
      if (!providerInstance) {
        throw new Error(`Provider ${provider} is not registered`)
      }
      return await providerInstance.getModels()
    }

    // Get models from active provider
    const activeProvider = this.getActiveProviderInstance()
    return await activeProvider.getModels()
  }

  async getAllModels(): Promise<Record<AIProvider, string[]>> {
    const results: Record<string, string[]> = {}
    
    const fetches = Array.from(this.providers.entries()).map(async ([provider, instance]) => {
      try {
        const models = await instance.getModels()
        results[provider] = models
      } catch {
        results[provider] = []
      }
    })

    await Promise.all(fetches)
    return results as Record<AIProvider, string[]>
  }

  // Utility Methods
  private getActiveProviderInstance(): BaseProvider {
    if (!this.activeProvider) {
      throw new Error('No active provider set')
    }

    const provider = this.providers.get(this.activeProvider)
    if (!provider) {
      throw new Error(`Active provider ${this.activeProvider} is not registered`)
    }

    return provider
  }

  // Configuration Presets
  static getProviderConfigs(): AIProviderConfig[] {
    return [
      {
        name: 'openai',
        provider: 'openai',
        displayName: 'OpenAI',
        description: 'GPT models from OpenAI including GPT-4 and GPT-3.5',
        models: [
          { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
          { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', maxTokens: 128000 },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 }
        ],
        requiresApiKey: true,
        requiresBaseUrl: false,
        supportsBearerToken: false,
        supportsStreaming: true,
        defaultModel: 'gpt-3.5-turbo'
      },
      {
        name: 'claude',
        provider: 'claude',
        displayName: 'Claude (Anthropic)',
        description: 'Claude models from Anthropic including Claude-3',
        models: [
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096 },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', maxTokens: 4096 },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 4096 }
        ],
        requiresApiKey: true,
        requiresBaseUrl: false,
        supportsBearerToken: false,
        supportsStreaming: true,
        defaultModel: 'claude-3-sonnet-20240229'
      },
      {
        name: 'gemini',
        provider: 'gemini',
        displayName: 'Google Gemini',
        description: 'Gemini models from Google including Gemini Pro',
        models: [
          { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 30720 },
          { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', maxTokens: 30720 },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 1048576 }
        ],
        requiresApiKey: true,
        requiresBaseUrl: false,
        supportsBearerToken: false,
        supportsStreaming: true,
        defaultModel: 'gemini-pro'
      },
      {
        name: 'ollama',
        provider: 'ollama',
        displayName: 'Ollama (Local)',
        description: 'Local AI models running with Ollama',
        models: [
          { id: 'llama2', name: 'Llama 2', maxTokens: 4096 },
          { id: 'codellama', name: 'Code Llama', maxTokens: 4096 },
          { id: 'mistral', name: 'Mistral', maxTokens: 4096 }
        ],
        requiresApiKey: false,
        requiresBaseUrl: true,
        supportsBearerToken: true,
        supportsStreaming: true,
        defaultModel: 'llama2'
      }
    ]
  }

  // Cleanup
  destroy(): void {
    for (const provider of this.providers.values()) {
      provider.removeAllListeners()
    }
    this.providers.clear()
    this.activeProvider = null
    this.removeAllListeners()
  }
}