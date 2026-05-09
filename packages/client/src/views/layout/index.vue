<!-- ===== 主布局组件 =====
 页面骨架：左侧可折叠菜单栏 + 右侧内容区（顶栏 + 主内容）
 核心功能：
 1. 侧边栏：从 authStore.menus 获取菜单树，使用 NestedMenu 递归渲染
 2. 折叠/展开：通过 isCollapse 控制侧边栏宽度（64px / 220px）
 3. 顶栏右侧：用户头像、用户名、退出登录下拉菜单
 4. 主内容区：<router-view /> 动态渲染当前路由对应的页面组件
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import NestedMenu from './components/NestedMenu.vue'
import {
  Fold,
  Expand,
  HomeFilled,
  User,
  Avatar,
  Menu,
  Setting,
  Notebook,
  Document,
  ArrowDown,
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false) // 侧边栏是否折叠
const activeMenu = ref('/dashboard') // 当前激活的菜单项

const userInfo = computed(() => authStore.userInfo)

// 从菜单树中筛选根级菜单（parentId 为 0 或 null 的菜单作为一级菜单）
const treeMenus = computed(() => {
  const allMenus = authStore.menus || []
  return allMenus.filter((m) => !m.parentId || m.parentId === 0)
})

// 菜单图标映射表：将数据库中存储的图标名字符串映射为实际的 Vue 组件
const iconMap: Record<string, any> = {
  HomeFilled,
  User,
  Avatar,
  Menu,
  Setting,
  Notebook,
  Document,
}

// 根据图标名获取对应的组件，找不到时默认使用 Menu 图标
function getIcon(iconName: string | null) {
  if (!iconName) return Menu
  return iconMap[iconName] || Menu
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function handleMenuSelect(index: string) {
  activeMenu.value = index
  if (index && index !== '/') {
    router.push(index)
  }
}
</script>

<template>
  <div class="layout">
    <el-container class="layout-container">
      <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
        <div class="logo">
          <span v-show="!isCollapse">后台管理系统</span>
          <span v-show="isCollapse">后台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          background-color="#001529"
          text-color="#ffffffb3"
          active-text-color="#1890ff"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <template #title>首页</template>
          </el-menu-item>

          <template v-for="menu in treeMenus" :key="menu.id">
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
        </el-menu>
      </el-aside>

      <el-container class="main-container">
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="toggleCollapse">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </div>
          <div class="header-right">
            <el-dropdown>
              <span class="user-dropdown">
                <el-avatar :size="28">{{ userInfo?.username?.[0]?.toUpperCase() || 'U' }}</el-avatar>
                <span class="username">{{ userInfo?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.layout {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
}

.layout-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.aside {
  background: #001529;
  transition: width 0.3s;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
  flex-shrink: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  background: #002140;
  white-space: nowrap;
  overflow: hidden;
}

.el-menu {
  border-right: none;
}

.main-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
  height: 56px !important;
  line-height: 56px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.collapse-btn:hover {
  color: #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}

.main {
  background: #f0f2f5;
  overflow-y: auto;
  flex: 1;
  padding: 0 !important;
}
</style>
