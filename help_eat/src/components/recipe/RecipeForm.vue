<template>
  <el-dialog
    :title="isEdit ? '编辑菜谱' : '新增菜谱'"
    v-model="visible"
    width="600px"
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
          <el-input v-model="formData.name" placeholder="请输入菜谱名称" />
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

      <el-form-item label="口味">
        <el-input v-model="formData.taste" placeholder="请输入口味" />
      </el-form-item>

      <el-form-item label="食材">
        <div class="ingredient-input-section">
          <div class="ingredient-input-wrapper">
            <el-input
              v-model="ingredientInput"
              placeholder="输入食材名称（例如：西红柿）"
              clearable
              class="ingredient-input"
              @keyup.enter="handleAddIngredientInput"
            />
            <el-button
              type="primary"
              @click="handleAddIngredientInput"
            >
              添加
            </el-button>
          </div>

          <div class="matched-ingredients" v-if="matchedIngredients.length > 0">
            <p class="match-hint">您可能还想要添加：</p>
            <div class="matched-list">
              <el-tag
                v-for="ing in matchedIngredients"
                :key="ing.id"
                @click="handleAddMatchedIngredient(ing)"
                class="matched-tag"
              >
                {{ ing.name }}
              </el-tag>
            </div>
          </div>

          <div class="selected-ingredients" v-if="selectedIngredients.length > 0">
            <div class="selected-label">已添加的食材：</div>
            <div class="selected-list">
              <el-tag
                v-for="ing in selectedIngredients"
                :key="ing.id"
                closable
                @close="handleRemoveIngredient(ing.id)"
                class="selected-tag"
              >
                {{ ing.name }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="难度" prop="difficulty">
        <el-radio-group v-model="formData.difficulty">
          <el-radio value="easy">简单</el-radio>
          <el-radio value="medium">中等</el-radio>
          <el-radio value="hard">困难</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="烹饪时间">
        <el-input-number v-model="formData.cookingTime" :min="1" :step="5" style="width: 100%" />
        <span style="margin-left: 8px; color: var(--el-text-color-secondary)">分钟</span>
      </el-form-item>

      <el-form-item label="份量">
        <el-input-number v-model="formData.servings" :min="1" :max="20" style="width: 100%" />
        <span style="margin-left: 8px; color: var(--el-text-color-secondary)">人份</span>
      </el-form-item>

      <el-form-item label="步骤">
        <el-input
          v-model="formData.steps"
          type="textarea"
          :rows="5"
          placeholder="请输入烹饪步骤"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        保存
      </el-button>
    </template>

    <!-- 不存在食材提示对话框 -->
    <el-dialog
      v-model="showMissingIngredientsDialog"
      title="检测到不存在的食材"
      width="500px"
    >
      <p>以下食材在食材库中不存在：</p>
      <div class="missing-list">
        <el-tag v-for="(name, i) in missingIngredientNames" :key="i" type="danger">
          {{ name }}
        </el-tag>
      </div>
      <p class="dialog-hint">您想要：</p>
      <div class="dialog-actions">
        <el-button type="primary" @click="handleAddMissingIngredients">
          添加食材并继续保存
        </el-button>
        <el-button @click="handleContinueWithoutAdding">
          仅保存现有食材
        </el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { Plus, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Recipe, RecipeCategory, Ingredient } from '@/types'
import { generateId } from '@/utils/helpers'
import { useAIChat } from '@/composables/useAIChat'

const ingredientStore = useIngredientStore()
const { fillRecipeForm, isLoading: isAILoading } = useAIChat()

interface Props {
  modelValue: boolean
  categories: RecipeCategory[]
  ingredients: Ingredient[]
  editData?: Recipe | null
}

const props = withDefaults(defineProps<Props>(), {
  editData: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): void
  (e: 'addIngredient', data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): void
  (e: 'needAddMissingIngredients', missingNames: string[], formData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): void
}>()

const formRef = ref<FormInstance>()
const fileInputRef = ref<HTMLInputElement>()
const ingredientInput = ref('')
const selectedIngredients = ref<Array<{ id: string; name: string }>>([])
const showMissingIngredientsDialog = ref(false)
const missingIngredientNames = ref<string[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = ref(false)
const submitting = ref(false)
const isFilling = ref(false)

const formData = reactive<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>({
  name: '',
  categoryId: '',
  image: '',
  taste: '',
  steps: '',
  cookingTime: 15,
  servings: 2,
  difficulty: 'easy'
})

const rules = reactive<FormRules<typeof formData>>({
  name: [{ required: true, message: '请输入菜谱名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
})

/**
 * AI自动填写表单
 */
async function handleAIFill() {
  if (!formData.name.trim()) {
    ElMessage.warning('请先输入菜谱名称')
    return
  }

  isFilling.value = true
  try {
    const result = await fillRecipeForm(formData.name.trim())
    formData.taste = result.taste
    formData.difficulty = result.difficulty
    formData.cookingTime = result.cookingTime
    formData.servings = result.servings
    formData.steps = result.steps
    
    // 尝试添加食材
    for (const ingredientName of result.ingredientNames) {
      const existingIng = ingredientStore.ingredients.find(ing => ing.name === ingredientName)
      if (existingIng) {
        if (!selectedIngredients.value.some(i => i.id === existingIng.id)) {
          selectedIngredients.value.push({ id: existingIng.id, name: existingIng.name })
        }
      } else {
        // 如果食材库中没有，添加临时食材
        if (!selectedIngredients.value.some(i => i.name === ingredientName)) {
          selectedIngredients.value.push({ id: `temp_${generateId()}_${ingredientName}`, name: ingredientName })
        }
      }
    }
    
    ElMessage.success('AI填写成功！')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'AI填写失败')
  } finally {
    isFilling.value = false
  }
}

const matchedIngredients = computed(() => {
  if (!ingredientInput.value.trim()) return []
  const input = ingredientInput.value.trim().toLowerCase()
  return ingredientStore.ingredients.filter(ing =>
    ing.name.toLowerCase().includes(input) &&
    !selectedIngredients.value.some(selected => selected.id === ing.id)
  )
})

const ingredientsForSubmit = computed(() => [...selectedIngredients.value])

watch(() => props.editData, (data, oldValue) => {
  console.log('👀 [DEBUG] watch editData 触发！')
  console.log('  旧值:', oldValue)
  console.log('  新值:', data)
  
  if (data) {
    console.log('  ✅ 编辑模式，准备填充数据')
    isEdit.value = true
    Object.assign(formData, {
      name: data.name,
      categoryId: data.categoryId,
      image: data.image,
      taste: data.taste,
      steps: data.steps,
      cookingTime: data.cookingTime,
      servings: data.servings,
      difficulty: data.difficulty
    })
    console.log('  ⚠️ 准备设置 selectedIngredients:', data.ingredients)
    selectedIngredients.value = [...data.ingredients]
    console.log('  ✅ 设置完成，当前 selectedIngredients:', selectedIngredients.value)
  } else {
    console.log('  ❌ 新增模式，重置表单')
    isEdit.value = false
    selectedIngredients.value = []
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.name = ''
  formData.categoryId = props.categories[0]?.id || ''
  formData.image = ''
  formData.taste = ''
  formData.steps = ''
  formData.cookingTime = 15
  formData.servings = 2
  formData.difficulty = 'easy'
  selectedIngredients.value = []
  ingredientInput.value = ''
  formRef.value?.resetFields()
}

function handleAddIngredientInput() {
  const name = ingredientInput.value.trim()
  console.log('🍅 [DEBUG] handleAddIngredientInput 被调用！当前输入:', name)
  
  if (!name) {
    ElMessage.warning('请输入食材名称')
    return
  }
  
  const existingIng = ingredientStore.ingredients.find(ing => ing.name === name)
  console.log('🍅 [DEBUG] ingredientStore.ingredients 内容:', ingredientStore.ingredients)
  
  if (existingIng) {
    console.log('🍅 [DEBUG] 找到匹配食材:', existingIng)
    handleAddMatchedIngredient(existingIng)
  } else {
    console.log('🍅 [DEBUG] 未找到匹配，添加临时食材')
    handleAddNewIngredient(name)
  }
  ingredientInput.value = ''
}

function handleAddMatchedIngredient(ing: Ingredient) {
  console.log('🍏 [DEBUG] handleAddMatchedIngredient 被调用！添加食材:', ing)
  
  if (selectedIngredients.value.some(i => i.id === ing.id)) {
    ElMessage.warning('该食材已添加')
    return
  }
  selectedIngredients.value.push({ id: ing.id, name: ing.name })
  console.log('🍏 [DEBUG] 添加成功，当前 selectedIngredients:', selectedIngredients.value)
  ingredientInput.value = ''
}

function handleAddNewIngredient(name: string) {
  console.log('🆕 [DEBUG] handleAddNewIngredient 被调用！名称:', name)
  
  if (selectedIngredients.value.some(i => i.name === name)) {
    ElMessage.warning('该食材已添加')
    return
  }
  selectedIngredients.value.push({ id: `temp_${Date.now()}_${name}`, name })
  console.log('🆕 [DEBUG] 添加成功，当前 selectedIngredients:', selectedIngredients.value)
}

function handleRemoveIngredient(id: string) {
  console.log('❌ [DEBUG] handleRemoveIngredient 被调用！id:', id)
  selectedIngredients.value = selectedIngredients.value.filter(i => i.id !== id)
  console.log('❌ [DEBUG] 移除成功，当前 selectedIngredients:', selectedIngredients.value)
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
      checkIngredientsAndSubmit()
    }
  })
}

async function checkIngredientsAndSubmit() {
  const tempIds = selectedIngredients.value.filter(i => i.id.startsWith('temp_'))
  if (tempIds.length > 0) {
    missingIngredientNames.value = tempIds.map(i => i.name)
    showMissingIngredientsDialog.value = true
    return
  }

  doSubmit()
}

async function handleAddMissingIngredients() {
  showMissingIngredientsDialog.value = false
  
  // 构建完整的表单数据
  const fullFormData = {
    ...formData,
    ingredients: ingredientsForSubmit.value
  }
  
  // emit 事件，告诉父页面需要处理这些不存在的食材
  emit('needAddMissingIngredients', [...missingIngredientNames.value], fullFormData)
}

async function handleContinueWithoutAdding() {
  showMissingIngredientsDialog.value = false

  selectedIngredients.value = selectedIngredients.value.filter(i => !i.id.startsWith('temp_'))
  doSubmit()
}

function doSubmit() {
  submitting.value = true
  console.log('📤 [Form 准备 emit submit 数据')
  console.log('  formData 内容:', { ...formData })
  console.log('  selectedIngredients:', selectedIngredients.value)
  console.log('  ingredientsForSubmit:', ingredientsForSubmit.value)
  
  const submitData = {
    ...formData,
    ingredients: ingredientsForSubmit.value
  }
  
  console.log('  最终 submitData:', submitData)
  
  // 双重保险：把 Vue Proxy 转换为普通对象
  const plainSubmitData = JSON.parse(JSON.stringify(submitData))
  
  emit('submit', plainSubmitData)
  setTimeout(() => {
    submitting.value = false
    visible.value = false
  }, 500)
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

.ingredient-input-section {
  width: 100%;
}

.ingredient-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  .ingredient-input {
    flex: 1;
  }
}

.matched-ingredients {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  .match-hint {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .matched-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .matched-tag {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.selected-ingredients {
  .selected-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  .selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .selected-tag {
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.missing-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.dialog-hint {
  margin: 16px 0 8px;
}

.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.dialog-actions .el-button {
  margin: 0 !important;
}
</style>
