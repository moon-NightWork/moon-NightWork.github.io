<template>
  <el-dialog
    v-model="visible"
    width="500px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <template #header v-if="recipe">
      <div class="dialog-header">
        <span class="dialog-title">{{ recipe.name }}</span>
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

    <div class="preview-content" v-if="recipe">
      <div class="preview-image">
        <img v-if="recipe.image" :src="recipe.image" :alt="recipe.name" />
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
          <span class="label">口味：</span>
          <span class="value">{{ recipe.taste || '暂无' }}</span>
        </div>
        <div class="info-item">
          <span class="label">难度：</span>
          <span class="value">{{ getDifficultyText(recipe.difficulty) }}</span>
        </div>
        <div class="info-item">
          <span class="label">烹饪时间：</span>
          <span class="value">{{ recipe.cookingTime }}分钟</span>
        </div>
        <div class="info-item">
          <span class="label">份量：</span>
          <span class="value">{{ recipe.servings }}人份</span>
        </div>
        <div class="info-item">
          <span class="label">食材：</span>
          <div class="ingredient-list">
            <el-tag
              v-for="ing in recipe.ingredients"
              :key="ing.id"
              :class="{ 'ghost-tag': isIngredientGhost(ing.id) }"
              @click.stop="handleIngredientClick(ing)"
              class="clickable-tag"
            >
              {{ ing.name }}
            </el-tag>
            <span v-if="recipe.ingredients.length === 0">暂无</span>
          </div>
        </div>
        <div class="info-item">
          <span class="label">步骤：</span>
          <span class="value">{{ recipe.steps || '暂无' }}</span>
        </div>
      </div>
    </div>

    <template #footer v-if="recipe">
      <el-button @click="handleEdit">编辑</el-button>
      <el-button @click="handleDelete" type="danger">删除</el-button>
      <el-button type="primary" @click="handleViewDetail">查看详情</el-button>
    </template>
  </el-dialog>

  <!-- 幽灵项提示对话框 -->
  <GhostItemDialog
    v-model="showGhostDialog"
    :item-name="ghostItemName"
    @delete="handleDeleteGhostItem"
    @create="handleCreateGhostItem"
  />

  <FolderSelectDialog
    v-model="showFolderDialog"
    :item-id="recipe?.id || ''"
    type="recipe"
    @confirm="handleFolderConfirm"
  />

  <MemberLibrarySelectDialog
    v-model="showMemberDialog"
    :item-id="recipe?.id || ''"
    type="recipe"
  />

  <AIInfoDialog
    v-model="showAIDialog"
    :name="recipe?.name || ''"
    type="recipe"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Picture, Star, User, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Recipe, RecipeCategory, Ingredient } from '@/types'
import { useRouter } from 'vue-router'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useFolderStore } from '@/stores/useFolderStore'
import { useUserStore } from '@/stores/useUserStore'
import GhostItemDialog from '@/components/common/GhostItemDialog.vue'
import FolderSelectDialog from '@/components/common/FolderSelectDialog.vue'
import MemberLibrarySelectDialog from '@/components/user/MemberLibrarySelectDialog.vue'
import AIInfoDialog from '@/components/ai/AIInfoDialog.vue'

interface Props {
  modelValue: boolean
  recipe: Recipe | null
  categories: RecipeCategory[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'ingredient-click', ingredientId: string): void
  (e: 'ghost-delete', ingredientId: string): void
  (e: 'ghost-create', ingredientName: string): void
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
  if (!props.recipe) return '未分类'
  const cat = props.categories.find(c => c.id === props.recipe.categoryId)
  return cat?.name || '未分类'
})

const isFavorited = computed(() => {
  if (!props.recipe) return false
  return folderStore.getFolderIdsByItem(props.recipe.id, 'recipe').length > 0
})

const isInMemberLibrary = computed(() => {
  if (!props.recipe) return false
  for (const member of userStore.members) {
    const libraries = userStore.getMemberLibraries(member.id, 'recipe')
    for (const library of libraries) {
      if (library.itemIds.includes(props.recipe.id)) {
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

const showGhostDialog = ref(false)
const ghostItemName = ref('')
const ghostIngredientId = ref('')

function isIngredientGhost(ingredientId: string) {
  return !ingredientStore.ingredients.some(i => i.id === ingredientId)
}

async function handleFolderConfirm(folderIds: string[]) {
  if (!props.recipe) return

  const currentFolders = folderStore.getFolderIdsByItem(props.recipe.id, 'recipe')

  for (const folderId of folderIds) {
    if (!currentFolders.includes(folderId)) {
      await folderStore.addToFolder(folderId, props.recipe.id)
    }
  }

  for (const folderId of currentFolders) {
    if (!folderIds.includes(folderId)) {
      await folderStore.removeFromFolder(folderId, props.recipe.id)
    }
  }

  ElMessage.success(folderIds.length > 0 ? '收藏成功' : '已取消收藏')
}

function handleIngredientClick(ing: { id: string; name: string }) {
  if (isIngredientGhost(ing.id)) {
    ghostItemName.value = ing.name
    ghostIngredientId.value = ing.id
    showGhostDialog.value = true
  } else {
    emit('ingredient-click', ing.id)
  }
}

function handleDeleteGhostItem() {
  emit('ghost-delete', ghostIngredientId.value)
}

async function handleCreateGhostItem() {
  emit('ghost-create', ghostItemName.value)
}

function getDifficultyText(difficulty: 'easy' | 'medium' | 'hard') {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty]
}

function handleClose() {
  visible.value = false
}

function handleEdit() {
  emit('edit')
}

async function handleDelete() {
  if (!props.recipe) return
  try {
    await ElMessageBox.confirm('确定要删除这个菜谱吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    emit('delete')
    visible.value = false
  } catch {}
}

function handleViewDetail() {
  if (!props.recipe) return
  router.push(`/recipe/${props.recipe.id}`)
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
    margin-bottom: 12px;
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
  }
}
</style>
