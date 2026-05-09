// ===== 用户管理服务 =====
// 封装用户 CRUD 操作，包括：
// 1. 分页查询（支持按用户名、手机、状态、部门筛选）
// 2. 用户创建/编辑/删除（含角色分配、密码哈希）
// 3. 密码重置（恢复默认密码）和状态切换（启用/停用）
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs' // bcryptjs：密码哈希加密（与 Go 的 bcrypt 库兼容）
import { PrismaService } from '../prisma/prisma.service.js'
import { RedisService } from '../redis/redis.service.js'
import { QueryUserDto } from './dto/query-user.dto.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService, // 用于清除用户权限缓存
  ) {}

  // 【分页查询用户列表】支持多条件筛选，一次查询同时获取列表和总数
  async findAll(query: QueryUserDto) {
    const { page = 1, pageSize = 10, username, phone, status, deptId } = query

    // 动态构建 WHERE 条件对象（Prisma 的特性，只有传入的参数才加入查询条件）
    const where: Record<string, unknown> = {}

    if (username) {
      where['username'] = { contains: username } // contains：模糊搜索
    }
    if (phone) {
      where['phone'] = { contains: phone }
    }
    if (status !== undefined && status !== null) {
      where['status'] = status
    }
    if (deptId !== undefined && deptId !== null) {
      where['deptId'] = deptId
    }

    // Promise.all：并行查询列表和总数，提升性能（两个查询无依赖关系）
    const [list, total] = await Promise.all([
      this.prisma.sysUser.findMany({
        where: where as any,
        skip: (page - 1) * pageSize, // 分页偏移量
        take: pageSize, // 每页条数
        orderBy: { createTime: 'desc' },
        include: {
          dept: { select: { id: true, deptName: true } }, // 关联查询部门名称
          userRoles: {
            include: {
              role: { select: { id: true, roleName: true } }, // 关联查询角色名称
            },
          },
        },
      }),
      this.prisma.sysUser.count({ where: where as any }), // 统计总数
    ])

    // 映射为前端友好的数据结构，扁平化关联字段
    const mappedList = list.map((user) => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      gender: user.gender,
      status: user.status,
      deptId: user.deptId,
      deptName: user.dept?.deptName ?? null,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        roleName: ur.role.roleName,
      })),
      createTime: user.createTime,
      updateTime: user.updateTime,
    }))

    return { list: mappedList, total, page, pageSize }
  }

  // 【查询单个用户详情】包含部门和角色关联信息
  async findOne(id: number) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id },
      include: {
        dept: { select: { id: true, deptName: true } },
        userRoles: {
          include: {
            role: { select: { id: true, roleName: true } },
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      gender: user.gender,
      status: user.status,
      deptId: user.deptId,
      deptName: user.dept?.deptName ?? null,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        roleName: ur.role.roleName,
      })),
      roleIds: user.userRoles.map((ur) => ur.roleId), // 角色 ID 列表（用于编辑时回显）
      createTime: user.createTime,
      updateTime: user.updateTime,
    }
  }

  // 【创建用户】密码使用 bcrypt 哈希，支持同时分配角色
  async create(dto: CreateUserDto) {
    // 检查用户名唯一性
    const existing = await this.prisma.sysUser.findUnique({
      where: { username: dto.username },
    })
    if (existing) {
      throw new BadRequestException('用户名已存在')
    }

    // bcrypt.hash(密码, saltRounds)：saltRounds=10 是安全与性能的平衡值
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // 创建用户
    const user = await this.prisma.sysUser.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        nickname: dto.nickname,
        email: dto.email,
        phone: dto.phone,
        gender: dto.gender,
        deptId: dto.deptId,
      },
    })

    // 如果指定了角色，批量创建 user-role 关联
    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.prisma.sysUserRole.createMany({
        data: dto.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
      })
    }

    // 清除用户权限缓存
    await this.redisService.del(`user:permissions:${user.id}`)

    return { id: user.id, username: user.username }
  }

  // 【编辑用户】支持部分更新（只更新传入的字段）
  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.sysUser.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 动态构建更新数据，只有传入的字段才更新
    const updateData: Record<string, unknown> = {}
    if (dto.nickname !== undefined) updateData['nickname'] = dto.nickname
    if (dto.email !== undefined) updateData['email'] = dto.email
    if (dto.phone !== undefined) updateData['phone'] = dto.phone
    if (dto.gender !== undefined) updateData['gender'] = dto.gender
    if (dto.deptId !== undefined) updateData['deptId'] = dto.deptId

    const updated = await this.prisma.sysUser.update({
      where: { id },
      data: updateData as any,
    })

    // 如果指定了角色，先删除旧关联，再创建新关联
    if (dto.roleIds !== undefined) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId: id } })
      if (dto.roleIds.length > 0) {
        await this.prisma.sysUserRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        })
      }
      // 角色变更后清除权限缓存，下次请求时重新查询
      await this.redisService.del(`user:permissions:${id}`)
    }

    return { id: updated.id, username: updated.username }
  }

  // 【删除用户】不允许删除自己
  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('不能删除自己')
    }

    const user = await this.prisma.sysUser.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 先删除用户角色关联，再删除用户（保证数据完整性）
    await this.prisma.sysUserRole.deleteMany({ where: { userId: id } })
    await this.prisma.sysUser.delete({ where: { id } })

    return { message: '删除成功' }
  }

  // 【批量删除用户】
  async removeBatch(ids: number[], currentUserId: number) {
    if (ids.includes(currentUserId)) {
      throw new ForbiddenException('不能删除自己')
    }

    await this.prisma.sysUserRole.deleteMany({
      where: { userId: { in: ids } }, // in：批量操作
    })
    await this.prisma.sysUser.deleteMany({ where: { id: { in: ids } } })

    return { message: '批量删除成功' }
  }

  // 【重置密码】将密码重置为默认值 123456
  async resetPassword(id: number) {
    const user = await this.prisma.sysUser.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    const defaultPassword = await bcrypt.hash('123456', 10)
    await this.prisma.sysUser.update({
      where: { id },
      data: { password: defaultPassword, loginAttempts: 0, lockedUntil: null } as any,
    })

    return { message: '密码已重置为 123456' }
  }

  // 【切换用户状态】正常↔停用
  async toggleStatus(id: number) {
    const user = await this.prisma.sysUser.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    const newStatus = user.status === 1 ? 0 : 1 // 1=正常 → 0=停用，反之亦然
    await this.prisma.sysUser.update({
      where: { id },
      data: { status: newStatus } as any,
    })

    const statusLabel = newStatus === 1 ? '已启用' : '已停用'
    return { message: statusLabel, status: newStatus }
  }
}
