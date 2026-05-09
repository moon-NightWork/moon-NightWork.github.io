import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { folderApi } from '@/api'
import { generateId } from '@/utils/helpers'
import type { Folder } from '@/types'

export const useFolderStore = defineStore('folder', () => {
  const folders = ref<Folder[]>([])
  const loading = ref(false)

  const getFoldersByType = computed(() => {
    return (type: 'ingredient' | 'recipe') => {
      return folders.value.filter(f => f.type === type)
    }
  })

  function isNameExist(name: string, type: 'ingredient' | 'recipe', excludeId?: string): boolean {
    return folders.value.some(f => f.type === type && f.name === name && f.id !== excludeId)
  }

  function isInFolder(folderId: string, itemId: string): boolean {
    const folder = folders.value.find(f => f.id === folderId)
    return folder ? folder.itemIds.includes(itemId) : false
  }

  function getFolderIdsByItem(itemId: string, type: 'ingredient' | 'recipe'): string[] {
    return folders.value
      .filter(f => f.type === type && f.itemIds.includes(itemId))
      .map(f => f.id)
  }

  async function fetchAll() {
    loading.value = true
    try {
      folders.value = await folderApi.getAllFolders()
      // 如果没有默认收藏夹，创建它们
      await ensureDefaultFolders()
    } finally {
      loading.value = false
    }
  }

  async function ensureDefaultFolders() {
    const hasIngredientFolder = folders.value.some(f => f.type === 'ingredient')
    const hasRecipeFolder = folders.value.some(f => f.type === 'recipe')

    if (!hasIngredientFolder) {
      await addFolder('我的食材', 'ingredient')
    }
    if (!hasRecipeFolder) {
      await addFolder('我的菜谱', 'recipe')
    }
  }

  async function addFolder(name: string, type: 'ingredient' | 'recipe') {
    const newFolder: Folder = {
      id: generateId(),
      name,
      type,
      itemIds: []
    }
    folders.value.push(newFolder)
    await folderApi.saveFolder(newFolder)
    return newFolder
  }

  async function updateFolder(id: string, name: string) {
    const index = folders.value.findIndex(f => f.id === id)
    if (index !== -1) {
      folders.value[index].name = name
      await folderApi.saveFolder(folders.value[index])
    }
  }

  async function deleteFolder(id: string) {
    folders.value = folders.value.filter(f => f.id !== id)
    await folderApi.deleteFolder(id)
  }

  async function addToFolder(folderId: string, itemId: string) {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder && !folder.itemIds.includes(itemId)) {
      folder.itemIds.push(itemId)
      await folderApi.addItemToFolder(folderId, itemId)
    }
  }

  async function removeFromFolder(folderId: string, itemId: string) {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      folder.itemIds = folder.itemIds.filter(id => id !== itemId)
      await folderApi.removeItemFromFolder(folderId, itemId)
    }
  }

  async function removeItemRef(itemId: string) {
    for (const folder of folders.value) {
      if (folder.itemIds.includes(itemId)) {
        folder.itemIds = folder.itemIds.filter(id => id !== itemId)
      }
    }
    await folderApi.removeItemRefFromAllFolders(itemId)
  }

  return {
    folders,
    loading,
    getFoldersByType,
    isNameExist,
    isInFolder,
    getFolderIdsByItem,
    fetchAll,
    addFolder,
    updateFolder,
    deleteFolder,
    addToFolder,
    removeFromFolder,
    removeItemRef
  }
})
