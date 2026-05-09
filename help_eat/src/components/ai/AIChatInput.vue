<template>
  <div class="chat-input-wrapper">
    <div class="chat-input-container">
      <el-input
        v-model="inputValue"
        type="textarea"
        :rows="1"
        :autosize="{ minRows: 1, maxRows: 4 }"
        placeholder="输入你的问题..."
        @keydown="handleKeydown"
        class="chat-input"
        resize="none"
      />
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!inputValue.trim() || loading"
        @click="handleSend"
        class="send-button"
      >
        <el-icon><Promotion /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Promotion } from '@element-plus/icons-vue'

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  send: [value: string]
}>()

const inputValue = ref('')

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (!inputValue.value.trim() || props.loading) return

  emit('send', inputValue.value.trim())
  inputValue.value = ''
}
</script>

<style scoped lang="scss">
.chat-input-wrapper {
  padding: 16px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.chat-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 900px;
  margin: 0 auto;
}

.chat-input {
  flex: 1;

  :deep(.el-textarea__inner) {
    border-radius: 20px;
    padding: 12px 16px;
  }
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
</style>
