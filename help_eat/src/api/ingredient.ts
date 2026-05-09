import { db } from './db'
import type { Ingredient, IngredientCategory } from '@/types'

export const ingredientApi = {
  async getAllIngredients(): Promise<Ingredient[]> {
    return db.ingredients.getAll()
  },

  async getIngredient(id: string): Promise<Ingredient | null> {
    return db.ingredients.get(id)
  },

  async saveIngredient(ingredient: Ingredient): Promise<void> {
    return db.ingredients.put(ingredient)
  },

  async deleteIngredient(id: string): Promise<void> {
    return db.ingredients.delete(id)
  },

  async getAllCategories(): Promise<IngredientCategory[]> {
    return db.ingredientCategories.getAll()
  },

  async saveCategory(category: IngredientCategory): Promise<void> {
    return db.ingredientCategories.put(category)
  },

  async deleteCategory(id: string): Promise<void> {
    return db.ingredientCategories.delete(id)
  }
}
