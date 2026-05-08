# 通用后台管理系统 - 开发修复记录

## 项目概述

基于 Vue3 + Element Plus + Vite 前端和 NestJS + Prisma + MySQL 后端的通用后台管理系统。

- **前端**: packages/client (Vue3 + TypeScript + Element Plus + Vite)
- **后端**: packages/server (NestJS + TypeScript + Prisma + MariaDB/MySQL)
- **数据库**: MySQL 8.0 (Docker, 端口 3307)
- **缓存**: Redis 7 (Docker, 端口 6379)
- **默认账号**: admin / admin123

---

## 开发文档索引

| 文档 | 内容 |
|------|------|
| [requirements.md](requirements.md) | 项目需求与功能模块定义 |
| [implementation-steps.md](implementation-steps.md) | 开发步骤规划 |
| [step1-environment-setup.md](step1-environment-setup.md) | 环境搭建 |
| [step2-database-prisma.md](step2-database-prisma.md) | 数据库配置 |
| [step3-auth-module.md](step3-auth-module.md) | 认证模块 |
| [step4-user-module.md](step4-user-module.md) | 用户模块 |
| [step5-role-menu-module.md](step5-role-menu-module.md) | 角色与菜单模块 |
| [step6-dept-module.md](step6-dept-module.md) | 部门模块 |
| [step7-log-dict-module.md](step7-log-dict-module.md) | 日志与字典模块 |
| [step8-layout-final.md](step8-layout-final.md) | 布局与最终集成 |

---

## 修复记录

### 一、代码完整性检查

#### 1.1 缺失依赖修复

**问题**: `prisma.service.ts` 引用了 `@prisma/adapter-mariadb` 和 `mariadb`，但 `package.json` 中未声明。

**修复**:
```bash
pnpm add @prisma/adapter-mariadb mariadb
```

**文件**: `packages/server/package.json`

#### 1.2 prisma.config.ts 依赖 dotenv

**问题**: `prisma.config.ts` 使用了 `import "dotenv/config"` 但未安装 `dotenv`。

**修复**: 移除 dotenv 依赖，改用 Node.js 原生 `fs.readFileSync` 手动加载 `.env` 文件。

**文件**: `packages/server/prisma.config.ts`

### 二、登录用户信息不完整

**问题**: `login()` 接口只返回了 `id/username/nickname/avatar`，但 Dashboard 页面需要 `email/phone/roles/deptName` 字段。

**修复**: 在 `auth.service.ts` 的 `login()` 方法中增加对 `dept` 和 `userRoles` 的关联查询，返回完整的用户信息。

**文件**: `packages/server/src/auth/auth.service.ts`

### 三、刷新 Token 绕过拦截器

**问题**: `request.ts` 中刷新 token 时使用全局 `axios.post('/api/auth/refresh')` 而非配置的 `request` 实例，绕过了 baseURL 和拦截器。

**修复**: 改为 `request.post('/auth/refresh')` 使用已配置的 axios 实例。

**文件**: `packages/client/src/utils/request.ts`

### 四、前端编译警告

#### 4.1 dict/index.vue 未使用的导入

**修复**: 移除未使用的 `watch` 和 `getDictByType` 导入。

#### 4.2 role/index.vue 未使用的代码

**修复**: 移除未使用的 `extractAllIds` 函数、`menuTreeRef` ref 和 `ElTree` 类型导入。

### 五、菜单只显示首页

**问题**:
1. `fetchPermissions()` 只在 `userInfo` 为 null 时调用，登录后 `menus` 数组始终为空
2. 路由守卫判断条件使用了 `!authStore.userInfo` 而非菜单加载状态
3. `el-sub-menu` 只渲染一层子菜单，无法递归渲染多层菜单树

**修复**:
1. 新增 `menusLoaded` 标记，`fetchPermissions()` 成功后标记为 `true`
2. 路由守卫判断条件改为 `!authStore.menusLoaded`
3. 创建 `NestedMenu.vue` 递归组件，支持无限层级菜单渲染
4. 后端返回树形结构的 `menus` 数据

**涉及文件**:
- `packages/client/src/stores/auth.ts`
- `packages/client/src/router/index.ts`
- `packages/client/src/views/layout/index.vue`
- `packages/client/src/views/layout/components/NestedMenu.vue`（新增）
- `packages/server/src/auth/auth.service.ts`

### 六、布局宽高不100%适配屏幕

**问题**: 侧边栏和内容区宽度被限制，没有正确填充浏览器窗口。

**修复**:
- `.layout` 和 `.layout-container` 设置 `display: flex; width: 100%; height: 100%`
- `.aside` 设置 `flex-shrink: 0` 防止侧边栏被压缩
- `.main-container` 设置 `min-width: 0` 允许正确收缩
- `.main` 设置 `flex: 1` 填充剩余空间
- `.header` 固定 `height: 56px` 并设置 `flex-shrink: 0`

**文件**: `packages/client/src/views/layout/index.vue`

### 七、刷新页面疯狂请求 /api/auth/permissions

**问题**: 页面刷新后 `userInfo` 为 null，路由守卫每次都触发 `fetchPermissions()`，导致无限请求。

**修复**:
1. 新增 `menusLoaded` 标记防止重复请求
2. `fetchPermissions()` 开头检查 `menusLoaded`，已加载时直接返回缓存
3. 修复 `next({ path: ..., replace: true })` 避免无限重定向循环
4. `viewedPages` 初始化包含 `['/', '/dashboard']` 避免首次加载重复触发

**文件**: `packages/client/src/router/index.ts`、`packages/client/src/stores/auth.ts`

### 八、点击菜单跳转404

**问题**: 数据库种子数据中菜单的 `routePath` 是 `/system/user`、`/system/role` 等，但前端路由配置的 `path` 是 `/user`、`/role`，路径不匹配。

**修复**: 将前端路由的 `path` 改为 `system/user`、`system/role` 等，与数据库中的 `routePath` 保持一致。

**文件**: `packages/client/src/router/index.ts`

### 九、刷新后首页数据丢失

**问题**: Pinia Store 中的 `userInfo`、`permissions`、`menus` 没有持久化到 `localStorage`，刷新页面后数据丢失。

**修复**:
1. 初始化时从 `localStorage` 恢复 `userInfo`、`permissions`、`menus`
2. `login()` 成功后保存 `userInfo` 到 `localStorage`
3. `fetchPermissions()` 成功后保存 `permissions` 和 `menus` 到 `localStorage`
4. `clearToken()` 退出时清理所有持久化数据

**文件**: `packages/client/src/stores/auth.ts`

---

## 修复统计

| 类型 | 数量 |
|------|------|
| 缺失依赖 | 2 |
| 功能BUG | 5 |
| 编译警告 | 2 |
| 样式问题 | 1 |
| **合计** | **10** |

---

## 编译验证

- ✅ 后端 `npx nest build` 编译通过
- ✅ 前端 `npx vue-tsc -b` 类型检查通过
- ✅ 前端 `npx vite build` 构建通过

---

## 启动方式

### 依赖服务
```bash
docker-compose up -d
```

### 后端
```bash
cd packages/server
node dist/src/main.js
```
访问: http://localhost:3000

### 前端
```bash
cd packages/client
npx vite --host
```
访问: http://localhost:5173

### API文档
http://localhost:3000/api/docs
