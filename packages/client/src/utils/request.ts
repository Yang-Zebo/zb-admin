import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error
    if (!response) {
      ElMessage.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    if (response.status === 401 && !config._retry) {
      config._retry = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (!isRefreshing) {
        isRefreshing = true
        try {
          const res = await request.post('/auth/refresh', { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = res.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          isRefreshing = false

          pendingRequests.forEach((cb) => cb(accessToken))
          pendingRequests = []

          config.headers.Authorization = `Bearer ${accessToken}`
          return request(config)
        } catch {
          isRefreshing = false
          pendingRequests = []
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          ElMessage.error('登录已过期，请重新登录')
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }

      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          config.headers.Authorization = `Bearer ${token}`
          resolve(request(config))
        })
      })
    }

    const message = response.data?.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default request
