import localforage from 'localforage'
import type {
  Ingredient,
  IngredientCategory,
  Recipe,
  RecipeCategory,
  Folder,
  FamilyMember,
  AIChatSession,
  AISettings
} from '@/types'

localforage.config({
  name: 'one-day-three-meals',
  version: 1.0,
  storeName: 'app_data'
})

export const db = {
  ingredients: createStore<Ingredient>('ingredients'),
  ingredientCategories: createStore<IngredientCategory>('ingredientCategories'),
  recipes: createStore<Recipe>('recipes'),
  recipeCategories: createStore<RecipeCategory>('recipeCategories'),
  folders: createStore<Folder>('folders'),
  members: createStore<FamilyMember>('members'),
  aiSessions: createStore<AIChatSession>('aiSessions'),
  aiSettings: localforage.createInstance({
    name: 'one-day-three-meals',
    storeName: 'aiSettings'
  })
}

function createStore<T extends { id: string }>(storeName: string) {
  const store = localforage.createInstance({
    name: 'one-day-three-meals',
    storeName
  })

  return {
    async getAll(): Promise<T[]> {
      const items: T[] = []
      await store.iterate((value: T) => {
        items.push(value)
      })
      return items
    },

    async get(id: string): Promise<T | null> {
      const item = await store.getItem<T>(id)
      return item || null
    },

    async put(item: T): Promise<void> {
      // 关键修复：把 Vue Proxy 对象转换为普通对象
      const plainItem = JSON.parse(JSON.stringify(item))
      await store.setItem(item.id, plainItem)
    },

    async delete(id: string): Promise<void> {
      await store.removeItem(id)
    },

    async clear(): Promise<void> {
      await store.clear()
    }
  }
}
