import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
process.loadEnvFile(resolve(__dirname, '../.env'))

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'root123456',
  database: 'admin_system',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 开始执行种子数据...\n')

  // ==================== 1. 创建部门 ====================
  const dept = await prisma.sysDept.create({
    data: {
      deptName: '总公司',
      parentId: 0,
      sort: 0,
      leader: '管理员',
      phone: '13800138000',
      status: 1,
    },
  })
  console.log('✅ 部门创建完成:', dept.deptName)

  // ==================== 2. 创建超级管理员用户 ====================
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.sysUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      nickname: '超级管理员',
      email: 'admin@example.com',
      phone: '13800000000',
      gender: 1,
      status: 1,
      deptId: dept.id,
    },
  })
  console.log('✅ 超级管理员创建完成:', adminUser.username, '(密码: admin123)')

  // ==================== 3. 创建角色 ====================
  const superAdminRole = await prisma.sysRole.upsert({
    where: { roleKey: 'super_admin' },
    update: {},
    create: {
      roleName: '超级管理员',
      roleKey: 'super_admin',
      sort: 1,
      status: 1,
    },
  })
  console.log('✅ 角色创建完成:', superAdminRole.roleName)

  const normalRole = await prisma.sysRole.upsert({
    where: { roleKey: 'normal_user' },
    update: {},
    create: {
      roleName: '普通用户',
      roleKey: 'normal_user',
      sort: 2,
      status: 1,
    },
  })
  console.log('✅ 角色创建完成:', normalRole.roleName)

  // ==================== 4. 分配角色给用户 ====================
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRole.id },
  })
  console.log('✅ 角色分配完成: admin → 超级管理员')

  // ==================== 5. 创建菜单树 ====================
  // 一级目录：系统管理
  const systemDir = await prisma.sysMenu.create({
    data: {
      menuName: '系统管理',
      parentId: 0,
      menuType: 0, // 目录
      routePath: '/system',
      componentPath: '',
      permission: '',
      icon: 'Setting',
      sort: 1,
      isVisible: 1,
      isCache: 0,
      isExternal: 0,
    },
  })
  console.log('✅ 菜单创建完成:', systemDir.menuName)

  // 用户管理
  const userMenu = await createMenu({
    menuName: '用户管理',
    parentId: systemDir.id,
    menuType: 1, // 菜单
    routePath: '/system/user',
    componentPath: 'system/user/index',
    permission: 'sys:user:list',
    icon: 'User',
    sort: 1,
  })

  await createMenu({ menuName: '新增用户', parentId: userMenu.id, menuType: 2, permission: 'sys:user:add', sort: 1 })
  await createMenu({ menuName: '编辑用户', parentId: userMenu.id, menuType: 2, permission: 'sys:user:edit', sort: 2 })
  await createMenu({ menuName: '删除用户', parentId: userMenu.id, menuType: 2, permission: 'sys:user:delete', sort: 3 })
  await createMenu({ menuName: '重置密码', parentId: userMenu.id, menuType: 2, permission: 'sys:user:resetPwd', sort: 4 })
  console.log('✅ 菜单创建完成: 用户管理 (含 4 个按钮权限)')

  // 角色管理
  const roleMenu = await createMenu({
    menuName: '角色管理',
    parentId: systemDir.id,
    menuType: 1,
    routePath: '/system/role',
    componentPath: 'system/role/index',
    permission: 'sys:role:list',
    icon: 'UserFilled',
    sort: 2,
  })

  await createMenu({ menuName: '新增角色', parentId: roleMenu.id, menuType: 2, permission: 'sys:role:add', sort: 1 })
  await createMenu({ menuName: '编辑角色', parentId: roleMenu.id, menuType: 2, permission: 'sys:role:edit', sort: 2 })
  await createMenu({ menuName: '删除角色', parentId: roleMenu.id, menuType: 2, permission: 'sys:role:delete', sort: 3 })
  await createMenu({ menuName: '分配权限', parentId: roleMenu.id, menuType: 2, permission: 'sys:role:assignPerm', sort: 4 })
  console.log('✅ 菜单创建完成: 角色管理 (含 4 个按钮权限)')

  // 菜单管理
  const menuMenu = await createMenu({
    menuName: '菜单管理',
    parentId: systemDir.id,
    menuType: 1,
    routePath: '/system/menu',
    componentPath: 'system/menu/index',
    permission: 'sys:menu:list',
    icon: 'Menu',
    sort: 3,
  })

  await createMenu({ menuName: '新增菜单', parentId: menuMenu.id, menuType: 2, permission: 'sys:menu:add', sort: 1 })
  await createMenu({ menuName: '编辑菜单', parentId: menuMenu.id, menuType: 2, permission: 'sys:menu:edit', sort: 2 })
  await createMenu({ menuName: '删除菜单', parentId: menuMenu.id, menuType: 2, permission: 'sys:menu:delete', sort: 3 })
  console.log('✅ 菜单创建完成: 菜单管理 (含 3 个按钮权限)')

  // 部门管理
  const deptMenu = await createMenu({
    menuName: '部门管理',
    parentId: systemDir.id,
    menuType: 1,
    routePath: '/system/dept',
    componentPath: 'system/dept/index',
    permission: 'sys:dept:list',
    icon: 'OfficeBuilding',
    sort: 4,
  })

  await createMenu({ menuName: '新增部门', parentId: deptMenu.id, menuType: 2, permission: 'sys:dept:add', sort: 1 })
  await createMenu({ menuName: '编辑部门', parentId: deptMenu.id, menuType: 2, permission: 'sys:dept:edit', sort: 2 })
  await createMenu({ menuName: '删除部门', parentId: deptMenu.id, menuType: 2, permission: 'sys:dept:delete', sort: 3 })
  console.log('✅ 菜单创建完成: 部门管理 (含 3 个按钮权限)')

  // 操作日志
  await createMenu({
    menuName: '操作日志',
    parentId: systemDir.id,
    menuType: 1,
    routePath: '/system/log',
    componentPath: 'system/log/index',
    permission: 'sys:log:list',
    icon: 'Document',
    sort: 5,
  })
  console.log('✅ 菜单创建完成: 操作日志')

  // 字典管理
  const dictMenu = await createMenu({
    menuName: '字典管理',
    parentId: systemDir.id,
    menuType: 1,
    routePath: '/system/dict',
    componentPath: 'system/dict/index',
    permission: 'sys:dict:list',
    icon: 'Collection',
    sort: 6,
  })

  await createMenu({ menuName: '新增字典', parentId: dictMenu.id, menuType: 2, permission: 'sys:dict:add', sort: 1 })
  await createMenu({ menuName: '编辑字典', parentId: dictMenu.id, menuType: 2, permission: 'sys:dict:edit', sort: 2 })
  await createMenu({ menuName: '删除字典', parentId: dictMenu.id, menuType: 2, permission: 'sys:dict:delete', sort: 3 })
  console.log('✅ 菜单创建完成: 字典管理 (含 3 个按钮权限)')

  // ==================== 6. 赋予超级管理员所有菜单权限 ====================
  const allMenus = await prisma.sysMenu.findMany()
  for (const menu of allMenus) {
    await prisma.sysRoleMenu.upsert({
      where: { roleId_menuId: { roleId: superAdminRole.id, menuId: menu.id } },
      update: {},
      create: { roleId: superAdminRole.id, menuId: menu.id },
    })
  }
  console.log(`✅ 权限分配完成: 超级管理员获得 ${allMenus.length} 个菜单权限`)

  // ==================== 7. 创建字典数据 ====================
  const dictData = [
    { dictName: '用户状态', dictType: 'sys_user_status', dictLabel: '启用', dictValue: '1', status: 1, sort: 1 },
    { dictName: '用户状态', dictType: 'sys_user_status', dictLabel: '停用', dictValue: '0', status: 1, sort: 2 },
    { dictName: '性别', dictType: 'sys_user_gender', dictLabel: '男', dictValue: '1', status: 1, sort: 1 },
    { dictName: '性别', dictType: 'sys_user_gender', dictLabel: '女', dictValue: '0', status: 1, sort: 2 },
    { dictName: '菜单类型', dictType: 'sys_menu_type', dictLabel: '目录', dictValue: '0', status: 1, sort: 1 },
    { dictName: '菜单类型', dictType: 'sys_menu_type', dictLabel: '菜单', dictValue: '1', status: 1, sort: 2 },
    { dictName: '菜单类型', dictType: 'sys_menu_type', dictLabel: '按钮', dictValue: '2', status: 1, sort: 3 },
  ]

  for (const item of dictData) {
    await prisma.sysDict.create({ data: item })
  }
  console.log(`✅ 字典数据创建完成: ${dictData.length} 条`)

  console.log('\n🎉 种子数据执行完成!')
  console.log('   ┌──────────────────────────────────────────┐')
  console.log('   │  管理员账号: admin                       │')
  console.log('   │  管理员密码: admin123                    │')
  console.log('   │  角色: 超级管理员 / 普通用户              │')
  console.log('   └──────────────────────────────────────────┘')
}

interface MenuInput {
  menuName: string
  parentId: number
  menuType: number
  routePath?: string
  componentPath?: string
  permission?: string
  icon?: string
  sort: number
}

async function createMenu(input: MenuInput) {
  return prisma.sysMenu.create({
    data: {
      menuName: input.menuName,
      parentId: input.parentId,
      menuType: input.menuType,
      routePath: input.routePath ?? '',
      componentPath: input.componentPath ?? '',
      permission: input.permission ?? '',
      icon: input.icon ?? '',
      sort: input.sort,
      isVisible: 1,
      isCache: 0,
      isExternal: 0,
    },
  })
}

main()
  .catch((e) => {
    console.error('❌ 种子数据执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
