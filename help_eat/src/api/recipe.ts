import { db } from './db'
import type { Recipe, RecipeCategory } from '@/types'

export const recipeApi = {
  async getAllRecipes(): Promise<Recipe[]> {
    return db.recipes.getAll()
  },

  async getRecipe(id: string): Promise<Recipe | null> {
    return db.recipes.get(id)
  },

  async saveRecipe(recipe: Recipe): Promise<void> {
    return db.recipes.put(recipe)
  },

  async deleteRecipe(id: string): Promise<void> {
    return db.recipes.delete(id)
  },

  async getAllCategories(): Promise<RecipeCategory[]> {
    return db.recipeCategories.getAll()
  },

  async saveCategory(category: RecipeCategory): Promise<void> {
    return db.recipeCategories.put(category)
  },

  async deleteCategory(id: string): Promise<void> {
    return db.recipeCategories.delete(id)
  }
}
