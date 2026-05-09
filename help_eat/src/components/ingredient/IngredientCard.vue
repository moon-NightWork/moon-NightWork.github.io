<template>
  <div class="ingredient-card" @click="onClick">
    <div class="card-image">
      <img v-if="ingredient.image" :src="ingredient.image" :alt="ingredient.name" />
      <div v-else class="image-placeholder">
        <el-icon :size="40"><Picture /></el-icon>
      </div>
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ ingredient.name }}</h3>
      <p class="card-effect">{{ ingredient.effect || '暂无功效' }}</p>
      <div class="card-recipes" v-if="recipeCount > 0">
        <el-icon><Bowl /></el-icon>
        <span>{{ recipeCount }}个相关菜谱</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Picture, Bowl } from '@element-plus/icons-vue'
import type { Ingredient } from '@/types'

interface Props {
  ingredient: Ingredient
  recipeCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  recipeCount: 0
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

function onClick() {
  emit('click')
}
</script>

<style scoped lang="scss">
.ingredient-card {
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
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.card-effect {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-recipes {
  margin-top: auto;
  padding-top: 8px;
  font-size: 12px;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
