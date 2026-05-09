<template>
  <div class="favorites-page">
    <div class="detail-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
    </div>

    <el-tabs v-model="activeTab" class="favorites-tabs">
      <el-tab-pane label="食材" name="ingredient">
        <div class="folder-section">
          <div class="folder-list">
            <div
              v-for="folder in ingredientFolders"
              :key="folder.id"
              class="folder-card"
            >
              <div class="folder-header">
                <div class="folder-title">
                  <el-icon><Folder /></el-icon>
                  <span>{{ folder.name }}</span>
                  <span class="folder-count">({{ folder.itemIds.length }})</span>
                </div>
                <div class="folder-actions">
                  <el-button
                    v-if="folder.itemIds.length > 0"
                    link
                    @click="clearFolder(folder)"
                  >
                    <el-icon :size="18"><Delete /></el-icon>
                    清空
                  </el-button>
                  <el-button link @click="editFolderName(folder)">
                    <el-icon :size="18"><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="deleteFolder(folder)"
                  >
                    <el-icon :size="18"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <div v-if="folder.itemIds.length > 0" class="item-list">
                <div
                  v-for="itemId in folder.itemIds"
                  :key="itemId"
                  class="item-card"
                  @click="viewIngredient(itemId)"
                >
                  <div v-if="ingredientsMap[itemId]" class="item-content">
                    <img
                      v-if="ingredientsMap[itemId].image"
                      :src="ingredientsMap[itemId].image"
                      class="item-image"
                    />
                    <div v-else class="item-image-placeholder">
                      <el-icon><Food /></el-icon>
                    </div>
                    <div class="item-info">
                      <div class="item-name">{{ ingredientsMap[itemId].name }}</div>
                    </div>
                  </div>
                  <div v-else class="item-ghost">
                    <span>已删除</span>
                  </div>
                  <el-button
                    link
                    type="danger"
                    class="remove-btn"
                    @click.stop="removeFromFolder(folder.id, itemId)"
                  >
                    <el-icon :size="18"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <EmptyState v-else description="该文件夹为空" />
            </div>

            <div class="add-folder-card" @click="showAddFolderDialog('ingredient')">
              <el-icon><Plus /></el-icon>
              <span>新建文件夹</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="菜谱" name="recipe">
        <div class="folder-section">
          <div class="folder-list">
            <div
              v-for="folder in recipeFolders"
              :key="folder.id"
              class="folder-card"
            >
              <div class="folder-header">
                <div class="folder-title">
                  <el-icon><Folder /></el-icon>
                  <span>{{ folder.name }}</span>
                  <span class="folder-count">({{ folder.itemIds.length }})</span>
                </div>
                <div class="folder-actions">
                  <el-button
                    v-if="folder.itemIds.length > 0"
                    link
                    @click="clearFolder(folder)"
                  >
                    <el-icon :size="18"><Delete /></el-icon>
                    清空
                  </el-button>
                  <el-button link @click="editFolderName(folder)">
                    <el-icon :size="18"><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="deleteFolder(folder)"
                  >
                    <el-icon :size="18"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <div v-if="folder.itemIds.length > 0" class="item-list">
                <div
                  v-for="itemId in folder.itemIds"
                  :key="itemId"
                  class="item-card"
                  @click="viewRecipe(itemId)"
                >
                  <div v-if="recipesMap[itemId]" class="item-content">
                    <img
                      v-if="recipesMap[itemId].image"
                      :src="recipesMap[itemId].image"
                      class="item-image"
                    />
                    <div v-else class="item-image-placeholder">
                      <el-icon><Dish /></el-icon>
                    </div>
                    <div class="item-info">
                      <div class="item-name">{{ recipesMap[itemId].name }}</div>
                    </div>
                  </div>
                  <div v-else class="item-ghost">
                    <span>已删除</span>
                  </div>
                  <el-button
                    link
                    type="danger"
                    class="remove-btn"
                    @click.stop="removeFromFolder(folder.id, itemId)"
                  >
                    <el-icon :size="18"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <EmptyState v-else description="该文件夹为空" />
            </div>

            <div class="add-folder-card" @click="showAddFolderDialog('recipe')">
              <el-icon><Plus /></el-icon>
              <span>新建文件夹</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showFolderDialog" :title="editingFolder ? '重命名' : '新建文件夹'" width="360px">
      <el-input
        v-model="folderName"
        placeholder="请输入文件夹名称"
        maxlength="20"
        show-word-limit
        @keyup.enter="confirmFolderAction"
      />
      <template #footer>
        <el-button @click="showFolderDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmFolderAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFolderStore } from '@/stores/useFolderStore'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useRecipeStore } from '@/stores/useRecipeStore'
import { Folder, Food, Dish, Delete, Plus, Edit, ArrowLeft } from '@element-plus/icons-vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Folder as FolderType } from '@/types'

const router = useRouter()
const folderStore = useFolderStore()
const ingredientStore = useIngredientStore()
const recipeStore = useRecipeStore()

const activeTab = ref<'ingredient' | 'recipe'>('ingredient')
const showFolderDialog = ref(false)
const folderName = ref('')
const editingFolder = ref<FolderType | null>(null)
const currentType = ref<'ingredient' | 'recipe'>('ingredient')

const ingredientFolders = computed(() => folderStore.getFoldersByType('ingredient'))
const recipeFolders = computed(() => folderStore.getFoldersByType('recipe'))

const ingredientsMap = computed(() => {
  const map: Record<string, any> = {}
  ingredientStore.ingredients.forEach(item => {
    map[item.id] = item
  })
  return map
})

const recipesMap = computed(() => {
  const map: Record<string, any> = {}
  recipeStore.recipes.forEach(item => {
    map[item.id] = item
  })
  return map
})

onMounted(async () => {
  await folderStore.fetchAll()
  await ingredientStore.fetchAll()
  await recipeStore.fetchAll()
})

function showAddFolderDialog(type: 'ingredient' | 'recipe') {
  currentType.value = type
  editingFolder.value = null
  folderName.value = ''
  showFolderDialog.value = true
}

function editFolderName(folder: FolderType) {
  editingFolder.value = folder
  folderName.value = folder.name
  showFolderDialog.value = true
}

async function confirmFolderAction() {
  if (!folderName.value.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }

  if (editingFolder.value) {
    // 编辑
    if (folderStore.isNameExist(folderName.value, editingFolder.value.type, editingFolder.value.id)) {
      ElMessage.warning('该文件夹名称已存在')
      return
    }
    await folderStore.updateFolder(editingFolder.value.id, folderName.value)
    ElMessage.success('重命名成功')
  } else {
    // 新建
    if (folderStore.isNameExist(folderName.value, currentType.value)) {
      ElMessage.warning('该文件夹名称已存在')
      return
    }
    await folderStore.addFolder(folderName.value, currentType.value)
    ElMessage.success('新建成功')
  }

  showFolderDialog.value = false
}

async function deleteFolder(folder: FolderType) {
  try {
    const warningText = folder.itemIds.length > 0
      ? `该文件夹包含 ${folder.itemIds.length} 个收藏项，确定要删除吗？`
      : '确定要删除该文件夹吗？'

    await ElMessageBox.confirm(warningText, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await folderStore.deleteFolder(folder.id)
    ElMessage.success('删除成功')
  } catch {
  }
}

async function clearFolder(folder: FolderType) {
  try {
    await ElMessageBox.confirm(`确定要清空该文件夹吗？将移除 ${folder.itemIds.length} 个收藏项。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 逐个移除项目
    const itemIdsCopy = [...folder.itemIds]
    for (const itemId of itemIdsCopy) {
      await folderStore.removeFromFolder(folder.id, itemId)
    }

    ElMessage.success('清空成功')
  } catch {
  }
}

async function removeFromFolder(folderId: string, itemId: string) {
  try {
    await ElMessageBox.confirm('确定要从该文件夹移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await folderStore.removeFromFolder(folderId, itemId)
    ElMessage.success('已移除')
  } catch {
  }
}

function viewIngredient(itemId: string) {
  if (ingredientsMap.value[itemId]) {
    router.push(`/ingredient/${itemId}`)
  }
}

function viewRecipe(itemId: string) {
  if (recipesMap.value[itemId]) {
    router.push(`/recipe/${itemId}`)
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped lang="scss">
.favorites-page {
  min-height: 100%;
  background: #f5f7fa;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  padding-bottom: 0;
}

.favorites-tabs {
  padding: 16px;
}

.folder-section {
  margin-top: 16px;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.folder-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.folder-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;

  .folder-count {
    font-size: 14px;
    font-weight: 400;
    color: #909399;
  }
}

.folder-actions {
  display: flex;
  gap: 4px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.item-card {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: #f0f0f0;
  }

  .item-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    .item-image {
      width: 56px;
      height: 56px;
      border-radius: 6px;
      object-fit: cover;
    }

    .item-image-placeholder {
      width: 56px;
      height: 56px;
      border-radius: 6px;
      background: #e9e9e9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
    }

    .item-info {
      .item-name {
        font-size: 15px;
        color: #303133;
      }
    }
  }

  .item-ghost {
    flex: 1;
    color: #c0c4cc;
    text-decoration: line-through;
  }
}

.add-folder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: white;
  border: 2px dashed #d0d0d0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #606266;
  gap: 8px;

  &:hover {
    border-color: #409eff;
    color: #409eff;
  }
}
</style>
