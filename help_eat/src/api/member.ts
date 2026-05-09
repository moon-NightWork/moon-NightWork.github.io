import { db } from './db'
import type { FamilyMember, MemberLibrary } from '@/types'

export const memberApi = {
  async getAllMembers(): Promise<FamilyMember[]> {
    return db.members.getAll()
  },

  async getMember(id: string): Promise<FamilyMember | null> {
    return db.members.get(id)
  },

  async saveMember(member: FamilyMember): Promise<void> {
    return db.members.put(member)
  },

  async deleteMember(id: string): Promise<void> {
    return db.members.delete(id)
  },

  async removeIngredientRef(ingredientId: string): Promise<void> {
    const members = await this.getAllMembers()
    for (const member of members) {
      let updated = false
      for (const library of member.libraries) {
        if (library.type === 'ingredient' && library.itemIds.includes(ingredientId)) {
          library.itemIds = library.itemIds.filter(id => id !== ingredientId)
          updated = true
        }
      }
      if (updated) {
        await this.saveMember(member)
      }
    }
  },

  async removeRecipeRef(recipeId: string): Promise<void> {
    const members = await this.getAllMembers()
    for (const member of members) {
      let updated = false
      for (const library of member.libraries) {
        if (library.type === 'recipe' && library.itemIds.includes(recipeId)) {
          library.itemIds = library.itemIds.filter(id => id !== recipeId)
          updated = true
        }
      }
      if (updated) {
        await this.saveMember(member)
      }
    }
  }
}
