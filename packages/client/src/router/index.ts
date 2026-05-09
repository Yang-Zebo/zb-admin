// ===== Vue Router 路由配置 =====
// 核心职责：
// 1. 定义静态路由（login、dashboard、各模块管理页面）
// 2. 配置路由守卫（beforeEach）：检查登录状态、获取权限、校验按钮权限
// 3. 支持路由懒加载（() => import(...)），按需加载页面组件
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 静态路由定义 — 所有页面的路径和组件映射
const staticRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'), // 路由懒加载：打包时拆分为独立 chunk
    meta: { requiresAuth: false }, // 不需要认证
  },
  {
    path: '/',
    component: () => import('../views/layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/index.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'system/user',
        name: 'User',
        component: () => import('../views/user/index.vue'),
        meta: { requiresAuth: true, permission: 'sys:user:list' },
      },
      {
        path: 'system/role',
        name: 'Role',
        component: () => import('../views/role/index.vue'),
        meta: { requiresAuth: true, permission: 'sys:role:list' },
      },
      {
        path: 'system/menu',
        name: 'Menu',
        component: () => import('../views/menu/index.vue'),
        meta: { requiresAuth: true, permission: 'sys:menu:list' },
      },
      {
        path: 'system/dept',
        name: 'Dept',
        component: () => import('../views/dept/index.vue'),
        meta: { requiresAuth: true, permission: 'sys:dept:list' },
      },
      {
        path: 'system/log',
        name: 'Log',
        component: () => import('../views/log/index.vue'),
        meta: { requiresAuth: true, permission: 'sys:log:list' },
      },
      {
        path: 'system/dict',
        name: 'Dict',
        component: () => import('../views/dict/index.vue'),
        meta: { requiresAuth: true, permission: 'sys:dict:list' },
      },
    ],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('../views/error/403.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../views/error/404.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404', // 所有未匹配的路由重定向到 404 页面
  },
]

// createRouter：创建路由实例
const router = createRouter({
  history: createWebHistory(), // HTML5 History 模式（无 # 号，需要服务端配合）
  routes: staticRoutes,
})

// 记录已访问的页面路径（用于判断是否是首次访问）
const viewedPages = new Set<string>(['/', '/dashboard'])

// 【路由守卫】每次路由跳转前执行
// to：目标路由  from：来源路由  next：放行/重定向函数
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 如果要去登录页
  if (to.path === '/login') {
    if (authStore.token) {
      next('/') // 已登录用户访问 /login 直接跳转到首页
      return
    }
    next()
    return
  }

  // 没有 Token → 跳转到登录页
  if (!authStore.token) {
    next('/login')
    return
  }

  // 有 Token 但权限菜单未加载 → 先获取权限再跳转
  if (!authStore.menusLoaded) {
    try {
      await authStore.fetchPermissions()
      next({ path: to.path === '/' ? '/dashboard' : to.path, replace: true })
    } catch {
      next('/login')
    }
    return
  }

  // 检查目标路由是否需要特定权限
  const requiredPermission = to.meta.permission as string | undefined
  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    next('/403') // 无权限 → 跳转到 403 页面
    return
  }

  viewedPages.add(to.path)
  next()
})

export { staticRoutes }
export default router
