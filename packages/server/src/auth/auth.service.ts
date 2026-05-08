import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import * as svgCaptcha from 'svg-captcha'
import { PrismaService } from '../prisma/prisma.service.js'
import { RedisService } from '../redis/redis.service.js'
import { LoginDto } from './dto/login.dto.js'
import { randomUUID } from 'node:crypto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

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

    const captchaId = randomUUID()
    const ttl = parseInt(process.env['CAPTCHA_EXPIRES_IN'] || '300', 10)
    await this.redisService.set(`captcha:${captchaId}`, captcha.text.toLowerCase(), 'EX', ttl)

    return {
      captchaId,
      captchaSvg: captcha.data,
    }
  }

  async login(dto: LoginDto) {
    const { username, password, captcha, captchaId } = dto

    const captchaText = await this.redisService.get(`captcha:${captchaId}`)
    if (!captchaText || captchaText !== captcha.toLowerCase()) {
      throw new UnauthorizedException('验证码错误或已过期')
    }
    await this.redisService.del(`captcha:${captchaId}`)

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

    if (userWithRelations.status === 0) {
      throw new UnauthorizedException('账号已被停用，请联系管理员')
    }

    const maxAttempts = parseInt(process.env['LOGIN_MAX_ATTEMPTS'] || '5', 10)
    const lockMinutes = parseInt(process.env['LOGIN_LOCK_MINUTES'] || '30', 10)

    if (userWithRelations.lockedUntil && new Date(userWithRelations.lockedUntil) > new Date()) {
      throw new UnauthorizedException(`账号已被锁定，请${lockMinutes}分钟后再试`)
    }

    const isPasswordValid = await bcrypt.compare(password, userWithRelations.password)
    if (!isPasswordValid) {
      const newAttempts = userWithRelations.loginAttempts + 1
      const updateData: Record<string, unknown> = { loginAttempts: newAttempts }

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

    await this.prisma.sysUser.update({
      where: { id: userWithRelations.id },
      data: { loginAttempts: 0, lockedUntil: null },
    })

    const payload = { sub: userWithRelations.id, username: userWithRelations.username }
    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_REFRESH_SECRET'] || 'refresh-secret',
      expiresIn: '7d' as const,
    })

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

  async logout(userId: number, token: string) {
    const accessExpires = 7200
    await this.redisService.set(`token:blacklist:${userId}`, token, 'EX', accessExpires)
    return { message: '退出成功' }
  }

  async refreshToken(refreshToken: string) {
    try {
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

  async getPermissions(userId: number) {
    const cacheKey = `user:permissions:${userId}`
    const cached = await this.redisService.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId },
      include: { role: true },
    })

    if (userRoles.length === 0) {
      return { menus: [], permissions: [] }
    }

    const roleIds = userRoles.map((ur) => ur.roleId)
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId: { in: roleIds } },
      include: { menu: true },
    })

    const menus = roleMenus.map((rm) => rm.menu)
    const uniqueMenus = menus.filter(
      (menu, index, self) => self.findIndex((m) => m.id === menu.id) === index,
    )

    const permissions = uniqueMenus
      .filter((m) => m.permission && m.permission.trim() !== '')
      .map((m) => m.permission!)

    const menuTree = this.buildMenuTree(uniqueMenus)
    const flatMenus = uniqueMenus.sort((a, b) => a.sort - b.sort)

    const result = { menus: menuTree, flatMenus, permissions }
    await this.redisService.set(cacheKey, JSON.stringify(result), 'EX', 3600)

    return result
  }

  async clearPermissionCache(userId: number) {
    await this.redisService.del(`user:permissions:${userId}`)
  }

  private buildMenuTree(menus: any[]) {
    const list = JSON.parse(JSON.stringify(menus))
    const map: Record<number, any> = {}
    const tree: any[] = []

    for (const menu of list) {
      map[menu.id] = menu
      menu.children = []
    }

    for (const menu of list) {
      if (menu.parentId && menu.parentId !== 0 && map[menu.parentId]) {
        map[menu.parentId].children.push(menu)
      } else if (!menu.parentId || menu.parentId === 0) {
        tree.push(menu)
      }
    }

    return tree
  }
}
