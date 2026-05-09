<template>
  <el-dialog
    :title="isEdit ? '编辑食材' : '新增食材'"
    v-model="visible"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="图片">
        <div class="image-upload" @click="handleImageClick">
          <img v-if="formData.image" :src="formData.image" class="preview-image" />
          <div v-else class="upload-placeholder">
            <el-icon :size="32"><Plus /></el-icon>
            <p>点击上传</p>
          </div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileChange"
        />
      </el-form-item>

      <el-form-item label="名称" prop="name">
        <div class="name-input-wrapper">
          <el-input v-model="formData.name" placeholder="请输入食材名称" />
          <el-button
            type="success"
            :disabled="!formData.name.trim() || isFilling"
            :loading="isFilling"
            @click="handleAIFill"
          >
            <el-icon><MagicStick /></el-icon>
            AI填写
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="分类" prop="categoryId">
        <el-select v-model="formData.categoryId" placeholder="请选择分类" style="width: 100%">
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="功效">
        <el-input
          v-model="formData.effect"
          type="textarea"
          :rows="3"
          placeholder="请输入食材功效"
        />
      </el-form-item>

      <el-form-item label="处理方法">
        <el-input
          v-model="formData.processingMethod"
          type="textarea"
          :rows="3"
          placeholder="请输入处理方法"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { Plus, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Ingredient, IngredientCategory } from '@/types'
import { useAIChat } from '@/composables/useAIChat'

interface Props {
  modelValue: boolean
  categories: IngredientCategory[]
  editData?: Ingredient | null
}

const props = withDefaults(defineProps<Props>(), {
  editData: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): void
}>()

const formRef = ref<FormInstance>()
const fileInputRef = ref<HTMLInputElement>()
const { fillIngredientForm, isLoading: isAILoading } = useAIChat()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = ref(false)
const submitting = ref(false)
const isFilling = ref(false)

const formData = reactive<Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>>({
  name: '',
  categoryId: '',
  image: '',
  effect: '',
  processingMethod: ''
})

const rules = reactive<FormRules<typeof formData>>({
  name: [{ required: true, message: '请输入食材名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
})

/**
 * AI自动填写表单
 */
async function handleAIFill() {
  if (!formData.name.trim()) {
    ElMessage.warning('请先输入食材名称')
    return
  }

  isFilling.value = true
  try {
    const result = await fillIngredientForm(formData.name.trim())
    formData.effect = result.effect
    formData.processingMethod = result.processingMethod
    ElMessage.success('AI填写成功！')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'AI填写失败')
  } finally {
    isFilling.value = false
  }
}

watch(() => props.editData, (data) => {
  if (data) {
    isEdit.value = true
    Object.assign(formData, {
      name: data.name,
      categoryId: data.categoryId,
      image: data.image,
      effect: data.effect,
      processingMethod: data.processingMethod
    })
  } else {
    isEdit.value = false
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.name = ''
  formData.categoryId = props.categories[0]?.id || ''
  formData.image = ''
  formData.effect = ''
  formData.processingMethod = ''
  formRef.value?.resetFields()
}

function handleImageClick() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      formData.image = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      emit('submit', { ...formData })
      setTimeout(() => {
        submitting.value = false
        visible.value = false
      }, 500)
    }
  })
}

function handleClose() {
  visible.value = false
}
</script>

<style scoped lang="scss">
.image-upload {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .upload-placeholder {
    text-align: center;
    color: var(--el-text-color-placeholder);

    p {
      margin: 8px 0 0;
      font-size: 12px;
    }
  }
}

.name-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;

  .el-input {
    flex: 1;
  }
}
</style>
