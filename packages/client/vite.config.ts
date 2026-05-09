// ===== Vite 前端构建配置 =====
// Vite 是新一代前端构建工具，基于原生 ES 模块，开发时启动极快
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // Vue3 单文件组件编译插件

export default defineConfig({
  plugins: [vue()], // 启用 Vue SFC 编译
  server: {
    port: 5173, // 开发服务器端口
    proxy: {
      // 【开发代理】将以 /api 开头的请求代理到后端服务器
      // 解决开发时的跨域问题，生产环境由 Nginx 处理
      '/api': {
        target: 'http://localhost:3000', // 后端 NestJS 服务地址
        changeOrigin: true, // 修改请求头中的 Origin 为目标地址
      },
    },
  },
})
