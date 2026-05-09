export interface Folder {
  id: string
  name: string
  type: 'ingredient' | 'recipe'
  itemIds: string[]
}
