import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { recipeApi } from '@/api'
import { generateId } from '@/utils/helpers'
import type { Recipe, RecipeCategory } from '@/types'
import { useFolderStore } from './useFolderStore'
import { useUserStore } from './useUserStore'

export const useRecipeStore = defineStore('recipe', () => {
  const recipes = ref<Recipe[]>([])
  const categories = ref<RecipeCategory[]>([])
  const loading = ref(false)

  function isCategoryNameExist(name: string, excludeId?: string) {
    return categories.value.some(cat => 
      cat.name === name && cat.id !== excludeId
    )
  }

  function isRecipeNameExist(name: string, excludeId?: string) {
    return recipes.value.some(rec => 
      rec.name === name && rec.id !== excludeId
    )
  }

  const getByCategory = computed(() => {
    return (catId: string) => {
      return recipes.value.filter((r) => r.categoryId === catId)
    }
  })

  // 获取包含指定食材的所有菜谱
  const getRecipesByIngredient = computed(() => {
    return (ingredientId: string) => {
      return recipes.value.filter(r => 
        r.ingredients.some(i => i.id === ingredientId)
      )
    }
  })

  // 从所有菜谱中删除指定食材引用
  async function removeIngredientRef(ingredientId: string) {
    for (const recipe of recipes.value) {
      const hasIngredient = recipe.ingredients.some(i => i.id === ingredientId)
      if (hasIngredient) {
        const updatedIngredients = recipe.ingredients.filter(i => i.id !== ingredientId)
        await updateRecipe(recipe.id, { ingredients: updatedIngredients })
      }
    }
  }

  async function fetchAll() {
    console.log('🚀 [Store.fetchAll] 开始读取数据...')
    loading.value = true
    try {
      const loadedRecipes = await recipeApi.getAllRecipes()
      const loadedCategories = await recipeApi.getAllCategories()
      
      console.log('  ✅ 从 API 读取到的 recipes:', loadedRecipes)
      console.log('  ✅ 从 API 读取到的 categories:', loadedCategories)
      
      recipes.value = loadedRecipes
      categories.value = loadedCategories
      
      console.log('  ✅ Store 已更新！当前 recipes 内容:', recipes.value)
    } finally {
      loading.value = false
    }
  }

  async function addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
    console.log('➕ [Store.addRecipe] 开始添加菜谱，输入数据:', data)
    const newItem: Recipe = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    console.log('  ✅ 准备保存的完整对象:', newItem)
    recipes.value.push(newItem)
    await recipeApi.saveRecipe(newItem)
    console.log('  ✅ 保存成功！当前 recipes:', recipes.value)
    return newItem
  }

  async function updateRecipe(id: string, data: Partial<Recipe>) {
    console.log('✏️ [Store.updateRecipe] 开始更新菜谱')
    console.log('  ID:', id)
    console.log('  更新数据:', data)
    
    const index = recipes.value.findIndex((r) => r.id === id)
    console.log('  在 recipes 中找到的索引:', index)
    
    if (index !== -1) {
      const updated = {
        ...recipes.value[index],
        ...data,
        updatedAt: Date.now()
      }
      console.log('  更新后的对象:', updated)
      recipes.value[index] = updated
      await recipeApi.saveRecipe(updated)
      console.log('  ✅ 更新成功！当前 recipes:', recipes.value)
    } else {
      console.log('  ❌ 找不到该 ID 的菜谱！')
    }
  }

  async function deleteRecipe(id: string) {
    console.log('🗑️ [Store.deleteRecipe] 删除 ID:', id)
    recipes.value = recipes.value.filter((r) => r.id !== id)
    
    // 清理收藏夹中的引用
    const folderStore = useFolderStore()
    await folderStore.removeItemRef(id, 'recipe')
    
    // 清理成员库中的引用
    const userStore = useUserStore()
    await userStore.removeRecipeRef(id)
    
    await recipeApi.deleteRecipe(id)
    console.log('  ✅ 删除成功！')
  }

  async function addCategory(name: string) {
    const newCat: RecipeCategory = {
      id: generateId(),
      name,
      sortOrder: categories.value.length
    }
    categories.value.push(newCat)
    await recipeApi.saveCategory(newCat)
    return newCat
  }

  async function updateCategory(id: string, name: string) {
    const index = categories.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      categories.value[index].name = name
      await recipeApi.saveCategory(categories.value[index])
    }
  }

  async function deleteCategory(id: string) {
    categories.value = categories.value.filter((c) => c.id !== id)
    await recipeApi.deleteCategory(id)
  }

  return {
    recipes,
    categories,
    loading,
    getByCategory,
    getRecipesByIngredient,
    isCategoryNameExist,
    isRecipeNameExist,
    fetchAll,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    removeIngredientRef,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
