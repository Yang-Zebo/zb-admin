# 第二步：数据库设计与 Prisma 建模 — 执行记录

> **日期**: 2026-05-07  
> **状态**: ⚠️ **中断** — 因 pnpm 安装 mysql2 时网络超时（registry.npmmirror.com 部分包下载失败）  
> **基于**: [implementation-steps.md](../implementation-steps.md) 第二步

---

## 已完成任务

### 2.1 Prisma 初始化 ✅

```bash
cd packages/server
pnpm exec prisma init
```

Prisma 7 生成了以下文件结构：

```
packages/server/
├── prisma/
│   └── schema.prisma          # 数据模型定义
├── prisma.config.ts           # Prisma 配置文件（新版本特性）
├── .gitignore
```

### 2.2 ~ 2.8 编写 Schema — 9 张表 ✅

完整的 `schema.prisma` 已编写完成，包含以下模型：

| # | 表名 | 说明 | 字段 |
|:---:|------|------|------|
| 2.2 | `sys_user` | 用户表 | id, username, password, nickname, email, phone, avatar, gender, status, dept_id, login_attempts, locked_until, create_time, update_time |
| 2.3 | `sys_role` | 角色表 | id, role_name, role_key, status, sort, create_time, update_time |
| 2.4 | `sys_menu` | 菜单表 | id, menu_name, parent_id, menu_type(1目录/2菜单/3按钮), route_path, component_path, permission, icon, sort, is_visible, is_cache, is_external, create_time, update_time |
| 2.5 | `sys_user_role` | 用户-角色关联表 | user_id + role_id（联合主键，级联删除） |
| 2.5 | `sys_role_menu` | 角色-菜单关联表 | role_id + menu_id（联合主键，级联删除） |
| 2.6 | `sys_dept` | 部门表 | id, dept_name, parent_id, sort, leader, phone, status, create_time, update_time |
| 2.7 | `sys_dict` | 字典表 | id, dict_name, dict_type, dict_label, dict_value, sort, status, create_time, update_time |
| 2.8 | `sys_log` | 操作日志表 | id, user_id, ip, action_type, module, description, request_params, response_result, duration, created_time |

> **技术决策**：
> - `sys_dict` 合并了字典类型与字典数据为单表，通过 `dict_type` 字段区分
> - 字段命名使用驼峰 `camelCase`，通过 `@map()` 映射为数据库的下划线 `snake_case`
> - 所有表增加 `login_attempts`（登录失败次数）和 `locked_until`（锁定截止时间）字段

### 2.9 运行数据库迁移 ✅

```bash
pnpm exec prisma migrate dev --name init
```

迁移成功，生成的 SQL 在 `prisma/migrations/20260507132602_init/migration.sql`。

**验证结果**：
- 9 张表全部成功创建到 MySQL `admin_system` 数据库
- 所有外键约束正确建立（`sys_user -> sys_dept`、`sys_user_role -> sys_user/sys_role`、`sys_role_menu -> sys_role/sys_menu`、`sys_log -> sys_user`）
- 索引已建立（`sys_dict.dict_type`、`sys_log.user_id/action_type/created_time`）

---

## 遇到的关键问题：Prisma 7 重大变更

### Prisma 7 的新架构

Prisma 7 不再将 `datasource.url` 放在 `schema.prisma` 中，改为：

1. **`prisma.config.ts`** — 管理数据源 URL 和迁移路径
   ```ts
   export default defineConfig({
     schema: "prisma/schema.prisma",
     migrations: { path: "prisma/migrations" },
     datasource: { url: process.env["DATABASE_URL"] },
   });
   ```

2. **`prismaClient` 需要适配器** — Prisma 7 强制要求传 `adapter` 参数
   ```ts
   import { PrismaClient } from './generated/prisma/client.js'
   const prisma = new PrismaClient({
     adapter: /* 需要一个 MySQL 驱动适配器 */
   })
   ```

3. GitHub 上未找到 `@prisma/adapter-mysql` 包（404），推测 Prisma 7 的 MySQL 适配器命名可能不同或尚未发布

### 对种子脚本的影响

由于 Prisma Client 初始化需要适配器参数，当前无法直接用 Prisma Client 写种子脚本。**临时方案**：使用 `mysql2` 直接写 SQL 插种子数据。

---

## 当前卡点

| 问题 | 说明 |
|------|------|
| 2.10 种子脚本 | ❌ 待完成 — 需先安装 mysql2 + bcryptjs 后编写 |
| 2.11 Prisma Studio 验证 | ❌ 待完成 |
| 网络问题 | pnpm 安装 mysql2 时 npmjs 和 npmmirror 均出现 Socket timeout |

### 阻塞原因

```
ERR_PNPM_META_FETCH_FAIL  —  registry.npmmirror.com 上多个包（denque, iconv-lite, fsevents 等）下载超时
ERR_SOCKET_TIMEOUT       —  重试后仍失败，安装中断
```

---

## 目录结构（当前状态）

```
packages/server/
├── prisma/
│   ├── schema.prisma                   # 完整 9 张表模型
│   └── migrations/
│       └── 20260507132602_init/
│           └── migration.sql           # 迁移 SQL
├── prisma.config.ts                    # Prisma 7 配置
├── generated/
│   └── prisma/                         # 生成的 Prisma Client
├── .env                                # DATABASE_URL=localhost:3307
└── package.json
```

---

## 待继续执行的任务

1. **确保网络畅通**后重新安装 `mysql2`：
   ```bash
   cd packages/server && pnpm add mysql2
   ```
2. 编写 `prisma/seed.ts` — 插入超级管理员（admin/admin123）、默认角色（超级管理员）、默认菜单树
3. 配置 `package.json` 的 `prisma.seed`
4. 运行种子脚本
5. 使用 Prisma Studio 验证数据库（`npx prisma studio` 或 MySQL 客户端）

---

## 对应需求索引

| 实施步骤 | 对应需求 |
|:--------:|:--------:|
| 2.2 sys_user | USER-001 ~ USER-008, LOGIN-001 ~ LOGIN-007 |
| 2.3 sys_role | ROLE-001 ~ ROLE-006 |
| 2.4 sys_menu | MENU-001 ~ MENU-007 |
| 2.5 sys_user_role / sys_role_menu | ROLE-006, AUTH-001 |
| 2.6 sys_dept | DEPT-001 ~ DEPT-005 |
| 2.7 sys_dict | DICT-001 ~ DICT-005 |
| 2.8 sys_log | LOG-001 ~ LOG-005 |

---

> **⚠️ 中断说明**：第二步执行到 2.10（种子脚本）时，因 pnpm 依赖安装（mysql2）过程中 registry.npmmirror.com 网络超时导致进程卡死，当前会话在此中断。恢复后需先确保网络正常，重新安装 mysql2，继续完成种子脚本和 Prisma Studio 验证。
