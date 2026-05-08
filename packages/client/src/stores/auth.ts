import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, getCaptcha, logout as logoutApi, getPermissions } from '../api/auth'
import type { LoginParams, LoginResult, CaptchaResult } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('accessToken') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const userInfo = ref<LoginResult['user'] | null>(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem('permissions') || '[]'))
  const menus = ref<any[]>(JSON.parse(localStorage.getItem('menus') || '[]'))
  const menusLoaded = ref(permissions.value.length > 0)

  function setToken(accessToken: string, newRefreshToken: string) {
    token.value = accessToken
    refreshToken.value = newRefreshToken
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

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

  async function fetchCaptcha(): Promise<CaptchaResult> {
    return getCaptcha()
  }

  async function login(params: LoginParams): Promise<LoginResult> {
    const result = await loginApi(params)
    setToken(result.accessToken, result.refreshToken)
    userInfo.value = result.user
    localStorage.setItem('userInfo', JSON.stringify(result.user))
    return result
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      clearToken()
    }
  }

  async function fetchPermissions() {
    if (menusLoaded.value) {
      return { permissions: permissions.value, menus: menus.value }
    }
    try {
      const result = await getPermissions()
      permissions.value = result.permissions
      menus.value = result.menus
      menusLoaded.value = true
      localStorage.setItem('permissions', JSON.stringify(result.permissions))
      localStorage.setItem('menus', JSON.stringify(result.menus))
      return result
    } catch {
      clearToken()
      throw new Error('获取权限失败')
    }
  }

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

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
