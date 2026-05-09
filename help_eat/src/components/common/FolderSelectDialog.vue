<template>
  <el-dialog
    v-model="visible"
    :title="`收藏${type === 'ingredient' ? '食材' : '菜谱'}`"
    width="400px"
    @close="handleClose"
  >
    <div class="folder-list">
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="folder-item"
        :class="{ selected: selectedFolderIds.includes(folder.id) }"
        @click="toggleFolder(folder.id)"
      >
        <el-icon><Folder /></el-icon>
        <span>{{ folder.name }}</span>
        <el-icon v-if="selectedFolderIds.includes(folder.id)" class="check-icon"><Check /></el-icon>
      </div>
      <div class="folder-item new-folder" @click="showNewFolderDialog">
        <el-icon><Plus /></el-icon>
        <span>新建文件夹</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>

    <!-- 新建文件夹弹窗 -->
    <el-dialog
      v-model="newFolderVisible"
      title="新建文件夹"
      width="320px"
      append-to-body
      @close="newFolderName = ''"
    >
      <el-form>
        <el-form-item label="文件夹名">
          <el-input
            v-model="newFolderName"
            placeholder="请输入文件夹名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newFolderVisible = false">取消</el-button>
        <el-button type="primary" @click="createNewFolder">创建</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Folder, Plus, Check } from '@element-plus/icons-vue'
import { useFolderStore } from '@/stores/useFolderStore'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  itemId: string
  type: 'ingredient' | 'recipe'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', folderIds: string[]): void
}>()

const folderStore = useFolderStore()
const visible = ref(false)
const selectedFolderIds = ref<string[]>([])
const newFolderVisible = ref(false)
const newFolderName = ref('')

const folders = computed(() => folderStore.getFoldersByType(props.type))

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      selectedFolderIds.value = folderStore.getFolderIdsByItem(props.itemId, props.type)
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function toggleFolder(folderId: string) {
  const index = selectedFolderIds.value.indexOf(folderId)
  if (index > -1) {
    selectedFolderIds.value.splice(index, 1)
  } else {
    selectedFolderIds.value.push(folderId)
  }
}

function showNewFolderDialog() {
  newFolderName.value = ''
  newFolderVisible.value = true
}

async function createNewFolder() {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }
  if (folderStore.isNameExist(newFolderName.value, props.type)) {
    ElMessage.warning('该文件夹名称已存在')
    return
  }

  const newFolder = await folderStore.addFolder(newFolderName.value, props.type)
  selectedFolderIds.value.push(newFolder.id)
  newFolderVisible.value = false
  ElMessage.success('文件夹创建成功')
}

function handleConfirm() {
  emit('confirm', [...selectedFolderIds.value])
  visible.value = false
}

function handleClose() {
  visible.value = false
}
</script>

<style scoped lang="scss">
.folder-list {
  max-height: 300px;
  overflow-y: auto;

  .folder-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    gap: 10px;

    &:hover {
      background: var(--el-fill-color-lighter);
    }

    &.selected {
      background: var(--el-color-primary-light-9);
    }

    &.new-folder {
      color: var(--el-color-primary);
    }

    .check-icon {
      margin-left: auto;
      color: var(--el-color-primary);
    }

    span {
      font-size: 14px;
    }
  }
}
</style>
