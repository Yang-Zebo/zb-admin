# 第六步：部门管理模块 — 执行记录

> **日期**: 2026-05-08
> **状态**: ✅ 完成
> **基于**: [implementation-steps.md](./implementation-steps.md) 第六步

---

## 完成概要

| 维度 | 数据 |
|------|------|
| 新增后端文件 | 5 个 |
| 新增前端文件 | 2 个 |
| 修改已有文件 | 3 个 |
| 实现 API 端点 | 6 个 |
| 后端编译 | ✅ 通过 |
| 前端编译 | ✅ 通过（21 chunks，含 dept 模块） |

---

## 一、后端实现

### 1.1 Dept 模块 (部门管理)

| 文件 | 职责 |
|------|------|
| [dept.service.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/dept/dept.service.ts) | 部门 CRUD + 树构建 + 删除检查（有子部门/关联用户拒绝删除） |
| [dept.controller.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/dept/dept.controller.ts) | 部门 API 控制器 |
| [dept.module.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/dept/dept.module.ts) | 部门模块定义 |
| [dto/create-dept.dto.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/dept/dto/create-dept.dto.ts) | 新增部门参数校验 |
| [dto/update-dept.dto.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/dept/dto/update-dept.dto.ts) | 编辑部门参数校验 |

### 1.2 实现的 API 端点

| 方法 | 路径 | 说明 | 关键逻辑 |
|:---:|------|------|------|
| GET | `/api/dept/list` | 获取完整部门树 | 查全部部门 → 按 sort+id 排序 → `buildTree()` 转树形 |
| GET | `/api/dept/tree` | 获取简化部门树 | 仅返回 id/deptName/parentId，仅查启用状态的部门（前端下拉选择用） |
| GET | `/api/dept/:id` | 查询部门详情 | 返回单条完整记录 |
| POST | `/api/dept` | 新增部门 | 支持 parentId 构建树形层级 |
| PUT | `/api/dept/:id` | 编辑部门 | 部分更新，未传字段保持不变 |
| DELETE | `/api/dept/:id` | 删除部门 | 先检查 `COUNT(parentId=id)`（有子部门返回 400）→ 再检查 `COUNT(deptId=id)` 在 sys_user 表（有关联用户返回 400）→ 删除 |

---

## 二、前端实现

### 2.1 新增文件

| 文件 | 职责 |
|------|------|
| [api/dept.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/api/dept.ts) | 部门 API 封装（含 TypeScript 类型定义：DeptItem、DeptTreeItem、CreateDeptParams、UpdateDeptParams） |
| [views/dept/index.vue](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/views/dept/index.vue) | 部门管理页（树形表格 + 自适应表单） |

### 2.2 部门管理页功能

- **树形表格**：`el-table` + `tree-props="{children:'children'}"` + `row-key="id"` + `default-expand-all`
- **表格列**：部门名称、排序、负责人、联系电话、状态（`<el-tag>` 启用/停用）、创建时间
- **操作**：编辑、删除
- **新增/编辑表单**：
  - 部门名称（必填，最长 50 字符）
  - 上级部门（递归构建带层级前缀 `├─ ` 的下拉选项）
  - 排序（数字输入框 0-999）
  - 负责人、联系电话
  - 状态（Radio 启用/停用）
- **删除保护**：后端校验存在子部门或关联用户时返回 400 错误

### 2.3 用户表单中的部门树形下拉选择（DEPT-005）

在 [views/user/index.vue](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/views/user/index.vue) 中新增：

- 导入 `getDeptTree` API 和 `DeptTreeItem` 类型
- 新增 `deptTree` ref 存储部门树数据
- 页面挂载时调用 `fetchDeptTree()` 加载部门树
- 用户新增/编辑表单中新增"部门"字段，使用 `el-tree-select` 组件：
  - `check-strictly` 允许选择任意层级
  - `:render-after-expand="false"` 优化性能
  - `node-key="id"` + `:props="{ label: 'deptName', children: 'children' }"`
  - 支持 `clearable` 清除选择

### 2.4 路由配置

在 [router/index.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/router/index.ts) 中新增：

```typescript
{
  path: '/dept',
  name: 'Dept',
  component: () => import('../views/dept/index.vue'),
  meta: { requiresAuth: true, permission: 'sys:dept:list' },
}
```

### 2.5 修改的已有文件

| 文件 | 修改内容 |
|------|---------|
| [app.module.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/server/src/app.module.ts) | 导入并注册 `DeptModule` |
| [router/index.ts](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/router/index.ts) | 添加 `/dept` 路由，权限标识 `sys:dept:list` |
| [user/index.vue](file:///Users/yangzebo/code/Trae%20IDE/zb-admin/packages/client/src/views/user/index.vue) | 导入部门 API；新增 `deptTree` 状态 + `fetchDeptTree()` 方法；新增部门 `el-tree-select` 表单项 |

---

## 三、编译验证

| 验证项 | 结果 | 说明 |
|--------|:---:|------|
| 后端 `nest build` | ✅ | exit code 0，无错误 |
| 前端 `vite build` | ✅ | exit code 0，1673 模块转换成功，21 个输出文件（含 dept 模块 JS/CSS chunks） |

---

## 四、目录结构总览

### 后端

```
packages/server/src/
├── app.module.ts                               # 已注册 DeptModule
├── dept/                                       # ★ 新增
│   ├── dept.module.ts                          # 部门模块
│   ├── dept.service.ts                         # 部门 CRUD + 树构建 + 删除检查
│   ├── dept.controller.ts                      # 部门 API（6 个端点）
│   └── dto/
│       ├── create-dept.dto.ts                  # 新增部门 DTO
│       └── update-dept.dto.ts                  # 编辑部门 DTO
├── user/
│   └── ...                                     # 用户模块（未修改）
├── role/
│   └── ...                                     # 角色模块
└── menu/
    └── ...                                     # 菜单模块
```

### 前端

```
packages/client/src/
├── router/
│   └── index.ts                                # 新增 /dept 路由
├── api/
│   └── dept.ts                                 # ★ 新增 部门 API 封装
└── views/
    ├── dept/                                   # ★ 新增
    │   └── index.vue                           # 部门管理页（树形表格）
    └── user/
        └── index.vue                           # 修改 新增部门树形下拉选择
```

---

## 五、对应需求索引

| 需求编号 | 需求描述 | 状态 |
|:---:|------|:---:|
| **DEPT-001** | 部门以树形表格展示，支持无限层级 | ✅ |
| **DEPT-002** | 新增部门：填写部门名称、上级部门、排序、负责人、联系电话、状态 | ✅ |
| **DEPT-003** | 编辑部门：修改部门信息 | ✅ |
| **DEPT-004** | 删除部门：存在子部门或关联用户的部门不允许删除 | ✅ |
| **DEPT-005** | 新增/编辑用户时，部门选择以树形下拉框展示 | ✅ |

---

## 六、前六步整体验证总结

| 步骤 | 内容 | 编译 | 备注 |
|:---:|------|:---:|------|
| 第一步 | 环境准备与项目初始化 | ✅ | Docker + Monorepo |
| 第二步 | 数据库设计与 Prisma 建模 | ✅ | 9 张表 + 种子数据 |
| 第三步 | 认证与授权模块 | ✅ | JWT + Redis 黑名单 |
| 第四步 | 用户管理模块 | ✅ | 完整 CRUD + 角色分配 |
| 第五步 | 角色管理与菜单权限模块 | ✅ | RBAC + 动态路由 + v-permission |
| 第六步 | 部门管理模块 | ✅ | 树形 CRUD + 用户表单集成 |

### 当前状态

- 后端：7 个模块全部注册（PrismaModule、RedisModule、AuthModule、UserModule、MenuModule、RoleModule、DeptModule）
- 前端：5 个业务页面（登录、用户管理、角色管理、菜单管理、部门管理）+ 403/404 错误页面
- 所有路由均配置权限标识，路由守卫完整

### 已知待办

- `/dashboard` 路由目前只有 `redirect`，无对应视图组件（属于第八步前端布局范围）
- 操作日志模块（第七步）尚未实现
- 字典管理模块（第七步）尚未实现

---

> **第六步完成！** ✅
>
> 下一步 → [implementation-steps.md](./implementation-steps.md) 第七步：操作日志与字典管理模块
