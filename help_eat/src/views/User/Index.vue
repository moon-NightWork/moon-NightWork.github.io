<template>
  <div class="user-page">
    <div class="user-section">
      <AvatarUpload v-model="avatar" @update:modelValue="handleAvatarChange" />
      <div class="username" @click="showEditDialog = true">
        {{ username }}
        <el-icon><Edit /></el-icon>
      </div>
    </div>

    <div class="menu-list">
      <div class="menu-item" @click="goToFavorites">
        <el-icon><Star /></el-icon>
        <span>我的收藏</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="goToMembers">
        <el-icon><UserFilled /></el-icon>
        <span>家庭成员</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="goToSettings">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <el-dialog v-model="showEditDialog" title="编辑用户名" width="360px">
      <el-input v-model="editUsername" placeholder="请输入用户名" maxlength="20" show-word-limit />
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUsername">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { Star, UserFilled, Setting, ArrowRight, Edit } from '@element-plus/icons-vue'
import AvatarUpload from '@/components/user/AvatarUpload.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const showEditDialog = ref(false)
const editUsername = ref('')

const username = computed(() => userStore.user?.username || '')
const avatar = computed({
  get: () => userStore.user?.avatar || '',
  set: (val) => {}
})

onMounted(() => {
  userStore.fetchUser()
})

function handleAvatarChange(newAvatar: string) {
  userStore.updateUser({ avatar: newAvatar })
  ElMessage.success('头像更新成功')
}

function handleSaveUsername() {
  if (!editUsername.value.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  userStore.updateUser({ username: editUsername.value.trim() })
  showEditDialog.value = false
  ElMessage.success('用户名更新成功')
}

function goToFavorites() {
  router.push('/user/favorites')
}

function goToMembers() {
  router.push('/user/members')
}

function goToSettings() {
  router.push('/user/settings')
}
</script>

<style scoped lang="scss">
.user-page {
  padding: 20px;
  min-height: 100%;
  background: #f5f7fa;
}

.user-section {
  background: white;
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .username {
    margin-top: 16px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.menu-list {
  margin-top: 16px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

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
</style>
