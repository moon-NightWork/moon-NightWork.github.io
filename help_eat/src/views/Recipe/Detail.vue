<template>
  <div class="recipe-detail">
    <div class="detail-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <div class="header-actions">
        <el-button @click="handleAIAsk" type="success">
          <el-icon><MagicStick /></el-icon>
          问AI
        </el-button>
        <el-button @click="showFolderDialog = true" :type="isFavorited ? 'warning' : 'default'">
          <el-icon><Star /></el-icon>
          {{ isFavorited ? '已收藏' : '收藏' }}
        </el-button>
        <el-button @click="handleEdit" type="primary">编辑</el-button>
        <el-button @click="handleDelete" type="danger">删除</el-button>
      </div>
    </div>

    <div v-if="recipe" class="detail-content">
      <div class="detail-image">
        <img v-if="recipe.image" :src="recipe.image" :alt="recipe.name" />
        <div v-else class="image-placeholder">
          <el-icon :size="80"><Picture /></el-icon>
        </div>
      </div>

      <div class="detail-info">
        <div class="title-row">
          <h1 class="detail-title">{{ recipe.name }}</h1>
          <el-tag :type="difficultyTagType">{{ getDifficultyText(recipe.difficulty) }}</el-tag>
        </div>
        <el-tag type="info">{{ categoryName }}</el-tag>

        <div class="info-grid">
          <div class="info-item">
            <el-icon><Timer /></el-icon>
            <span>烹饪时间：{{ recipe.cookingTime }}分钟</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>份量：{{ recipe.servings }}人份</span>
          </div>
          <div class="info-item">
            <el-icon><Location /></el-icon>
            <span>口味：{{ recipe.taste || '暂无' }}</span>
          </div>
        </div>

        <div class="info-section">
          <h3>食材</h3>
          <div class="ingredient-list">
            <el-tag
              v-for="ing in recipe.ingredients"
              :key="ing.id"
              :class="{ 'ghost-tag': isIngredientGhost(ing.id) }"
              @click="handleIngredientClick(ing.id)"
              class="clickable-tag"
            >
              {{ ing.name }}
            </el-tag>
            <span v-if="recipe.ingredients.length === 0">暂无</span>
          </div>
        </div>

        <div class="info-section">
          <h3>烹饪步骤</h3>
          <p>{{ recipe.steps || '暂无' }}</p>
        </div>

        <div class="info-section">
          <h3>相关信息</h3>
          <div class="meta-info">
            <span>创建时间：{{ formatTime(recipe.createdAt) }}</span>
            <span>更新时间：{{ formatTime(recipe.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="菜谱不存在" />
    </div>

    <RecipeForm
      v-model="showEditForm"
      :categories="recipeStore.categories"
      :ingredients="ingredientStore.ingredients"
      :edit-data="recipe"
      @submit="handleUpdate"
    />

    <FolderSelectDialog
      v-model="showFolderDialog"
      :item-id="recipe?.id || ''"
      type="recipe"
      @confirm="handleFolderConfirm"
    />

    <AIInfoDialog
      v-model="showAIDialog"
      :name="recipe?.name || ''"
      type="recipe"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Picture, Timer, User, Location, Star, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRecipeStore } from '@/stores/useRecipeStore'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useFolderStore } from '@/stores/useFolderStore'
import RecipeForm from '@/components/recipe/RecipeForm.vue'
import FolderSelectDialog from '@/components/common/FolderSelectDialog.vue'
import AIInfoDialog from '@/components/ai/AIInfoDialog.vue'
import type { Recipe } from '@/types'

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()
const folderStore = useFolderStore()

const recipe = ref<Recipe | null>(null)
const showEditForm = ref(false)
const showFolderDialog = ref(false)
const showAIDialog = ref(false)

const categoryName = computed(() => {
  if (!recipe.value) return ''
  const cat = recipeStore.categories.find(c => c.id === recipe.value!.categoryId)
  return cat?.name || '未分类'
})

const difficultyTagType = computed(() => {
  if (!recipe.value) return 'info'
  const map = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return map[recipe.value.difficulty] as any
})

const isFavorited = computed(() => {
  if (!recipe.value) return false
  return folderStore.getFolderIdsByItem(recipe.value.id, 'recipe').length > 0
})

function isIngredientGhost(ingredientId: string) {
  return !ingredientStore.ingredients.some(i => i.id === ingredientId)
}

function handleIngredientClick(ingredientId: string) {
  const ing = ingredientStore.ingredients.find(i => i.id === ingredientId)
  if (ing) {
    router.push(`/ingredient/${ing.id}`)
  }
}

onMounted(async () => {
  await recipeStore.fetchAll()
  await ingredientStore.fetchAll()
  await folderStore.fetchAll()
  const id = route.params.id as string
  recipe.value = recipeStore.recipes.find(r => r.id === id) || null
})

async function handleFolderConfirm(folderIds: string[]) {
  if (!recipe.value) return

  // 获取当前所有包含该菜谱的文件夹
  const currentFolders = folderStore.getFolderIdsByItem(recipe.value.id, 'recipe')

  // 添加到新选中的文件夹
  for (const folderId of folderIds) {
    if (!currentFolders.includes(folderId)) {
      await folderStore.addToFolder(folderId, recipe.value.id)
    }
  }

  // 从未选中的文件夹中移除
  for (const folderId of currentFolders) {
    if (!folderIds.includes(folderId)) {
      await folderStore.removeFromFolder(folderId, recipe.value.id)
    }
  }

  ElMessage.success(folderIds.length > 0 ? '收藏成功' : '已取消收藏')
}

function goBack() {
  router.back()
}

function handleAIAsk() {
  if (!recipe.value) return
  showAIDialog.value = true
}

function handleEdit() {
  showEditForm.value = true
}

async function handleDelete() {
  if (!recipe.value) return

  try {
    await ElMessageBox.confirm('确定要删除这个菜谱吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await recipeStore.deleteRecipe(recipe.value.id)
    ElMessage.success('删除成功')
    router.push('/recipe')
  } catch {
  }
}

async function handleUpdate(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!recipe.value) return
  await recipeStore.updateRecipe(recipe.value.id, data)
  recipe.value = { ...recipe.value, ...data, updatedAt: Date.now() }
  ElMessage.success('保存成功')
  showEditForm.value = false
}

function getDifficultyText(difficulty: 'easy' | 'medium' | 'hard') {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty]
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
.recipe-detail {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-content {
  max-width: 900px;
  margin: 0 auto;
}

.detail-image {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.detail-info {
  .title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .detail-title {
      margin: 0;
      font-size: 28px;
      color: var(--el-text-color-primary);
    }
  }
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.info-section {
  margin-top: 28px;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 1.8;
    white-space: pre-wrap;
  }
}

.ingredient-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.clickable-tag {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
  }
}

.ghost-tag {
  text-decoration: line-through;
  opacity: 0.6;
  border-style: dashed;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
