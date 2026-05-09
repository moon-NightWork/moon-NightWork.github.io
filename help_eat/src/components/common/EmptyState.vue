<template>
  <div class="empty-state">
    <el-icon :size="60" color="#c0c4cc">
      <component :is="icon" />
    </el-icon>
    <p class="description">{{ description }}</p>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { Folder } from '@element-plus/icons-vue'

interface Props {
  icon?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'Folder',
  description: '暂无数据'
})
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;

  .description {
    margin-top: 12px;
    font-size: 14px;
  }
}
</style>
