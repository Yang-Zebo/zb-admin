<!-- ===== 递归菜单组件 =====
 核心组件：通过自身递归渲染无限层级的菜单结构
 原理：组件在自己的 template 中调用自身，传入子菜单数据继续渲染
 props: menus — 当前层级的菜单数组
 使用 <component :is="..."> 动态渲染 Icon 图标
-->
<script setup lang="ts">
import {
  HomeFilled,
  User,
  Avatar,
  Menu,
  Setting,
  Notebook,
  Document,
} from '@element-plus/icons-vue'

defineProps<{
  menus: any[]
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
</script>

<template>
  <template v-for="menu in menus" :key="menu.id">
    <el-sub-menu
      v-if="menu.menuType === 0 && menu.children?.length"
      :index="String(menu.id)"
    >
      <template #title>
        <el-icon>
          <component :is="getIcon(menu.icon)" />
        </el-icon>
        <span>{{ menu.menuName }}</span>
      </template>
      <NestedMenu :menus="menu.children" />
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
