<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="home-btn">
        <el-icon :size="24"><HomeFilled /></el-icon>
      </router-link>
    </div>
    <h1 class="app-title">一日三餐</h1>
    <div class="header-right"></div>
  </header>
</template>

<script setup lang="ts">
import { HomeFilled } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.app-header {
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding-top: var(--safe-area-inset-top, 0);
  padding-left: 16px;
  padding-right: 16px;

  .header-left,
  .header-right {
    width: 40px;
    display: flex;
    align-items: center;
  }

  .home-btn {
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .app-title {
    color: white;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    flex: 1;
    text-align: center;
  }
}
</style>
