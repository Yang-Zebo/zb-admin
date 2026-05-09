// ===== 认证状态管理（Pinia Store）=====
// 管理用户认证相关的所有状态：Token、用户信息、权限列表、菜单数据
// 【关键设计】使用 localStorage 持久化状态，解决刷新后数据丢失问题
// 使用 defineStore + 组合式 API（setup store）模式编写
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, getCaptcha, logout as logoutApi, getPermissions } from '../api/auth'
import type { LoginParams, LoginResult, CaptchaResult } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  // === 状态（state）===
  // 初始化时优先从 localStorage 读取，实现状态持久化
  const token = ref<string>(localStorage.getItem('accessToken') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  // JSON.parse：将 localStorage 中的 JSON 字符串还原为对象
  const userInfo = ref<LoginResult['user'] | null>(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem('permissions') || '[]'))
  const menus = ref<any[]>(JSON.parse(localStorage.getItem('menus') || '[]'))
  // menusLoaded 标志：用于判断权限是否已从服务端获取
  // 如果本地已有权限数据则视为已加载（避免刷新时重复请求 /api/auth/permissions）
  const menusLoaded = ref(permissions.value.length > 0)

  // === 方法（actions）===

  // 设置 Token 并同步到 localStorage
  function setToken(accessToken: string, newRefreshToken: string) {
    token.value = accessToken
    refreshToken.value = newRefreshToken
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  // 清除所有认证状态（退出登录时调用）
  function clearToken() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    permissions.value = []
    menus.value = []
    menusLoaded.value = false
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('permissions')
    localStorage.removeItem('menus')
  }

  // 获取图形验证码（登录页使用）
  async function fetchCaptcha(): Promise<CaptchaResult> {
    return getCaptcha()
  }

  // 登录：调用 API → 保存 Token → 保存用户信息
  async function login(params: LoginParams): Promise<LoginResult> {
    const result = await loginApi(params)
    setToken(result.accessToken, result.refreshToken)
    userInfo.value = result.user
    localStorage.setItem('userInfo', JSON.stringify(result.user)) // 持久化用户信息
    return result
  }

  // 退出登录：调用 API → 清除本地状态
  async function logout() {
    try {
      await logoutApi()
    } finally {
      clearToken() // 无论 API 调用成功与否，都清除本地状态
    }
  }

  // 获取用户权限和菜单（核心方法）
  async function fetchPermissions() {
    // 如果已加载过，直接返回缓存的权限数据
    if (menusLoaded.value) {
      return { permissions: permissions.value, menus: menus.value }
    }
    try {
      const result = await getPermissions()
      permissions.value = result.permissions
      menus.value = result.menus
      menusLoaded.value = true
      // 持久化到 localStorage，防止刷新丢失
      localStorage.setItem('permissions', JSON.stringify(result.permissions))
      localStorage.setItem('menus', JSON.stringify(result.menus))
      return result
    } catch {
      clearToken()
      throw new Error('获取权限失败')
    }
  }

  // 检查是否拥有指定权限（用于按钮级别权限控制）
  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  // 暴露给组件使用的状态和方法
  return {
    token,
    refreshToken,
    userInfo,
    permissions,
    menus,
    menusLoaded,
    setToken,
    clearToken,
    fetchCaptcha,
    login,
    logout,
    fetchPermissions,
    hasPermission,
  }
})
