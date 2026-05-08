# 第二步：数据库设计与 Prisma 建模 — 执行记录

> **日期**: 2026-05-07
> **基于**: [implementation-steps.md](../implementation-steps.md) 第二步

---

## 2.1-2.8 Prisma Schema 定义

`packages/server/prisma/schema.prisma` 定义了 9 张表（7 张业务表 + 2 张关联表）：

| 表名 | Prisma 模型 | 说明 |
|------|------------|------|
| sys_user | SysUser | 用户表（username/password/nickname/email/phone/avatar/gender/status/deptId） |
| sys_role | SysRole | 角色表（roleName/roleKey/status/sort） |
| sys_menu | SysMenu | 菜单表（menuName/parentId/menuType/routePath/componentPath/permission/icon） |
| sys_user_role | SysUserRole | 用户-角色关联（userId + roleId 联合主键） |
| sys_role_menu | SysRoleMenu | 角色-菜单关联（roleId + menuId 联合主键） |
| sys_dept | SysDept | 部门表（deptName/parentId/sort/leader/phone/status） |
| sys_dict | SysDict | 字典表（dictName/dictType/dictLabel/dictValue/sort/status） |
| sys_log | SysLog | 操作日志表（userId/ip/actionType/module/description/requestParams/responseResult/duration） |

### 关键设计决策

- **menuType**: 0=目录, 1=菜单, 2=按钮
- **Prisma 生成器输出路径**: `generated/prisma/`（独立目录，不污染 src）
- **Prisma v7**: 需要 driver adapter，已安装 `@prisma/adapter-mariadb` + `mariadb`

---

## 2.9 数据库迁移

已执行 `npx prisma migrate dev --name init`，迁移文件：
`prisma/migrations/20260507132602_init/migration.sql`

---

## 2.10 种子数据

`prisma/seed.ts` 插入以下初始数据：

### 管理员账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 超级管理员 |

### 角色

| 角色名 | 角色标识 | 说明 |
|--------|----------|------|
| 超级管理员 | super_admin | 拥有所有菜单权限 |
| 普通用户 | normal_user | 仅拥有基本权限 |

### 菜单树（24 条）

```
系统管理（目录）
├── 用户管理（菜单）+ 4 个按钮权限（新增/编辑/删除/重置密码）
├── 角色管理（菜单）+ 4 个按钮权限（新增/编辑/删除/分配权限）
├── 菜单管理（菜单）+ 3 个按钮权限（新增/编辑/删除）
├── 部门管理（菜单）+ 3 个按钮权限（新增/编辑/删除）
├── 操作日志（菜单）
└── 字典管理（菜单）+ 3 个按钮权限（新增/编辑/删除）
```

### 字典数据（7 条）

| 字典类型 | 标签 | 值 |
|----------|------|-----|
| sys_user_status | 启用 | 1 |
| sys_user_status | 停用 | 0 |
| sys_user_gender | 男 | 1 |
| sys_user_gender | 女 | 0 |
| sys_menu_type | 目录 | 0 |
| sys_menu_type | 菜单 | 1 |
| sys_menu_type | 按钮 | 2 |

---

## 2.11 验证结果

| 验证项 | 结果 |
|--------|------|
| sys_user (1条) | ✅ admin |
| sys_role (2条) | ✅ 超级管理员 + 普通用户 |
| sys_menu (24条) | ✅ 完整菜单树 |
| sys_user_role (1条) | ✅ admin → 超级管理员 |
| sys_role_menu (24条) | ✅ 超级管理员 → 全部菜单 |
| sys_dept (1条) | ✅ 总公司 |
| sys_dict (7条) | ✅ 3 种字典类型 |

---

## Prisma v7 适配说明

Prisma v7 去掉了 Rust 引擎，需要通过 **driver adapter** 连接数据库：

```typescript
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'root123456',
  database: 'admin_system',
})

const prisma = new PrismaClient({ adapter })
```

新增依赖：
- `@prisma/adapter-mariadb` - MySQL/MariaDB 驱动适配器
- `mariadb` - MySQL 驱动

---

## 目录结构

```
packages/server/
├── prisma/
│   ├── schema.prisma                    # 数据模型定义
│   ├── seed.ts                          # 种子脚本
│   └── migrations/
│       └── 20260507132602_init/
│           └── migration.sql            # SQL 迁移
├── generated/
│   └── prisma/                          # Prisma Client 生成代码
├── prisma.config.ts                     # Prisma 配置（含 seed 命令）
└── .env                                 # 环境变量
```

---

## 前两步全链路验证（2026-05-07）

| 验证项 | 结果 | 说明 |
|--------|:--:|------|
| Docker MySQL 容器 | ✅ | `admin-mysql` Up (healthy), 端口 3307 |
| Docker Redis 容器 | ✅ | `admin-redis` Up (healthy), 端口 6379 |
| Prisma Client 生成 | ✅ | `npx prisma generate` → generated/prisma/ |
| 种子数据完整性 | ✅ | 1用户/2角色/24菜单/1部门/7字典 |
| admin 密码哈希 | ✅ | bcryptjs 加密存储 |
| admin 角色关联 | ✅ | admin → 超级管理员 |
| admin 菜单权限数 | ✅ | 24 个（全部菜单+按钮） |
| Redis 端口连通性 | ✅ | localhost:6379 可达 |
| NestJS `pnpm build` | ✅ | 编译通过（prisma 目录已排除） |
| NestJS 服务启动 | ✅ | `http://localhost:3000/` 正常监听 |
| API 响应测试 | ✅ | `curl localhost:3000/` → `Hello World!` HTTP 200 |
| 前端 `pnpm build` | ✅ | Vite 8 编译通过，18 模块 |

> ⚠️ **修复项**：`tsconfig.build.json` 排除了 `prisma` 目录，因为 `seed.ts` 使用 `import.meta.url` 在 CJS 编译模式下不兼容。

---

**第二步完成！** ✅
