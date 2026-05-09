// ===== 部门管理服务 =====
// 封装部门 CRUD 和部门树构建
// 删除保护：存在子部门或有用户关联的部门不允许删除
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateDeptDto } from './dto/create-dept.dto.js'
import { UpdateDeptDto } from './dto/update-dept.dto.js'

@Injectable()
export class DeptService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const depts = await this.prisma.sysDept.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    })
    return this.buildTree(depts)
  }

  async findTree() {
    const depts = await this.prisma.sysDept.findMany({
      where: { status: 1 },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        deptName: true,
        parentId: true,
      },
    })
    return this.buildTree(depts)
  }

  async findOne(id: number) {
    const dept = await this.prisma.sysDept.findUnique({ where: { id } })
    if (!dept) {
      throw new NotFoundException('部门不存在')
    }
    return dept
  }

  async create(dto: CreateDeptDto) {
    return this.prisma.sysDept.create({
      data: {
        deptName: dto.deptName,
        parentId: dto.parentId ?? 0,
        sort: dto.sort ?? 0,
        leader: dto.leader ?? '',
        phone: dto.phone ?? '',
        status: dto.status ?? 1,
      },
    })
  }

  async update(id: number, dto: UpdateDeptDto) {
    const dept = await this.prisma.sysDept.findUnique({ where: { id } })
    if (!dept) {
      throw new NotFoundException('部门不存在')
    }

    const data: Record<string, unknown> = {}
    if (dto.deptName !== undefined) data['deptName'] = dto.deptName
    if (dto.parentId !== undefined) data['parentId'] = dto.parentId
    if (dto.sort !== undefined) data['sort'] = dto.sort
    if (dto.leader !== undefined) data['leader'] = dto.leader
    if (dto.phone !== undefined) data['phone'] = dto.phone
    if (dto.status !== undefined) data['status'] = dto.status

    return this.prisma.sysDept.update({
      where: { id },
      data: data as any,
    })
  }

  async remove(id: number) {
    const dept = await this.prisma.sysDept.findUnique({ where: { id } })
    if (!dept) {
      throw new NotFoundException('部门不存在')
    }

    const children = await this.prisma.sysDept.count({ where: { parentId: id } })
    if (children > 0) {
      throw new BadRequestException('存在子部门，无法删除')
    }

    const users = await this.prisma.sysUser.count({ where: { deptId: id } })
    if (users > 0) {
      throw new BadRequestException('部门下存在用户，无法删除')
    }

    await this.prisma.sysDept.delete({ where: { id } })

    return { message: '删除成功' }
  }

  private buildTree(depts: any[]) {
    const list = JSON.parse(JSON.stringify(depts))
    const map: Record<number, any> = {}
    const tree: any[] = []

    for (const dept of list) {
      map[dept.id] = dept
      dept.children = []
    }

    for (const dept of list) {
      if (dept.parentId && dept.parentId !== 0 && map[dept.parentId]) {
        map[dept.parentId].children.push(dept)
      } else if (!dept.parentId || dept.parentId === 0) {
        tree.push(dept)
      }
    }

    return tree
  }
}
