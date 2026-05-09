import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ingredientApi } from '@/api'
import { generateId } from '@/utils/helpers'
import type { Ingredient, IngredientCategory } from '@/types'
import { useRecipeStore } from './useRecipeStore'
import { useFolderStore } from './useFolderStore'
import { useUserStore } from './useUserStore'

export const useIngredientStore = defineStore('ingredient', () => {
  const ingredients = ref<Ingredient[]>([])
  const categories = ref<IngredientCategory[]>([])
  const loading = ref(false)

  function isCategoryNameExist(name: string, excludeId?: string) {
    return categories.value.some(cat => 
      cat.name === name && cat.id !== excludeId
    )
  }

  function isIngredientNameExist(name: string, excludeId?: string) {
    return ingredients.value.some(ing => 
      ing.name === name && ing.id !== excludeId
    )
  }

  const getByCategory = computed(() => {
    return (catId: string) => {
      return ingredients.value.filter((i) => i.categoryId === catId)
    }
  })

  // 获取包含指定食材的相关菜谱
  const getRelatedRecipes = computed(() => {
    return (ingredientId: string) => {
      const recipeStore = useRecipeStore()
      return recipeStore.getRecipesByIngredient(ingredientId)
    }
  })

  async function fetchAll() {
    loading.value = true
    try {
      ingredients.value = await ingredientApi.getAllIngredients()
      categories.value = await ingredientApi.getAllCategories()
    } finally {
      loading.value = false
    }
  }

  async function addIngredient(data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) {
    const newItem: Ingredient = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    ingredients.value.push(newItem)
    await ingredientApi.saveIngredient(newItem)
    return newItem
  }

  async function updateIngredient(id: string, data: Partial<Ingredient>) {
    const index = ingredients.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      const updated = {
        ...ingredients.value[index],
        ...data,
        updatedAt: Date.now()
      }
      ingredients.value[index] = updated
      await ingredientApi.saveIngredient(updated)
    }
  }

  async function deleteIngredient(id: string) {
    // 删除食材，并清理所有相关引用
    ingredients.value = ingredients.value.filter((i) => i.id !== id)
    
    // 清理菜谱中的食材引用
    const recipeStore = useRecipeStore()
    await recipeStore.removeIngredientRef(id)
    
    // 清理收藏夹中的引用
    const folderStore = useFolderStore()
    await folderStore.removeItemRef(id, 'ingredient')
    
    // 清理成员库中的引用
    const userStore = useUserStore()
    await userStore.removeIngredientRef(id)
    
    await ingredientApi.deleteIngredient(id)
  }

  async function addCategory(name: string) {
    const newCat: IngredientCategory = {
      id: generateId(),
      name,
      sortOrder: categories.value.length
    }
    categories.value.push(newCat)
    await ingredientApi.saveCategory(newCat)
    return newCat
  }

  async function updateCategory(id: string, name: string) {
    const index = categories.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      categories.value[index].name = name
      await ingredientApi.saveCategory(categories.value[index])
    }
  }

  async function deleteCategory(id: string) {
    categories.value = categories.value.filter((c) => c.id !== id)
    await ingredientApi.deleteCategory(id)
  }

  return {
    ingredients,
    categories,
    loading,
    getByCategory,
    getRelatedRecipes,
    isCategoryNameExist,
    isIngredientNameExist,
    fetchAll,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
