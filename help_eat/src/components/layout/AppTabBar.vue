<template>
  <div class="app-tab-bar">
    <el-menu
      :default-active="activeRoute"
      class="tab-menu"
      router
    >
      <el-menu-item index="/ingredient">
        <el-icon><Food /></el-icon>
        <span>食材</span>
      </el-menu-item>
      <el-menu-item index="/recipe">
        <el-icon><Document /></el-icon>
        <span>菜谱</span>
      </el-menu-item>
      <el-menu-item index="/ai">
        <el-icon><MagicStick /></el-icon>
        <span>AI</span>
      </el-menu-item>
      <el-menu-item index="/user">
        <el-icon><User /></el-icon>
        <span>我的</span>
      </el-menu-item>
    </el-menu>
  </div>
  </template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Food, Document, User, MagicStick } from '@element-plus/icons-vue'

const route = useRoute()
const activeRoute = computed(() => route.path)
</script>

<style scoped lang="scss">
.app-tab-bar {
  height: 56px;
  background: white;
  border-top: 1px solid var(--el-border-color);
  padding-bottom: var(--safe-area-inset-bottom, 0);
  display: flex;
  width: 100%;

  .tab-menu {
    display: flex;
    height: 100%;
    border: none;
    width: 100%;
    min-width: 0;

    :deep(.el-menu-item) {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 !important;
      height: 100%;
      line-height: normal;

      .el-icon {
        font-size: 20px;
        margin-bottom: 4px;
        margin-right: 0;
      }

      span {
        font-size: 12px;
        line-height: 1;
      }
    }

    :deep(.el-menu-item.is-active) {
      color: #667eea;
      border-bottom: none;
    }
  }
}
</style>
