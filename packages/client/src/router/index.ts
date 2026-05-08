import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const staticRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: { requiresAuth: false },
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
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
})

const viewedPages = new Set<string>(['/', '/dashboard'])

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (to.path === '/login') {
    if (authStore.token) {
      next('/')
      return
    }
    next()
    return
  }

  if (!authStore.token) {
    next('/login')
    return
  }

  if (!authStore.menusLoaded) {
    try {
      await authStore.fetchPermissions()
      next({ path: to.path === '/' ? '/dashboard' : to.path, replace: true })
    } catch {
      next('/login')
    }
    return
  }

  const requiredPermission = to.meta.permission as string | undefined
  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    next('/403')
    return
  }

  viewedPages.add(to.path)
  next()
})

export { staticRoutes }
export default router
