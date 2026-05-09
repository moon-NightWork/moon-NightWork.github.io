<template>
  <div class="ingredient-detail">
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

    <div v-if="ingredient" class="detail-content">
      <div class="detail-image">
        <img v-if="ingredient.image" :src="ingredient.image" :alt="ingredient.name" />
        <div v-else class="image-placeholder">
          <el-icon :size="80"><Picture /></el-icon>
        </div>
      </div>

      <div class="detail-info">
        <h1 class="detail-title">{{ ingredient.name }}</h1>
        <el-tag type="info">{{ categoryName }}</el-tag>

        <div class="info-section">
          <h3>食材功效</h3>
          <p>{{ ingredient.effect || '暂无' }}</p>
        </div>

        <div class="info-section">
          <h3>处理方法</h3>
          <p>{{ ingredient.processingMethod || '暂无' }}</p>
        </div>

        <div class="info-section" v-if="relatedRecipes.length > 0">
          <h3>相关菜谱</h3>
          <div class="recipe-tags">
            <el-tag
              v-for="recipe in relatedRecipes"
              :key="recipe.id"
              @click="handleRecipeClick(recipe)"
              class="clickable-tag"
            >
              {{ recipe.name }}
            </el-tag>
          </div>
        </div>

        <div class="info-section">
          <h3>相关信息</h3>
          <div class="meta-info">
            <span>创建时间：{{ formatTime(ingredient.createdAt) }}</span>
            <span>更新时间：{{ formatTime(ingredient.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="食材不存在" />
    </div>

    <IngredientForm
      v-model="showEditForm"
      :categories="ingredientStore.categories"
      :edit-data="ingredient"
      @submit="handleUpdate"
    />

    <FolderSelectDialog
      v-model="showFolderDialog"
      :item-id="ingredient?.id || ''"
      type="ingredient"
      @confirm="handleFolderConfirm"
    />

    <AIInfoDialog
      v-model="showAIDialog"
      :name="ingredient?.name || ''"
      type="ingredient"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Picture, Star, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useRecipeStore } from '@/stores/useRecipeStore'
import { useFolderStore } from '@/stores/useFolderStore'
import IngredientForm from '@/components/ingredient/IngredientForm.vue'
import FolderSelectDialog from '@/components/common/FolderSelectDialog.vue'
import AIInfoDialog from '@/components/ai/AIInfoDialog.vue'
import type { Ingredient, Recipe } from '@/types'

const route = useRoute()
const router = useRouter()
const ingredientStore = useIngredientStore()
const recipeStore = useRecipeStore()
const folderStore = useFolderStore()

const ingredient = ref<Ingredient | null>(null)
const showEditForm = ref(false)
const showFolderDialog = ref(false)
const showAIDialog = ref(false)

const categoryName = computed(() => {
  if (!ingredient.value) return ''
  const cat = ingredientStore.categories.find(c => c.id === ingredient.value!.categoryId)
  return cat?.name || '未分类'
})

const relatedRecipes = computed(() => {
  if (!ingredient.value) return []
  return recipeStore.getRecipesByIngredient(ingredient.value.id)
})

const isFavorited = computed(() => {
  if (!ingredient.value) return false
  return folderStore.getFolderIdsByItem(ingredient.value.id, 'ingredient').length > 0
})

onMounted(async () => {
  await ingredientStore.fetchAll()
  await recipeStore.fetchAll()
  await folderStore.fetchAll()
  const id = route.params.id as string
  ingredient.value = ingredientStore.ingredients.find(i => i.id === id) || null
})

async function handleFolderConfirm(folderIds: string[]) {
  if (!ingredient.value) return

  // 获取当前所有包含该食材的文件夹
  const currentFolders = folderStore.getFolderIdsByItem(ingredient.value.id, 'ingredient')

  // 添加到新选中的文件夹
  for (const folderId of folderIds) {
    if (!currentFolders.includes(folderId)) {
      await folderStore.addToFolder(folderId, ingredient.value.id)
    }
  }

  // 从未选中的文件夹中移除
  for (const folderId of currentFolders) {
    if (!folderIds.includes(folderId)) {
      await folderStore.removeFromFolder(folderId, ingredient.value.id)
    }
  }

  ElMessage.success(folderIds.length > 0 ? '收藏成功' : '已取消收藏')
}

function goBack() {
  router.back()
}

function handleAIAsk() {
  if (!ingredient.value) return
  showAIDialog.value = true
}

function handleEdit() {
  showEditForm.value = true
}

async function handleDelete() {
  if (!ingredient.value) return

  try {
    await ElMessageBox.confirm('确定要删除这个食材吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await ingredientStore.deleteIngredient(ingredient.value.id)
    ElMessage.success('删除成功')
    router.push('/ingredient')
  } catch {
  }
}

async function handleUpdate(data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!ingredient.value) return
  await ingredientStore.updateIngredient(ingredient.value.id, data)
  ingredient.value = { ...ingredient.value, ...data, updatedAt: Date.now() }
  ElMessage.success('保存成功')
  showEditForm.value = false
}

function handleRecipeClick(recipe: Recipe) {
  router.push(`/recipe/${recipe.id}`)
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
.ingredient-detail {
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
  .detail-title {
    margin: 0 0 12px;
    font-size: 28px;
    color: var(--el-text-color-primary);
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

.recipe-tags {
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
