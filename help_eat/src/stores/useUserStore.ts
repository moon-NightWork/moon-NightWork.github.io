import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi, memberApi } from '@/api'
import { generateId } from '@/utils/helpers'
import type { User, FamilyMember, MemberLibrary } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const members = ref<FamilyMember[]>([])
  const loading = ref(false)

  function calculateBMI(height: number, weight: number): number {
    if (height <= 0 || weight <= 0) return 0
    const heightInMeters = height / 100
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
  }

  async function fetchUser() {
    loading.value = true
    try {
      user.value = await userApi.getUser()
    } finally {
      loading.value = false
    }
  }

  async function updateUser(data: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...data }
      await userApi.saveUser(user.value)
    }
  }

  async function fetchMembers() {
    loading.value = true
    try {
      members.value = await memberApi.getAllMembers()
    } finally {
      loading.value = false
    }
  }

  async function addMember(data: Omit<FamilyMember, 'id'>) {
    // 确保有默认的库
    const memberData = {
      ...data,
      libraries: data.libraries || [
        {
          id: generateId(),
          name: '常用食材',
          type: 'ingredient' as const,
          itemIds: []
        },
        {
          id: generateId(),
          name: '常用菜谱',
          type: 'recipe' as const,
          itemIds: []
        }
      ]
    }

    const newMember: FamilyMember = {
      ...memberData,
      id: generateId()
    }
    members.value.push(newMember)
    await memberApi.saveMember(newMember)
    return newMember
  }

  async function updateMember(id: string, data: Partial<FamilyMember>) {
    const index = members.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const updated = { ...members.value[index], ...data }
      members.value[index] = updated
      await memberApi.saveMember(updated)
    }
  }

  async function deleteMember(id: string) {
    members.value = members.value.filter(m => m.id !== id)
    await memberApi.deleteMember(id)
  }

  // 成员饮食库操作
  function getMemberLibraries(memberId: string, type: 'ingredient' | 'recipe'): MemberLibrary[] {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return []
    return member.libraries.filter(l => l.type === type)
  }

  function isLibraryNameExist(memberId: string, name: string, type: 'ingredient' | 'recipe', excludeId?: string): boolean {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return false
    return member.libraries.some(l => l.type === type && l.name === name && l.id !== excludeId)
  }

  async function addLibrary(memberId: string, name: string, type: 'ingredient' | 'recipe') {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return null

    const newLibrary: MemberLibrary = {
      id: generateId(),
      name,
      type,
      itemIds: []
    }
    member.libraries.push(newLibrary)
    await memberApi.saveMember(member)
    return newLibrary
  }

  async function updateLibrary(memberId: string, libraryId: string, name: string) {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return

    const library = member.libraries.find(l => l.id === libraryId)
    if (library) {
      library.name = name
      await memberApi.saveMember(member)
    }
  }

  async function deleteLibrary(memberId: string, libraryId: string) {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return

    member.libraries = member.libraries.filter(l => l.id !== libraryId)
    await memberApi.saveMember(member)
  }

  async function addToLibrary(memberId: string, libraryId: string, itemId: string) {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return

    const library = member.libraries.find(l => l.id === libraryId)
    if (library && !library.itemIds.includes(itemId)) {
      library.itemIds.push(itemId)
      await memberApi.saveMember(member)
    }
  }

  async function removeFromLibrary(memberId: string, libraryId: string, itemId: string) {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return

    const library = member.libraries.find(l => l.id === libraryId)
    if (library) {
      library.itemIds = library.itemIds.filter(id => id !== itemId)
      await memberApi.saveMember(member)
    }
  }

  async function clearLibrary(memberId: string, libraryId: string) {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return

    const library = member.libraries.find(l => l.id === libraryId)
    if (library) {
      library.itemIds = []
      await memberApi.saveMember(member)
    }
  }

  async function removeIngredientRef(ingredientId: string) {
    for (const member of members.value) {
      for (const library of member.libraries) {
        if (library.type === 'ingredient' && library.itemIds.includes(ingredientId)) {
          library.itemIds = library.itemIds.filter(id => id !== ingredientId)
        }
      }
    }
    await memberApi.removeIngredientRef(ingredientId)
  }

  async function removeRecipeRef(recipeId: string) {
    for (const member of members.value) {
      for (const library of member.libraries) {
        if (library.type === 'recipe' && library.itemIds.includes(recipeId)) {
          library.itemIds = library.itemIds.filter(id => id !== recipeId)
        }
      }
    }
    await memberApi.removeRecipeRef(recipeId)
  }

  return {
    user,
    members,
    loading,
    calculateBMI,
    fetchUser,
    updateUser,
    fetchMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberLibraries,
    isLibraryNameExist,
    addLibrary,
    updateLibrary,
    deleteLibrary,
    addToLibrary,
    removeFromLibrary,
    clearLibrary,
    removeIngredientRef,
    removeRecipeRef
  }
})
