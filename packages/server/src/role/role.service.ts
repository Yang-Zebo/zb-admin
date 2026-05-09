// ===== 角色管理服务 =====
// 封装角色 CRUD 和菜单权限分配
// 关键逻辑：分配菜单时清除所有关联用户的权限缓存
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { RedisService } from '../redis/redis.service.js'
import { CreateRoleDto } from './dto/create-role.dto.js'
import { UpdateRoleDto } from './dto/update-role.dto.js'
import { QueryRoleDto } from './dto/query-role.dto.js'

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findAll(query: QueryRoleDto) {
    const { page = 1, pageSize = 10, roleName, roleKey, status } = query

    const where: Record<string, unknown> = {}

    if (roleName) {
      where['roleName'] = { contains: roleName }
    }
    if (roleKey) {
      where['roleKey'] = { contains: roleKey }
    }
    if (status !== undefined && status !== null) {
      where['status'] = status
    }

    const [list, total] = await Promise.all([
      this.prisma.sysRole.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sort: 'asc' },
        include: {
          _count: {
            select: { userRoles: true },
          },
        },
      }),
      this.prisma.sysRole.count({ where: where as any }),
    ])

    const mappedList = list.map((role) => ({
      id: role.id,
      roleName: role.roleName,
      roleKey: role.roleKey,
      status: role.status,
      sort: role.sort,
      userCount: role._count.userRoles,
      createTime: role.createTime,
      updateTime: role.updateTime,
    }))

    return { list: mappedList, total, page, pageSize }
  }

  async findAllSimple() {
    return this.prisma.sysRole.findMany({
      where: { status: 1 },
      select: { id: true, roleName: true, roleKey: true },
      orderBy: { sort: 'asc' },
    })
  }

  async findOne(id: number) {
    const role = await this.prisma.sysRole.findUnique({
      where: { id },
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId: id },
    })

    return {
      ...role,
      menuIds: roleMenus.map((rm) => rm.menuId),
    }
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.sysRole.findUnique({
      where: { roleKey: dto.roleKey },
    })
    if (existing) {
      throw new BadRequestException('角色标识已存在')
    }

    return this.prisma.sysRole.create({
      data: {
        roleName: dto.roleName,
        roleKey: dto.roleKey,
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
      },
    })
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.prisma.sysRole.findUnique({ where: { id } })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    if (dto.roleKey && dto.roleKey !== role.roleKey) {
      const existing = await this.prisma.sysRole.findUnique({
        where: { roleKey: dto.roleKey },
      })
      if (existing) {
        throw new BadRequestException('角色标识已存在')
      }
    }

    const data: Record<string, unknown> = {}
    if (dto.roleName !== undefined) data['roleName'] = dto.roleName
    if (dto.roleKey !== undefined) data['roleKey'] = dto.roleKey
    if (dto.sort !== undefined) data['sort'] = dto.sort
    if (dto.status !== undefined) data['status'] = dto.status

    return this.prisma.sysRole.update({
      where: { id },
      data: data as any,
    })
  }

  async remove(id: number) {
    const role = await this.prisma.sysRole.findUnique({ where: { id } })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    const userCount = await this.prisma.sysUserRole.count({
      where: { roleId: id },
    })
    if (userCount > 0) {
      throw new BadRequestException(`角色已关联 ${userCount} 个用户，无法删除`)
    }

    await this.prisma.sysRoleMenu.deleteMany({ where: { roleId: id } })
    await this.prisma.sysRole.delete({ where: { id } })

    return { message: '删除成功' }
  }

  async assignMenus(roleId: number, menuIds: number[]) {
    const role = await this.prisma.sysRole.findUnique({ where: { id: roleId } })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    await this.prisma.sysRoleMenu.deleteMany({ where: { roleId } })

    if (menuIds.length > 0) {
      await this.prisma.sysRoleMenu.createMany({
        data: menuIds.map((menuId) => ({ roleId, menuId })),
      })
    }

    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { roleId },
    })
    for (const ur of userRoles) {
      await this.redisService.del(`user:permissions:${ur.userId}`)
    }

    return { message: '菜单权限分配成功' }
  }
}
