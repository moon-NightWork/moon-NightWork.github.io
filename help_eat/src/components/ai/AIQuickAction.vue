<template>
  <div class="quick-actions">
    <div class="action-title">开始对话</div>
    <div class="action-grid">
      <div
        v-for="action in quickActions"
        :key="action.id"
        class="action-card"
        @click="handleAction(action)"
      >
        <div class="action-icon">{{ action.icon }}</div>
        <div class="action-info">
          <div class="action-title-text">{{ action.title }}</div>
          <div class="action-desc">{{ action.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIQuickAction } from '@/types'

const emit = defineEmits<{
  action: [prompt: string]
}>()

const quickActions: AIQuickAction[] = [
  {
    id: 'ingredient',
    icon: '🥬',
    title: '食材功效',
    description: '咨询某种食材的营养价值',
    prompt: '请介绍一下常见食材的营养价值和功效'
  },
  {
    id: 'recipe',
    icon: '🍳',
    title: '菜谱推荐',
    description: '根据情况推荐合适的菜谱',
    prompt: '请推荐一些简单又健康的家常菜'
  },
  {
    id: 'seasonal',
    icon: '🌿',
    title: '季节饮食',
    description: '当前季节适合吃什么',
    prompt: '现在这个季节适合吃什么？有什么养生建议？'
  },
  {
    id: 'health',
    icon: '💪',
    title: '健康建议',
    description: '个性化的饮食健康建议',
    prompt: '给我一些日常健康饮食的建议'
  }
]

function handleAction(action: AIQuickAction) {
  emit('action', action.prompt)
}
</script>

<style scoped lang="scss">
.quick-actions {
  padding: 24px;
}

.action-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 12px;
  align-items: flex-start;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
}

.action-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
  min-width: 0;
}

.action-title-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}
</style>
