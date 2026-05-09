<template>
  <el-dialog
    v-model="visible"
    width="500px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <template #header v-if="ingredient">
      <div class="dialog-header">
        <span class="dialog-title">{{ ingredient.name }}</span>
        <div class="dialog-actions">
          <div class="action-button" @click="showAIDialog = true">
            <el-icon class="action-icon action-icon-success"><MagicStick /></el-icon>
            <span class="action-text">问AI</span>
          </div>
          <div class="action-button" @click="showMemberDialog = true">
            <el-icon class="action-icon" :class="{ 'action-icon-success': isInMemberLibrary }">
              <User />
            </el-icon>
            <span class="action-text">{{ isInMemberLibrary ? '已添加' : '成员库' }}</span>
          </div>
          <div class="action-button" @click="showFolderDialog = true">
            <el-icon class="action-icon" :class="{ 'action-icon-warning': isFavorited }">
              <Star />
            </el-icon>
            <span class="action-text">{{ isFavorited ? '已收藏' : '收藏' }}</span>
          </div>
        </div>
      </div>
    </template>

    <div class="preview-content" v-if="ingredient">
      <div class="preview-image">
        <img v-if="ingredient.image" :src="ingredient.image" :alt="ingredient.name" />
        <div v-else class="image-placeholder">
          <el-icon :size="60"><Picture /></el-icon>
        </div>
      </div>

      <div class="preview-info">
        <div class="info-item">
          <span class="label">分类：</span>
          <span class="value">{{ categoryName }}</span>
        </div>
        <div class="info-item">
          <span class="label">功效：</span>
          <span class="value">{{ ingredient.effect || '暂无' }}</span>
        </div>
        <div class="info-item">
          <span class="label">处理方法：</span>
          <span class="value">{{ ingredient.processingMethod || '暂无' }}</span>
        </div>

        <!-- 相关菜谱 -->
        <div class="info-item" v-if="relatedRecipes.length > 0">
          <span class="label">相关菜谱：</span>
          <div class="recipe-list">
            <el-tag
              v-for="recipe in relatedRecipes"
              :key="recipe.id"
              @click.stop="handleRecipeClick(recipe)"
              class="clickable-tag"
            >
              {{ recipe.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <template #footer v-if="ingredient">
      <el-button @click="handleEdit">编辑</el-button>
      <el-button @click="handleDelete" type="danger">删除</el-button>
      <el-button type="primary" @click="handleViewDetail">查看详情</el-button>
    </template>
  </el-dialog>

  <FolderSelectDialog
    v-model="showFolderDialog"
    :item-id="ingredient?.id || ''"
    type="ingredient"
    @confirm="handleFolderConfirm"
  />

  <MemberLibrarySelectDialog
    v-model="showMemberDialog"
    :item-id="ingredient?.id || ''"
    type="ingredient"
  />

  <AIInfoDialog
    v-model="showAIDialog"
    :name="ingredient?.name || ''"
    type="ingredient"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Picture, Star, User, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Ingredient, IngredientCategory, Recipe } from '@/types'
import { useRouter } from 'vue-router'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useFolderStore } from '@/stores/useFolderStore'
import { useUserStore } from '@/stores/useUserStore'
import FolderSelectDialog from '@/components/common/FolderSelectDialog.vue'
import MemberLibrarySelectDialog from '@/components/user/MemberLibrarySelectDialog.vue'
import AIInfoDialog from '@/components/ai/AIInfoDialog.vue'

interface Props {
  modelValue: boolean
  ingredient: Ingredient | null
  categories: IngredientCategory[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'recipe-click', recipe: Recipe): void
}>()

const router = useRouter()
const ingredientStore = useIngredientStore()
const folderStore = useFolderStore()
const userStore = useUserStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showFolderDialog = ref(false)
const showMemberDialog = ref(false)
const showAIDialog = ref(false)

const categoryName = computed(() => {
  if (!props.ingredient) return '未分类'
  const cat = props.categories.find(c => c.id === props.ingredient.categoryId)
  return cat?.name || '未分类'
})

const relatedRecipes = computed(() => {
  if (!props.ingredient) return []
  return ingredientStore.getRelatedRecipes(props.ingredient.id)
})

const isFavorited = computed(() => {
  if (!props.ingredient) return false
  return folderStore.getFolderIdsByItem(props.ingredient.id, 'ingredient').length > 0
})

const isInMemberLibrary = computed(() => {
  if (!props.ingredient) return false
  for (const member of userStore.members) {
    const libraries = userStore.getMemberLibraries(member.id, 'ingredient')
    for (const library of libraries) {
      if (library.itemIds.includes(props.ingredient.id)) {
        return true
      }
    }
  }
  return false
})

onMounted(() => {
  folderStore.fetchAll()
  userStore.fetchMembers()
})

function handleRecipeClick(recipe: Recipe) {
  emit('recipe-click', recipe)
}

async function handleFolderConfirm(folderIds: string[]) {
  if (!props.ingredient) return

  const currentFolders = folderStore.getFolderIdsByItem(props.ingredient.id, 'ingredient')

  for (const folderId of folderIds) {
    if (!currentFolders.includes(folderId)) {
      await folderStore.addToFolder(folderId, props.ingredient.id)
    }
  }

  for (const folderId of currentFolders) {
    if (!folderIds.includes(folderId)) {
      await folderStore.removeFromFolder(folderId, props.ingredient.id)
    }
  }

  ElMessage.success(folderIds.length > 0 ? '收藏成功' : '已取消收藏')
}

function handleClose() {
  visible.value = false
}

function handleEdit() {
  emit('edit')
}

async function handleDelete() {
  if (!props.ingredient) return
  try {
    await ElMessageBox.confirm('确定要删除这个食材吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    emit('delete')
    visible.value = false
  } catch {
  }
}

function handleViewDetail() {
  if (!props.ingredient) return
  router.push(`/ingredient/${props.ingredient.id}`)
}
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8px;
}

.dialog-actions {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-shrink: 0;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &:active {
    transform: scale(0.95);
  }
}

.action-icon {
  font-size: 18px !important;
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.action-icon-success {
  color: var(--el-color-success) !important;
}

.action-icon-warning {
  color: var(--el-color-warning) !important;
}

.action-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  line-height: 1;
}

.preview-content {
  padding: 8px 0;
}

.preview-image {
  width: 100%;
  height: 250px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.preview-info {
  .info-item {
    margin-bottom: 16px;
    display: flex;
  align-items: flex-start;

    .label {
      font-weight: 500;
      color: var(--el-text-color-secondary);
      min-width: 80px;
      padding-top: 4px;
    }

    .value {
      flex: 1;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .recipe-list {
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
  }
}
</style>
