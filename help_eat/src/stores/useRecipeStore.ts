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
    loading.value = true
    try {
      const loadedRecipes = await recipeApi.getAllRecipes()
      const loadedCategories = await recipeApi.getAllCategories()
      
      recipes.value = loadedRecipes
      categories.value = loadedCategories
    } finally {
      loading.value = false
    }
  }

  async function addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
    const newItem: Recipe = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    recipes.value.push(newItem)
    await recipeApi.saveRecipe(newItem)
    return newItem
  }

  async function updateRecipe(id: string, data: Partial<Recipe>) {
    const index = recipes.value.findIndex((r) => r.id === id)
    
    if (index !== -1) {
      const updated = {
        ...recipes.value[index],
        ...data,
        updatedAt: Date.now()
      }
      recipes.value[index] = updated
      await recipeApi.saveRecipe(updated)
    }
  }

  async function deleteRecipe(id: string) {
    recipes.value = recipes.value.filter((r) => r.id !== id)
    
    // 清理收藏夹中的引用
    const folderStore = useFolderStore()
    await folderStore.removeItemRef(id, 'recipe')
    
    // 清理成员库中的引用
    const userStore = useUserStore()
    await userStore.removeRecipeRef(id)
    
    await recipeApi.deleteRecipe(id)
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
