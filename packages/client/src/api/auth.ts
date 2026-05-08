import request from '../utils/request'

export interface LoginParams {
  username: string
  password: string
  captcha: string
  captchaId: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    username: string
    nickname: string
    avatar: string | null
    email?: string
    phone?: string
    roles?: { id: number; roleName: string }[]
    deptName?: string
  }
}

export interface CaptchaResult {
  captchaId: string
  captchaSvg: string
}

export interface PermissionResult {
  menus: any[]
  permissions: string[]
}

export function getCaptcha(): Promise<CaptchaResult> {
  return request.get('/auth/captcha').then((res) => res.data)
}

export function login(params: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', params).then((res) => res.data)
}

export function logout(): Promise<void> {
  return request.post('/auth/logout').then((res) => res.data)
}

export function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  return request.post('/auth/refresh', { refreshToken }).then((res) => res.data)
}

export function getPermissions(): Promise<PermissionResult> {
  return request.get('/auth/permissions').then((res) => res.data)
}
