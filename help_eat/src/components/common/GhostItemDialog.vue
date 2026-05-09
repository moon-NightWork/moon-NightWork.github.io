<template>
  <el-dialog
    v-model="visible"
    title="提示"
    width="400px"
  >
    <div class="dialog-content">
      <el-icon :size="32" color="#E6A23C"><Warning /></el-icon>
      <p>食材「{{ itemName }}」已不存在</p>
      <p>您想要如何处理？</p>
    </div>
    <template #footer>
      <el-button @click="handleDelete">从菜谱中移除</el-button>
      <el-button type="primary" @click="handleCreate">重新创建该食材</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Warning } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  itemName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'delete'): void
  (e: 'create'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function handleDelete() {
  emit('delete')
  visible.value = false
}

function handleCreate() {
  emit('create')
  visible.value = false
}
</script>

<style scoped lang="scss">
.dialog-content {
  text-align: center;
  padding: 20px 0;

  p {
    margin: 12px 0 0;
    color: var(--el-text-color-primary);
  }
}
</style>
