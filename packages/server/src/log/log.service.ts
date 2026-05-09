// ===== 日志存储服务 =====
// 负责操作日志的查询和写入
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { QueryLogDto } from './dto/query-log.dto.js'
import { CreateLogDto } from './dto/create-log.dto.js'

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryLogDto) {
    const { page = 1, pageSize = 10, userId, actionType, module, startTime, endTime } = query

    const where: Record<string, unknown> = {}

    if (userId) {
      where['userId'] = userId
    }
    if (actionType) {
      where['actionType'] = { contains: actionType }
    }
    if (module) {
      where['module'] = { contains: module }
    }
    if (startTime || endTime) {
      where['createdTime'] = {}
      if (startTime) {
        ;(where['createdTime'] as Record<string, unknown>)['gte'] = new Date(startTime)
      }
      if (endTime) {
        ;(where['createdTime'] as Record<string, unknown>)['lte'] = new Date(endTime)
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.sysLog.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdTime: 'desc' },
      }),
      this.prisma.sysLog.count({ where: where as any }),
    ])

    return { list, total, page, pageSize }
  }

  async create(dto: CreateLogDto) {
    return this.prisma.sysLog.create({
      data: {
        userId: dto.userId,
        ip: dto.ip ?? '',
        actionType: dto.actionType ?? '',
        module: dto.module ?? '',
        description: dto.description ?? '',
        requestParams: dto.requestParams ?? '',
        responseResult: dto.responseResult ?? '',
        duration: dto.duration ?? 0,
      },
    })
  }
}
