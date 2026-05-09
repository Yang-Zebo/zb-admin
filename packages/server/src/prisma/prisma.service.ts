// ===== Prisma 数据库服务 =====
// 封装 Prisma ORM，提供数据库连接管理
// 继承 PrismaClient 获得所有数据库操作方法（findMany, create, update, delete 等）
// 实现 OnModuleInit 和 OnModuleDestroy 接口，在模块启动/销毁时自动管理连接
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '../../generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 从 DATABASE_URL 环境变量解析数据库连接信息
    // 格式：mysql://用户名:密码@主机:端口/数据库名
    const url = new URL(process.env['DATABASE_URL']!)
    // PrismaMariaDb 适配器：让 Prisma 通过 MariaDB 驱动连接 MySQL
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: parseInt(url.port, 10),
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''), // 去掉路径前的 /
    })
    super({ adapter })
  }

  // onModuleInit：NestJS 生命周期钩子，模块初始化时自动调用
  // 在应用启动时建立数据库连接
  async onModuleInit() {
    await this.$connect()
  }

  // onModuleDestroy：NestJS 生命周期钩子，模块销毁时自动调用
  // 在应用关闭时断开数据库连接，释放资源
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
