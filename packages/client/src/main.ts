// ===== Vue 应用入口 =====
// 负责：创建 Vue 应用实例 → 注册插件（Pinia/Router/ElementPlus） → 注册全局组件（图标） → 注册全局指令（权限） → 挂载到 #app
import { createApp } from 'vue'
import { createPinia } from 'pinia' // Pinia：Vue3 官方推荐的状态管理库（替代 Vuex）
import ElementPlus from 'element-plus' // Element Plus：基于 Vue3 的 UI 组件库
import 'element-plus/dist/index.css' // Element Plus 样式
import zhCn from 'element-plus/es/locale/lang/zh-cn' // 中文语言包
import * as ElementPlusIconsVue from '@element-plus/icons-vue' // Element Plus 图标库
import App from './App.vue'
import router from './router' // Vue Router 路由配置
import { vPermission } from './directives/permission' // 自定义权限指令
import './style.css'

// createApp：创建 Vue 应用实例，传入根组件 App.vue
const app = createApp(App)

// 全局注册所有 Element Plus 图标组件，避免在每个页面重复导入
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 按顺序注册插件：
// 1. Pinia — 状态管理（需要在 Router 之前注册，因为路由守卫中使用 store）
// 2. Router — 路由管理
// 3. Element Plus — UI 组件库（中文语言）
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 注册全局指令 v-permission，用于按钮级别的权限控制
app.directive('permission', vPermission)

// 将应用挂载到 index.html 中的 <div id="app"></div>
app.mount('#app')
