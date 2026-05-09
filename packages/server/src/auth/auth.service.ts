// ===== 认证服务 =====
// 核心业务逻辑层，处理：
// 1. 图形验证码生成 — 使用 svg-captcha 生成数学题验证码
// 2. 用户登录 — 验证码校验 → 密码比对 → 账号锁定 → 签发 JWT
// 3. 退出登录 — 将当前 Token 加入 Redis 黑名单
// 4. Token 刷新 — 用 RefreshToken 换取新的 AccessToken
// 5. 权限获取 — 查询用户角色 → 角色菜单 → 构建菜单树并缓存到 Redis
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs' // bcryptjs：用于密码的哈希加密和比对
import * as svgCaptcha from 'svg-captcha' // svg-captcha：生成 SVG 格式的图形验证码
import { PrismaService } from '../prisma/prisma.service.js'
import { RedisService } from '../redis/redis.service.js'
import { LoginDto } from './dto/login.dto.js'
import { randomUUID } from 'node:crypto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, // 数据库操作
    private readonly jwtService: JwtService, // JWT 签发和验证
    private readonly redisService: RedisService, // Redis 缓存
  ) {}

  // 【生成图形验证码】使用数学表达式（如 "3+5=?"），结果缓存在 Redis 中
  async generateCaptcha() {
    const captcha = svgCaptcha.createMathExpr({
      mathMin: 1,
      mathMax: 49,
      mathOperator: '+',
      fontSize: 50,
      width: 120,
      height: 44,
      background: '#f0f2f5',
    })

    const captchaId = randomUUID() // 生成唯一标识，用于后续校验
    const ttl = parseInt(process.env['CAPTCHA_EXPIRES_IN'] || '300', 10)
    // 将验证码答案存入 Redis，key 格式：captcha:{uuid}，设置过期时间
    await this.redisService.set(`captcha:${captchaId}`, captcha.text.toLowerCase(), 'EX', ttl)

    return {
      captchaId, // 验证码唯一标识，登录时需要回传
      captchaSvg: captcha.data, // SVG 字符串，前端直接渲染为图片
    }
  }

  // 【用户登录】完整的登录流程
  async login(dto: LoginDto) {
    const { username, password, captcha, captchaId } = dto

    // 第一步：验证码校验
    const captchaText = await this.redisService.get(`captcha:${captchaId}`)
    if (!captchaText || captchaText !== captcha.toLowerCase()) {
      throw new UnauthorizedException('验证码错误或已过期')
    }
    await this.redisService.del(`captcha:${captchaId}`) // 验证成功后删除，防止重复使用

    // 第二步：查询用户（同时加载关联的部门和角色信息）
    // include：Prisma 的关联查询，一次性加载部门、用户角色、角色信息，避免 N+1 查询
    const userWithRelations = await this.prisma.sysUser.findUnique({
      where: { username },
      include: {
        dept: { select: { id: true, deptName: true } },
        userRoles: {
          include: {
            role: { select: { id: true, roleName: true } },
          },
        },
      },
    })

    if (!userWithRelations) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    // 第三步：检查账号状态（0=停用，1=正常）
    if (userWithRelations.status === 0) {
      throw new UnauthorizedException('账号已被停用，请联系管理员')
    }

    // 第四步：检查账号是否被锁定
    const maxAttempts = parseInt(process.env['LOGIN_MAX_ATTEMPTS'] || '5', 10) // 最大尝试次数
    const lockMinutes = parseInt(process.env['LOGIN_LOCK_MINUTES'] || '30', 10) // 锁定时间（分钟）

    if (userWithRelations.lockedUntil && new Date(userWithRelations.lockedUntil) > new Date()) {
      throw new UnauthorizedException(`账号已被锁定，请${lockMinutes}分钟后再试`)
    }

    // 第五步：密码比对（bcrypt.compare 对比明文和哈希值）
    const isPasswordValid = await bcrypt.compare(password, userWithRelations.password)
    if (!isPasswordValid) {
      const newAttempts = userWithRelations.loginAttempts + 1
      const updateData: Record<string, unknown> = { loginAttempts: newAttempts }

      // 达到最大尝试次数时，设置锁定时间
      if (newAttempts >= maxAttempts) {
        updateData.lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000)
      }

      await this.prisma.sysUser.update({
        where: { id: userWithRelations.id },
        data: updateData as any,
      })

      if (newAttempts >= maxAttempts) {
        throw new UnauthorizedException(`密码错误次数过多，账号已被锁定${lockMinutes}分钟`)
      }

      const remaining = maxAttempts - newAttempts
      throw new UnauthorizedException(`用户名或密码错误，还剩${remaining}次机会`)
    }

    // 第六步：登录成功，重置登录尝试次数和锁定状态
    await this.prisma.sysUser.update({
      where: { id: userWithRelations.id },
      data: { loginAttempts: 0, lockedUntil: null },
    })

    // 第七步：签发 JWT Token
    // AccessToken：用于接口认证，有效期 2 小时
    // RefreshToken：用于刷新 AccessToken，有效期 7 天，使用独立密钥签名
    const payload = { sub: userWithRelations.id, username: userWithRelations.username }
    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_REFRESH_SECRET'] || 'refresh-secret',
      expiresIn: '7d' as const,
    })

    // 返回 Token 和用户信息（包含角色、部门等）
    return {
      accessToken,
      refreshToken,
      user: {
        id: userWithRelations.id,
        username: userWithRelations.username,
        nickname: userWithRelations.nickname,
        avatar: userWithRelations.avatar,
        email: userWithRelations.email,
        phone: userWithRelations.phone,
        deptName: userWithRelations.dept?.deptName ?? null,
        roles: userWithRelations.userRoles.map((ur) => ({
          id: ur.role.id,
          roleName: ur.role.roleName,
        })),
      },
    }
  }

  // 【退出登录】将当前 Token 加入 Redis 黑名单，防止被重复使用
  async logout(userId: number, token: string) {
    const accessExpires = 7200 // 与 AccessToken 有效期一致（2小时=7200秒）
    await this.redisService.set(`token:blacklist:${userId}`, token, 'EX', accessExpires)
    return { message: '退出成功' }
  }

  // 【刷新 Token】使用 RefreshToken 换取新的 AccessToken 和 RefreshToken
  async refreshToken(refreshToken: string) {
    try {
      // 验证 RefreshToken 是否有效（使用独立密钥）
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env['JWT_REFRESH_SECRET'] || 'refresh-secret',
      })

      const newPayload = { sub: payload.sub, username: payload.username }
      const newAccessToken = this.jwtService.sign(newPayload)
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: process.env['JWT_REFRESH_SECRET'] || 'refresh-secret',
        expiresIn: '7d' as const,
      })

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    } catch {
      throw new UnauthorizedException('Refresh Token 无效或已过期，请重新登录')
    }
  }

  // 【获取用户权限和菜单】核心方法
  // 流程：查用户角色 → 查角色关联的菜单 → 去重 → 提取按钮权限 → 构建菜单树 → 缓存到 Redis
  async getPermissions(userId: number) {
    // 先查 Redis 缓存，有缓存直接返回（减少数据库查询）
    const cacheKey = `user:permissions:${userId}`
    const cached = await this.redisService.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // 查询用户拥有的角色
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId },
      include: { role: true },
    })

    // 没有角色则返回空
    if (userRoles.length === 0) {
      return { menus: [], permissions: [] }
    }

    // 根据角色 ID 列表查询所有角色关联的菜单
    const roleIds = userRoles.map((ur) => ur.roleId)
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId: { in: roleIds } }, // in：Prisma 的批量查询操作符
      include: { menu: true },
    })

    // 去重：同一菜单可能被多个角色分配，按 id 去重只保留一份
    const menus = roleMenus.map((rm) => rm.menu)
    const uniqueMenus = menus.filter(
      (menu, index, self) => self.findIndex((m) => m.id === menu.id) === index,
    )

    // 提取按钮权限标识（如 sys:user:add、sys:role:delete）
    // permission 字段为空的菜单（如目录、页面）不纳入权限列表
    const permissions = uniqueMenus
      .filter((m) => m.permission && m.permission.trim() !== '')
      .map((m) => m.permission!)

    // 构建层级菜单树（用于侧边栏渲染）
    const menuTree = this.buildMenuTree(uniqueMenus)
    // flatMenus：扁平化菜单列表，按排序号排列
    const flatMenus = uniqueMenus.sort((a, b) => a.sort - b.sort)

    const result = { menus: menuTree, flatMenus, permissions }
    // 缓存到 Redis，有效期 1 小时
    await this.redisService.set(cacheKey, JSON.stringify(result), 'EX', 3600)

    return result
  }

  // 清除指定用户的权限缓存（角色/菜单变更时调用）
  async clearPermissionCache(userId: number) {
    await this.redisService.del(`user:permissions:${userId}`)
  }

  // 【构建菜单树】将扁平菜单列表转为层级树结构
  // 算法：两次遍历 —— 第一次建立 id 到菜单的映射表，第二次根据 parentId 挂载子节点
  private buildMenuTree(menus: any[]) {
    const list = JSON.parse(JSON.stringify(menus)) // 深拷贝，避免修改原始数据
    const map: Record<number, any> = {} // id → 菜单节点的映射表
    const tree: any[] = [] // 最终返回的树结构

    // 第一次遍历：建立映射表，初始化 children 数组
    for (const menu of list) {
      map[menu.id] = menu
      menu.children = []
    }

    // 第二次遍历：根据 parentId 决定节点位置
    for (const menu of list) {
      if (menu.parentId && menu.parentId !== 0 && map[menu.parentId]) {
        // 有父节点且父节点存在 → 挂到父节点的 children 下
        map[menu.parentId].children.push(menu)
      } else if (!menu.parentId || menu.parentId === 0) {
        // 无父节点 → 作为根节点放入树中
        tree.push(menu)
      }
    }

    return tree
  }
}
