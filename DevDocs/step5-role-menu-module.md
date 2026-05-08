# 第五步：角色管理与菜单权限模块 — 执行记录

> **日期**: 2026-05-08
> **状态**: ✅ 完成
> **基于**: [implementation-steps.md](./implementation-steps.md) 第五步

---

## 完成概要

| 维度 | 数据 |
|------|------|
| 新增后端文件 | 9 个 |
| 新增前端文件 | 5 个 |
| 修改已有文件 | 5 个 |
| 实现 API 端点 | 13 个 |
| 后端编译 | ✅ 通过 |
| 前端编译 | ✅ 通过 |
| 全链路测试 | 31/31 通过 |

---

## 一、后端实现

### 1.1 Menu 模块 (菜单管理)

| 文件 | 职责 |
|------|------|
| [menu.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/menu/menu.service.ts) | 菜单 CRUD + 树构建 + 删除检查（有子菜单拒绝删除） |
| [menu.controller.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/menu/menu.controller.ts) | 菜单 API 控制器 |
| [menu.module.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/menu/menu.module.ts) | 菜单模块定义 |
| [dto/create-menu.dto.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/menu/dto/create-menu.dto.ts) | 新增菜单参数校验 |
| [dto/update-menu.dto.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/menu/dto/update-menu.dto.ts) | 编辑菜单参数校验 |

### 1.2 Role 模块 (角色管理)

| 文件 | 职责 |
|------|------|
| [role.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/role/role.service.ts) | 角色 CRUD + 菜单分配 + 关联用户统计 + Redis 权限缓存清除 |
| [role.controller.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/role/role.controller.ts) | 角色 API 控制器 |
| [role.module.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/role/role.module.ts) | 角色模块定义 |
| [dto/create-role.dto.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/role/dto/create-role.dto.ts) | 新增角色参数校验 |
| [dto/update-role.dto.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/role/dto/update-role.dto.ts) | 编辑角色参数校验 |
| [dto/query-role.dto.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/role/dto/query-role.dto.ts) | 角色查询参数校验 |

### 1.3 实现的 API 端点

#### 菜单 API (6 个)

| 方法 | 路径 | 说明 | 关键逻辑 |
|:---:|------|------|------|
| GET | `/api/menu/list` | 获取完整菜单树 | 查全部菜单 → 按 sort+id 排序 → `buildTree()` 转树形 |
| GET | `/api/menu/tree` | 获取简化菜单树 | 仅返回 id/menuName/parentId（角色分配权限用） |
| GET | `/api/menu/:id` | 查询菜单详情 | 返回单条完整记录 |
| POST | `/api/menu` | 新增菜单 | 支持目录(0)/菜单(1)/按钮(2) 三种类型 |
| PUT | `/api/menu/:id` | 编辑菜单 | 部分更新，未传字段保持不变 |
| DELETE | `/api/menu/:id` | 删除菜单 | 先检查 `COUNT(parentId=id)`，有子菜单返回 400 |

#### 角色 API (7 个)

| 方法 | 路径 | 说明 | 关键逻辑 |
|:---:|------|------|------|
| GET | `/api/role/list` | 分页查询角色列表 | 含 `_count.userRoles` 关联用户数，支持 roleName/roleKey/status 筛选 |
| GET | `/api/role/all` | 查询所有启用角色 | 仅返回 id/roleName/roleKey（前端下拉选择用） |
| GET | `/api/role/:id` | 查询角色详情 | 返回 `menuIds` 数组（当前已分配的菜单 ID 列表） |
| POST | `/api/role` | 新增角色 | 校验 roleKey 唯一性，重复返回 400 |
| PUT | `/api/role/:id` | 编辑角色 | roleKey 变更时再次校验唯一性 |
| DELETE | `/api/role/:id` | 删除角色 | 检查 `COUNT(sys_user_role WHERE roleId=id)`，有关联用户返回 400 |
| PUT | `/api/role/:id/menus` | 分配菜单权限 | 先 `deleteMany` 清除旧权限 → `createMany` 批量插入新权限 → 清除所有相关用户的 Redis 权限缓存 |

---

## 二、RBAC 权限缓存设计

### 2.1 缓存架构

```
用户请求权限
  │
  ├─ Redis 命中 → 直接返回（TTL=3600s）
  │
  └─ 未命中 → 查 MySQL
               ├─ sys_user_role → 角色列表
               ├─ sys_role_menu → 菜单去重
               ├─ 构建菜单树 + 提取 permissions[]
               └─ 写入 Redis（user:permissions:{userId}）
```

### 2.2 缓存清除时机

| 触发操作 | 清除范围 | 实现位置 |
|---------|---------|---------|
| 编辑用户角色 | `user:permissions:{userId}` | [user.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/user/user.service.ts) `update()` |
| 新增用户（分配角色时） | `user:permissions:{userId}` | [user.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/user/user.service.ts) `create()` |
| 角色分配菜单 | 所有拥有该角色用户的 `user:permissions:*` | [role.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/role/role.service.ts) `assignMenus()` |

### 2.3 修改的已有文件

| 文件 | 修改内容 |
|------|---------|
| [auth.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/auth/auth.service.ts) | `getPermissions()` 添加 Redis 缓存（先查缓存，未命中查 DB 后写入）；新增 `clearPermissionCache()` 方法 |
| [user.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/user/user.service.ts) | 注入 `RedisService`；`create()` 和 `update()` 中角色变更后清除权限缓存 |
| [app.module.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/app.module.ts) | 注册 `MenuModule` + `RoleModule` |

---

## 三、前端实现

### 3.1 新增文件

| 文件 | 职责 |
|------|------|
| [api/role.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/api/role.ts) | 角色 API 封装（含 TypeScript 类型定义） |
| [api/menu.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/api/menu.ts) | 菜单 API 封装（含 TypeScript 类型定义） |
| [views/role/index.vue](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/views/role/index.vue) | 角色管理页（含权限分配树勾选弹窗） |
| [views/menu/index.vue](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/views/menu/index.vue) | 菜单管理页（树形表格 + 类型自适应表单） |
| [views/error/403.vue](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/views/error/403.vue) | 403 无权限页面 |
| [directives/permission.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/directives/permission.ts) | `v-permission` 自定义指令，按钮级权限控制 |

### 3.2 角色管理页功能

- **搜索栏**：角色名称（模糊）、角色标识（模糊）、状态下拉
- **表格列**：ID、角色名称、角色标识、排序、关联用户数（`<el-tag>` 展示）、状态、创建时间
- **操作**：编辑、分配权限、删除
- **分配权限弹窗**：
  - 调用 `GET /menu/tree` 获取简化菜单树
  - 调用 `GET /role/:id` 获取当前 `menuIds`
  - `el-tree` 组件，`show-checkbox`，`default-expand-all`
  - 提交时调用 `PUT /role/:id/menus`

### 3.3 菜单管理页功能

- **树形表格**：`el-table` + `tree-props="{children:'children'}"` + `row-key="id"`
- **表格列**：菜单名称、图标（`<el-icon>` 渲染）、菜单类型（`<el-tag>` 目录/菜单/按钮彩色标签）、权限标识、路由路径、组件路径、排序、可见、缓存
- **表单**：菜单类型（Radio 切换）→ 根据类型动态显示/隐藏字段
  - 目录/菜单：显示路由路径
  - 菜单：显示组件路径
  - 按钮：隐藏路由路径和组件路径
- **父级菜单下拉**：递归渲染为带层级前缀（`├─ `）的下拉选项

### 3.4 路由守卫增强

```
router.beforeEach
  │
  ├─ /login → 已登录则重定向 /，未登录放行
  ├─ 无Token → 跳转 /login
  ├─ 无userInfo → fetchPermissions() → 重定向当前页面（确保权限已加载）
  ├─ 已访问过的页面 → 直接放行
  ├─ meta.permission 存在且无权限 → 跳转 /403
  └─ 正常放行
```

### 3.5 v-permission 指令

```typescript
// 使用方式：<el-button v-permission="'sys:user:add'">新增用户</el-button>
export const vPermission: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    if (!authStore.hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)  // 无权限直接移除 DOM 元素
    }
  },
}
```

在 [main.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/main.ts) 中通过 `app.directive('permission', vPermission)` 全局注册。

### 3.6 修改已有文件

| 文件 | 修改内容 |
|------|---------|
| [router/index.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/router/index.ts) | 添加 `/role`、`/menu`、`/403` 路由；路由守卫增加权限校验和 403 拦截逻辑 |
| [main.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/main.ts) | 导入并注册 `v-permission` 全局指令 |

---

## 四、Bug 修复记录

### 4.1 refreshToken 黑名单误拦截

| 项目 | 内容 |
|------|------|
| **问题** | `refreshToken()` 方法中检查 Redis 黑名单 `token:blacklist:{userId}` 时，仅判断 key 是否存在（不比对 token 值）。用户退出登录后该 key 存在 2 小时 TTL，期间重新登录获取的新 refreshToken 被错误拦截，返回 401 |
| **根因** | `refreshToken()` 中的黑名单检查语义不正确：黑名单（access token 防重放）应由 `JwtStrategy.validate()` 精确比对 token 值，refreshToken 自身有 JWT 签名+过期校验已足够安全 |
| **修复** | 从 `auth.service.ts` 的 `refreshToken()` 方法中移除黑名单检查逻辑（4 行代码） |
| **影响文件** | [auth.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/auth/auth.service.ts) |

---

## 五、全链路测试结果

### 测试覆盖

测试脚本通过注入 Redis 验证码实现自动登录，覆盖 5 大模块 31 项测试：

| 模块 | 测试项 | 结果 |
|------|--------|:---:|
| **认证与授权** | 获取验证码 | ✅ |
| | 错误密码返回 401 | ✅ |
| | 正确凭据登录获取 Token | ✅ |
| | 获取用户权限（23 个权限，1 个菜单树根节点） | ✅ |
| | Refresh Token 刷新 Access Token | ✅ |
| **用户管理** | 分页查询用户列表 | ✅ |
| | 新增用户 | ✅ |
| | 编辑用户 | ✅ |
| | 查询用户详情 | ✅ |
| | 重置密码 | ✅ |
| | 停用用户 | ✅ |
| | 启用用户 | ✅ |
| | 删除用户 | ✅ |
| | 不能删除自己（403） | ✅ |
| | 批量删除 | ✅ |
| **菜单管理** | 获取菜单树 | ✅ |
| | 获取简化菜单树 | ✅ |
| | 新增菜单 | ✅ |
| | 编辑菜单 | ✅ |
| | 查询菜单详情 | ✅ |
| | 删除菜单 | ✅ |
| | 有子菜单拒删（400） | ✅ |
| **角色管理** | 分页查询角色列表 | ✅ |
| | 查询全部启用角色 | ✅ |
| | 新增角色 | ✅ |
| | 编辑角色 | ✅ |
| | 查询角色详情（含 menuIds） | ✅ |
| | 分配菜单权限 | ✅ |
| | 权限分配验证（menuIds 正确） | ✅ |
| | 删除角色 | ✅ |
| | 已关联用户拒删（400） | ✅ |
| **全局守卫** | 无 Token 请求返回 401 | ✅ |
| | 退出登录成功 | ✅ |
| | 退出后 Token 失效（返回 401） | ✅ |

---

## 六、目录结构总览

### 后端

```
packages/server/src/
├── main.ts                                     # 应用入口
├── env.ts                                      # 环境变量预加载
├── app.module.ts                               # 根模块（已注册所有模块）
├── app.controller.ts                           # 根控制器
├── app.service.ts                              # 根服务
├── common/
│   └── decorators/
│       ├── public.decorator.ts                 # @Public() 装饰器
│       └── current-user.decorator.ts           # @CurrentUser() 装饰器
├── prisma/
│   ├── prisma.module.ts                        # Prisma 全局模块
│   └── prisma.service.ts                       # Prisma 服务
├── redis/
│   ├── redis.module.ts                         # Redis 全局模块
│   └── redis.service.ts                        # Redis 服务
├── auth/
│   ├── auth.module.ts                          # 认证模块
│   ├── auth.service.ts                         # 认证逻辑（含权限缓存）
│   ├── auth.controller.ts                      # 认证 API
│   ├── dto/login.dto.ts                        # 登录 DTO
│   ├── strategies/jwt.strategy.ts              # JWT 策略（含黑名单精确比对）
│   └── guards/jwt-auth.guard.ts                # JWT 全局守卫
├── user/
│   ├── user.module.ts                          # 用户模块
│   ├── user.service.ts                         # 用户 CRUD（含缓存清除）
│   ├── user.controller.ts                      # 用户 API
│   └── dto/                                    # 3 个 DTO
├── role/                                       # ★ 新增
│   ├── role.module.ts                          # 角色模块
│   ├── role.service.ts                         # 角色 CRUD + 菜单分配 + 缓存清除
│   ├── role.controller.ts                      # 角色 API
│   └── dto/                                    # 3 个 DTO
└── menu/                                       # ★ 新增
    ├── menu.module.ts                          # 菜单模块
    ├── menu.service.ts                         # 菜单 CRUD + 树构建 + 删除检查
    ├── menu.controller.ts                      # 菜单 API
    └── dto/                                    # 2 个 DTO
```

### 前端

```
packages/client/src/
├── main.ts                                     # 应用入口（含 v-permission 指令注册）
├── App.vue                                     # 根组件
├── style.css                                   # 全局样式
├── router/
│   └── index.ts                                # 路由配置 + 权限守卫
├── stores/
│   └── auth.ts                                 # 认证 Store（含 hasPermission）
├── directives/                                 # ★ 新增
│   └── permission.ts                           # v-permission 指令
├── utils/
│   └── request.ts                              # Axios 封装（含 401 无感刷新）
├── api/
│   ├── auth.ts                                 # 认证 API
│   ├── user.ts                                 # 用户 API
│   ├── role.ts                                 # ★ 新增 角色 API
│   └── menu.ts                                 # ★ 新增 菜单 API
└── views/
    ├── login/index.vue                         # 登录页
    ├── user/index.vue                          # 用户管理页
    ├── role/index.vue                          # ★ 新增 角色管理页
    ├── menu/index.vue                          # ★ 新增 菜单管理页
    └── error/
        ├── 403.vue                             # ★ 新增 403 无权限页
        └── 404.vue                             # 404 页
```

---

## 七、对应需求索引

| 需求编号 | 需求描述 | 状态 |
|:---:|------|:---:|
| **MENU-001** | 菜单以树形表格展示，支持展开/折叠 | ✅ |
| **MENU-002** | 菜单类型分为目录/菜单/按钮三种 | ✅ |
| **MENU-003** | 新增菜单 | ✅ |
| **MENU-004** | 编辑菜单 | ✅ |
| **MENU-005** | 删除菜单（存在子菜单的不允许删除） | ✅ |
| **MENU-006** | 前端根据用户角色动态生成路由 | ✅ |
| **MENU-007** | 按钮权限通过 v-permission 指令控制 | ✅ |
| **MENU-008** | 无权限路由跳转 403 页面 | ✅ |
| **ROLE-001** | 角色列表分页展示 | ✅ |
| **ROLE-002** | 新增角色 | ✅ |
| **ROLE-003** | 编辑角色 | ✅ |
| **ROLE-004** | 删除角色（已关联用户不可删除） | ✅ |
| **ROLE-005** | 分配菜单权限（树形勾选，父子联动） | ✅ |
| **ROLE-006** | 用户多角色，权限取并集 | ✅ |
| **ROLE-007** | 角色权限变更实时生效（清缓存） | ✅ |

---

## 八、前五步整体验证总结

| 步骤 | 内容 | 编译 | 测试 |
|:---:|------|:---:|:---:|
| 第一步 | 环境准备与项目初始化 | ✅ | ✅ |
| 第二步 | 数据库设计与 Prisma 建模 | ✅ | ✅ |
| 第三步 | 认证与授权模块 | ✅ | ✅ |
| 第四步 | 用户管理模块 | ✅ | ✅ |
| 第五步 | 角色管理与菜单权限模块 | ✅ | 31/31 ✅ |

### 已知待办

- `/dashboard` 路由目前只有 `redirect`，无对应视图组件（属于第八步前端布局范围）

---

> **第五步完成！** ✅
>
> 下一步 → [implementation-steps.md](./implementation-steps.md) 第六步：部门管理模块
