<template>
  <el-dialog
    v-model="visible"
    :title="`添加到${type === 'ingredient' ? '食材' : '菜谱'}库`"
    width="420px"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div v-if="!selectedMember" class="member-list">
        <div
          v-for="member in members"
          :key="member.id"
          class="member-item"
          @click="selectMember(member)"
        >
          <div class="member-avatar">
            <el-icon :size="24">
              <component :is="member.gender === 'male' ? 'UserFilled' : 'Female'" />
            </el-icon>
          </div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-detail">
              {{ member.age }}岁 · {{ member.gender === 'male' ? '男' : '女' }}
              · {{ getMemberLibraryCount(member) }}个库
            </div>
          </div>
          <el-icon class="arrow-icon">
            <ArrowRight />
          </el-icon>
        </div>
        <div v-if="members.length === 0" class="empty-tip">
          暂无家庭成员，请先添加成员
        </div>
      </div>

      <div v-else class="library-section">
        <div class="section-header">
          <el-button link size="small" @click="backToMemberSelection">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span class="member-name">{{ selectedMember.name }}</span>
        </div>
        <div class="library-list">
          <div
            v-for="library in getMemberLibraries(selectedMember.id)"
            :key="library.id"
            class="library-item"
            :class="{ selected: isLibrarySelected(library.id) }"
            @click="toggleLibrary(library.id)"
          >
            <el-icon><Folder /></el-icon>
            <span>{{ library.name }}</span>
            <span class="item-count">({{ library.itemIds.length }})</span>
            <el-icon v-if="isLibrarySelected(library.id)" class="check-icon">
              <Check />
            </el-icon>
          </div>
          <div class="library-item new-library" @click="showAddLibraryDialog">
            <el-icon><Plus /></el-icon>
            <span>新建库</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">
        确定
      </el-button>
    </template>

    <!-- 新建库弹窗 -->
    <el-dialog
      v-model="addLibraryVisible"
      title="新建库"
      width="320px"
      append-to-body
      @close="newLibraryName = ''"
    >
      <el-form>
        <el-form-item label="库名称">
          <el-input
            v-model="newLibraryName"
            placeholder="请输入库名称"
            maxlength="20"
            show-word-limit
            @keyup.enter="confirmAddLibrary"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addLibraryVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddLibrary">创建</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Folder, Plus, Check, ArrowLeft, ArrowRight, UserFilled, Female } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/useUserStore'
import { ElMessage } from 'element-plus'
import type { FamilyMember, MemberLibrary } from '@/types'

interface Props {
  modelValue: boolean
  itemId: string
  type: 'ingredient' | 'recipe'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const userStore = useUserStore()

const visible = ref(false)
const selectedMember = ref<FamilyMember | null>(null)
const selectedLibraryIds = ref<string[]>([])
const addLibraryVisible = ref(false)
const newLibraryName = ref('')

const members = computed<FamilyMember[]>(() => userStore.members)

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      resetState()
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function resetState() {
  selectedMember.value = null
  selectedLibraryIds.value = []
}

function getMemberLibraryCount(member: FamilyMember): number {
  return userStore.getMemberLibraries(member.id, props.type).length
}

function selectMember(member: FamilyMember) {
  selectedMember.value = member
  // 初始化已选中的库
  selectedLibraryIds.value = []
  const libraries = getMemberLibraries(member.id)
  for (const library of libraries) {
    if (library.itemIds.includes(props.itemId)) {
      selectedLibraryIds.value.push(library.id)
    }
  }
}

function backToMemberSelection() {
  selectedMember.value = null
}

function getMemberLibraries(memberId: string): MemberLibrary[] {
  return userStore.getMemberLibraries(memberId, props.type)
}

function isLibrarySelected(libraryId: string): boolean {
  return selectedLibraryIds.value.includes(libraryId)
}

function toggleLibrary(libraryId: string) {
  const index = selectedLibraryIds.value.indexOf(libraryId)
  if (index > -1) {
    selectedLibraryIds.value.splice(index, 1)
  } else {
    selectedLibraryIds.value.push(libraryId)
  }
}

function showAddLibraryDialog() {
  newLibraryName.value = ''
  addLibraryVisible.value = true
}

async function confirmAddLibrary() {
  if (!newLibraryName.value.trim() || !selectedMember.value) {
    ElMessage.warning('请输入库名称')
    return
  }
  if (userStore.isLibraryNameExist(selectedMember.value.id, newLibraryName.value, props.type)) {
    ElMessage.warning('该库名称已存在')
    return
  }

  const newLibrary = await userStore.addLibrary(selectedMember.value.id, newLibraryName.value, props.type)
  if (newLibrary) {
    selectedLibraryIds.value.push(newLibrary.id)
    ElMessage.success('创建成功')
  }
  addLibraryVisible.value = false
}

async function handleConfirm() {
  if (!selectedMember.value) return

  const libraries = getMemberLibraries(selectedMember.value.id)

  // 处理添加/移除
  for (const library of libraries) {
    const isSelected = selectedLibraryIds.value.includes(library.id)
    const isInLibrary = library.itemIds.includes(props.itemId)

    if (isSelected && !isInLibrary) {
      // 添加
      await userStore.addToLibrary(selectedMember.value.id, library.id, props.itemId)
    } else if (!isSelected && isInLibrary) {
      // 移除
      await userStore.removeFromLibrary(selectedMember.value.id, library.id, props.itemId)
    }
  }

  ElMessage.success(selectedLibraryIds.value.length > 0 ? '添加成功' : '已取消添加')
  emit('confirm')
  visible.value = false
}

function handleClose() {
  visible.value = false
}
</script>

<style scoped lang="scss">
.dialog-content {
  padding: 8px 0;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 350px;
  overflow-y: auto;

  .member-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    gap: 12px;
    border: 1px solid transparent;

    &:hover {
      background: #f5f7fa;
    }

    .member-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
      flex-shrink: 0;
    }

    .member-info {
      flex: 1;

      .member-name {
        font-size: 15px;
        color: #303133;
        font-weight: 600;
      }

      .member-detail {
        font-size: 13px;
        color: #909399;
        margin-top: 4px;
      }
    }

    .arrow-icon {
      color: #909399;
    }
  }

  .empty-tip {
    text-align: center;
    padding: 32px;
    color: #909399;
  }
}

.library-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;

    .member-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .library-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 280px;
    overflow-y: auto;

    .library-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      gap: 12px;
      border: 1px solid transparent;

      &:hover {
        background: #f5f7fa;
      }

      &.selected {
        border-color: #409eff;
        background: #ecf5ff;
      }

      &.new-library {
        color: #409eff;
      }

      .item-count {
        font-size: 13px;
        color: #909399;
        margin-left: auto;
        margin-right: 8px;
      }

      .check-icon {
        color: #409eff;
      }
    }
  }
}
</style>
