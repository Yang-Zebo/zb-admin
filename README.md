# 通用后台管理系统 (zb-admin)

> 基于 Vue 3 + NestJS + Prisma + MySQL + Redis + JWT 的 RBAC 权限管理系统

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite 8
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP**: Axios (含 401 无感刷新)
- **类型安全**: TypeScript

### 后端
- **框架**: NestJS 11 (ESM 模式)
- **ORM**: Prisma 7 (使用 `@prisma/adapter-mariadb` 驱动适配器)
- **数据库**: MySQL 8
- **缓存**: Redis 7
- **认证**: JWT (Access Token + Refresh Token)
- **密码加密**: bcryptjs
- **验证码**: svg-captcha

## 功能模块

| 模块 | 说明 |
|------|------|
| 认证与授权 | JWT 登录/退出/Token 无感刷新、全局 Guard 鉴权、Redis 黑名单 |
| 用户管理 | 用户 CRUD、角色分配、重置密码、启用/停用、部门选择 |
| 角色管理 | 角色 CRUD、菜单权限分配（树形勾选）、RBAC 缓存清除 |
| 菜单权限 | 菜单树 CRUD（目录/菜单/按钮）、动态路由、v-permission 按钮级权限 |
| 部门管理 | 树形组织架构 CRUD、用户表单部门选择 |
| 操作日志 | 全局拦截器自动记录、分页查询、操作人/类型/时间范围筛选 |
| 字典管理 | 字典类型+数据 CRUD、useDict 组合式函数（含缓存） |

## 快速开始

### 前置要求

- Node.js 20+（推荐 24+）
- pnpm 8+
- Docker + Docker Compose

### 安装依赖

```bash
pnpm install
```

### 启动数据库和 Redis

```bash
docker compose up -d
```

### 数据库迁移与种子数据

```bash
cd packages/server
npx prisma migrate dev
npx prisma db seed
```

### 启动开发服务器

```bash
# 启动后端
pnpm dev:server

# 启动前端（新终端）
pnpm dev:client
```

### 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 超级管理员 |

## 项目结构

```
zb-admin/
├── docker-compose.yml              # Docker 编排 MySQL + Redis
├── pnpm-workspace.yaml             # pnpm monorepo 配置
├── DevDocs/                        # 开发步骤文档
│   ├── implementation-steps.md     # 实施步骤清单
│   ├── requirements.md             # 需求文档
│   ├── step1-environment-setup.md  # 第一步执行记录
│   ├── step2-database-setup.md     # 第二步执行记录
│   ├── step3-auth-module.md        # 第三步执行记录
│   ├── step4-user-module.md        # 第四步执行记录
│   ├── step5-role-menu-module.md   # 第五步执行记录
│   ├── step6-dept-module.md        # 第六步执行记录
│   ├── step7-log-dict-module.md    # 第七步执行记录
│   └── step8-layout-final.md       # 第八步执行记录
├── packages/
│   ├── client/                     # 前端 (Vue 3 + Vite)
│   │   ├── src/
│   │   │   ├── api/                # API 封装
│   │   │   ├── composables/        # 组合式函数
│   │   │   ├── directives/         # 自定义指令 (v-permission)
│   │   │   ├── router/             # 路由配置 + 权限守卫
│   │   │   ├── stores/             # Pinia 状态管理
│   │   │   ├── utils/              # 工具函数
│   │   │   ├── views/              # 页面组件
│   │   │   │   ├── login/          # 登录页
│   │   │   │   ├── layout/         # 主布局（侧边栏+顶栏）
│   │   │   │   ├── dashboard/      # 首页
│   │   │   │   ├── user/           # 用户管理
│   │   │   │   ├── role/           # 角色管理
│   │   │   │   ├── menu/           # 菜单管理
│   │   │   │   ├── dept/           # 部门管理
│   │   │   │   ├── log/            # 操作日志
│   │   │   │   ├── dict/           # 字典管理
│   │   │   │   └── error/          # 403/404 错误页
│   │   │   ├── main.ts             # 应用入口
│   │   │   └── App.vue             # 根组件
│   │   └── .env                    # 环境变量
│   └── server/                     # 后端 (NestJS + Prisma)
│       ├── prisma/
│       │   ├── schema.prisma       # 数据模型定义
│       │   ├── seed.ts             # 种子脚本
│       │   └── migrations/         # 数据库迁移
│       ├── src/
│       │   ├── auth/               # 认证模块
│       │   ├── user/               # 用户模块
│       │   ├── role/               # 角色模块
│       │   ├── menu/               # 菜单模块
│       │   ├── dept/               # 部门模块
│       │   ├── log/                # 日志模块（含全局拦截器）
│       │   ├── dict/               # 字典模块
│       │   ├── prisma/             # Prisma 全局模块
│       │   ├── redis/              # Redis 全局模块
│       │   ├── common/             # 公共装饰器
│       │   ├── app.module.ts       # 根模块
│       │   └── main.ts             # 应用入口
│       └── .env                    # 环境变量
└── package.json                    # 根项目配置
```

## API 文档

启动后端服务后，访问 `http://localhost:3000/api/docs` 查看 Swagger API 文档。

## 数据库表

| 表名 | 说明 |
|------|------|
| sys_user | 用户表 |
| sys_role | 角色表 |
| sys_menu | 菜单表 |
| sys_dept | 部门表 |
| sys_dict | 字典表 |
| sys_log | 操作日志表 |
| sys_user_role | 用户-角色关联 |
| sys_role_menu | 角色-菜单关联 |

## 端口配置

| 服务 | 端口 |
|------|------|
| 前端 | 5173 |
| 后端 | 3000 |
| MySQL | 3307 (容器内 3306) |
| Redis | 6379 |

## 许可证

MIT
