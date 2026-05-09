<template>
  <el-dialog
    :title="title"
    v-model="visible"
    width="600px"
    @close="handleClose"
  >
    <div v-if="isLoading && !hasReceivedContent && !error" class="loading-wrapper">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>正在查询中...</p>
    </div>
    <div v-else-if="error" class="error-wrapper">
      <el-icon :size="40" color="#f56c6c"><Warning /></el-icon>
      <p>{{ error }}</p>
    </div>
    <div v-else class="info-content" ref="infoContentRef">
      <div class="markdown-content" v-html="renderedContent"></div>
      <div v-if="isLoading" class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="success" @click="handleExportJSON" v-if="!isLoading && !error && content">
        <el-icon><Download /></el-icon>
        导出JSON
      </el-button>
      <el-button type="primary" @click="handleGoToAI" v-if="!error">
        <el-icon><ChatDotRound /></el-icon>
        继续对话
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Warning, ChatDotRound, Download } from '@element-plus/icons-vue'
import { useAIChat } from '@/composables/useAIChat'
import { useAIStore } from '@/stores/useAIStore'
import type { FamilyMember } from '@/types'

interface Props {
  modelValue: boolean
  name?: string
  type?: 'ingredient' | 'recipe' | 'member'
  member?: FamilyMember
}

const props = withDefaults(defineProps<Props>(), {
  type: 'ingredient'
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()
const { streamQueryInfo, streamQueryMemberInfo, isLoading: isAILoading } = useAIChat()
const aiStore = useAIStore()

const content = ref('')
const error = ref<string | null>(null)
const infoContentRef = ref<HTMLElement | null>(null)
const hasReceivedContent = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const title = computed(() => {
  if (props.type === 'member' && props.member) {
    return `AI饮食建议 - ${props.member.name}`
  }
  const typeText = props.type === 'ingredient' ? '食材' : '菜谱'
  return `AI解析 - ${props.name}`
})

const isLoading = computed(() => isAILoading.value)

/**
 * 将简单的文本格式化为类似Markdown的样式
 */
const renderedContent = computed(() => {
  if (!content.value) return ''
  
  let html = content.value
    // 替换换行符为<br>
    .replace(/\n/g, '<br>')
    // 替换数字开头的列表项
    .replace(/(\d+\.\s)/g, '<strong>$1</strong>')
    // 替换加粗文本
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  return html
})

/**
 * 滚动到底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (infoContentRef.value) {
      infoContentRef.value.scrollTop = infoContentRef.value.scrollHeight
    }
  })
}

/**
 * 监听对话框打开，自动查询
 */
watch(() => props.modelValue, async (val) => {
  if (val) {
    await fetchInfo()
  }
})

async function fetchInfo() {
  if (!aiStore.settings?.apiKey) {
    error.value = '请先配置API Key'
    return
  }

  content.value = ''
  error.value = null
  hasReceivedContent.value = false

  console.log('[AIInfoDialog] 开始查询')

  try {
    if (props.type === 'member' && props.member) {
      await streamQueryMemberInfo(props.member, async (chunk) => {
        console.log('[AIInfoDialog] 收到chunk:', chunk)
        if (!hasReceivedContent.value && chunk.trim()) {
          hasReceivedContent.value = true
        }
        content.value += chunk
        await nextTick() // 强制立即更新DOM
        scrollToBottom()
      })
    } else if (props.name) {
      await streamQueryInfo(props.name, props.type as 'ingredient' | 'recipe', async (chunk) => {
        console.log('[AIInfoDialog] 收到chunk:', chunk)
        if (!hasReceivedContent.value && chunk.trim()) {
          hasReceivedContent.value = true
        }
        content.value += chunk
        await nextTick() // 强制立即更新DOM
        scrollToBottom()
      })
    }
    console.log('[AIInfoDialog] 查询完成，最终内容长度:', content.value.length)
  } catch (err) {
    console.error('[AIInfoDialog] 查询失败:', err)
    error.value = err instanceof Error ? err.message : '查询失败'
  }
}

function handleClose() {
  visible.value = false
  content.value = ''
  error.value = null
  hasReceivedContent.value = false
}

async function handleGoToAI() {
  let prompt = ''
  let sessionTitle = ''
  
  if (props.type === 'member' && props.member) {
    prompt = `请为家庭成员"${props.member.name}"提供详细的个性化饮食建议。`
    sessionTitle = `${props.member.name}饮食建议`
  } else if (props.name) {
    const typeText = props.type === 'ingredient' ? '食材' : '菜谱'
    prompt = `请详细介绍一下${typeText}"${props.name}"的相关知识，包括营养价值、食用方法、搭配建议等。`
    sessionTitle = `${props.name}咨询`
  }
  
  if (prompt) {
    await aiStore.createSession(sessionTitle, { type: props.type, dataId: '' })
    await aiStore.addMessage(prompt, 'user')
    
    // 跳转到AI页面
    handleClose()
    router.push('/ai')
  }
}

/**
 * 导出为JSON文件
 */
function handleExportJSON() {
  if (!content.value) {
    ElMessage.warning('暂无内容可导出')
    return
  }

  const exportData: Record<string, any> = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    type: props.type,
    content: content.value,
    metadata: {}
  }

  if (props.type === 'member' && props.member) {
    exportData.metadata = {
      member: {
        id: props.member.id,
        name: props.member.name,
        age: props.member.age,
        gender: props.member.gender,
        height: props.member.height,
        weight: props.member.weight,
        tags: props.member.tags,
        bmi: props.member.weight / ((props.member.height / 100) ** 2)
      }
    }
  } else if (props.name) {
    exportData.metadata = {
      name: props.name
    }
  }

  const fileName = `${props.type === 'member' ? (props.member?.name || 'unknown') : (props.name || 'export')}_diet_${Date.now()}.json`
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
.loading-wrapper,
.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.info-content {
  max-height: 400px;
  overflow-y: auto;
}

.markdown-content {
  color: var(--el-text-color-primary);
  line-height: 1.8;
  font-size: 14px;

  strong {
    color: var(--el-color-primary);
  }

  br {
    margin-bottom: 8px;
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator .dot {
  width: 6px;
  height: 6px;
  background-color: var(--el-color-primary);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
