<template>
  <div
    class="chat-bubble"
    :class="{
      'user-bubble': message.role === 'user',
      'assistant-bubble': message.role === 'assistant'
    }"
  >
    <div class="bubble-avatar">
      <span v-if="message.role === 'user'">👤</span>
      <span v-else>🤖</span>
    </div>
    <div class="bubble-content">
      <div class="bubble-text" v-html="formattedContent"></div>
      <div v-if="message.isStreaming" class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="bubble-time">{{ formatTime(message.timestamp) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AIChatMessage } from '@/types'

const props = defineProps<{
  message: AIChatMessage
}>()

const formattedContent = computed(() => {
  // 简单的换行处理
  return props.message.content.replace(/\n/g, '<br>')
})

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.chat-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  max-width: 85%;

  &.user-bubble {
    flex-direction: row-reverse;
    margin-left: auto;
  }

  &.assistant-bubble {
    margin-right: auto;
  }
}

.bubble-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.bubble-content {
  flex: 1;
}

.bubble-text {
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.6;
  word-break: break-word;

  .user-bubble & {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .assistant-bubble & {
    background: var(--el-bg-color-page);
    color: var(--el-text-color-primary);
    border-bottom-left-radius: 4px;
  }
}

.bubble-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
  padding: 0 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;

  span {
    width: 8px;
    height: 8px;
    background: var(--el-text-color-placeholder);
    border-radius: 50%;
    animation: typing 1.4s infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}
</style>
