<template>
  <div class="member-card">
    <div class="member-header">
      <div class="member-avatar">
        <el-icon :size="40">
          <component :is="member.gender === 'male' ? 'UserFilled' : 'Female'" />
        </el-icon>
      </div>
      <div class="member-info">
        <div class="member-name">{{ member.name }}</div>
        <div class="member-detail">{{ member.age }}岁 · {{ member.gender === 'male' ? '男' : '女' }}</div>
      </div>
      <div class="member-actions">
        <el-button link type="success" @click="handleAIClick" title="获取AI饮食建议">
          <el-icon :size="18"><MagicStick /></el-icon>
        </el-button>
        <el-button link type="primary" @click="$emit('view-library')">
          <el-icon :size="18"><Folder /></el-icon>
        </el-button>
        <el-button link type="primary" @click="$emit('edit')">
          <el-icon :size="18"><Edit /></el-icon>
        </el-button>
        <el-button link type="danger" @click="$emit('delete')">
          <el-icon :size="18"><Delete /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="member-body">
      <div class="bmi-item">
        <span class="label">BMI</span>
        <span class="value" :class="bmiClass">{{ bmi }}</span>
      </div>
      <div class="bmi-item">
        <span class="label">身高</span>
        <span class="value">{{ member.height }}cm</span>
      </div>
      <div class="bmi-item">
        <span class="label">体重</span>
        <span class="value">{{ member.weight }}kg</span>
      </div>
    </div>
    <div v-if="member.tags.length > 0" class="member-tags">
      <el-tag v-for="tag in member.tags" :key="tag" size="small" type="info">{{ tag }}</el-tag>
    </div>

    <AIInfoDialog
      v-model="showAIDialog"
      :member="member"
      type="member"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserFilled, Female, Edit, Delete, Folder, MagicStick } from '@element-plus/icons-vue'
import type { FamilyMember } from '@/types'
import AIInfoDialog from '@/components/ai/AIInfoDialog.vue'

interface Props {
  member: FamilyMember
  bmi: number
}

const props = defineProps<Props>()

defineEmits(['edit', 'delete', 'view-library'])

const showAIDialog = ref(false)

const bmiClass = computed(() => {
  if (props.bmi < 18.5) return 'underweight'
  if (props.bmi < 24) return 'normal'
  if (props.bmi < 28) return 'overweight'
  return 'obese'
})

function handleAIClick() {
  showAIDialog.value = true
}
</script>

<style scoped lang="scss">
.member-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .member-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .member-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
    }

    .member-info {
      flex: 1;

      .member-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .member-detail {
        font-size: 13px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .member-body {
    display: flex;
    gap: 16px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;

    .bmi-item {
      flex: 1;
      text-align: center;

      .label {
        display: block;
        font-size: 12px;
        color: #909399;
      }

      .value {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin-top: 4px;

        &.underweight {
          color: #409eff;
        }
        &.normal {
          color: #67c23a;
        }
        &.overweight {
          color: #e6a23c;
        }
        &.obese {
          color: #f56c6c;
        }
      }
    }
  }

  .member-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
}
</style>
