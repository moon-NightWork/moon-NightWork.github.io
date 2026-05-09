<template>
  <div class="members-page">
    <div class="detail-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
    </div>

    <div class="content">
      <div v-if="members.length > 0" class="member-list">
        <MemberCard
          v-for="member in members"
          :key="member.id"
          :member="member"
          :bmi="calculateBMI(member.height, member.weight)"
          @edit="editMember(member)"
          @delete="deleteMember(member.id)"
          @view-library="viewMemberLibrary(member)"
        />
      </div>
      <EmptyState v-else description="暂无家庭成员" />

      <el-button type="primary" class="add-btn" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加成员
      </el-button>
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑成员' : '添加成员'" width="380px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名" maxlength="10" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="form.age" :min="1" :max="120" placeholder="请输入年龄" />
        </el-form-item>
        <el-form-item label="身高">
          <el-input-number v-model="form.height" :min="50" :max="250" placeholder="请输入身高" suffix="cm" />
        </el-form-item>
        <el-form-item label="体重">
          <el-input-number v-model="form.weight" :min="5" :max="300" placeholder="请输入体重" suffix="kg" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="tagInput"
            placeholder="输入标签后按回车添加"
            @keyup.enter="addTag"
          />
          <div class="tag-list">
            <el-tag
              v-for="tag in form.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              style="margin-top: 8px; margin-right: 8px"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MemberCard from '@/components/user/MemberCard.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FamilyMember } from '@/types'

const router = useRouter()

const userStore = useUserStore()

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref('')
const tagInput = ref('')

const form = ref<Partial<FamilyMember>>({
  name: '',
  gender: 'male',
  age: 30,
  height: 170,
  weight: 65,
  tags: [],
  libraries: []
})

const members = ref<FamilyMember[]>([])

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && form.value.tags && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagInput.value = ''
  }
}

function removeTag(tag: string) {
  if (form.value.tags) {
    const index = form.value.tags.indexOf(tag)
    if (index > -1) {
      form.value.tags.splice(index, 1)
    }
  }
}

function calculateBMI(height: number, weight: number): number {
  return userStore.calculateBMI(height, weight)
}

onMounted(() => {
  userStore.fetchMembers()
  members.value = userStore.members
})

function showAddDialog() {
  isEdit.value = false
  form.value = {
    name: '',
    gender: 'male',
    age: 30,
    height: 170,
    weight: 65,
    tags: [],
    libraries: []
  }
  showDialog.value = true
}

function editMember(member: FamilyMember) {
  isEdit.value = true
  editId.value = member.id
  form.value = { ...member }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.name?.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!form.value.age || !form.value.height || !form.value.weight) {
    ElMessage.warning('请填写完整信息')
    return
  }

  if (isEdit.value) {
    await userStore.updateMember(editId.value, form.value as any)
    ElMessage.success('更新成功')
  } else {
    await userStore.addMember(form.value as any)
    ElMessage.success('添加成功')
  }

  showDialog.value = false
  members.value = [...userStore.members]
}

async function deleteMember(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该成员吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.deleteMember(id)
    ElMessage.success('删除成功')
    members.value = [...userStore.members]
  } catch {
  }
}

function goBack() {
  router.back()
}

function viewMemberLibrary(member: FamilyMember) {
  router.push(`/user/members/${member.id}/library`)
}
</script>

<style scoped lang="scss">
.members-page {
  min-height: 100%;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.content {
  padding: 16px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-btn {
  width: 100%;
  margin-top: 16px;
}
</style>
