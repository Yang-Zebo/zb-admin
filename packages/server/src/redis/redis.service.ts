// ===== Redis 缓存服务 =====
// 封装 ioredis，提供 Redis 缓存操作
// 直接继承 Redis 类，因此拥有所有 Redis 命令（get, set, del, expire 等）
// 用途：缓存用户权限数据、存储验证码、管理 Token 黑名单
import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    // 使用环境变量配置 Redis 连接参数
    super({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
      password: process.env['REDIS_PASSWORD'] || undefined, // 无密码时为 undefined
      db: parseInt(process.env['REDIS_DB'] || '0', 10), // Redis 数据库编号，默认 0
    })
  }

  // 应用关闭时优雅退出 Redis 连接
  async onModuleDestroy() {
    await this.quit()
  }
}
