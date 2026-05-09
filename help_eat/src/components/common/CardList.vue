<template>
  <div class="card-list-layout">
    <aside class="category-sidebar">
      <ul class="category-list">
        <li
          v-for="cat in categories"
          :key="cat.id"
          :class="{ active: activeCategory === cat.id }"
        >
          <div class="category-name" @click="activeCategory = cat.id">
            {{ cat.name }}
          </div>
          <div class="category-actions">
            <el-button :icon="Edit" circle size="small" @click.stop="handleEditCategory(cat)" />
            <el-button :icon="Delete" circle size="small" type="danger" @click.stop="handleDeleteCategory(cat)" />
          </div>
        </li>
      </ul>
      <div class="category-footer-container">
        <slot name="category-footer"></slot>
      </div>
    </aside>

    <section class="card-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="card-item"
      >
        <slot name="card" :item="item" :onClick="() => onCardClick(item)"></slot>
      </div>
      <div v-if="filteredItems.length === 0" class="empty-tip">暂无数据</div>
    </section>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string; categoryId: string }">
import { ref, computed, watch } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'

interface Props {
  categories: { id: string; name: string }[]
  items: T[]
  searchText?: string
  searchFields?: (keyof T)[]
}

const props = withDefaults(defineProps<Props>(), {
  searchText: '',
  searchFields: () => []
})

const emit = defineEmits<{
  (e: 'card-click', item: T): void
  (e: 'edit-category', category: any): void
  (e: 'delete-category', category: any): void
}>()

const activeCategory = ref('')

watch(
  () => props.categories,
  (newCats) => {
    if (newCats.length > 0) {
      const hasActive = newCats.some(cat => cat.id === activeCategory.value)
      if (!hasActive || !activeCategory.value) {
        activeCategory.value = newCats[0].id
      }
    }
  },
  { immediate: true, deep: true }
)

const filteredItems = computed(() => {
  let list = props.items.filter((i) => i.categoryId === activeCategory.value)

  if (props.searchText && props.searchFields.length > 0) {
    const kw = props.searchText.toLowerCase()
    list = list.filter((item) => {
      return props.searchFields.some((field) => {
        const val = item[field]
        return typeof val === 'string' && val.toLowerCase().includes(kw)
      })
    })
  }

  return list
})

function onCardClick(item: T) {
  emit('card-click', item)
}

function handleEditCategory(category: any) {
  emit('edit-category', category)
}

function handleDeleteCategory(category: any) {
  emit('delete-category', category)
}
</script>

<style scoped lang="scss">
.card-list-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.category-sidebar {
  width: 200px;
  border-right: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: white;
}

.category-list {
  list-style: none;
  padding: 16px 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.category-list li {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

.category-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.category-footer-container {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 16px;
  flex-shrink: 0;
}

.card-grid {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-content: start;
  min-height: 0;
  background: #f5f7fa;
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px;
  color: var(--el-text-color-placeholder);
}
</style>
