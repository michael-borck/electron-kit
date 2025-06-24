export type AIProvider = 'openai' | 'claude' | 'gemini' | 'ollama'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  baseUrl?: string
  bearerToken?: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
  id?: string
}

export interface AIResponse {
  content: string
  model: string
  provider: AIProvider
  usage?: TokenUsage
  finishReason?: string
  id?: string
  timestamp: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface AIStreamResponse {
  content: string
  delta: string
  done: boolean
  model: string
  provider: AIProvider
  id?: string
}

export interface AIProviderConfig {
  name: string
  provider: AIProvider
  displayName: string
  description: string
  models: AIModel[]
  requiresApiKey: boolean
  requiresBaseUrl: boolean
  supportsBearerToken: boolean
  supportsStreaming: boolean
  defaultModel?: string
}

export interface AIModel {
  id: string
  name: string
  description?: string
  maxTokens?: number
  costPer1kTokens?: {
    input: number
    output: number
  }
}

export interface ChatCompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  systemPrompt?: string
  stopSequences?: string[]
}

export interface AIError {
  code: string
  message: string
  provider: AIProvider
  details?: any
}

export interface RateLimitInfo {
  requestsPerMinute?: number
  tokensPerMinute?: number
  requestsRemaining?: number
  tokensRemaining?: number
  resetTime?: Date
}

export interface AIProviderStatus {
  provider: AIProvider
  connected: boolean
  model?: string
  rateLimit?: RateLimitInfo
  lastError?: AIError
  lastChecked: Date
}