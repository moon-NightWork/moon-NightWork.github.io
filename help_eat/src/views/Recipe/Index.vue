<template>
  <div class="recipe-page">
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索菜谱名称、口味..."
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
    </div>

    <CardList
      :categories="recipeStore.categories"
      :items="recipeStore.recipes"
      :search-text="''"
      @card-click="handleCardClick"
      @edit-category="handleEditCategory"
      @delete-category="handleDeleteCategory"
    >
      <template #card="{ item, onClick }">
        <RecipeCard :recipe="item" @click="onClick" />
      </template>

      <template #category-footer>
        <div class="category-footer">
          <el-button @click="handleAddCategory">+ 新增分类</el-button>
          <el-button @click="handleAddRecipe">+ 新增菜谱</el-button>
        </div>
      </template>
    </CardList>

    <RecipePreview
      v-model="showPreview"
      :recipe="currentRecipe!"
      :categories="recipeStore.categories"
      @edit="handleEditRecipe"
      @delete="handleDeleteRecipe"
      @ingredient-click="handleIngredientClick"
      @ghost-delete="handleGhostDelete"
      @ghost-create="handleGhostCreate"
    />

    <RecipeForm
      v-model="showForm"
      :categories="recipeStore.categories"
      :ingredients="ingredientStore.ingredients"
      :edit-data="editRecipe"
      @submit="handleFormSubmit"
      @addIngredient="handleAddIngredient"
      @needAddMissingIngredients="handleNeedAddMissingIngredients"
    />

    <!-- 食材预览弹窗 -->
    <IngredientPreview
      v-model="showIngredientPreview"
      :ingredient="currentIngredient!"
      :categories="ingredientStore.categories"
      @edit="handleEditIngredient"
      @delete="handleDeleteIngredient"
      @recipe-click="handlePreviewRecipeClick"
    />
    
    <!-- 食材创建表单 -->
    <IngredientForm
      v-model="showIngredientForm"
      :categories="ingredientStore.categories"
      :edit-data="editIngredient"
      @submit="handleIngredientFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useRecipeStore } from '@/stores/useRecipeStore'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { recipeApi } from '@/api'
import CardList from '@/components/common/CardList.vue'
import RecipeCard from '@/components/recipe/RecipeCard.vue'
import RecipeForm from '@/components/recipe/RecipeForm.vue'
import RecipePreview from '@/components/recipe/RecipePreview.vue'
import IngredientPreview from '@/components/ingredient/IngredientPreview.vue'
import IngredientForm from '@/components/ingredient/IngredientForm.vue'
import type { Recipe, Ingredient } from '@/types'

const router = useRouter()
const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()

const searchText = ref('')
const showPreview = ref(false)
const showForm = ref(false)
const currentRecipe = ref<Recipe | null>(null)
const editRecipe = ref<Recipe | null>(null)

const showIngredientPreview = ref(false)
const currentIngredient = ref<Ingredient | null>(null)

// 新增：暂存相关状态
const showIngredientForm = ref(false)
const editIngredient = ref<Ingredient | null>(null)
const pendingRecipeFormData = ref<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> | null>(null)
const pendingMissingIngredients = ref<string[]>([])
const currentPendingIngredientIndex = ref(0)

// 新增：暂存幽灵食材创建相关状态
const pendingGhostIngredientName = ref('')
const pendingGhostIngredientId = ref('')
const isCreatingFromGhost = ref(false)

function handleSearch() {
  if (searchText.value.trim()) {
    router.push({
      path: '/search',
      query: {
        keyword: searchText.value.trim(),
        type: 'recipe'
      }
    })
  }
}

onMounted(async () => {
  await recipeStore.fetchAll()
  await ingredientStore.fetchAll()
  // 仅在分类和菜谱都为空时初始化默认数据（首次使用）
  if (recipeStore.categories.length === 0 && recipeStore.recipes.length === 0) {
    await initDefaultData()
  }
})

async function initDefaultData() {
  // 添加默认分类：早餐、午餐、晚餐、甜点
  const cat1 = await recipeStore.addCategory('早餐')
  const cat2 = await recipeStore.addCategory('午餐')
  const cat3 = await recipeStore.addCategory('晚餐')
  const cat4 = await recipeStore.addCategory('甜点')

  await recipeStore.addRecipe({
    name: '番茄炒蛋',
    categoryId: cat2.id,
    image: '',
    ingredients: [],
    taste: '酸甜',
    steps: '1. 西红柿切块，鸡蛋打散\n2. 锅热下油，先炒鸡蛋盛出\n3. 再下番茄炒软，加盐和糖\n4. 倒入炒好的鸡蛋翻炒均匀',
    cookingTime: 15,
    servings: 2,
    difficulty: 'easy'
  })

  await recipeStore.addRecipe({
    name: '宫保鸡丁',
    categoryId: cat3.id,
    image: '',
    ingredients: [],
    taste: '麻辣',
    steps: '1. 鸡胸肉切丁，加生抽料酒腌制\n2. 花生米炸香备用\n3. 热锅炒鸡丁\n4. 加干辣椒花椒\n5. 调酱汁翻炒均匀出锅',
    cookingTime: 20,
    servings: 3,
    difficulty: 'medium'
  })

  await recipeStore.addRecipe({
    name: '提拉米苏',
    categoryId: cat4.id,
    image: '',
    ingredients: [],
    taste: '甜',
    steps: '1. 制作马斯卡彭芝士糊\n2. 咖啡浸泡手指饼干\n3. 分层铺放\n4. 冷藏6小时以上',
    cookingTime: 30,
    servings: 6,
    difficulty: 'hard'
  })
}

function handleCardClick(recipe: Recipe) {
  currentRecipe.value = recipe
  showPreview.value = true
}

function handleAddRecipe() {
  editRecipe.value = null
  showForm.value = true
}

function handleEditRecipe() {
  editRecipe.value = currentRecipe.value
  showPreview.value = false
  showForm.value = true
}

async function handleDeleteRecipe() {
  if (!currentRecipe.value) return
  await recipeStore.deleteRecipe(currentRecipe.value.id)
  ElMessage.success('删除成功')
}

async function handleFormSubmit(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
  console.log('🔵 [DEBUG] 收到提交数据:', data)
  console.log('🔵 [DEBUG] 当前 selectedIngredients 在 Form 中:', data.ingredients)
  
  // 如果 editRecipe 的 id 是空字符串，说明是新增模式
  const isEditMode = editRecipe.value && editRecipe.value.id !== ''
  const excludeId = isEditMode ? editRecipe.value?.id : undefined
  
  if (recipeStore.isRecipeNameExist(data.name, excludeId)) {
    ElMessage.error('该菜谱名称已存在，请使用其他名称')
    return
  }
  
  if (isEditMode) {
    console.log('🟡 [DEBUG] 准备更新菜谱 ID:', editRecipe.value.id)
    await recipeStore.updateRecipe(editRecipe.value.id, data)
    ElMessage.success('更新成功')
  } else {
    console.log('🟢 [DEBUG] 准备添加新菜谱')
    await recipeStore.addRecipe(data)
    ElMessage.success('添加成功')
  }
  
  // 调试：直接从 API 读取一下看看数据有没有保存成功！
  console.log('📝 [DEBUG] 保存后 recipeStore.recipes 内容:', recipeStore.recipes)
  
  // 调试：直接从 IndexedDB 读取验证
  const allRecipesFromDB = await recipeApi.getAllRecipes()
  console.log('💾 [DEBUG] IndexedDB 中的菜谱:', allRecipesFromDB)
  
  // 清空 editRecipe 并关闭表单
  editRecipe.value = null
  showForm.value = false
}

async function handleAddCategory() {
  const { value } = await ElMessageBox.prompt('请输入分类名称', '新增分类', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '分类名称不能为空'
  })

  if (value) {
    if (recipeStore.isCategoryNameExist(value)) {
      ElMessage.error('该分类名称已存在，请使用其他名称')
      return
    }
    await recipeStore.addCategory(value)
    ElMessage.success('添加成功')
  }
}

async function handleEditCategory(category: any) {
  const { value } = await ElMessageBox.prompt('请输入分类名称', '编辑分类', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: category.name,
    inputPattern: /\S+/,
    inputErrorMessage: '分类名称不能为空'
  })

  if (value) {
    if (recipeStore.isCategoryNameExist(value, category.id)) {
      ElMessage.error('该分类名称已存在，请使用其他名称')
      return
    }
    await recipeStore.updateCategory(category.id, value)
    ElMessage.success('更新成功')
  }
}

async function handleDeleteCategory(category: any) {
  await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await recipeStore.deleteCategory(category.id)
  ElMessage.success('删除成功')
}

function handleIngredientClick(ingredientId: string) {
  const ing = ingredientStore.ingredients.find(i => i.id === ingredientId)
  if (ing) {
    showPreview.value = false
    currentIngredient.value = ing
    showIngredientPreview.value = true
  }
}

function handlePreviewRecipeClick(recipe: Recipe) {
  showIngredientPreview.value = false
  currentRecipe.value = recipe
  showPreview.value = true
}

function handleEditIngredient() {
  ElMessage.info('编辑食材请跳转到食材页面')
}

async function handleDeleteIngredient() {
  if (!currentIngredient.value) return
  try {
    await ElMessageBox.confirm('确定要删除这个食材吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await ingredientStore.deleteIngredient(currentIngredient.value.id)
    showIngredientPreview.value = false
    ElMessage.success('删除成功')
  } catch {}
}

async function handleAddIngredient(data: any) {
  try {
    if (ingredientStore.isIngredientNameExist(data.name)) {
      ElMessage.warning('该食材已存在')
      return
    }
    await ingredientStore.addIngredient(data)
    ElMessage.success('食材添加成功')
  } catch (error) {
    ElMessage.error('添加食材失败')
  }
}

async function handleGhostDelete(ingredientId: string) {
  if (!currentRecipe.value) return
  const updatedIngredients = currentRecipe.value.ingredients.filter(i => i.id !== ingredientId)
  await recipeStore.updateRecipe(currentRecipe.value.id, { ingredients: updatedIngredients })
  
  // 更新 currentRecipe，让弹窗实时刷新
  currentRecipe.value = {
    ...currentRecipe.value,
    ingredients: updatedIngredients
  }
  
  ElMessage.success('已从菜谱中移除该食材')
}

function handleGhostCreate(ingredientName: string) {
  // 先检查名称是否已存在
  if (ingredientStore.isIngredientNameExist(ingredientName)) {
    ElMessage.warning('该食材名称已存在，请使用其他名称')
    return
  }
  
  const firstCategory = ingredientStore.categories[0]
  if (!firstCategory) {
    ElMessage.error('请先创建食材分类')
    return
  }
  
  // 暂存幽灵食材信息
  pendingGhostIngredientName.value = ingredientName
  pendingGhostIngredientId.value = currentRecipe.value?.ingredients.find(i => i.name === ingredientName)?.id || ''
  isCreatingFromGhost.value = true
  
  // 打开食材创建表单，预填名称
  const tempIng = {
    id: '',
    name: ingredientName,
    categoryId: firstCategory.id,
    image: '',
    effect: '',
    processingMethod: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  editIngredient.value = tempIng
  showIngredientForm.value = true
}

// 处理不存在食材的事件
function handleNeedAddMissingIngredients(missingNames: string[], formData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
  // 暂存菜谱表单数据
  pendingRecipeFormData.value = formData
  pendingMissingIngredients.value = missingNames
  currentPendingIngredientIndex.value = 0
  
  // 关闭菜谱表单
  showForm.value = false
  
  // 打开第一个食材的创建表单
  openNextIngredientForm()
}

// 打开下一个需要创建的食材表单
function openNextIngredientForm() {
  if (currentPendingIngredientIndex.value >= pendingMissingIngredients.value.length) {
    // 所有食材都创建完了，继续保存菜谱
    continueSaveRecipe()
    return
  }
  
  const name = pendingMissingIngredients.value[currentPendingIngredientIndex.value]
  const firstCategory = ingredientStore.categories[0]
  
  if (!firstCategory) {
    ElMessage.error('请先创建食材分类')
    return
  }
  
  // 打开食材创建表单，预填名称
  editIngredient.value = null
  // 设置一个临时数据，让表单预填名称
  showIngredientForm.value = true
  // 通过 nextTick 让表单打开后再设置初始值
  setTimeout(() => {
    // 我们需要设置初始值，让 IngredientForm 预填
    // 由于 IngredientForm 需要 editData，我们创建一个临时对象
    const tempIng = {
      id: '',
      name,
      categoryId: firstCategory.id,
      image: '',
      effect: '',
      processingMethod: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    editIngredient.value = tempIng
  }, 50)
}

// 处理食材表单提交
async function handleIngredientFormSubmit(data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) {
  if (isCreatingFromGhost.value) {
    // 处理从幽灵食材创建的情况
    const newIngredient = await ingredientStore.addIngredient(data)
    
    // 更新 currentRecipe，把幽灵项替换成新的食材
    if (currentRecipe.value && pendingGhostIngredientId.value) {
      const updatedIngredients = currentRecipe.value.ingredients.map(ing => {
        if (ing.id === pendingGhostIngredientId.value) {
          return { id: newIngredient.id, name: newIngredient.name }
        }
        return ing
      })
      
      // 更新到 store
      await recipeStore.updateRecipe(currentRecipe.value.id, { ingredients: updatedIngredients })
      
      // 更新 currentRecipe，让弹窗实时刷新
      currentRecipe.value = {
        ...currentRecipe.value,
        ingredients: updatedIngredients
      }
    }
    
    // 重置暂存状态
    pendingGhostIngredientName.value = ''
    pendingGhostIngredientId.value = ''
    isCreatingFromGhost.value = false
    
    ElMessage.success('食材创建成功')
    showIngredientForm.value = false
  } else if (pendingRecipeFormData.value) {
    // 处理创建菜谱时缺失食材的情况
    await ingredientStore.addIngredient(data)
    ElMessage.success('食材创建成功')
    
    // 关闭食材表单
    showIngredientForm.value = false
    
    // 索引+1，打开下一个（如果有），或者继续保存菜谱
    currentPendingIngredientIndex.value++
    openNextIngredientForm()
  } else {
    // 其他情况（直接添加食材）
    await ingredientStore.addIngredient(data)
    ElMessage.success('食材添加成功')
    showIngredientForm.value = false
  }
}

// 继续保存菜谱
async function continueSaveRecipe() {
  if (!pendingRecipeFormData.value) return
  
  // 构建新的食材列表（替换 temp ID）
  const updatedIngredients = pendingRecipeFormData.value.ingredients.map(ing => {
    if (ing.id.startsWith('temp_')) {
      // 查找刚创建的同名食材
      const found = ingredientStore.ingredients.find(i => i.name === ing.name)
      if (found) {
        return { id: found.id, name: found.name }
      }
    }
    return ing
  }).filter(ing => !ing.id.startsWith('temp_'))
  
  // 构建最终提交数据
  const finalData = {
    ...pendingRecipeFormData.value,
    ingredients: updatedIngredients
  }
  
  // 清空暂存状态
  const saveData = finalData // 先保存引用
  pendingRecipeFormData.value = null
  pendingMissingIngredients.value = []
  currentPendingIngredientIndex.value = 0
  
  // 直接调用保存函数，不要设置 editRecipe（避免被识别为更新模式）
  await handleFormSubmit(saveData)
}
</script>

<style scoped lang="scss">
.recipe-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.search-bar {
  padding: 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background: white;
}

.search-input {
  width: 100%;
}

.category-footer {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.category-footer .el-button {
  margin: 0 !important;
}
</style>
