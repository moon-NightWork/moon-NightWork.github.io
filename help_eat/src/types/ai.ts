export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export interface AIChatSession {
  id: string
  title: string
  messages: AIChatMessage[]
  createdAt: number
  updatedAt: number
  context?: {
    type?: 'ingredient' | 'recipe' | 'general'
    dataId?: string
  }
}

export interface AISettings {
  provider: 'openai' | 'wenxin' | 'tongyi' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  systemPrompt: string
  temperature: number
}

export interface AIQuickAction {
  id: string
  icon: string
  title: string
  description: string
  prompt: string
}

export interface AIProviderConfig {
  name: string
  defaultModel: string
  defaultBaseUrl: string
}
