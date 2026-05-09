<template>
  <div class="search-result-page">
    <div class="search-header">
      <el-button :icon="ArrowLeft" @click="goBack" circle />
      <div class="search-title">搜索结果</div>
    </div>

    <div class="search-keyword" v-if="keyword">
      <span>关键词：</span>
      <el-tag>{{ keyword }}</el-tag>
    </div>

    <div class="result-grid">
      <div v-if="filteredItems.length === 0" class="empty-tip">
        没有找到相关结果
      </div>
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="result-card"
        @click="handleCardClick(item)"
      >
        <!-- 食材卡片 -->
        <template v-if="type === 'ingredient'">
          <div class="card-image">
            <div class="category-badge">{{ getIngredientCategoryName(item.categoryId) }}</div>
            <el-icon v-if="!item.image"><Picture /></el-icon>
            <img v-else :src="item.image" alt="" />
          </div>
          <div class="card-content">
            <div class="card-title">{{ item.name }}</div>
            <div class="card-desc">{{ item.effect }}</div>
          </div>
        </template>

        <!-- 菜谱卡片 -->
        <template v-else-if="type === 'recipe'">
          <div class="card-image">
            <div class="category-badge">{{ getRecipeCategoryName(item.categoryId) }}</div>
            <el-icon v-if="!item.image"><Picture /></el-icon>
            <img v-else :src="item.image" alt="" />
          </div>
          <div class="card-content">
            <div class="card-title">{{ item.name }}</div>
            <div class="card-desc">{{ item.taste }} | {{ item.cookingTime }}分钟</div>
          </div>
        </template>
      </div>
    </div>

    <!-- 食材预览弹窗 -->
    <IngredientPreview
      v-if="type === 'ingredient'"
      v-model="showPreview"
      :ingredient="currentIngredient"
      :categories="ingredientStore.categories"
      @edit="handleEditIngredient"
      @delete="handleDeleteIngredient"
    />

    <!-- 菜谱预览弹窗 -->
    <RecipePreview
      v-if="type === 'recipe'"
      v-model="showPreview"
      :recipe="currentRecipe"
      :categories="recipeStore.categories"
      @edit="handleEditRecipe"
      @delete="handleDeleteRecipe"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Picture } from '@element-plus/icons-vue'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useRecipeStore } from '@/stores/useRecipeStore'
import IngredientPreview from '@/components/ingredient/IngredientPreview.vue'
import RecipePreview from '@/components/recipe/RecipePreview.vue'
import type { Ingredient, Recipe } from '@/types'

const router = useRouter()
const route = useRoute()
const ingredientStore = useIngredientStore()
const recipeStore = useRecipeStore()

const keyword = ref('')
const type = ref<'ingredient' | 'recipe'>('ingredient')
const showPreview = ref(false)
const currentIngredient = ref<Ingredient | null>(null)
const currentRecipe = ref<Recipe | null>(null)

onMounted(async () => {
  keyword.value = (route.query.keyword as string) || ''
  type.value = (route.query.type as any) || 'ingredient'

  if (type.value === 'ingredient') {
    await ingredientStore.fetchAll()
  } else if (type.value === 'recipe') {
    await recipeStore.fetchAll()
    await ingredientStore.fetchAll()
  }
})

const filteredItems = computed(() => {
  if (!keyword.value) return []

  if (type.value === 'ingredient') {
    return ingredientStore.ingredients.filter(item => {
      return (
        item.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
        item.effect.toLowerCase().includes(keyword.value.toLowerCase()) ||
        item.processingMethod.toLowerCase().includes(keyword.value.toLowerCase())
      )
    })
  }

  if (type.value === 'recipe') {
    return recipeStore.recipes.filter(item => {
      return (
        item.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
        item.taste.toLowerCase().includes(keyword.value.toLowerCase()) ||
        item.steps.toLowerCase().includes(keyword.value.toLowerCase())
      )
    })
  }

  return []
})

function getIngredientCategoryName(categoryId: string) {
  const category = ingredientStore.categories.find(cat => cat.id === categoryId)
  return category?.name || ''
}

function getRecipeCategoryName(categoryId: string) {
  const category = recipeStore.categories.find(cat => cat.id === categoryId)
  return category?.name || ''
}

function goBack() {
  router.back()
}

function handleCardClick(item: any) {
  if (type.value === 'ingredient') {
    currentIngredient.value = item
    currentRecipe.value = null
    showPreview.value = true
  } else if (type.value === 'recipe') {
    currentRecipe.value = item
    currentIngredient.value = null
    showPreview.value = true
  }
}

async function handleEditIngredient() {
  if (!currentIngredient.value) return
  showPreview.value = false
  router.push(`/ingredient/${currentIngredient.value.id}`)
}

async function handleDeleteIngredient() {
  if (!currentIngredient.value) return
  await ElMessageBox.confirm('确定要删除该食材吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await ingredientStore.deleteIngredient(currentIngredient.value.id)
  showPreview.value = false
  ElMessage.success('删除成功')
}

async function handleEditRecipe() {
  if (!currentRecipe.value) return
  showPreview.value = false
  router.push(`/recipe/${currentRecipe.value.id}`)
}

async function handleDeleteRecipe() {
  if (!currentRecipe.value) return
  await ElMessageBox.confirm('确定要删除该菜谱吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await recipeStore.deleteRecipe(currentRecipe.value.id)
  showPreview.value = false
  ElMessage.success('删除成功')
}
</script>

<style scoped lang="scss">
.search-result-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.search-title {
  font-size: 18px;
  font-weight: 600;
}

.search-keyword {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-content: start;
}

.result-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.card-image {
  height: 160px;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .category-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--el-color-primary);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    z-index: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .el-icon {
    font-size: 48px;
    color: var(--el-text-color-placeholder);
  }
}

.card-content {
  padding: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px;
  color: var(--el-text-color-placeholder);
}
</style>
