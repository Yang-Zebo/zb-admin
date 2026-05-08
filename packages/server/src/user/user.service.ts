import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findAll(query: QueryUserDto) {
    const { page = 1, pageSize = 10, username, phone, status, deptId } = query;

    const where: Record<string, unknown> = {};

    if (username) {
      where['username'] = { contains: username };
    }
    if (phone) {
      where['phone'] = { contains: phone };
    }
    if (status !== undefined && status !== null) {
      where['status'] = status;
    }
    if (deptId !== undefined && deptId !== null) {
      where['deptId'] = deptId;
    }

    const [list, total] = await Promise.all([
      this.prisma.sysUser.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          dept: { select: { id: true, deptName: true } },
          userRoles: {
            include: {
              role: { select: { id: true, roleName: true } },
            },
          },
        },
      }),
      this.prisma.sysUser.count({ where: where as any }),
    ]);

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
    }));

    return { list: mappedList, total, page, pageSize };
  }

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
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
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
      roleIds: user.userRoles.map((ur) => ur.roleId),
      createTime: user.createTime,
      updateTime: user.updateTime,
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.sysUser.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

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
    });

    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.prisma.sysUserRole.createMany({
        data: dto.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    await this.redisService.del(`user:permissions:${user.id}`)

    return { id: user.id, username: user.username };
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.sysUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.nickname !== undefined) updateData['nickname'] = dto.nickname;
    if (dto.email !== undefined) updateData['email'] = dto.email;
    if (dto.phone !== undefined) updateData['phone'] = dto.phone;
    if (dto.gender !== undefined) updateData['gender'] = dto.gender;
    if (dto.deptId !== undefined) updateData['deptId'] = dto.deptId;

    const updated = await this.prisma.sysUser.update({
      where: { id },
      data: updateData as any,
    });

    if (dto.roleIds !== undefined) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length > 0) {
        await this.prisma.sysUserRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
      }
      await this.redisService.del(`user:permissions:${id}`)
    }

    return { id: updated.id, username: updated.username };
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('不能删除自己');
    }

    const user = await this.prisma.sysUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.sysUserRole.deleteMany({ where: { userId: id } });
    await this.prisma.sysUser.delete({ where: { id } });

    return { message: '删除成功' };
  }

  async removeBatch(ids: number[], currentUserId: number) {
    if (ids.includes(currentUserId)) {
      throw new ForbiddenException('不能删除自己');
    }

    await this.prisma.sysUserRole.deleteMany({
      where: { userId: { in: ids } },
    });
    await this.prisma.sysUser.deleteMany({ where: { id: { in: ids } } });

    return { message: '批量删除成功' };
  }

  async resetPassword(id: number) {
    const user = await this.prisma.sysUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const defaultPassword = await bcrypt.hash('123456', 10);
    await this.prisma.sysUser.update({
      where: { id },
      data: { password: defaultPassword, loginAttempts: 0, lockedUntil: null } as any,
    });

    return { message: '密码已重置为 123456' };
  }

  async toggleStatus(id: number) {
    const user = await this.prisma.sysUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const newStatus = user.status === 1 ? 0 : 1;
    await this.prisma.sysUser.update({
      where: { id },
      data: { status: newStatus } as any,
    });

    const statusLabel = newStatus === 1 ? '已启用' : '已停用';
    return { message: statusLabel, status: newStatus };
  }
}
