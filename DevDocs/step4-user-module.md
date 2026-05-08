# 第四步：用户管理模块 — 执行记录

> **日期**: 2026-05-08
> **状态**: ✅ 完成
> **基于**: [implementation-steps.md](./implementation-steps.md) 第四步

---

## 完成概要

| 维度 | 数据 |
|------|------|
| 新增后端文件 | 8 个 |
| 新增前端文件 | 2 个 |
| 修改已有文件 | 2 个 |
| 实现 API 端点 | 8 个 |
| 编译状态 | 前后端均通过 |
| 端到端测试 | 15/15 通过 |

---

## 一、后端实现

### 1.1 新增文件

| 文件 | 职责 |
|------|------|
| [user.module.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/user/user.module.ts) | 用户模块入口 |
| [user.service.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/user/user.service.ts) | 用户 CRUD 核心逻辑 |
| [user.controller.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/user/user.controller.ts) | 用户 API 控制器 |
| [dto/query-user.dto.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/user/dto/query-user.dto.ts) | 分页查询参数（username/phone/status/deptId 筛选） |
| [dto/create-user.dto.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/user/dto/create-user.dto.ts) | 新增用户参数（含 roleIds 分配角色） |
| [dto/update-user.dto.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/user/dto/update-user.dto.ts) | 编辑用户参数（不含 password 字段） |

### 1.2 实现的 API 端点

| 方法 | 路径 | 需求编号 | 说明 |
|:---:|------|:---:|------|
| GET | `/api/user/list` | USER-001, USER-007 | 分页查询 + 多条件筛选 |
| GET | `/api/user/:id` | USER-001 | 查询用户详情（含角色ID列表） |
| POST | `/api/user` | USER-002 | 新增用户（bcrypt 加密密码 + 分配角色） |
| PUT | `/api/user/:id` | USER-003 | 编辑用户（不可修改密码） |
| DELETE | `/api/user/:id` | USER-004 | 删除用户（不能删自己） |
| POST | `/api/user/batch-delete` | USER-004 | 批量删除（不能含自己） |
| PUT | `/api/user/:id/reset-password` | USER-005 | 重置密码为 123456 + 清除锁定状态 |
| PUT | `/api/user/:id/toggle-status` | USER-006 | 启用/停用切换 |

### 1.3 用户列表返回格式

```json
{
  "list": [{
    "id": 1,
    "username": "admin",
    "nickname": "超级管理员",
    "email": "admin@example.com",
    "phone": "13800000000",
    "avatar": null,
    "gender": 1,
    "status": 1,
    "deptId": 1,
    "deptName": "总公司",
    "roles": [{ "id": 1, "roleName": "超级管理员" }],
    "createTime": "2026-05-07T13:26:02.000Z",
    "updateTime": "2026-05-07T13:26:02.000Z"
  }],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```

---

## 二、前端实现

### 2.1 新增文件

| 文件 | 职责 |
|------|------|
| [api/user.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/api/user.ts) | 用户 API 封装（全部 8 个接口 + TypeScript 类型） |
| [views/user/index.vue](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/views/user/index.vue) | 用户管理完整页面 |

### 2.2 页面功能清单

- **搜索栏**：用户名（模糊）、手机号（模糊）、状态下拉筛选
- **工具栏**：新增用户按钮、批量删除按钮（未选中时禁用）
- **表格列**：ID、用户名、昵称、手机号、邮箱、性别、部门、角色标签、状态标签、创建时间
- **操作列**：编辑、重置密码、启用/停用、删除
- **分页**：支持每页 10/20/50/100 条，页码跳转
- **新增/编辑弹窗**：
  - 新增时：用户名 + 密码必填，昵称/手机/邮箱/性别可选
  - 编辑时：用户名 disabled，密码字段隐藏
  - 表单校验：用户名长度 2-50，密码长度 6-20，邮箱格式校验
- **确认弹窗**：删除/批量删除/重置密码/启用停用 均有二次确认

---

## 三、修改的已有文件

| 文件 | 修改内容 |
|------|---------|
| [app.module.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/app.module.ts) | 注册 `UserModule` |
| [index.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/client/src/router/index.ts) | 添加 `/user` 路由 |
| [jwt.strategy.ts](file:///Users/yangzebo/code/Trae IDE/zb-admin/packages/server/src/auth/strategies/jwt.strategy.ts) | **Bug 修复**：黑名单校验改为精确 token 比对，而非仅检查 key 存在性 |

### JWT 黑名单 Bug 修复详情

**原逻辑**：`logout` 时将 token 存入 `token:blacklist:{userId}`，`validate` 只要 key 存在就直接返回 null，导致用户退出后无法再登录（2 小时内）。

**修复后**：`validate` 增加 `passReqToCallback: true`，从 Request header 中提取当前 token，与黑名单中的 token **精确比对**，只有匹配时才拒绝。这样退出登录只作废当次 Token，新登录不受影响。

---

## 四、端到端测试结果

| # | 测试场景 | 结果 |
|:---:|------|:---:|
| 1 | 获取验证码 | ✅ |
| 2 | 登录获取 Token | ✅ |
| 3 | 分页查询用户列表（返回 admin + 角色 + 部门） | ✅ |
| 4 | 新增用户 testuser1 | ✅ |
| 5 | 查询新增用户详情 | ✅ |
| 6 | 编辑用户昵称/手机号 | ✅ |
| 7 | 验证编辑结果 | ✅ |
| 8 | 重置密码为 123456 | ✅ |
| 9 | 停用用户 | ✅ |
| 10 | 重新启用用户 | ✅ |
| 11 | 按用户名筛选 | ✅ |
| 12 | 删除单个用户 | ✅ |
| 13 | 验证用户已删除（404） | ✅ |
| 14 | 批量删除（创建 2 个 → 批量删） | ✅ |
| 15 | 不能删除自己（403） | ✅ |

---

## 五、对应需求索引

| 需求编号 | 需求描述 | 状态 |
|:---:|------|:---:|
| USER-001 | 用户列表分页展示 | ✅ |
| USER-002 | 新增用户（密码 bcrypt） | ✅ |
| USER-003 | 编辑用户（不可改密码） | ✅ |
| USER-004 | 删除用户/批量删除（不可删自己） | ✅ |
| USER-005 | 重置密码为 123456 | ✅ |
| USER-006 | 启用/停用切换 | ✅ |
| USER-007 | 按用户名/手机号/状态筛选 | ✅ |

---

## 六、目录结构总览

```
packages/server/src/
├── app.module.ts                         # 新增 UserModule 导入
├── user/
│   ├── user.module.ts                    # 用户模块
│   ├── user.service.ts                   # CRUD 逻辑
│   ├── user.controller.ts                # API 端点
│   └── dto/
│       ├── query-user.dto.ts             # 查询参数
│       ├── create-user.dto.ts            # 新增参数
│       └── update-user.dto.ts            # 编辑参数
├── auth/strategies/
│   └── jwt.strategy.ts                   # Bug 修复

packages/client/src/
├── router/
│   └── index.ts                          # 新增 /user 路由
├── api/
│   └── user.ts                           # 用户 API 封装
└── views/
    └── user/
        └── index.vue                     # 用户管理页面
```

---

> **第四步完成！** ✅
>
> 下一步 → [implementation-steps.md](./implementation-steps.md) 第五步：角色管理与菜单权限模块
