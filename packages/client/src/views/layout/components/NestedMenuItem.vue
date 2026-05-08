<script setup lang="ts">
import { computed } from 'vue'
import { Menu } from '@element-plus/icons-vue'
import {
  Fold,
  Expand,
  HomeFilled,
  User,
  Avatar,
  Setting,
  Notebook,
  Document,
} from '@element-plus/icons-vue'

defineProps<{
  menus: any[]
  level?: number
}>()

const iconMap: Record<string, any> = {
  HomeFilled,
  User,
  Avatar,
  Menu,
  Setting,
  Notebook,
  Document,
}

function getIcon(iconName: string | null) {
  if (!iconName) return Menu
  return iconMap[iconName] || Menu
}

const hasChildren = (menu: any) => menu.children && menu.children.length > 0
</script>

<template>
  <template v-for="menu in menus" :key="menu.id">
    <el-sub-menu
      v-if="menu.menuType === 0 && hasChildren(menu)"
      :index="String(menu.id)"
    >
      <template #title>
        <el-icon>
          <component :is="getIcon(menu.icon)" />
        </el-icon>
        <span>{{ menu.menuName }}</span>
      </template>
      <NestedMenuItem :menus="menu.children" :level="(level || 0) + 1" />
    </el-sub-menu>
    <el-menu-item
      v-else-if="menu.menuType === 1"
      :index="menu.routePath"
    >
      <el-icon>
        <component :is="getIcon(menu.icon)" />
      </el-icon>
      <template #title>{{ menu.menuName }}</template>
    </el-menu-item>
  </template>
</template>
