<template>
  <div class="avatar-upload">
    <div class="avatar-wrapper" @click="triggerUpload">
      <img v-if="modelValue" :src="modelValue" class="avatar" />
      <el-icon v-else class="avatar-placeholder">
        <User />
      </el-icon>
      <div class="avatar-mask">
        <el-icon>
          <Camera />
        </el-icon>
        <span>更换头像</span>
      </div>
    </div>
    <input ref="fileInput" type="file" accept="image/*" @change="handleFileChange" style="display: none" />
    <ImageCropper v-model="showCropper" :image="tempImage" @confirm="handleCropConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, Camera } from '@element-plus/icons-vue'
import ImageCropper from '@/components/common/ImageCropper.vue'
import { useImageUpload } from '@/composables/useImageUpload'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const fileInput = ref<HTMLInputElement | null>(null)
const showCropper = ref(false)
const tempImage = ref('')
const { handleFileSelect } = useImageUpload()

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const imageData = await handleFileSelect(file)
    tempImage.value = imageData
    showCropper.value = true
  }
  target.value = ''
}

function handleCropConfirm(imageData: string) {
  emit('update:modelValue', imageData)
}
</script>

<style scoped lang="scss">
.avatar-upload {
  display: flex;
  justify-content: center;

  .avatar-wrapper {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;

    .avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 50px;
      color: #c0c4cc;
    }

    &:hover .avatar-mask {
      opacity: 1;
    }

    .avatar-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 12px;
      gap: 4px;
    }
  }
}
</style>
