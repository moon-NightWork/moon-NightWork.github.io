import { db } from './db'
import type { AIChatSession, AISettings } from '@/types'
import { generateId } from '@/utils/helpers'
import { obfuscate, deobfuscate } from '@/utils/security'

const DEFAULT_SETTINGS: AISettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  systemPrompt: '你是一个专业的饮食健康助手，擅长：\n1. 食材营养和功效分析\n2. 菜谱推荐和改良\n3. 季节饮食建议\n4. 健康饮食指导\n5. 烹饪技巧分享\n\n请用友好、专业的语言回答用户问题。',
  temperature: 0.7
}

export const aiApi = {
  async getSettings(): Promise<AISettings> {
    try {
      const settings = await db.aiSettings.getItem<AISettings>('settings')
      if (settings && settings.apiKey) {
        settings.apiKey = deobfuscate(settings.apiKey)
      }
      return settings || DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  async saveSettings(settings: AISettings): Promise<void> {
    const plainSettings = JSON.parse(JSON.stringify(settings))
    if (plainSettings.apiKey) {
      plainSettings.apiKey = obfuscate(plainSettings.apiKey)
    }
    await db.aiSettings.setItem('settings', plainSettings)
  },

  async getAllSessions(): Promise<AIChatSession[]> {
    return await db.aiSessions.getAll()
  },

  async getSession(id: string): Promise<AIChatSession | null> {
    return await db.aiSessions.get(id)
  },

  async createSession(title: string, context?: AIChatSession['context']): Promise<AIChatSession> {
    const session: AIChatSession = {
      id: generateId(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      context
    }
    await db.aiSessions.put(session)
    return session
  },

  async updateSession(session: AIChatSession): Promise<void> {
    session.updatedAt = Date.now()
    await db.aiSessions.put(session)
  },

  async deleteSession(id: string): Promise<void> {
    await db.aiSessions.delete(id)
  },

  async clearAllSessions(): Promise<void> {
    await db.aiSessions.clear()
  }
}
