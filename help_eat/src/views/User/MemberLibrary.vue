<template>
  <div class="member-library-page">
    <div class="detail-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <h2>{{ member?.name }}的饮食库</h2>
    </div>

    <el-tabs v-model="activeTab" class="library-tabs">
      <el-tab-pane label="食材库" name="ingredient">
        <div class="library-section">
          <div class="library-list">
            <div
              v-for="library in ingredientLibraries"
              :key="library.id"
              class="library-card"
            >
              <div class="library-header">
                <div class="library-title">
                  <el-icon><Folder /></el-icon>
                  <span>{{ library.name }}</span>
                  <span class="library-count">({{ library.itemIds.length }})</span>
                </div>
                <div class="library-actions">
                  <el-button
                    v-if="library.itemIds.length > 0"
                    link
                    @click="clearLibrary(library)"
                  >
                    <el-icon><Delete /></el-icon>
                    清空
                  </el-button>
                  <el-button link @click="editLibraryName(library)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="deleteLibrary(library)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <div v-if="library.itemIds.length > 0" class="item-list">
                <div
                  v-for="itemId in library.itemIds"
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
                    @click.stop="removeFromLibrary(library.id, itemId)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <EmptyState v-else description="该库为空" />
            </div>

            <div class="add-library-card" @click="showAddLibraryDialog('ingredient')">
              <el-icon><Plus /></el-icon>
              <span>新建食材库</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="菜谱库" name="recipe">
        <div class="library-section">
          <div class="library-list">
            <div
              v-for="library in recipeLibraries"
              :key="library.id"
              class="library-card"
            >
              <div class="library-header">
                <div class="library-title">
                  <el-icon><Folder /></el-icon>
                  <span>{{ library.name }}</span>
                  <span class="library-count">({{ library.itemIds.length }})</span>
                </div>
                <div class="library-actions">
                  <el-button
                    v-if="library.itemIds.length > 0"
                    link
                    @click="clearLibrary(library)"
                  >
                    <el-icon><Delete /></el-icon>
                    清空
                  </el-button>
                  <el-button link @click="editLibraryName(library)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="deleteLibrary(library)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <div v-if="library.itemIds.length > 0" class="item-list">
                <div
                  v-for="itemId in library.itemIds"
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
                    @click.stop="removeFromLibrary(library.id, itemId)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <EmptyState v-else description="该库为空" />
            </div>

            <div class="add-library-card" @click="showAddLibraryDialog('recipe')">
              <el-icon><Plus /></el-icon>
              <span>新建菜谱库</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showLibraryDialog" :title="editingLibrary ? '重命名' : '新建库'" width="360px">
      <el-input
        v-model="libraryName"
        placeholder="请输入库名称"
        maxlength="20"
        show-word-limit
        @keyup.enter="confirmLibraryAction"
      />
      <template #footer>
        <el-button @click="showLibraryDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmLibraryAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useRecipeStore } from '@/stores/useRecipeStore'
import { Folder, Food, Dish, Delete, Plus, Edit, ArrowLeft } from '@element-plus/icons-vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FamilyMember, MemberLibrary } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const ingredientStore = useIngredientStore()
const recipeStore = useRecipeStore()

const activeTab = ref<'ingredient' | 'recipe'>('ingredient')
const showLibraryDialog = ref(false)
const libraryName = ref('')
const editingLibrary = ref<MemberLibrary | null>(null)
const currentType = ref<'ingredient' | 'recipe'>('ingredient')

const member = computed(() => {
  const memberId = route.params.memberId as string
  return userStore.members.find(m => m.id === memberId)
})

const ingredientLibraries = computed(() => {
  if (!member.value) return []
  return userStore.getMemberLibraries(member.value.id, 'ingredient')
})

const recipeLibraries = computed(() => {
  if (!member.value) return []
  return userStore.getMemberLibraries(member.value.id, 'recipe')
})

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
  await userStore.fetchMembers()
  await ingredientStore.fetchAll()
  await recipeStore.fetchAll()
})

function goBack() {
  router.back()
}

function showAddLibraryDialog(type: 'ingredient' | 'recipe') {
  currentType.value = type
  editingLibrary.value = null
  libraryName.value = ''
  showLibraryDialog.value = true
}

function editLibraryName(library: MemberLibrary) {
  editingLibrary.value = library
  libraryName.value = library.name
  showLibraryDialog.value = true
}

async function confirmLibraryAction() {
  if (!libraryName.value.trim() || !member.value) {
    ElMessage.warning('请输入库名称')
    return
  }

  if (editingLibrary.value) {
    if (userStore.isLibraryNameExist(member.value.id, libraryName.value, editingLibrary.value.type, editingLibrary.value.id)) {
      ElMessage.warning('该库名称已存在')
      return
    }
    await userStore.updateLibrary(member.value.id, editingLibrary.value.id, libraryName.value)
    ElMessage.success('重命名成功')
  } else {
    if (userStore.isLibraryNameExist(member.value.id, libraryName.value, currentType.value)) {
      ElMessage.warning('该库名称已存在')
      return
    }
    await userStore.addLibrary(member.value.id, libraryName.value, currentType.value)
    ElMessage.success('新建成功')
  }

  showLibraryDialog.value = false
}

async function deleteLibrary(library: MemberLibrary) {
  if (!member.value) return

  try {
    const warningText = library.itemIds.length > 0
      ? `该库包含 ${library.itemIds.length} 个项目，确定要删除吗？`
      : '确定要删除该库吗？'

    await ElMessageBox.confirm(warningText, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.deleteLibrary(member.value.id, library.id)
    ElMessage.success('删除成功')
  } catch {
  }
}

async function clearLibrary(library: MemberLibrary) {
  if (!member.value) return

  try {
    await ElMessageBox.confirm(`确定要清空该库吗？将移除 ${library.itemIds.length} 个项目。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.clearLibrary(member.value.id, library.id)
    ElMessage.success('清空成功')
  } catch {
  }
}

async function removeFromLibrary(libraryId: string, itemId: string) {
  if (!member.value) return

  try {
    await ElMessageBox.confirm('确定要从该库移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.removeFromLibrary(member.value.id, libraryId, itemId)
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
</script>

<style scoped lang="scss">
.member-library-page {
  min-height: 100%;
  background: #f5f7fa;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  padding-bottom: 0;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #303133;
  }
}

.library-tabs {
  padding: 16px;
}

.library-section {
  margin-top: 16px;
}

.library-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.library-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.library-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;

  .library-count {
    font-size: 14px;
    font-weight: 400;
    color: #909399;
  }
}

.library-actions {
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

.add-library-card {
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
