<template>
  <div class="settings-page">
    <div class="detail-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <h2>设置</h2>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">数据管理</div>
        <div class="menu-item" @click="handleExport">
          <el-icon><Download /></el-icon>
          <span>导出数据</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="triggerImport">
          <el-icon><Upload /></el-icon>
          <span>导入数据</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
        <input ref="fileInput" type="file" accept=".json" @change="handleImport" style="display: none" />
      </div>

      <div class="section">
        <div class="section-title">AI数据</div>
        <div class="menu-item" @click="handleClearAIData">
          <el-icon><ChatDotRound /></el-icon>
          <span>清除AI数据</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="section">
        <div class="section-title">其他</div>
        <div class="menu-item danger" @click="handleClearData">
          <el-icon><Delete /></el-icon>
          <span>清除所有数据</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <el-dialog v-model="showPreviewDialog" title="数据预览" width="90%">
      <div class="preview-content">
        <pre>{{ previewData }}</pre>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="confirmExport">下载文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { useFolderStore } from '@/stores/useFolderStore'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useRecipeStore } from '@/stores/useRecipeStore'
import { useAIStore } from '@/stores/useAIStore'
import { Download, Upload, Delete, ArrowRight, ArrowLeft, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/api/db'
import { userApi, aiApi } from '@/api'

const router = useRouter()

const userStore = useUserStore()
const folderStore = useFolderStore()
const ingredientStore = useIngredientStore()
const recipeStore = useRecipeStore()

const fileInput = ref<HTMLInputElement | null>(null)
const showPreviewDialog = ref(false)
const previewData = ref('')
let exportData: any = null

async function handleExport() {
  await userStore.fetchUser()
  await userStore.fetchMembers()
  await folderStore.fetchAll()
  await ingredientStore.fetchAll()
  await recipeStore.fetchAll()

  exportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    user: userStore.user,
    members: userStore.members,
    folders: folderStore.folders,
    ingredients: ingredientStore.ingredients,
    ingredientCategories: ingredientStore.categories,
    recipes: recipeStore.recipes,
    recipeCategories: recipeStore.categories
  }

  previewData.value = JSON.stringify(exportData, null, 2)
  showPreviewDialog.value = true
}

function confirmExport() {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `一日三餐_数据备份_${date}.json`
  a.click()
  URL.revokeObjectURL(url)
  showPreviewDialog.value = false
  ElMessage.success('数据导出成功')
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.version || !data.exportTime) {
      ElMessage.error('无效的数据文件')
      return
    }

    await ElMessageBox.confirm(
      '导入数据将覆盖现有数据，确定要继续吗？',
      '警告',
      {
        confirmButtonText: '确定导入',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await db.ingredients.clear()
    await db.ingredientCategories.clear()
    await db.recipes.clear()
    await db.recipeCategories.clear()
    await db.folders.clear()
    await db.members.clear()

    if (data.ingredientCategories) {
      for (const item of data.ingredientCategories) {
        await db.ingredientCategories.put(item)
      }
    }
    if (data.ingredients) {
      for (const item of data.ingredients) {
        await db.ingredients.put(item)
      }
    }
    if (data.recipeCategories) {
      for (const item of data.recipeCategories) {
        await db.recipeCategories.put(item)
      }
    }
    if (data.recipes) {
      for (const item of data.recipes) {
        await db.recipes.put(item)
      }
    }
    if (data.folders) {
      for (const item of data.folders) {
        await db.folders.put(item)
      }
    }
    if (data.members) {
      for (const item of data.members) {
        await db.members.put(item)
      }
    }
    if (data.user) {
      await userApi.saveUser(data.user)
    }

    ElMessage.success('数据导入成功，请刷新页面')
  } catch (e: any) {
    console.error(e)
    ElMessage.error('数据导入失败：' + e.message)
  } finally {
    target.value = ''
  }
}

async function handleClearAIData() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有AI数据吗？包括API Key配置和对话历史。',
      '警告',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await db.aiSessions.clear()
    await db.aiSettings.clear()
    ElMessage.success('AI数据清除成功')
  } catch {
  }
}

async function handleClearData() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有数据吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await db.ingredients.clear()
    await db.ingredientCategories.clear()
    await db.recipes.clear()
    await db.recipeCategories.clear()
    await db.folders.clear()
    await db.members.clear()
    await db.aiSessions.clear()
    await db.aiSettings.clear()
    await userApi.saveUser({ avatar: '', username: '美食家' })

    ElMessage.success('数据清除成功，请刷新页面')
  } catch {
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped lang="scss">
.settings-page {
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

.content {
  padding: 16px;
}

.section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;

  .section-title {
    padding: 12px 16px;
    font-size: 13px;
    color: #909399;
    background: #f5f7fa;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f5f7fa;
    }

    &:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }

    &.danger {
      .el-icon,
      span {
        color: #f56c6c;
      }
    }

    .el-icon {
      font-size: 20px;
      color: #409eff;
    }

    span {
      flex: 1;
      margin-left: 12px;
      font-size: 15px;
      color: #303133;
    }

    .arrow {
      color: #c0c4cc;
      font-size: 16px;
    }
  }
}

.preview-content {
  max-height: 400px;
  overflow: auto;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;

  pre {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #606266;
    word-break: break-all;
  }
}
</style>
