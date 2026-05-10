<template>
  <div class="ai-page">
    <div class="ai-layout">
      <!-- 左侧：对话历史列表 -->
      <aside class="history-sidebar">
        <div class="sidebar-header">
          <h3>对话历史</h3>
        </div>
        <ul class="history-list">
          <li
            v-for="session in aiStore.sortedSessions"
            :key="session.id"
            :class="{ active: aiStore.currentSession?.id === session.id }"
            @click="handleSelectSession(session.id)"
          >
            <div class="history-title">
              <el-icon class="history-icon"><ChatDotRound /></el-icon>
              {{ session.title }}
            </div>
            <div class="history-date">{{ formatDate(session.updatedAt) }}</div>
          </li>
          <div v-if="aiStore.sessions.length === 0" class="empty-history">
            暂无对话历史
          </div>
        </ul>
        <div class="sidebar-footer">
          <el-button type="primary" @click="handleNewChat" class="new-chat-btn">
            <el-icon><Plus /></el-icon>
            新建对话
          </el-button>
          <el-button @click="handleImportFile">
            <el-icon><Upload /></el-icon>
            导入文件
          </el-button>
          <el-button @click="showSetting = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
          <el-button type="danger" @click="handleClearSessions" v-if="aiStore.sessions.length > 0">
            <el-icon><Delete /></el-icon>
            清空历史
          </el-button>
        </div>
      </aside>

      <!-- 右侧：聊天内容区 -->
      <div class="chat-container">
        <!-- 欢迎界面 -->
        <div v-if="!aiStore.currentSession || aiStore.currentSession.messages.length === 0" class="welcome-area">
          <div class="welcome-header">
            <div class="welcome-icon">🤖</div>
            <h1>AI饮食助手</h1>
            <p>你的专属饮食健康顾问</p>
          </div>
          <div class="quick-actions">
            <div v-for="action in quickActions" :key="action.id" class="action-card" @click="handleQuickAction(action)">
              <div class="action-icon">{{ action.icon }}</div>
              <div class="action-info">
                <div class="action-title">{{ action.title }}</div>
                <div class="action-desc">{{ action.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 对话内容区 -->
        <div v-else ref="messagesContainer" class="chat-messages">
          <AIChatBubble
            v-for="msg in aiStore.currentSession.messages"
            :key="msg.id"
            :message="msg"
          />
        </div>

        <!-- 底部输入框 -->
        <div class="chat-input-wrapper">
          <AIChatInput
            :loading="isLoading"
            @send="handleSendMessage"
          />
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <AISettingDialog
      v-model="showSetting"
      :settings="aiStore.settings"
      @save="handleSaveSettings"
    />

    <!-- 隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      accept=".json,.txt"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ChatDotRound, Setting, Delete, Upload } from '@element-plus/icons-vue'
import { useAIStore } from '@/stores/useAIStore'
import { useAIChat } from '@/composables/useAIChat'
import AIChatBubble from '@/components/ai/AIChatBubble.vue'
import AIChatInput from '@/components/ai/AIChatInput.vue'
import AISettingDialog from '@/components/ai/AISettingDialog.vue'
import type { AIQuickAction } from '@/types'

const router = useRouter()
const route = useRoute()
const aiStore = useAIStore()
const { isLoading, sendMessage, setStreamCallbacks, loadFileContent } = useAIChat()

const messagesContainer = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const showSetting = ref(false)

const quickActions: AIQuickAction[] = [
  { id: 'ingredient', icon: '🥬', title: '食材功效', description: '咨询某种食材的营养价值', prompt: '请详细介绍一下常见的营养食材及其功效？' },
  { id: 'recipe', icon: '🍳', title: '菜谱推荐', description: '推荐一些健康美味的菜谱', prompt: '请推荐一些简单又健康的家常菜食谱？' },
  { id: 'seasonal', icon: '🌿', title: '季节饮食', description: '当前季节适合吃什么', prompt: '现在这个季节适合吃什么？有什么饮食养生建议？' },
  { id: 'health', icon: '💪', title: '健康建议', description: '个性化的饮食健康建议', prompt: '能给我一些日常健康饮食的建议吗？' }
]

onMounted(async () => {
  await aiStore.fetchAll()

  // 设置流式回调，实现实时滚动
  setStreamCallbacks(
    () => scrollToBottom(), // 流式更新时滚动
    () => scrollToBottom()  // 流式完成时滚动
  )

  const contextType = route.query.type as 'ingredient' | 'recipe'
  const contextData = route.query.data as string
  if (contextType && contextData) {
    try {
      const data = JSON.parse(decodeURIComponent(contextData))
      const title = contextType === 'ingredient' ? `咨询：${data.name}` : `咨询：${data.name}`
      const prompt = contextType === 'ingredient' 
        ? `请详细介绍一下食材“${data.name}”的营养价值、功效和食用方法。${data.effect ? `已有信息：${data.effect}` : ''}`
        : `请详细介绍一下菜谱“${data.name}”的特点和营养分析。`
      
      await aiStore.createSession(title, { type: contextType, dataId: data.id })
      await handleSendMessage(prompt)
      router.replace('/ai')
    } catch {
      // 忽略错误
    }
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function handleNewChat() {
  aiStore.createSession('新对话')
}

function handleSelectSession(id: string) {
  aiStore.selectSession(id)
  scrollToBottom()
}

async function handleSendMessage(content: string) {
  if (!aiStore.settings?.apiKey) {
    showSetting.value = true
    ElMessage.warning('请先配置API Key')
    return
  }

  try {
    // 先添加用户消息，立即滚动到底部
    await aiStore.addMessage(content, 'user')
    scrollToBottom()
    
    // 然后等待AI回复，AI消息会通过updateStreamingMessage更新
    // 流式回调会自动处理滚动
    await sendMessage(content)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '发送消息失败')
  }
}

async function handleQuickAction(action: AIQuickAction) {
  if (!aiStore.currentSession) {
    await aiStore.createSession('新对话')
  }
  await handleSendMessage(action.prompt)
}

async function handleSaveSettings(settings: any) {
  await aiStore.saveSettings(settings)
  ElMessage.success('设置已保存')
}

async function handleClearSessions() {
  try {
    await ElMessageBox.confirm('确定要清空所有对话历史吗？', '提示', { type: 'warning' })
    await aiStore.clearAllSessions()
    ElMessage.success('已清空所有对话')
  } catch {
    // 用户取消
  }
}

function handleImportFile() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    const content = await loadFileContent(file)
    
    if (!aiStore.currentSession) {
      await aiStore.createSession(`文件对话: ${file.name}`)
    }
    
    const prompt = `用户已导入文件"${file.name}"，请基于文件内容进行对话。以下是文件内容：\n\n${content}\n\n请说明你已理解文件内容，并询问用户需要什么帮助。`
    await handleSendMessage(prompt)
    
    ElMessage.success('文件导入成功')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '文件导入失败')
  } finally {
    // 清空文件输入
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return `周${days[date.getDay()]}`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}
</script>

<style scoped lang="scss">
.ai-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.ai-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 左侧历史列表 */
.history-sidebar {
  width: 220px;
  border-right: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: white;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.history-list {
  list-style: none;
  padding: 12px 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.history-list li {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

.history-title {
  font-size: 14px;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-icon {
  font-size: 14px;
  color: inherit;
}

.history-date {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.empty-history {
  text-align: center;
  padding: 40px 16px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}
.sidebar-footer {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;

  .new-chat-btn {
    width: 100%;
  }
  
  .el-button {
    margin: 0 !important;
  }
}

/* 右侧聊天区域 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

/* 欢迎区域 */
.welcome-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  overflow-y: auto;
}

.welcome-header {
  text-align: center;
  margin-bottom: 32px;

  .welcome-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    color: #303133;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 16px;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 600px;
  width: 100%;
}

.action-card {
  background: white;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 12px;
  align-items: flex-start;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.action-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

/* 聊天消息区 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

/* 输入框区域 */
.chat-input-wrapper {
  flex-shrink: 0;
  background: white;
  padding: 8px 12px;
}
</style>
