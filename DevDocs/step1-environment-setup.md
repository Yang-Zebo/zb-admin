# 第一步：环境准备与项目初始化 — 执行记录

> **日期**: 2026-05-07  
> **基于**: [implementation-steps.md](../implementation-steps.md) 第一步

---

## 1.1 环境确认

| 工具 | 版本 |
|------|------|
| Node.js | v24.15.0 |
| pnpm | 8.15.3 |
| Docker | 29.4.2 |
| Docker Compose | v5.1.3 |

---

## 1.2 Monorepo 结构

创建了以下根目录文件：

- `pnpm-workspace.yaml` — 定义 `packages/*` 为工作区
- `package.json` — 根项目配置，包含 `dev:client` / `dev:server` 等脚本
- `.gitignore` — 忽略 `node_modules/`、`dist/`、`.env`、`*.log` 等

```
zb-admin/
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── docker-compose.yml
└── packages/
    ├── client/    # Vite + Vue 3 + TypeScript
    └── server/    # NestJS + TypeScript
```

---

## 1.3 Docker 编排

`docker-compose.yml` 配置了两个服务：

| 服务 | 镜像 | 端口映射 | 密码 |
|------|------|----------|------|
| MySQL 8 | `mysql:8.0` | `3307:3306` | root123456 |
| Redis 7 | `redis:7-alpine` | `6379:6379` | redis123456 |

> ⚠️ **端口调整**：3306 端口被本机其他程序占用，MySQL 改为映射到宿主机的 **3307** 端口。对应的 `.env` 中 `DATABASE_URL` 也同步改为 `localhost:3307`。

启动命令：
```bash
docker compose up -d
```

验证状态：
```
NAME          IMAGE            STATUS             PORTS
admin-mysql   mysql:8.0        Up (healthy)       0.0.0.0:3307 → 3306
admin-redis   redis:7-alpine   Up (healthy)       0.0.0.0:6379 → 6379
```

---

## 1.4 前端项目初始化

使用 `pnpm create vite client --template vue-ts` 创建。

**技术栈**:
- Vite 8 + Vue 3 + TypeScript
- 开发服务器端口：`5173`

`vite.config.ts` 已配置 `/api` 代理到 `http://localhost:3000`。

---

## 1.5 后端项目初始化

使用 `npx @nestjs/cli new server --package-manager pnpm --skip-git` 创建。

**技术栈**:
- NestJS 11 + TypeScript
- 服务端口：`3000`

---

## 1.6 前端核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `vue-router` | ^4.6.4 | 前端路由 |
| `pinia` | ^3.0.4 | 状态管理 |
| `axios` | ^1.16.0 | HTTP 请求 |
| `element-plus` | ^2.13.7 | UI 组件库 |
| `sass` | ^1.99.0 | SCSS 编译 |
| `eslint` + `prettier` | ^9 / ^3.8 | 代码规范 |

---

## 1.7 后端核心依赖

| 依赖 | 用途 |
|------|------|
| `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` | JWT 认证 |
| `@prisma/client` + `prisma` | ORM 数据库 |
| `bcryptjs` | 密码加密 |
| `class-validator` + `class-transformer` | DTO 校验 |
| `@nestjs/swagger` | API 文档 |
| `winston` | 日志 |
| `svg-captcha` | 图形验证码 |

---

## 1.8 环境变量

**后端 `.env`** (`packages/server/.env`):

```env
# 数据库
DATABASE_URL=mysql://root:root123456@localhost:3307/admin_system

# JWT
JWT_SECRET=admin-system-jwt-secret-key-2026
JWT_REFRESH_SECRET=admin-system-jwt-refresh-secret-key-2026
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123456
REDIS_DB=0

# 服务端口
PORT=3000

# 验证码
CAPTCHA_EXPIRES_IN=300

# 登录锁定
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_MINUTES=30
```

**前端 `.env`** (`packages/client/.env`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=通用后台管理系统
```

---

## 1.9 验证结果

| 验证项 | 结果 |
|--------|------|
| 前端 `pnpm build` | ✅ 编译通过 |
| 前端 `pnpm dev` | ✅ `http://localhost:5173/` 正常启动 |
| 后端 `pnpm build` | ✅ 编译通过 |
| 后端 `nest start` | ✅ `http://localhost:3000/` 正常启动 |
| API 响应 | ✅ `curl http://localhost:3000/` → `Hello World!` HTTP 200 |
| MySQL 容器 | ✅ healthy |
| Redis 容器 | ✅ healthy |

---

## 目录结构总览

```
zb-admin/
├── pnpm-workspace.yaml
├── package.json
├── docker-compose.yml
├── .gitignore
├── DevDocs/
│   └── step1-environment-setup.md
└── packages/
    ├── client/
    │   ├── .env
    │   ├── .env.example
    │   ├── vite.config.ts          # 含 /api 代理
    │   ├── package.json
    │   └── src/
    └── server/
        ├── .env
        ├── .env.example
        ├── package.json
        └── src/
```

---

**第一步完成！** ✅
