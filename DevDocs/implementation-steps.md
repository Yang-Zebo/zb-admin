# 通用后台管理系统 - 实施步骤清单

> **版本**: v1.0.0  
> **日期**: 2026-05-07  
> **基于**: [requirements.md](./requirements.md)

---

## 第一步：环境准备与项目初始化

> **目标**：把整个工程骨架搭起来，前后端能跑通，数据库能连上。

| 序号 | 具体任务 | 说明 |
|:---:|------|------|
| 1.1 | 确保 Node.js 20 LTS + pnpm 已安装 | `node -v` / `pnpm -v` |
| 1.2 | 创建项目根目录 `admin-system/`，初始化 `pnpm-workspace.yaml` | monorepo 结构，`packages/client` + `packages/server` |
| 1.3 | Docker 编排 MySQL 8 + Redis 7 | 写 `docker-compose.yml`，`docker compose up -d` 一键启动 |
| 1.4 | 初始化前端项目 `client/` | `pnpm create vite client --template vue-ts` |
| 1.5 | 初始化后端项目 `server/` | `npx @nestjs/cli new server` |
| 1.6 | 前端安装核心依赖 | Vue Router 4 / Pinia / Axios / Element Plus / SCSS / ESLint + Prettier |
| 1.7 | 后端安装核心依赖 | `@nestjs/jwt` / `@nestjs/passport` / `passport-jwt` / `prisma` / `@prisma/client` / `bcryptjs` / `class-validator` / `class-transformer` / `@nestjs/swagger` / `winston` / `svg-captcha` |
| 1.8 | 前后端各自配置环境变量 `.env` | 数据库连接串、Redis 连接串、JWT secret 等 |
| 1.9 | 验证：前端 `pnpm dev` 能跑，后端 `pnpm start:dev` 能跑，数据库能连上 |

---

## 第二步：数据库设计与 Prisma 建模

> **目标**：定义 7 张核心表的 Schema，生成迁移并同步到 MySQL。

| 序号 | 具体任务 | 说明 |
|:---:|------|------|
| 2.1 | 后端初始化 Prisma | `npx prisma init`，配置 MySQL 数据源 |
| 2.2 | 编写 `schema.prisma` — `sys_user` 表 | username, password, nickname, email, phone, avatar, gender, status, dept_id(FK) |
| 2.3 | 编写 `sys_role` 表 | role_name, role_key, status, sort |
| 2.4 | 编写 `sys_menu` 表 | menu_name, parent_id, menu_type(目录/菜单/按钮), route_path, component_path, permission, icon, sort, is_visible, is_cache, is_external |
| 2.5 | 编写多对多关联表 | `sys_user_role`(user_id + role_id), `sys_role_menu`(role_id + menu_id) |
| 2.6 | 编写 `sys_dept` 表 | dept_name, parent_id, sort, leader, phone, status |
| 2.7 | 编写 `sys_dict` 表 | dict_name, dict_type, dict_label, dict_value, sort, status（合并字典类型与字典数据为单表） |
| 2.8 | 编写 `sys_log` 表 | user_id, ip, action_type, module, description, request_params, response_result, duration, created_at |
| 2.9 | 运行迁移 | `npx prisma migrate dev --name init` |
| 2.10 | 编写种子脚本 `prisma/seed.ts` | 插入超级管理员、默认角色、默认菜单树 |
| 2.11 | 用 Prisma Studio 验证数据库 | `npx prisma studio` |

---

## 第三步：认证与授权模块

> **目标**：实现 JWT 登录/退出/Token 刷新/全局 Guard，这是所有后续模块的前置依赖。

| 序号 | 具体任务 | 对应需求编号 |
|:---:|------|:---:|
| 3.1 | 编写登录 DTO（username, password, captcha） | LOGIN-001 |
| 3.2 | 实现 `JwtStrategy`（Passport JWT） | AUTH-002 |
| 3.3 | 实现 `AuthService.login()` — 校验用户/密码/验证码/状态，返回 AccessToken + RefreshToken | LOGIN-001 ~ LOGIN-006 |
| 3.4 | 实现 `AuthController` 登录接口 POST `/api/auth/login` | LOGIN-004 |
| 3.5 | 实现图形验证码接口 GET `/api/auth/captcha`，存入 Redis | LOGIN-001 |
| 3.6 | 实现 JWT Auth Guard 全局注册 | AUTH-001, AUTH-002 |
| 3.7 | 实现退出接口 POST `/api/auth/logout`，Token 加入 Redis 黑名单 | LOGOUT-001 |
| 3.8 | 实现 Token 刷新接口 POST `/api/auth/refresh` | TOKEN-001, TOKEN-002 |
| 3.9 | 实现权限查询接口 GET `/api/auth/permissions`，返回用户菜单树 | MENU-006 |
| 3.10 | 前端封装 Axios 拦截器 — 自动带 Token / 401 跳登录 / 无感刷新 | TOKEN-003 |
| 3.11 | 前端实现登录页（用户名、密码、验证码） | LOGIN-001 |
| 3.12 | 登录失败锁定逻辑（5 次失败锁定 30 分钟） | LOGIN-007 (P1) |

---

## 第四步：用户管理模块

> **目标**：最核心的 CRUD 模块，跑通前后端完整链路。

| 序号 | 具体任务 | 对应需求编号 |
|:---:|------|:---:|
| 4.1 | 后端 `UserService` — 分页查询（含筛选：用户名、手机号、状态、部门） | USER-001, USER-007 |
| 4.2 | 后端 `UserService` — 新增用户（校验唯一性、密码 bcrypt 加密） | USER-002 |
| 4.3 | 后端 `UserService` — 编辑用户（不可改密码，密码走重置接口） | USER-003 |
| 4.4 | 后端 `UserService` — 删除用户（单个/批量，不能删自己） | USER-004 |
| 4.5 | 后端 `UserService` — 重置密码（默认 123456） | USER-005 |
| 4.6 | 后端 `UserService` — 启用/停用切换 | USER-006 |
| 4.7 | 前端 — 用户列表页（表格 + 分页 + 搜索栏 + 操作按钮） | USER-001 |
| 4.8 | 前端 — 新增/编辑用户弹窗表单 | USER-002, USER-003 |
| 4.9 | 前端 — 删除确认 / 批量删除 / 重置密码 / 启用停用 | USER-004 ~ USER-006 |

---

## 第五步：角色管理与菜单权限模块

> **目标**：RBAC 核心，角色 CRUD + 菜单树分配 + 前端动态路由 + 按钮权限指令。

| 序号 | 具体任务 | 对应需求编号 |
|:---:|------|:---:|
| 5.1 | 后端 `MenuService` — 菜单树查询、新增、编辑、删除（有子节点不可删） | MENU-001 ~ MENU-005 |
| 5.2 | 后端 `RoleService` — 角色 CRUD（关联用户的不可删） | ROLE-001 ~ ROLE-004 |
| 5.3 | 后端 `RoleService` — 分配菜单权限（树形勾选，操作 `role_menu` 表） | ROLE-005 |
| 5.4 | 后端 RBAC 权限缓存 — Redis 缓存用户权限，Guard 中鉴权 | AUTH-001, ROLE-006 |
| 5.5 | 前端 — 角色列表页（表格 + 分页） | ROLE-001 |
| 5.6 | 前端 — 分配权限（树形勾选弹窗，父子联动） | ROLE-005 |
| 5.7 | 前端 — 菜单管理页（树形表格，支持目录/菜单/按钮三种类型） | MENU-001 ~ MENU-005 |
| 5.8 | 前端 — 动态路由生成（路由守卫调用 `/auth/permissions` → `router.addRoute`） | MENU-006 |
| 5.9 | 前端 — `v-permission` 自定义指令，按钮级显隐控制 | MENU-007 |
| 5.10 | 前端 — 403 无权限页面 + 路由拦截 | MENU-008 |

---

## 第六步：部门管理模块

> **目标**：树形组织架构 CRUD，用户管理中的部门选择。

| 序号 | 具体任务 | 对应需求编号 |
|:---:|------|:---:|
| 6.1 | 后端 `DeptService` — 部门树查询、新增、编辑、删除（有子部门/关联用户不可删） | DEPT-001 ~ DEPT-004 |
| 6.2 | 前端 — 部门管理页（树形表格，支持展开折叠） | DEPT-001 ~ DEPT-004 |
| 6.3 | 前端 — 用户表单中的部门树形下拉选择 | DEPT-005 |

---

## 第七步：操作日志与字典管理模块

> **目标**：审计日志自动记录 + 字典数据统一管理，P1/P2 优先级。

| 序号 | 具体任务 | 对应需求编号 |
|:---:|------|:---:|
| 7.1 | 后端 `LogService` — 日志写入与分页查询（按操作人/类型/时间筛选） | LOG-001 ~ LOG-003 |
| 7.2 | 后端 NestJS Interceptor — 自动捕获 Controller 操作写入日志 | LOG-005 |
| 7.3 | 前端 — 操作日志页（只读表格，不可删除） | LOG-003, LOG-004 |
| 7.4 | 后端 `DictService` — 字典类型与字典数据的 CRUD | DICT-001 ~ DICT-003 |
| 7.5 | 前端 — 字典管理页（字典类型列表 + 字典数据子表） | DICT-002 ~ DICT-003 |
| 7.6 | 前端 — 封装 `useDict` 方法 / 字典下拉组件 | DICT-004, DICT-005 |

---

## 第八步：前后端联调、Swagger 文档与收尾

> **目标**：全链路打通，文档完善，项目可用。

| 序号 | 具体任务 |
|:---:|------|
| 8.1 | 后端 Swagger 装饰器补全所有 API 文档 |
| 8.2 | 前端布局搭建（侧边栏菜单 + 顶栏 + 主内容区），根据权限动态渲染 |
| 8.3 | 前端 404 / 500 等错误页面 |
| 8.4 | 全模块前后端联调，修复 bug |
| 8.5 | P2 优先级补充：用户头像上传（USER-008）、Excel 导出（USER-009） |
| 8.6 | ESLint + Prettier 最终检查，确保零告警 |
| 8.7 | 编写项目 README（启动方式、技术栈、目录结构说明） |

---

## 执行建议

1. **严格按顺序执行**：每一步是下一步的前置依赖，不能跳过。
2. **先跑通再优化**：P0 优先，P1/P2 在主干跑通后再补充。
3. **每个模块都走「后端 Service → Controller → 前端页面 → 联调」的闭环**。
4. **每完成一步做一次 `git commit`**，方便回退。
