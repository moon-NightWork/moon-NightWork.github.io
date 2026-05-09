<template>
  <div class="ingredient-page">
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索食材名称、功效..."
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
      :categories="ingredientStore.categories"
      :items="ingredientStore.ingredients"
      :search-text="''"
      @card-click="handleCardClick"
      @edit-category="handleEditCategory"
      @delete-category="handleDeleteCategory"
    >
      <template #card="{ item, onClick }">
        <IngredientCard :ingredient="item" :recipe-count="getRecipeCount(item.id)" @click="onClick" />
      </template>

      <template #category-footer>
        <div class="category-footer">
          <el-button @click="handleAddCategory">+ 新增分类</el-button>
          <el-button @click="handleAddIngredient">+ 新增食材</el-button>
        </div>
      </template>
    </CardList>

    <IngredientPreview
      v-model="showPreview"
      :ingredient="currentIngredient!"
      :categories="ingredientStore.categories"
      @edit="handleEditIngredient"
      @delete="handleDeleteIngredient"
      @recipe-click="handleRecipeClick"
    />

    <IngredientForm
      v-model="showForm"
      :categories="ingredientStore.categories"
      :edit-data="editIngredient"
      @submit="handleFormSubmit"
    />

    <!-- 菜谱预览弹窗 -->
    <RecipePreview
      v-model="showRecipePreview"
      :recipe="currentRecipe!"
      :categories="recipeStore.categories"
      @edit="handleEditRecipe"
      @delete="handleDeleteRecipe"
      @ingredient-click="handlePreviewIngredientClick"
      @ghost-delete="handleGhostDelete"
      @ghost-create="handleGhostCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useRecipeStore } from '@/stores/useRecipeStore'
import CardList from '@/components/common/CardList.vue'
import IngredientCard from '@/components/ingredient/IngredientCard.vue'
import IngredientForm from '@/components/ingredient/IngredientForm.vue'
import IngredientPreview from '@/components/ingredient/IngredientPreview.vue'
import RecipePreview from '@/components/recipe/RecipePreview.vue'
import type { Ingredient, Recipe } from '@/types'

const router = useRouter()
const ingredientStore = useIngredientStore()
const recipeStore = useRecipeStore()

const searchText = ref('')
const showPreview = ref(false)
const showForm = ref(false)
const currentIngredient = ref<Ingredient | null>(null)
const editIngredient = ref<Ingredient | null>(null)

const showRecipePreview = ref(false)
const currentRecipe = ref<Recipe | null>(null)

function getRecipeCount(ingredientId: string): number {
  return recipeStore.getRecipesByIngredient(ingredientId).length
}

function handleSearch() {
  if (searchText.value.trim()) {
    router.push({
      path: '/search',
      query: {
        keyword: searchText.value.trim(),
        type: 'ingredient'
      }
    })
  }
}

onMounted(async () => {
  await ingredientStore.fetchAll()
  await recipeStore.fetchAll()
  // 仅在分类和食材都为空时初始化默认数据（首次使用）
  if (ingredientStore.categories.length === 0 && ingredientStore.ingredients.length === 0) {
    await initDefaultData()
  }
})

async function initDefaultData() {
  const cat1 = await ingredientStore.addCategory('蔬菜')
  const cat2 = await ingredientStore.addCategory('肉类')
  await ingredientStore.addCategory('海鲜')
  await ingredientStore.addCategory('调料')

  await ingredientStore.addIngredient({
    name: '西红柿',
    categoryId: cat1.id,
    image: '',
    effect: '生津止渴、开胃消食、富含维生素C',
    processingMethod: '用清水冲洗，可切块或切片，炒制时间不宜过长'
  })

  await ingredientStore.addIngredient({
    name: '黄瓜',
    categoryId: cat1.id,
    image: '',
    effect: '清热解毒、生津止渴、利尿',
    processingMethod: '清水冲洗干净，可生食、凉拌或炒制'
  })

  await ingredientStore.addIngredient({
    name: '鸡胸肉',
    categoryId: cat2.id,
    image: '',
    effect: '低脂高蛋白、增强体力、强壮身体',
    processingMethod: '解冻后切片或切丁，可煎、炒、煮，注意不要煮太久以免变老'
  })
}

function handleCardClick(ingredient: Ingredient) {
  currentIngredient.value = ingredient
  showPreview.value = true
}

function handleAddIngredient() {
  editIngredient.value = null
  showForm.value = true
}

function handleEditIngredient() {
  editIngredient.value = currentIngredient.value
  showPreview.value = false
  showForm.value = true
}

async function handleDeleteIngredient() {
  if (!currentIngredient.value) return
  await ingredientStore.deleteIngredient(currentIngredient.value.id)
  ElMessage.success('删除成功')
}

async function handleFormSubmit(data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) {
  const excludeId = editIngredient.value?.id
  
  if (ingredientStore.isIngredientNameExist(data.name, excludeId)) {
    ElMessage.error('该食材名称已存在，请使用其他名称')
    return
  }
  
  if (editIngredient.value) {
    await ingredientStore.updateIngredient(editIngredient.value.id, data)
    ElMessage.success('更新成功')
  } else {
    await ingredientStore.addIngredient(data)
    ElMessage.success('添加成功')
  }
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
    if (ingredientStore.isCategoryNameExist(value)) {
      ElMessage.error('该分类名称已存在，请使用其他名称')
      return
    }
    await ingredientStore.addCategory(value)
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
    if (ingredientStore.isCategoryNameExist(value, category.id)) {
      ElMessage.error('该分类名称已存在，请使用其他名称')
      return
    }
    await ingredientStore.updateCategory(category.id, value)
    ElMessage.success('更新成功')
  }
}

async function handleDeleteCategory(category: any) {
  await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await ingredientStore.deleteCategory(category.id)
  ElMessage.success('删除成功')
}

function handleRecipeClick(recipe: Recipe) {
  showPreview.value = false
  currentRecipe.value = recipe
  showRecipePreview.value = true
}

function handleEditRecipe() {
  ElMessage.info('编辑菜谱请跳转到菜谱页面')
}

async function handleDeleteRecipe() {
  if (!currentRecipe.value) return
  try {
    await ElMessageBox.confirm('确定要删除这个菜谱吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await recipeStore.deleteRecipe(currentRecipe.value.id)
    showRecipePreview.value = false
    ElMessage.success('删除成功')
  } catch {}
}

function handlePreviewIngredientClick(ingredientId: string) {
  const ing = ingredientStore.ingredients.find(i => i.id === ingredientId)
  if (ing) {
    showRecipePreview.value = false
    currentIngredient.value = ing
    showPreview.value = true
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

async function handleGhostCreate(ingredientName: string) {
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
  const newIngredient = await ingredientStore.addIngredient({
    name: ingredientName,
    categoryId: firstCategory.id,
    image: '',
    effect: '',
    processingMethod: ''
  })
  
  // 更新 currentRecipe，把幽灵项替换成新的食材
  if (currentRecipe.value) {
    const updatedIngredients = currentRecipe.value.ingredients.map(ing => {
      if (ing.name === ingredientName && ing.id.startsWith('temp_')) {
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
  
  ElMessage.success('食材创建成功')
}
</script>

<style scoped lang="scss">
.ingredient-page {
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
