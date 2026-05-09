export interface Recipe {
  id: string
  name: string
  categoryId: string
  image: string
  ingredients: { id: string; name: string }[]
  taste: string
  steps: string
  cookingTime: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  createdAt: number
  updatedAt: number
}

export interface RecipeCategory {
  id: string
  name: string
  sortOrder: number
}
