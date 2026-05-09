export interface MemberLibrary {
  id: string
  name: string
  type: 'ingredient' | 'recipe'
  itemIds: string[]
}

export interface FamilyMember {
  id: string
  name: string
  gender: 'male' | 'female'
  height: number
  weight: number
  age: number
  tags: string[]
  libraries: MemberLibrary[]
}
