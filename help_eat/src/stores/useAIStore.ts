import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { aiApi } from '@/api'
import type { AIChatSession, AISettings, AIChatMessage } from '@/types'
import { generateId } from '@/utils/helpers'

export const useAIStore = defineStore('ai', () => {
  const sessions = ref<AIChatSession[]>([])
  const currentSession = ref<AIChatSession | null>(null)
  const settings = ref<AISettings | null>(null)
  const loading = ref(false)
  const streamingMessageId = ref<string | null>(null)

  const sortedSessions = computed(() => {
    return [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  async function fetchAll() {
    loading.value = true
    try {
      sessions.value = await aiApi.getAllSessions()
      settings.value = await aiApi.getSettings()
    } finally {
      loading.value = false
    }
  }

  async function loadSettings() {
    settings.value = await aiApi.getSettings()
  }

  async function saveSettings(newSettings: AISettings) {
    settings.value = newSettings
    await aiApi.saveSettings(newSettings)
  }

  async function createSession(title: string, context?: AIChatSession['context']) {
    const session = await aiApi.createSession(title, context)
    sessions.value.push(session)
    currentSession.value = session
    return session
  }

  async function selectSession(id: string) {
    const session = await aiApi.getSession(id)
    if (session) {
      currentSession.value = session
    }
  }

  async function addMessage(content: string, role: 'user' | 'assistant' = 'user') {
    if (!currentSession.value) {
      await createSession('新对话')
    }

    const message: AIChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now()
    }

    currentSession.value!.messages.push(message)
    await aiApi.updateSession(currentSession.value!)
    return message
  }

  async function updateStreamingMessage(id: string, content: string) {
    if (!currentSession.value) return

    const msgIndex = currentSession.value.messages.findIndex(m => m.id === id)
    if (msgIndex !== -1) {
      // 使用响应式更新：替换整个对象确保Vue能检测到变化
      currentSession.value.messages[msgIndex] = {
        ...currentSession.value.messages[msgIndex],
        content
      }
    }
  }

  async function finishStreamingMessage(id: string) {
    if (!currentSession.value) return

    const msgIndex = currentSession.value.messages.findIndex(m => m.id === id)
    if (msgIndex !== -1) {
      currentSession.value.messages[msgIndex].isStreaming = false
      await aiApi.updateSession(currentSession.value!)
    }
    streamingMessageId.value = null
  }

  async function deleteSession(id: string) {
    await aiApi.deleteSession(id)
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (currentSession.value?.id === id) {
      currentSession.value = null
    }
  }

  async function clearAllSessions() {
    await aiApi.clearAllSessions()
    sessions.value = []
    currentSession.value = null
  }

  return {
    sessions,
    currentSession,
    settings,
    loading,
    streamingMessageId,
    sortedSessions,
    fetchAll,
    loadSettings,
    saveSettings,
    createSession,
    selectSession,
    addMessage,
    updateStreamingMessage,
    finishStreamingMessage,
    deleteSession,
    clearAllSessions
  }
})
