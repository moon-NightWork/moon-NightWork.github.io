<template>
  <el-dialog v-model="visible" title="裁剪图片" width="400px" @close="handleClose">
    <div class="cropper-container">
      <img v-if="imageSrc" :src="imageSrc" class="preview-image" />
    </div>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  image: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = ref(false)
const imageSrc = ref('')

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      imageSrc.value = props.image
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function handleClose() {
  visible.value = false
}

function handleConfirm() {
  emit('confirm', imageSrc.value)
  visible.value = false
}
</script>

<style scoped lang="scss">
.cropper-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;

  .preview-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
  }
}
</style>
