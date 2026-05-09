import localforage from 'localforage'
import type { User } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

const userStore = localforage.createInstance({
  name: 'one-day-three-meals',
  storeName: 'user'
})

const DEFAULT_USER: User = {
  avatar: '',
  username: '美食家'
}

export const userApi = {
  async getUser(): Promise<User> {
    let user = await userStore.getItem<User>(STORAGE_KEYS.USER)
    if (!user) {
      user = DEFAULT_USER
      await this.saveUser(user)
    }
    return user
  },

  async saveUser(user: User): Promise<void> {
    await userStore.setItem(STORAGE_KEYS.USER, user)
  },

  async resetUser(): Promise<void> {
    await this.saveUser(DEFAULT_USER)
  }
}
