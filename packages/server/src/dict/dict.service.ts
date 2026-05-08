import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateDictDto } from './dto/create-dict.dto.js'
import { UpdateDictDto } from './dto/update-dict.dto.js'
import { QueryDictDto } from './dto/query-dict.dto.js'

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryDictDto) {
    const { page = 1, pageSize = 10, dictName, dictType, status } = query

    const where: Record<string, unknown> = {}

    if (dictName) {
      where['dictName'] = { contains: dictName }
    }
    if (dictType) {
      where['dictType'] = { contains: dictType }
    }
    if (status !== undefined && status !== null) {
      where['status'] = status
    }

    const [list, total] = await Promise.all([
      this.prisma.sysDict.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ dictType: 'asc' }, { sort: 'asc' }],
      }),
      this.prisma.sysDict.count({ where: where as any }),
    ])

    return { list, total, page, pageSize }
  }

  async findByType(dictType: string) {
    return this.prisma.sysDict.findMany({
      where: { dictType, status: 1 },
      orderBy: { sort: 'asc' },
    })
  }

  async findAllTypes() {
    const all = await this.prisma.sysDict.findMany({
      orderBy: { dictType: 'asc' },
    })
    const typeMap = new Map<string, string>()
    for (const item of all) {
      if (!typeMap.has(item.dictType)) {
        typeMap.set(item.dictType, item.dictName)
      }
    }
    return Array.from(typeMap.entries()).map(([dictType, dictName]) => ({
      dictType,
      dictName,
    }))
  }

  async findOne(id: number) {
    const dict = await this.prisma.sysDict.findUnique({ where: { id } })
    if (!dict) {
      throw new NotFoundException('字典不存在')
    }
    return dict
  }

  async create(dto: CreateDictDto) {
    return this.prisma.sysDict.create({
      data: {
        dictName: dto.dictName,
        dictType: dto.dictType,
        dictLabel: dto.dictLabel,
        dictValue: dto.dictValue,
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
      },
    })
  }

  async update(id: number, dto: UpdateDictDto) {
    const dict = await this.prisma.sysDict.findUnique({ where: { id } })
    if (!dict) {
      throw new NotFoundException('字典不存在')
    }

    const data: Record<string, unknown> = {}
    if (dto.dictName !== undefined) data['dictName'] = dto.dictName
    if (dto.dictType !== undefined) data['dictType'] = dto.dictType
    if (dto.dictLabel !== undefined) data['dictLabel'] = dto.dictLabel
    if (dto.dictValue !== undefined) data['dictValue'] = dto.dictValue
    if (dto.sort !== undefined) data['sort'] = dto.sort
    if (dto.status !== undefined) data['status'] = dto.status

    return this.prisma.sysDict.update({
      where: { id },
      data: data as any,
    })
  }

  async remove(id: number) {
    const dict = await this.prisma.sysDict.findUnique({ where: { id } })
    if (!dict) {
      throw new NotFoundException('字典不存在')
    }

    await this.prisma.sysDict.delete({ where: { id } })

    return { message: '删除成功' }
  }
}
