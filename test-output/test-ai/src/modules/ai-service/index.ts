// Main service
export { AIService } from './AIService'

// Provider classes
export { BaseProvider } from './providers/BaseProvider'
export { OpenAIProvider } from './providers/OpenAIProvider'
export { ClaudeProvider } from './providers/ClaudeProvider'
export { GeminiProvider } from './providers/GeminiProvider'
export { OllamaProvider } from './providers/OllamaProvider'

// Types
export type {
  AIProvider,
  AIConfig,
  AIMessage,
  AIResponse,
  AIStreamResponse,
  TokenUsage,
  AIProviderConfig,
  AIModel,
  ChatCompletionOptions,
  AIError,
  RateLimitInfo,
  AIProviderStatus
} from './types'

// Utility functions
export const createAIService = () => new AIService()

export const getDefaultConfig = (provider: AIProvider): Partial<AIConfig> => {
  const baseConfig = {
    temperature: 0.7,
    timeout: 30000
  }

  switch (provider) {
    case 'openai':
      return {
        ...baseConfig,
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 4096
      }
    case 'claude':
      return {
        ...baseConfig,
        provider: 'claude',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4096
      }
    case 'gemini':
      return {
        ...baseConfig,
        provider: 'gemini',
        model: 'gemini-pro',
        maxTokens: 4096
      }
    case 'ollama':
      return {
        ...baseConfig,
        provider: 'ollama',
        model: 'llama2',
        baseUrl: 'http://localhost:11434',
        timeout: 60000 // Ollama can be slower
      }
    default:
      return baseConfig
  }
}