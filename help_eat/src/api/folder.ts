import { db } from './db'
import type { Folder } from '@/types'

export const folderApi = {
  async getAllFolders(): Promise<Folder[]> {
    return db.folders.getAll()
  },

  async getFolder(id: string): Promise<Folder | null> {
    return db.folders.get(id)
  },

  async getFoldersByType(type: 'ingredient' | 'recipe'): Promise<Folder[]> {
    const folders = await this.getAllFolders()
    return folders.filter(f => f.type === type)
  },

  async saveFolder(folder: Folder): Promise<void> {
    return db.folders.put(folder)
  },

  async deleteFolder(id: string): Promise<void> {
    return db.folders.delete(id)
  },

  async addItemToFolder(folderId: string, itemId: string): Promise<void> {
    const folder = await this.getFolder(folderId)
    if (folder && !folder.itemIds.includes(itemId)) {
      folder.itemIds.push(itemId)
      await this.saveFolder(folder)
    }
  },

  async removeItemFromFolder(folderId: string, itemId: string): Promise<void> {
    const folder = await this.getFolder(folderId)
    if (folder) {
      folder.itemIds = folder.itemIds.filter(id => id !== itemId)
      await this.saveFolder(folder)
    }
  },

  async removeItemRefFromAllFolders(itemId: string): Promise<void> {
    const folders = await this.getAllFolders()
    for (const folder of folders) {
      if (folder.itemIds.includes(itemId)) {
        folder.itemIds = folder.itemIds.filter(id => id !== itemId)
        await this.saveFolder(folder)
      }
    }
  }
}
