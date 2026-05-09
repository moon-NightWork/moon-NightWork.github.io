import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/ingredient'
  },
  {
    path: '/ingredient',
    name: 'Ingredient',
    component: () => import('@/views/Ingredient/Index.vue')
  },
  {
    path: '/ingredient/:id',
    name: 'IngredientDetail',
    component: () => import('@/views/Ingredient/Detail.vue')
  },
  {
    path: '/recipe',
    name: 'Recipe',
    component: () => import('@/views/Recipe/Index.vue')
  },
  {
    path: '/recipe/:id',
    name: 'RecipeDetail',
    component: () => import('@/views/Recipe/Detail.vue')
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/User/Index.vue')
  },
  {
    path: '/user/favorites',
    name: 'Favorites',
    component: () => import('@/views/User/Favorites.vue')
  },
  {
    path: '/user/members',
    name: 'Members',
    component: () => import('@/views/User/Members.vue')
  },
  {
    path: '/user/members/:memberId/library',
    name: 'MemberLibrary',
    component: () => import('@/views/User/MemberLibrary.vue')
  },
  {
    path: '/user/settings',
    name: 'Settings',
    component: () => import('@/views/Settings/Index.vue')
  },
  {
    path: '/search',
    name: 'SearchResult',
    component: () => import('@/views/SearchResult.vue')
  },
  {
    path: '/ai',
    name: 'AI',
    component: () => import('@/views/AI/Index.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
