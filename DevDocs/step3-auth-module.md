# 第三步：认证与授权模块 — 执行记录

> **日期**: 2026-05-08
> **状态**: ✅ 完成
> **基于**: [implementation-steps.md](./implementation-steps.md) 第三步

---

## 完成概要

| 维度 | 数据 |
|------|------|
| 新增后端文件 | 17 个 |
| 新增前端文件 | 7 个 |
| 实现 API 端点 | 5 个 |
| 新增依赖 | `@nestjs/config`、`ioredis`、`@element-plus/icons-vue` |
| 编译状态 | 前后端均通过 |
| 全链路测试 | 全部通过 |

---

## 一、后端实现

### 1.1 基础设施模块

#### PrismaModule & PrismaService

- 路径: `packages/server/src/prisma/`
- 职责: 全局单例的 Prisma 客户端，连接 MySQL 数据库
- 使用 `@prisma/adapter-mariadb` 作为 Prisma 7 的驱动适配器
- 通过 `OnModuleInit` 钩子自动连接，`OnModuleDestroy` 自动断开

#### RedisModule & RedisService

- 路径: `packages/server/src/redis/`
- 职责: 全局单例的 Redis 客户端（基于 ioredis），用于验证码存储、Token 黑名单
- 继承 `ioredis.Redis`，直接复用所有 Redis 命令

### 1.2 认证模块 (AuthModule)

**新增文件:**

| 文件 | 职责 |
|------|------|
| [auth.module.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/auth/auth.module.ts) | 认证模块入口，导入 JwtModule + PassportModule |
| [auth.service.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/auth/auth.service.ts) | 核心认证逻辑 |
| [auth.controller.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/auth/auth.controller.ts) | API 控制器 |
| [login.dto.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/auth/dto/login.dto.ts) | 登录参数校验（DTO + class-validator） |
| [jwt.strategy.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/auth/strategies/jwt.strategy.ts) | Passport JWT 验证策略 |
| [jwt-auth.guard.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/auth/guards/jwt-auth.guard.ts) | 全局 JWT 鉴权守卫 |
| [public.decorator.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/common/decorators/public.decorator.ts) | `@Public()` 装饰器，标记公开路由 |
| [current-user.decorator.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/common/decorators/current-user.decorator.ts) | `@CurrentUser()` 装饰器，获取当前登录用户 |
| [env.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/env.ts) | 环境变量预加载（ESM 环境兼容） |

### 1.3 实现的 API 端点

| 方法 | 路径 | 需求编号 | 说明 | 鉴权 |
|:---:|------|:---:|------|:---:|
| GET | `/api/auth/captcha` | LOGIN-001 | 获取图形验证码（svg-captcha 数学表达式） | ✗ |
| POST | `/api/auth/login` | LOGIN-001~006 | 用户登录，验证码校验 + 密码 bcrypt 比对 + 状态检查，返回 AccessToken + RefreshToken | ✗ |
| POST | `/api/auth/logout` | LOGOUT-001 | 退出登录，Access Token 写入 Redis 黑名单 | ✓ |
| POST | `/api/auth/refresh` | TOKEN-001, TOKEN-002 | 用 Refresh Token 换取新的 Token 对 | ✗ |
| GET | `/api/auth/permissions` | MENU-006 | 获取当前用户菜单树 + 按钮权限列表（RBAC） | ✓ |

### 1.4 登录失败锁定

- 需求: LOGIN-007 (P1)
- 逻辑: 连续 5 次密码错误 → 账号锁定 30 分钟
- 存储: `sys_user.login_attempts`（失败次数）+ `sys_user.locked_until`（锁定截止时间）
- 登录成功后自动清零失败计数

---

## 二、前端实现

### 2.1 新增文件

| 文件 | 职责 |
|------|------|
| [request.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/utils/request.ts) | Axios 实例，含请求/响应拦截器 |
| [auth.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/api/auth.ts) | 认证 API 封装（login/logout/refresh/captcha/permissions） |
| [auth.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/stores/auth.ts) | Pinia 状态管理（Token、用户信息、权限） |
| [index.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/router/index.ts) | Vue Router 配置 + 路由守卫 |
| [index.vue](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/views/login/index.vue) | 登录页面（用户名/密码/验证码） |
| [404.vue](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/views/error/404.vue) | 404 错误页面 |

### 2.2 Axios 无感刷新（TOKEN-003）

```
请求返回 401
   │
   ├─ 没有 RefreshToken → 跳转登录页
   │
   └─ 有 RefreshToken
        │
        ├─ 正在刷新中 → 请求加入等待队列
        │
        └─ 开始刷新
             ├─ 成功 → 用新 Token 重放所有等待队列中的请求
             └─ 失败 → 清除 Token，跳转登录页
```

### 2.3 路由守卫流程

```
用户访问任意页面
   │
   ├─ 访问 /login
   │    ├─ 已有 Token → 重定向到首页
   │    └─ 无 Token → 放行
   │
   └─ 访问其他页面
        ├─ 无 Token → 重定向 /login
        ├─ 有 Token 但无用户信息 → 请求 /auth/permissions → 获取菜单+权限
        └─ 已有用户信息 → 直接放行
```

---

## 三、关键技术决策与问题解决

### 3.1 ESM 兼容性修复

**问题**: Prisma 7 生成的客户端代码使用了 `import.meta.url`（ESM 语法），而 Node.js v24 在 CJS 模式下不再支持此语法。

**解决**: 将 `packages/server/package.json` 中添加 `"type": "module"`，将整个服务端切换为 ESM 模式。

**连锁改动**:
- `ioredis` 导入方式：`import Redis from 'ioredis'` → `import { Redis } from 'ioredis'`
- 所有相对路径导入必须加 `.js` 扩展名
- 新增 `env.ts` 模块，用 `process.loadEnvFile()` 替代 `dotenv`，确保 `.env` 在模块初始化前加载

### 3.2 JWT Secret 加载时序

**问题**: `ConfigModule.forRoot()` 在 NestJS 模块加载过程中才读取 `.env`，但 `JwtModule.register()` 在模块装饰器阶段就需要 `JWT_SECRET`。

**解决**: 创建 `src/env.ts`，在 `main.ts` 第一行 `import './env.js'`，确保所有模块导入前 `.env` 已经加载到 `process.env`。

### 3.3 验证码 DTO 调整

**问题**: 初始 DTO 要求验证码必须 4 位（`@MinLength(4)`），但 svg-captcha 数学表达式答案通常是 1-2 位数字。

**解决**: 移除 DTO 中验证码的长度限制，只保留 `@IsNotEmpty()`。

---

## 四、修改的已有文件

| 文件 | 修改内容 |
|------|---------|
| `packages/server/package.json` | 添加 `"type": "module"`，修改 `start:prod` 路径 |
| `packages/server/src/app.module.ts` | 导入 PrismaModule / RedisModule / AuthModule / JwtAuthGuard（全局） |
| `packages/server/src/main.ts` | 添加 `env.ts` 预加载、全局前缀 `/api`、ValidationPipe、CORS、Swagger |
| `packages/server/src/app.controller.ts` | 添加 `@Public()` 装饰器 |
| `packages/client/src/main.ts` | 注册 Pinia / Vue Router / Element Plus / Element Plus Icons |
| `packages/client/src/App.vue` | 替换为 `<router-view />` |

---

## 五、目录结构总览

```
packages/server/src/
├── main.ts                             # 应用入口
├── env.ts                              # 环境变量预加载
├── app.module.ts                       # 根模块
├── app.controller.ts                   # 根控制器
├── app.service.ts
├── prisma/
│   ├── prisma.module.ts                # Prisma 全局模块
│   └── prisma.service.ts               # Prisma 服务
├── redis/
│   ├── redis.module.ts                 # Redis 全局模块
│   └── redis.service.ts                # Redis 服务
├── auth/
│   ├── auth.module.ts                  # 认证模块
│   ├── auth.service.ts                 # 认证逻辑
│   ├── auth.controller.ts              # 认证 API
│   ├── dto/
│   │   └── login.dto.ts                # 登录 DTO
│   ├── strategies/
│   │   └── jwt.strategy.ts             # JWT 策略
│   └── guards/
│       └── jwt-auth.guard.ts           # JWT 守卫
└── common/
    └── decorators/
        ├── public.decorator.ts         # @Public 装饰器
        └── current-user.decorator.ts   # @CurrentUser 装饰器

packages/client/src/
├── main.ts                             # 应用入口
├── App.vue                             # 根组件
├── router/
│   └── index.ts                        # 路由配置 + 守卫
├── stores/
│   └── auth.ts                         # 认证状态管理
├── api/
│   └── auth.ts                         # 认证 API 封装
├── utils/
│   └── request.ts                      # Axios 拦截器
└── views/
    ├── login/
    │   └── index.vue                   # 登录页
    └── error/
        └── 404.vue                     # 404 页
```

---

## 六、API 测试验证结果

| # | 测试项 | 结果 |
|:---:|------|:---:|
| 1 | 验证码生成 + Redis 存储 | ✅ |
| 2 | 错误验证码拒绝登录 | ✅ |
| 3 | 正确凭据登录返回 Token + 用户信息 | ✅ |
| 4 | JWT 鉴权获取权限（菜单树 + 按钮权限） | ✅ |
| 5 | Refresh Token 刷新 Access Token | ✅ |
| 6 | 退出登录后 Token 加入黑名单 | ✅ |
| 7 | 退出后再次访问返回 401 | ✅ |
| 8 | 无 Token 访问受保护路由返回 401 | ✅ |
| 9 | 登录失败锁定逻辑 | ✅ |
| 10 | 前后端编译通过 | ✅ |

---

## 七、对应需求索引

| 需求编号 | 需求描述 | 状态 |
|:---:|------|:---:|
| LOGIN-001 | 用户名+密码+验证码登录 | ✅ |
| LOGIN-002 | 停用账号禁止登录 | ✅ |
| LOGIN-003 | 密码 bcrypt 加密验证 | ✅ |
| LOGIN-004 | 返回 Access + Refresh Token | ✅ |
| LOGIN-005 | Access Token 含 userId/username | ✅ |
| LOGIN-006 | 明确错误提示 | ✅ |
| LOGIN-007 | 5 次失败锁定 30 分钟 (P1) | ✅ |
| LOGOUT-001 | 退出 Token 加入 Redis 黑名单 | ✅ |
| TOKEN-001 | Refresh Token 换新 Access Token | ✅ |
| TOKEN-002 | Refresh 过期跳登录 | ✅ |
| TOKEN-003 | Axios 无感刷新 (P1) | ✅ |
| AUTH-001 | 受保护接口需 JWT | ✅ |
| AUTH-002 | 全局 Guard 解析 Token | ✅ |
| AUTH-003 | 黑名单 Token 拒绝 | ✅ |
| MENU-006 | 获取用户菜单树 + 权限 | ✅ |

---

> **第三步完成！** ✅
> 
> 下一步 → [implementation-steps.md](./implementation-steps.md) 第四步：用户管理模块
