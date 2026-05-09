// ===== JWT 策略 =====
// Passport 的 JWT 验证策略，负责：
// 1. 从请求头 Authorization: Bearer <token> 中提取 Token
// 2. 使用密钥验证 Token 的签名和有效期
// 3. 检查 Token 是否在 Redis 黑名单中（退出登录后的 Token）
// 4. 验证通过后返回用户信息，注入到请求上下文中
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport' // Passport 策略基类
import { ExtractJwt, Strategy } from 'passport-jwt' // passport-jwt 提供 JWT 提取和验证
import { Request } from 'express'
import { RedisService } from '../../redis/redis.service.js'

// JwtPayload 接口：定义 JWT Token 中存储的用户信息结构
export interface JwtPayload {
  sub: number // 用户 ID（sub 是 JWT 标准字段 subject）
  username: string // 用户名
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly redisService: RedisService) {
    super({
      // ExtractJwt.fromAuthHeaderAsBearerToken：从 Authorization 头中提取 Bearer Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 不忽略过期时间，过期 Token 会被拒绝
      secretOrKey: process.env['JWT_SECRET'] || 'default-secret', // JWT 签名密钥
      passReqToCallback: true, // 将原始 Request 对象传给 validate 方法（用于检查黑名单）
    })
  }

  // validate：Passport 策略的核心验证方法
  // 在 Token 签名和有效期验证通过后调用，返回的对象会注入到 req.user 中
  async validate(req: Request, payload: JwtPayload) {
    // 从请求头中提取当前 Token
    const currentToken = req.headers.authorization?.replace('Bearer ', '') || ''
    // 检查 Token 是否在 Redis 黑名单中（用户退出登录后 Token 会被加入黑名单）
    const blacklistedToken = await this.redisService.get(`token:blacklist:${payload.sub}`)
    if (blacklistedToken && blacklistedToken === currentToken) {
      return null // 返回 null 表示认证失败
    }
    // 认证成功，返回用户信息（后续可通过 @CurrentUser() 获取）
    return { userId: payload.sub, username: payload.username }
  }
}
