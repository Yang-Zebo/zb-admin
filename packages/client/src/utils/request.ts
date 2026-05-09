// ===== Axios 请求封装 =====
// 创建统一的 HTTP 请求实例，配置：
// 1. 请求拦截器：自动附加 Authorization 头（Bearer Token）
// 2. 响应拦截器：自动刷新 Token（401 时）、错误提示
// 3. 并发请求 Token 刷新队列（防止多个请求同时刷新 Token）
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api', // 所有请求以 /api 为前缀，由 Vite 代理转发到后端
  timeout: 15000, // 请求超时时间 15 秒
})

// Token 刷新状态管理
let isRefreshing = false // 是否正在刷新 Token
let pendingRequests: Array<(token: string) => void> = [] // 等待 Token 刷新的请求队列

// 【请求拦截器】在每个请求发送前执行
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 读取 Token 并设置到请求头
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 【响应拦截器】在每个请求返回后执行
request.interceptors.response.use(
  (response) => response, // 成功响应直接返回
  async (error) => { // 失败响应处理
    const { response, config } = error
    // 网络连接失败（无响应）
    if (!response) {
      ElMessage.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    // 401 未授权 → 尝试刷新 Token
    if (response.status === 401 && !config._retry) {
      config._retry = true // 标记已尝试刷新，防止死循环
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // 没有 RefreshToken → 直接跳到登录页
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // 【并发请求处理】如果正在刷新 Token，将当前请求加入等待队列
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const res = await request.post('/auth/refresh', { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = res.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          isRefreshing = false

          // Token 刷新成功，执行等待队列中的所有请求
          pendingRequests.forEach((cb) => cb(accessToken))
          pendingRequests = []

          // 用新 Token 重试当前请求
          config.headers.Authorization = `Bearer ${accessToken}`
          return request(config)
        } catch {
          // Token 刷新失败 → 清除状态，跳到登录页
          isRefreshing = false
          pendingRequests = []
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          ElMessage.error('登录已过期，请重新登录')
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }

      // 正在刷新中 → 将当前请求加入等待队列，返回 Promise 等待新 Token
      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          config.headers.Authorization = `Bearer ${token}`
          resolve(request(config))
        })
      })
    }

    // 其他错误 → 显示错误提示
    const message = response.data?.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default request
