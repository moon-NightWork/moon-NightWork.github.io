<template>
  <div class="recipe-card" @click="onClick">
    <div class="card-image">
      <img v-if="recipe.image" :src="recipe.image" :alt="recipe.name" />
      <div v-else class="image-placeholder">
        <el-icon :size="40"><Picture /></el-icon>
      </div>
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ recipe.name }}</h3>
      <div class="card-info">
        <span class="taste">
          <el-icon><Location /></el-icon>
          {{ recipe.taste || '暂无' }}
        </span>
        <span class="time">
          <el-icon><Timer /></el-icon>
          {{ recipe.cookingTime ? recipe.cookingTime + '分钟' : '暂无' }}
        </span>
      </div>
      <div class="difficulty" :class="recipe.difficulty">
        {{ getDifficultyText(recipe.difficulty) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Picture, Timer, Location } from '@element-plus/icons-vue'
import type { Recipe } from '@/types'

interface Props {
  recipe: Recipe
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

function onClick() {
  emit('click')
}

function getDifficultyText(difficulty: 'easy' | 'medium' | 'hard') {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || '暂无'
}
</script>

<style scoped lang="scss">
.recipe-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px var(--el-box-shadow-light);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px var(--el-box-shadow);
  }
}

.card-image {
  width: 100%;
  height: 180px;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.card-info {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.difficulty {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-top: auto;
  width: fit-content;

  &.easy {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }

  &.medium {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }

  &.hard {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}
</style>
