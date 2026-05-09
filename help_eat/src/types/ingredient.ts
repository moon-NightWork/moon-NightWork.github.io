export interface Ingredient {
  id: string
  name: string
  categoryId: string
  image: string
  effect: string
  processingMethod: string
  createdAt: number
  updatedAt: number
}

export interface IngredientCategory {
  id: string
  name: string
  sortOrder: number
}
