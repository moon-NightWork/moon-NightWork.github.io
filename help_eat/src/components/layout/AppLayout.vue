<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppTabBar v-if="showTabBar" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppTabBar from './AppTabBar.vue'

const route = useRoute()

// 只在主页面显示TabBar的路由
const mainRoutes = ['/', '/ingredient', '/recipe', '/user', '/ai']

const showTabBar = computed(() => {
  return mainRoutes.includes(route.path)
})
</script>

<style scoped lang="scss">
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.main-content {
  flex: 1;
  overflow-y: auto;

  &.full-screen {
    overflow: hidden;
  }
}
</style>
